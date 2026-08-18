import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
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

interface Layer {
  runtime: string;
  test_outputs?: Record<string, string[]>;
}

/** その runtime の layer が `test_outputs` で宣言している出力 path。 */
function declaredOutputs(runtime: string, consumer?: string): string[] {
  const layers = (JSON.parse(read('docs/layers.json')) as { layers: Layer[] }).layers;
  return layers
    .filter((l) => l.runtime === runtime)
    .flatMap((l) => Object.entries(l.test_outputs ?? {}))
    .filter(([name]) => consumer === undefined || name === consumer)
    .flatMap(([, outputs]) => outputs);
}

/** `{example}/test/unit/{module}.test.{ts,tsx}` を実在しうる basename へ畳む。 */
function sampleBasenames(pattern: string): string[] {
  const base = pattern.split('/').pop()!;
  const brace = /\{([^{}]*,[^{}]*)\}/.exec(base);
  if (brace) {
    return brace[1]!.split(',').flatMap((alt) => sampleBasenames(base.replace(brace[0], alt)));
  }
  return [base.replace(/\{[^{}]*\}/g, 'Sample').replace(/\*/g, 'sample')];
}

/** `-name '<glob>'` で書かれた対象 (prune 側は引用符が無いので入らない)。 */
function documentedGlobs(fence: string): string[] {
  return [...new Set([...fence.matchAll(/-name\s+'([^']+)'/g)].map((m) => m[1]!))].sort();
}

/** glob 1 つを正規表現に畳む。 `*` は `/` を跨がない。 */
function globToRegExp(glob: string): RegExp {
  const escaped = glob
    .split('*')
    .map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'))
    .join('[^/]*');
  return new RegExp(`^${escaped}$`);
}

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

/**
 * `##### <runtime>` の本文 (次の見出しまで)。
 *
 * runtime ごとに探索の形が違うため、 Step 2 の fence を全部まとめて見てはいけない
 * (`solidity` の prune 群 `\( -name node_modules -o -name lib \)` が glob 群に混ざる)。
 */
function runtimeSubsection(runtime: string): string {
  const lines = stepSection(DESIGN, STEP_2).split('\n');
  const start = lines.findIndex((line) => line === `##### ${runtime}`);
  if (start < 0) throw new Error(`Step 2 に ##### ${runtime} が無い`);
  // fence の中を見ない。 bash の comment (`# 1. test file を列挙する`) は行頭 `# ` で始まるため、
  // 素直に見出しとして扱うと fence の途中で切れて中身が取れない。
  let inFence = false;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i += 1) {
    if (lines[i]!.startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && /^#{1,5} /.test(lines[i]!)) {
      end = i;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

/** その runtime の bash fence (列挙と抽出の 2 段)。 */
function runtimeFence(runtime: string): string {
  const fences = [...runtimeSubsection(runtime).matchAll(/```bash\n([\s\S]*?)```/g)].map(
    (m) => m[1]!,
  );
  if (fences.length === 0) throw new Error(`##### ${runtime} に bash fence が無い`);
  return fences.join('\n');
}

/** 抽出段が渡す正規表現。 runner が複数ある runtime も全て取り出す。 */
function extractRegexes(runtime: string): string[] {
  const matches = [
    ...runtimeFence(runtime).matchAll(/^\s*xargs -0 grep -nE "(.+)"\s*$/gm),
  ].map((m) => m[1]!);
  if (matches.length === 0) throw new Error(`##### ${runtime} に xargs -0 grep -nE の行が無い`);
  return matches;
}

/** 書いてある正規表現を実際に走らせ、 一致した行の中身を返す。 */
function grepLines(regex: string, file: string): string[] {
  try {
    return execFileSync('grep', ['-nE', regex, file], { encoding: 'utf-8' })
      .split('\n')
      .filter((line) => line.length > 0)
      .map((line) => line.replace(/^\d+:\s*/, '').trim());
  } catch (err) {
    // grep は一致 0 件で exit 1 を返す。 内容を見たいので空配列に畳む。
    const status = (err as { status?: number }).status;
    if (status === 1) return [];
    throw err;
  }
}

/** runtime の表が宣言している runtime 名。 */
function documentedRuntimes(): string[] {
  return stepSection(DESIGN, STEP_2)
    .split('\n')
    .map((line) => /^\|\s*`([a-z]+)`\s*\|/.exec(line))
    .filter((m): m is RegExpExecArray => m !== null)
    .map((m) => m[1]!)
    .sort();
}

describe('/kiwa-design が既存 test を探す', () => {
  it('runtime の表が docs/layers.json の runtime を全て覆う', () => {
    // 探索の形は runtime で決まる。 layer を足した時に形を足し忘れると、 その runtime の
    // package は必ず「既存 test 0 件」 になる (当たらない glob で探すため)。
    // 表を手で並べず、 実物 (`docs/layers.json`) から導いた集合と突き合わせる。
    const declared = [
      ...new Set(
        (JSON.parse(read('docs/layers.json')) as { layers: { runtime: string }[] }).layers.map(
          (l) => l.runtime,
        ),
      ),
    ].sort();
    expect(documentedRuntimes()).toEqual(declared);
  });

  it('typescript の探索が 4 種の test file を対象にする', () => {
    // `.test.` だけを見ると `.spec.` を使う package が「test 0 件」 に見え、 全 TC が未覆へ倒れる。
    // 倒れる向きは安全側だが、 重複 TC が出るのは探索を省いたのと同じ結果になる。
    // 群の数も見る = 列挙と抽出の 2 段が揃っていることを、 片方の消失で落ちる形にする。
    expect(globGroups(runtimeFence('typescript'))).toEqual([FOUR_GLOBS, FOUR_GLOBS]);
  });

  it('typescript の探索が node_modules を除外する', () => {
    // 除外しないと依存の test 名を候補として拾う。 pnpm の symlink は既定で辿らないが、
    // hoisting された実体 dir を持つ project では入る。
    // 語だけを見ると fence の comment が残って素通りするので、 prune 句そのものを見る。
    // 起動ごとに見る = 2 段のうち片方から prune を落としても、 fence 全体では残って素通りする。
    const commands = findCommands(runtimeFence('typescript'));
    expect(commands.length).toBe(2);
    for (const command of commands) {
      expect(command, `prune の無い find:\n${command}`).toContain('-name node_modules -prune');
    }
  });

  it('solidity の探索が Foundry と Hardhat の両方を対象にする', () => {
    // `contract` layer は runtime が solidity でも `/kiwa-forge` と `/kiwa-hardhat` の
    // 両方に消費される。 `*.t.sol` だけに絞ると Hardhat 側の既存 test を 1 件も拾えない。
    const commands = findCommands(runtimeFence('solidity'));
    expect(commands.length).toBe(4);

    const runners = [
      { consumer: 'kiwa-forge', commands: commands.slice(0, 2) },
      { consumer: 'kiwa-hardhat', commands: commands.slice(2, 4) },
    ];
    for (const runner of runners) {
      const globs = documentedGlobs(runner.commands[0]!).map(globToRegExp);
      const outputs = declaredOutputs('solidity', runner.consumer);
      // 宣言が 0 件だと uncovered も 0 件になり、 照合を 1 度もせずに通る。 consumer 名を
      // 打ち間違えた時に「全部拾えている」 と報告されるのを防ぐ。
      expect(outputs.length, `${runner.consumer} の test_outputs が宣言されていない`).toBeGreaterThan(0);
      const uncovered = outputs
        .flatMap(sampleBasenames)
        .filter((name) => !globs.some((glob) => glob.test(name)));
      expect(
        uncovered,
        `${runner.consumer} の出力を拾えない find:\n${runner.commands.join('\n---\n')}`,
      ).toEqual([]);
    }
  });

  it.each(['typescript', 'solidity'])('%s の探索が 2 段 1 組で同じ対象を見る', (runtime) => {
    // 列挙と抽出は対で 1 つの形を見る。 **fence 全体の集合で見てはいけない** = 片方から
    // glob を落としても、 もう片方に残っていれば集合は変わらず素通りする (実測で
    // `*.test.cjs` を列挙側だけから落とす変異が生き残った)。
    const commands = findCommands(runtimeFence(runtime));
    expect(commands.length % 2, `find の数が偶数でない: ${commands.length}`).toBe(0);
    for (let i = 0; i < commands.length; i += 2) {
      expect(
        documentedGlobs(commands[i]!),
        `列挙と抽出で対象が違う:\n${commands[i]}\n---\n${commands[i + 1]}`,
      ).toEqual(documentedGlobs(commands[i + 1]!));
    }
  });

  it.each(['typescript', 'solidity'])(
    '%s の探索が docs/layers.json の出力 path を全て拾える',
    (runtime) => {
      // glob を手で並べない。 Layer 2 が書き出す path は `docs/layers.json` の `test_outputs` が
      // SSOT なので、 そこから basename を導いて 1 つでも当たらない形が無いことを見る。
      //
      // この形にする前は `*.t.sol` だけを見ており、 同じ runtime の Hardhat 出力
      // (`{Contract}.test.cjs` / `*.test.ts`) を落としていた (PR #2004 Round 1 の指摘)。
      const globs = documentedGlobs(runtimeFence(runtime)).map(globToRegExp);
      const uncovered = declaredOutputs(runtime)
        .flatMap(sampleBasenames)
        .filter((name) => !globs.some((glob) => glob.test(name)));
      expect(uncovered).toEqual([]);
    },
  );

  it('solidity の探索が node_modules と lib を除外する', () => {
    // `lib` は forge が vendored 依存を置く dir。 実測で examples の *.t.sol 34 件のうち
    // 30 件が lib/forge-std/ にあり、 prune しないと候補の 88% が依存側の test 名になる。
    const commands = findCommands(runtimeFence('solidity'));
    expect(commands.length).toBe(4);
    for (const command of commands) {
      expect(command, `prune の無い find:\n${command}`).toContain(
        '\\( -name node_modules -o -name lib \\) -prune',
      );
    }
  });

  it('書いてある抽出が test だけを拾う (runtime ごとに実行)', () => {
    // 正規表現を目で読んで判断しない。 書いてあるものをそのまま走らせ、 拾う行と拾わない行を
    // 固定する。 test でない関数まで拾うと、 候補欄が「その名前の test がある」 と嘘をつく。
    const dir = mkdtempSync(resolve(tmpdir(), 'kiwa-discovery-'));
    try {
      const sol = resolve(dir, 'Sample.t.sol');
      writeFileSync(
        sol,
        [
          'contract SampleTest is Test {',
          '    function setUp() public {}',
          '    function test_alpha() public {}',
          '    function testFuzz_beta(uint256 x) public {}',
          '    function invariant_gamma() public {}',
          '    function helperNotATest() public {}',
          '}',
          '',
        ].join('\n'),
        'utf-8',
      );
      const solidityRegexes = extractRegexes('solidity');
      expect(solidityRegexes).toHaveLength(2);
      expect(grepLines(solidityRegexes[0]!, sol)).toEqual([
        'contract SampleTest is Test {',
        'function test_alpha() public {}',
        'function testFuzz_beta(uint256 x) public {}',
        'function invariant_gamma() public {}',
      ]);

      const hardhat = resolve(dir, 'Sample.test.cjs');
      writeFileSync(
        hardhat,
        [
          "describe('contract', () => {",
          "  it('case one', () => {});",
          "  test('case two', () => {});",
          '  const helperNotATest = () => {};',
          '});',
          '',
        ].join('\n'),
        'utf-8',
      );
      expect(grepLines(solidityRegexes[1]!, hardhat)).toEqual([
        "describe('contract', () => {",
        "it('case one', () => {});",
        "test('case two', () => {});",
      ]);

      const ts = resolve(dir, 'sample.test.ts');
      writeFileSync(
        ts,
        [
          "describe('group', () => {",
          "  it('case one', () => {});",
          "  it.each([1])('case two', () => {});",
          "  test('case three', () => {});",
          '  const notATest = () => {};',
          '});',
          '',
        ].join('\n'),
        'utf-8',
      );
      expect(grepLines(extractRegexes('typescript')[0]!, ts)).toEqual([
        "describe('group', () => {",
        "it('case one', () => {});",
        "it.each([1])('case two', () => {});",
        "test('case three', () => {});",
      ]);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('書いてある抽出が実 repo の test を拾う', () => {
    // 作った fixture だけで確かめると、 実物の書き方 (import / 修飾子 / 空白) を外していても
    // 気付けない。 repo に実在する 2 file で 1 件以上取れることを見る。
    const solidityRegexes = extractRegexes('solidity');
    const sol = grepLines(
      solidityRegexes[0]!,
      resolve(REPO_ROOT, 'examples/dogfood-foundry-dapp/test/DogfoodToken.t.sol'),
    );
    expect(sol.length).toBeGreaterThan(0);
    const hardhat = grepLines(
      solidityRegexes[1]!,
      resolve(REPO_ROOT, 'tests/fixtures/mint-nft/hardhat-test/MintNft.test.cjs'),
    );
    expect(hardhat.length).toBeGreaterThan(0);
    const ts = grepLines(
      extractRegexes('typescript')[0]!,
      resolve(REPO_ROOT, 'packages/skill-test/tests/skill-test.test.ts'),
    );
    expect(ts.length).toBeGreaterThan(0);
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

  it('TC を 1 つの検証単位に絞ると書いてある', () => {
    // 期待を束ねた TC は「一部だけ覆われている」 状態を作り、 3 値のどれにも当てはまらない
    // (#2007 の dogfood で判明)。 束ねた場合の倒し先も併せて固定する。
    const section = stepSection(DESIGN, STEP_4);
    expect(section).toContain('##### TC は 1 つの検証単位に絞る');
    expect(section).toContain('既に束ねてしまった TC は `未覆` に倒す');
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

  it('雛形が探索した runtime を書かせる', () => {
    // runtime を残さないと、 当たらない glob で 0 件になった spec と本当に 0 件の spec が
    // 読み分けられない (`solidity` の package を `typescript` の glob で探すと必ず 0 件)。
    const section = sectionOf(skeleton, /^## 既存 test との対応/m);
    expect(section).toContain('- 探索した runtime —');
    for (const runtime of documentedRuntimes()) {
      expect(section, `runtime ${runtime} が雛形に無い`).toContain(`\`${runtime}\``);
    }
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
    // 定数ではなく /kiwa-design の typescript 行そのものと比べる = 片方だけ形を変えた時に落ちる。
    // /kiwa-vitest は typescript 専用なので solidity 行とは比べない。
    expect(globGroups(fence)).toEqual([globGroups(runtimeFence('typescript'))[0]]);
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

  /**
   * 対応表の行 (3 cell) だけを返す。
   *
   * section に別の表や bullet があっても、 **header 行で表を特定してから** 読む。
   * 行だけを正規表現で拾うと、 2 cell の別表が混ざった時に 3 列目が `undefined` になり
   * TypeError で落ちる = 「対応表が壊れている」 と「別表がある」 を区別できない。
   */
  function correspondenceRows(section: string): string[][] {
    const lines = section.split('\n');
    const header = lines.findIndex(
      (line) => line.startsWith('|') && headerCells(line)[0] === 'TC',
    );
    if (header < 0) throw new Error('先頭 cell が TC の対応表が無い');
    const rows: string[][] = [];
    for (const line of lines.slice(header + 2)) {
      if (!line.startsWith('|')) break;
      rows.push(headerCells(line));
    }
    return rows;
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
    const rows = correspondenceRows(sectionOf(body, /^## 既存 test との対応/m)).map(
      (cells) => cells[0]!,
    );
    // 両方が空でも `toEqual` は通る。 TC を 1 件も読めていない状態を pass にしない。
    expect(cases.length).toBeGreaterThan(0);
    expect(rows).toEqual(cases);
  });

  it.each(withSection)('%s の判定が 3 値のいずれか', (rel) => {
    const rows = correspondenceRows(sectionOf(read(rel), /^## 既存 test との対応/m));
    // 3 cell であること自体を先に見る。 列が欠けた表を「判定が読めない」 のではなく
    // 「壊れている」 として落とす。
    expect(rows.map((cells) => cells.length).filter((n) => n !== 3)).toEqual([]);
    const verdicts = rows.map((cells) => cells[2]!);
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

describe('Layer 2 skill が既存 test の判定を読む', () => {
  const REUSE_REF = '.claude/skills/kiwa-design/references/existing-test-reuse.md';

  /**
   * `docs/layers.json` が宣言する Layer 2 skill。
   *
   * 一覧を手で持たない。 layer を足した時に skill を足し忘れると、 その layer だけ判定を
   * 読まないまま緑になる (#2005 が塞いだのはこの形)。
   */
  function layer2Skills(): string[] {
    const layers = (
      JSON.parse(read('docs/layers.json')) as {
        layers: { consumer_skill: string; also_consumed_by?: string[] }[];
      }
    ).layers;
    const names = new Set<string>();
    for (const layer of layers) {
      names.add(layer.consumer_skill);
      for (const also of layer.also_consumed_by ?? []) names.add(also);
    }
    return [...names].sort();
  }

  it('共有 contract が実在し 4 項目を持つ', () => {
    expect(existsSync(resolve(REPO_ROOT, REUSE_REF)), `${REUSE_REF} が無い`).toBe(true);
    const ref = read(REUSE_REF);
    for (const heading of [
      '## 1. 判定の読み方',
      '## 2. 対象の絞り方',
      '## 3. 追記先の決め方',
      '## 4. 禁止',
    ]) {
      expect(ref, `共有 contract に ${heading} が無い`).toContain(heading);
    }
    for (const verdict of VERDICTS) {
      // 表の行として持っていることを見る。 本文のどこかに語があるだけでは、 定義表から
      // 落ちても素通りする (実測で `不明` の行を崩す変異が生き残った)。
      expect(ref, `共有 contract の判定表に ${verdict} の行が無い`).toContain(`| \`${verdict}\` |`);
    }
  });

  /** `test_outputs` の key が名指しする skill (`consumer_skill` とは別の宣言経路)。 */
  function outputConsumers(): string[] {
    const layers = (
      JSON.parse(read('docs/layers.json')) as {
        layers: { test_outputs?: Record<string, string[]> }[];
      }
    ).layers;
    const names = new Set<string>();
    for (const layer of layers) {
      for (const name of Object.keys(layer.test_outputs ?? {})) names.add(name);
    }
    return [...names].sort();
  }

  it('共有 contract が追記の単位を runtime 別に持つ', () => {
    // dogfood (#2007) で判明した = Solidity は `setUp` が contract 単位のため、 contract を
    // 足す形にすると前提を 2 箇所で保つことになる。 単位は runtime で違う。
    const ref = read(REUSE_REF);
    expect(ref).toContain('### 追記の単位 (runtime で違う)');
    expect(ref).toContain('| solidity | **既存の test contract に `function test_*` を足す** |');
    expect(ref).toContain('| typescript | 既存 file の末尾に `describe` を 1 つ足す |');
  });

  it('共有 contract が追記してよい範囲を持つ', () => {
    // `vm.expectEmit` は test contract 側の event 宣言を要る。 「既存 test を書き換えない」 だけ
    // だと、 宣言を足してよいのかが読めない (#2007 の dogfood で詰まった点)。
    const ref = read(REUSE_REF);
    expect(ref).toContain('### 追記してよい範囲');
    expect(ref).toContain('その test が動くために必要な宣言');
    expect(ref).toContain('`setUp` (JS なら `beforeEach`) は変えない');
  });

  it('対象 skill を docs/layers.json から導けている', () => {
    // 0 件でも `it.each` は 1 件も走らずに緑になる。 導出が壊れた状態を pass にしない。
    const skills = layer2Skills();
    expect(skills.length).toBeGreaterThan(0);
    // `docs/layers.json` は consumer を 2 経路で宣言する (`consumer_skill` + `also_consumed_by` と
    // `test_outputs` の key)。 **片方だけを見ると、 traversal を落とした時に検査対象が静かに
    // 減るだけで緑になる** (実測で `also_consumed_by` を落とすと kiwa-hardhat が検査から消え、
    // 件数が 50 → 49 に減っただけで pass した)。 2 経路の一致を見る。
    expect(skills).toEqual(outputConsumers());
  });

  it.each(layer2Skills())('%s が 既存 test の再利用 を持つ', (skill) => {
    const section = sectionOf(skillBody(skill), /^## 既存 test の再利用/m);
    // 契約の複製ではなく参照であること。 複製すると 16 file のうち 1 つ直した時に 15 が残る。
    expect(section, `${skill} が共有 contract を参照していない`).toContain(REUSE_REF);
    // 対象を絞る規約と、 既存 test を壊さない規約は各 skill の本文にも要る
    // (reference を読まずに動く経路が残るため)。
    expect(section, `${skill} が対象の絞り方を書いていない`).toContain('`未覆` / `不明` の TC だけ');
    expect(section, `${skill} が候補 test の入力と期待を確認していない`).toContain(
      'TC の入力と期待を実際に走らせているか',
    );
    expect(section, `${skill} が既存 test の保護を書いていない`).toContain(
      '既存 test の削除と期待値の書き換えは行わない',
    );
  });
});
