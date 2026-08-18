import { readdirSync, readFileSync } from 'node:fs';
import { isAbsolute, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, read, skillBody, stepSection } from './skill-md.js';

/**
 * 既存 test を探してから TC を起こす経路 (#2000)。
 *
 * `/kiwa-design` は実装 (`src/`) しか読まなかったため、 既に 19 test がある package に対して
 * 23 TC を起こし、 うち 18 件が既存 test と重複した。 spec の指示どおり新規 file へ Write して
 * いれば、 同じ振る舞いを 2 度 test する file がもう 1 つできていた。
 *
 * **重複は失敗として現れない**。 test は緑のまま増え、 spec を読んだ人が「まだ覆われていない」
 * と誤認する。 探索を省いたことは成果物からは読めないので、 探索の宣言と、 判定を spec に残す
 * 形の両方を検査で固定する。
 *
 * 判定を断定させない点も同じ重みで固定する。 test 名は自由文で、 名前が一致しても body が同じ
 * 入力を走らせているとは限らない = 実測で「`expectedOrder` 空なら常に pass」 という名前の test
 * が、 記録が空の場合しか走らせていなかった。 skill が `既覆` と断定すると、 その 1 件は
 * 永久に書かれない。
 */

const DESIGN = 'kiwa-design';
const VITEST = 'kiwa-vitest';
const SKELETON = '.claude/skills/kiwa-design/references/output-skeleton.md';

const STEP_2 = /^### Step 2\b/m;
const STEP_4 = /^### Step 4\b/m;

/** SSOT (`docs/SKILL-DESIGN.ja.md` § 出力フォーマット) が順序固定で要求する 9 section。 */
const NINE_SECTIONS = [
  '## 対象機能',
  '## 仕様の要約',
  '## 主な品質リスク',
  '## 推奨テスト構成',
  '## テスト観点一覧',
  '## テストケース一覧',
  '## 自動化すべきテスト',
  '## 手動確認でよいテスト',
  '## 不足している仕様',
];

/** Layer 2 parser が column index で読む 9 column。 */
const NINE_COLUMNS = [
  'テスト ID',
  'テストレベル',
  'テスト観点',
  '前提条件',
  '入力値',
  '操作手順',
  '期待結果',
  '優先度',
  '自動化',
];

const VERDICTS = ['既覆 (候補)', '未覆', '不明'];

/** `## ` 見出しの本文 (次の `## ` まで)。 `stepSection` は `### ` で閉じるため兼用できない。 */
function sectionOf(body: string, heading: RegExp): string {
  const at = body.search(heading);
  if (at < 0) throw new Error(`${heading} が見つからない`);
  const rest = body.slice(at);
  const next = rest.slice(1).search(/^## /m);
  return next === -1 ? rest : rest.slice(0, next + 1);
}

/** 表の header 行 (`| a | b |`) の cell 名。 */
function headerCells(line: string): string[] {
  return line
    .split('|')
    .slice(1, -1)
    .map((cell) => cell.trim());
}

/** 本文中で最初に現れる、 先頭 cell が `want` の表の header cell 群。 */
function tableHeaderStartingWith(body: string, want: string): string[] {
  for (const line of body.split('\n')) {
    if (!line.startsWith('|')) continue;
    const cells = headerCells(line);
    if (cells[0] === want) return cells;
  }
  throw new Error(`先頭 cell が ${want} の表が無い`);
}

/** 4 種を 1 群として見る。 1 つ欠けると、 その拡張子を使う package が「test 0 件」 に見える。 */
const FOUR_GLOBS = ['*.spec.ts', '*.spec.tsx', '*.test.ts', '*.test.tsx'];

/**
 * `\( -name '*.test.ts' -o ... \)` の群ごとに、 列挙された glob を取る。
 *
 * `/kiwa-design` の Step 2 は列挙と抽出で `find` を 2 度書く (2 段目に `grep -r` を使うと
 * `node_modules` を辿るため)。 **群を畳んで 1 つの集合にしてはいけない** = 片方だけを書き換え
 * ても畳んだ集合は変わらず、 2 段の対象がずれたまま素通りする。
 */
function globGroups(fence: string): string[][] {
  return [...fence.matchAll(/\\\(([\s\S]*?)\\\)/g)].map((group) =>
    [...group[1]!.matchAll(/-name\s+'([^']+)'/g)].map((m) => m[1]!).sort(),
  );
}

/** fence 内の `find` 起動ごとの本文。 起動単位で見ないと、 片方だけの書き換えが素通りする。 */
function findCommands(fence: string): string[] {
  return fence.split(/^find /m).slice(1);
}

/** Step の bash fence。 `stepSection` と同じ範囲で閉じるので、 Step から消えれば見つからない。 */
function stepBashFence(skill: string, heading: RegExp): string {
  const section = stepSection(skill, heading);
  const fences = [...section.matchAll(/```bash\n([\s\S]*?)```/g)].map((m) => m[1]!);
  if (fences.length === 0) throw new Error(`${skill} の ${heading} に bash fence が無い`);
  return fences.join('\n');
}

describe('/kiwa-design が既存 test を探す', () => {
  it('Step 2 の探索が 4 種の test file を対象にする', () => {
    // `.test.` だけを見ると `.spec.` を使う package が「test 0 件」 に見え、 全 TC が未覆へ倒れる。
    // 倒れる向きは安全側だが、 重複 TC が出るのは探索を省いたのと同じ結果になる。
    // 群の数も見る = 列挙と抽出の 2 段が揃っていることを、 片方の消失で落ちる形にする。
    expect(globGroups(stepBashFence(DESIGN, STEP_2))).toEqual([FOUR_GLOBS, FOUR_GLOBS]);
  });

  it('Step 2 の探索が node_modules を除外する', () => {
    // 除外しないと依存の test 名を候補として拾う。 pnpm の symlink は既定で辿らないが、
    // hoisting された実体 dir を持つ project では入る。
    // 語だけを見ると fence の comment が残って素通りするので、 prune 句そのものを見る。
    // 起動ごとに見る = 2 段のうち片方から prune を落としても、 fence 全体では残って素通りする。
    const commands = findCommands(stepBashFence(DESIGN, STEP_2));
    expect(commands.length).toBe(2);
    for (const command of commands) {
      expect(command, `prune の無い find:\n${command}`).toContain('-name node_modules -prune');
    }
  });

  it('Step 2 の探索が test 名を抽出する', () => {
    const fence = stepBashFence(DESIGN, STEP_2);
    // file の列挙だけでは TC と突き合わせられない。 名前まで取って初めて候補になる。
    expect(fence).toMatch(/describe\|it\|test|it\|test\|describe/);
  });

  it('Step 2 が test / tests の両方を探索先に含める', () => {
    // kiwa の package は `tests/`、 `/kiwa-vitest` の既定出力は `test/unit/`。 片方だけを見ると
    // 既存 test を取りこぼす。
    const section = stepSection(DESIGN, STEP_2);
    expect(section).toContain('`tests/`');
    expect(section).toContain('`test/`');
  });

  it('探索できなかった場合を 不明 として記録する', () => {
    const section = stepSection(DESIGN, STEP_2);
    expect(section).toContain('既存 test 不明');
    expect(section).toContain('`不明`');
  });

  it('Step 4 の判定が 3 値で、 既覆を断定しない', () => {
    const section = stepSection(DESIGN, STEP_4);
    for (const verdict of VERDICTS) {
      // 本文ではなく判定表の行を見る。 本文には「`既覆` と断定せず `既覆 (候補)` と書く」 が
      // あるため、 語だけを見ると表を `既覆` に書き換えても素通りする。
      expect(section, `判定 ${verdict} の行が Step 4 の表に無い`).toContain(`| \`${verdict}\` |`);
    }
    expect(section).toContain('断定');
  });

  it('候補を読んで走っていなければ 未覆 へ倒すと書いてある', () => {
    // 誤って `既覆` にすると必要な TC が落ち、 誤って `未覆` にすると重複 test が 1 件増える
    // だけ。 損失が非対称なので、 倒す向きを skill 側に固定する。 2 文を別々に見る =
    // 「`未覆` に倒す」 の 1 語だけを見ると、 片方を消しても他方が残って素通りする。
    const section = stepSection(DESIGN, STEP_4);
    expect(section).toContain('走らせていないと分かった場合は `未覆` に倒す');
    expect(section).toContain('迷った場合も `未覆` に倒す');
  });
});

describe('出力の契約を壊していない', () => {
  const design = skillBody(DESIGN);
  const skeleton = read(SKELETON);

  it('9 section が順序どおり残っている', () => {
    // 見出しの境界では切らない。 fence の中身が `## ` で始まる行そのものなので、 境界で切ると
    // fence の手前で終わる。 見出しの後ろに最初に現れる markdown fence を取る。
    const after = design.slice(design.search(/^## 出力フォーマット/m));
    const fence = /```markdown\n([\s\S]*?)```/.exec(after);
    if (!fence) throw new Error('§ 出力フォーマット に markdown fence が無い');
    const listed = fence[1]!
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.startsWith('## '));
    expect(listed).toEqual(NINE_SECTIONS);
  });

  it('差し込む section の位置が宣言されている', () => {
    // 9 section の fence には出さない (SSOT の 9 件と食い違う)。 差し込む位置は表で宣言する。
    expect(design).toContain('| `## UI feature 一覧` | `## 推奨テスト構成` の後 |');
    expect(design).toContain('| `## 既存 test との対応` | `## 自動化すべきテスト` の直前 |');
  });

  it('雛形の 9 column 表が変わっていない', () => {
    // 対応表を 9 column に足すと Layer 2 parser が column index で読めなくなる。 別 section に
    // 持つ形を、 column 名の一致で固定する。
    expect(tableHeaderStartingWith(skeleton, 'テスト ID')).toEqual(NINE_COLUMNS);
  });

  it('雛形が 既存 test との対応 を別表として持つ', () => {
    const section = sectionOf(skeleton, /^## 既存 test との対応/m);
    expect(tableHeaderStartingWith(section, 'TC')).toEqual(['TC', '既存 test の候補', '判定']);
  });

  it('雛形の 自動化すべきテスト が未覆を先に置く', () => {
    const section = sectionOf(skeleton, /^## 自動化すべきテスト/m);
    const uncovered = section.indexOf('未覆');
    const covered = section.indexOf('既覆');
    expect(uncovered).toBeGreaterThanOrEqual(0);
    expect(covered).toBeGreaterThanOrEqual(0);
    // 既覆を先に置くと、 読んだ人が上から実装して重複 test を作る。
    expect(uncovered).toBeLessThan(covered);
  });
});

describe('/kiwa-vitest が既存 file へ追記する', () => {
  const vitest = skillBody(VITEST);

  it('探索の glob が /kiwa-design と一致する', () => {
    // 2 skill が別の集合を見ると、 spec が「候補あり」 と書いた file を Layer 2 が見つけられず
    // 新規 file を作る。 追記先を決めるのは 1 段だけなので群は 1 つ。
    const fence = stepBashFence(VITEST, STEP_2);
    expect(globGroups(fence)).toEqual([FOUR_GLOBS]);
    for (const command of findCommands(fence)) {
      expect(command, `prune の無い find:\n${command}`).toContain('-name node_modules -prune');
    }
  });

  it('spec の候補 path を探索結果の内側に制限する', () => {
    const section = stepSection(VITEST, STEP_2);
    // spec は data。候補欄だけで repo 内の任意 file を追記先にできてはいけない。
    expect(section).toContain('`find` の探索結果に完全一致する場合だけ');
    expect(section).toContain('絶対 path / `..` を含む path');
    expect(section).toContain('探索結果に\n無い path は Read も追記もしない');
  });

  it('対象実装を test する file が無ければ新規 file を作る', () => {
    const section = stepSection(VITEST, STEP_2);
    // package に無関係な test が 1 件あるだけで、そこへ別 module の test を混ぜない。
    expect(section).toContain('**対象実装を import している file だけ**');
    expect(section).toContain('対象実装を import する file が 1 件も残らなければ');
    expect(section).toContain('無関係な test file へ追記しない');
  });

  it('Step 1 が spec の判定を読む', () => {
    const section = stepSection(VITEST, /^### Step 1\b/m);
    expect(section).toContain('## 既存 test との対応');
    // section を持たない旧 spec を「全て覆われている」 に倒すと、 書くべき test が 0 件になる。
    expect(section).toContain('`不明`');
  });

  it('Step 4 が未覆の TC だけを対象にする', () => {
    const section = stepSection(VITEST, STEP_4);
    expect(section).toContain('`未覆`');
    expect(section).toContain('`既覆 (候補)`');
    expect(section).toContain('書かない');
  });

  it('Step 4 が既存 file への追記経路を持つ', () => {
    // 「追記」 の語だけを見ると、 分岐表を新規 Write に書き換えても本文の別の「追記」 が残って
    // 素通りする。 分岐表の行そのものを見る。
    expect(stepSection(VITEST, STEP_4)).toContain('| Step 2 で特定できた | **その file に追記**');
  });

  it('既存 it の削除 / 書き換えを禁じている', () => {
    // 期待値を書き換えて緑にする経路が、 Layer 2 の既定動作として開かないようにする。
    expect(stepSection(VITEST, STEP_4)).toContain('書き換えは行わない');
    expect(vitest).toContain('1 件も削除 / 書き換えていない');
  });
});

describe('生成済 spec の 既存 test との対応 が全 TC を持つ', () => {
  /** `tests/spec` 配下の spec を全件。 */
  function specFiles(dir: string): string[] {
    return readdirSync(resolve(REPO_ROOT, dir), { withFileTypes: true }).flatMap((entry) =>
      entry.isDirectory()
        ? specFiles(`${dir}/${entry.name}`)
        : entry.name.endsWith('.md')
          ? [`${dir}/${entry.name}`]
          : [],
    );
  }

  /** 本文中の TC id (先頭 cell が `TC-NNN` の行)。 */
  function tcIds(body: string): string[] {
    return [...body.matchAll(/^\|\s*(TC-\d+)\s*\|/gm)].map((m) => m[1]!);
  }

  const withSection = specFiles('tests/spec').filter((rel) =>
    readFileSync(resolve(REPO_ROOT, rel), 'utf-8').includes('## 既存 test との対応'),
  );

  it('dogfood spec が対象に入っている', () => {
    // 0 件でも通る検査は、 section が 1 つも無い状態と区別が付かない。
    expect(withSection).toContain('tests/spec/unit/test-spec-dogfood-probe.ja.md');
  });

  it.each(withSection)('%s の全 TC が 1 行ずつ現れる', (rel) => {
    const body = read(rel);
    const cases = tcIds(sectionOf(body, /^## テストケース一覧/m));
    const rows = tcIds(sectionOf(body, /^## 既存 test との対応/m));
    // 両方が空でも `toEqual` は通る。 TC を 1 件も読めていない状態を pass にしない。
    expect(cases.length).toBeGreaterThan(0);
    expect(rows).toEqual(cases);
  });

  it.each(withSection)('%s の判定が 3 値のいずれか', (rel) => {
    const section = sectionOf(read(rel), /^## 既存 test との対応/m);
    const verdicts = section
      .split('\n')
      .filter((line) => /^\|\s*TC-\d+\s*\|/.test(line))
      .map((line) => headerCells(line)[2]!.trim());
    expect([...new Set(verdicts)].filter((v) => !VERDICTS.includes(v))).toEqual([]);
  });

  it.each(withSection)('%s の既覆候補 path が repo root から開ける', (rel) => {
    const section = sectionOf(read(rel), /^## 既存 test との対応/m);
    const coveredRows = section
      .split('\n')
      .filter((line) => /^\|\s*TC-\d+\s*\|/.test(line))
      .map(headerCells)
      .filter((cells) => cells[2] === '既覆 (候補)');

    for (const cells of coveredRows) {
      const refs = [...cells[1]!.matchAll(/`([^`]+):(\d+)`/g)];
      expect(refs.length, `${rel} ${cells[0]} に候補 path が無い`).toBeGreaterThan(0);
      for (const ref of refs) {
        const path = ref[1]!;
        const line = Number(ref[2]);
        const absolute = resolve(REPO_ROOT, path);
        const fromRoot = relative(REPO_ROOT, absolute);
        expect(
          isAbsolute(path) ||
            fromRoot === '..' ||
            fromRoot.startsWith('../') ||
            fromRoot.startsWith('..\\'),
        ).toBe(false);
        const candidate = readFileSync(absolute, 'utf-8');
        expect(line).toBeGreaterThan(0);
        expect(line).toBeLessThanOrEqual(candidate.split('\n').length);
      }
    }
  });
});
