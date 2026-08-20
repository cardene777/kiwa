import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, headingSectionIn, read } from './skill-md.js';

/**
 * `/kiwa-review` が読む入力を、 実際に読める形で書けているか。
 *
 * 手順どおりに `--mode test-review` を回すと、 応答の検証表を全行 pass した直後に spec の
 * Read が `No such file or directory` で落ちた (#2044)。 原因は応答の壊れではなく、 同じ
 * 応答の中で `spec_path` と `test_paths.files` の起点が違うこと。 「JSON が読めるか」 までを
 * 見る検査では届かないので、 **実在する example で 2 つの path を実際に開いて**確かめる。
 *
 * 同じ run で result-review 側も見たところ、 weight 0.20 の軸 4 が子 report 0 件のまま
 * 「推定」 で 9/10 を計上していた (`tests/reports/review/` の 5 件すべて)。 集約する側と
 * 集約される側が同じ agent になり、 軸が測っているものが消えていた。
 */

const REVIEW = read('.claude/skills/kiwa-review/SKILL.md');
const RESULT_AXES = read('.claude/skills/kiwa-review/references/result-review-axes.md');
const TEST_SKILL = read('.claude/skills/kiwa-test/SKILL.md');

/** dogfood に使った実在の example。 spec が example 配下にある形の代表。 */
const EXAMPLE = 'examples/react-component-poc';
const LAYER = 'ui';
const MODULE = 'counter';
const PRODUCER = 'kiwa-ui';

interface Layer {
  id: string;
  spec_dir: string;
  spec_path: string | null;
  test_paths?: { producer: string; anchor: string | null; patterns: string[]; files: string[] };
}

/**
 * header 行で名指しした表の、 データ行だけ。
 *
 * `|` で始まる行を file 全体から拾うと隣の表を拾う。 同じ語が 2 つの表に出る時に、
 * 片方から行を消す変異が素通りする (実測 = 判定表とサマリ表の両方に「未測定」 と
 * 「CONDITIONAL」 があった)。
 */
function tableRows(body: string, header: RegExp): string[] {
  const at = body.search(header);
  if (at < 0) throw new Error(`${header} の表が見つからない`);
  const rows: string[] = [];
  for (const line of body.slice(at).split('\n').slice(2)) {
    if (!line.startsWith('|')) break;
    rows.push(line);
  }
  return rows;
}

/**
 * 手順に書かれた解決 command を、 built binary で実際に走らせる。
 *
 * 関数を import せず command を叩くのは、 skill が消費するのが出力だからで、
 * `lang-suffix-agreement` が同じ理由で同じ形を採っている。
 */
function resolveLayer(opts: {
  layer: string;
  lang: string;
  module: string;
  producer: string;
  projectRoot: string;
}): Layer {
  const bin = resolve(REPO_ROOT, 'packages/cli/dist/bin.js');
  const out = execFileSync(
    'node',
    [
      bin,
      'layers',
      '--json',
      '--layer',
      opts.layer,
      '--lang',
      opts.lang,
      '--module',
      opts.module,
      '--producer',
      opts.producer,
      '--project-root',
      opts.projectRoot,
    ],
    { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' },
  );
  const parsed = JSON.parse(out) as { layers: Layer[] };
  const layer = parsed.layers.find((l) => l.id === opts.layer);
  if (!layer) throw new Error(`${opts.layer} が応答に無い`);
  return layer;
}

describe('kiwa-review が読む入力の起点', () => {
  it('spec_path と test_paths.files の起点は実測で違う', () => {
    const layer = resolveLayer({
      layer: LAYER,
      lang: 'en',
      module: MODULE,
      producer: PRODUCER,
      projectRoot: EXAMPLE,
    });
    const spec = layer.spec_path;
    const files = layer.test_paths?.files ?? [];

    expect(spec, 'spec_path が返っていない').toBeTruthy();
    expect(files.length, 'test_paths.files が 0 件では起点を比べられない').toBeGreaterThan(0);

    // test 側は cwd 起点なので、 repo root からそのまま開ける。
    expect(files[0]!.startsWith(`${EXAMPLE}/`), 'test_paths.files が cwd 起点でない').toBe(true);
    expect(existsSync(resolve(REPO_ROOT, files[0]!)), 'test file が開けない').toBe(true);

    // spec 側は project-root 起点なので、 repo root からは開けず、 前置して初めて開ける。
    // この 2 行が本 Issue の穴そのもの = 手順どおりに前者を開くと ENOENT になる。
    expect(existsSync(resolve(REPO_ROOT, spec!)), 'spec_path が cwd 起点で開けてしまう').toBe(
      false,
    );
    expect(existsSync(resolve(REPO_ROOT, EXAMPLE, spec!)), 'project-root 起点でも開けない').toBe(
      true,
    );
  });

  it('起点が一致する呼出では差が出ない (陰性対照)', () => {
    // 上の検査は「cwd から開けない」 ことを判定材料にする。 判定材料が恒真でないことを、
    // **差がゼロの入力** で確かめる = `--project-root .` なら 2 つの起点は同じ dir を指す
    // ので、 spec は cwd からそのまま開けなければならない。 ここが常に開けないなら、
    // 上の検査は起点の差ではなく「いつでも開けない」 を見ていることになる。
    const layer = resolveLayer({
      layer: 'contract',
      lang: 'ja',
      module: 'mint-nft',
      producer: 'kiwa-forge',
      projectRoot: '.',
    });
    expect(layer.spec_path, 'spec_path が返っていない').toBeTruthy();
    expect(
      existsSync(resolve(REPO_ROOT, layer.spec_path!)),
      '起点が一致しているのに cwd から開けない',
    ).toBe(true);
  });

  it('起点が違うことを SKILL.md の表が書いている', () => {
    // 散文ではなく **表の行** を見る。 節の中に「`spec_path` は `--project-root` 起点」 と
    // いう地の文が別にあるため、 節全体を対象にすると行を薄める変異が素通りする
    // (実測 = 変異 m8 が 1 度素通りした)。
    const rows = headingSectionIn(REVIEW, /^#### 2 つの path は起点が違う$/m)
      .split('\n')
      .filter((l) => l.startsWith('|'));
    const spec = rows.find((l) => l.includes('`spec_path`'));
    const tests = rows.find((l) => l.includes('test_paths'));
    expect(spec, '起点の表に spec_path 行が無い').toBeTruthy();
    expect(spec!, 'spec_path の起点が --project-root になっていない').toContain('--project-root');
    expect(tests, '起点の表に test_paths 行が無い').toBeTruthy();
    expect(tests!, 'test_paths の起点が cwd になっていない').toContain('cwd');
  });

  it('spec 解決 command が --project-root を渡している', () => {
    // 起点が `--project-root` である以上、 渡さない command は example 配下の spec を
    // repo root から探すことになる。 fence を範囲で閉じて取る = 隣の節の fence に流れない。
    const section = headingSectionIn(REVIEW, /^### 入力 spec の path は CLI から受け取る$/m);
    const fence = /```bash\n([\s\S]*?)```/.exec(section);
    expect(fence, '解決 command の fence が無い').toBeTruthy();
    expect(fence![1], '解決 command に --project-root が無い').toContain('--project-root');
  });

  it('検証表が「解決先に file が無い」 を中断として持つ', () => {
    // 表の全行を pass した応答でも Read は落ちる。 その 1 行が無いと、 起点違いと
    // spec 未生成が同じ「spec が無い」 に潰れる。
    const section = headingSectionIn(REVIEW, /^#### 解決に失敗したら止める$/m);
    const row = section
      .split('\n')
      .filter((l) => l.startsWith('|'))
      .find((l) => l.includes('file が無い'));
    expect(row, '「file が無い」 行が検証表に無い').toBeTruthy();
    expect(row!, 'file が無い時に中断すると書かれていない').toContain('中断');
  });
});

describe('kiwa-review が spec path を組み立てていない', () => {
  it('§ 前提 が書いた件数が docs/layers.json と一致する', () => {
    // 下の検査が意味を持つ前提であり、 同時に **手で書いた数を実物で固定する**。
    // 最初に書いた「20 layer 中 16 が integration 配下」 は誤りで、 `integration` 配下は
    // 17、 `spec_dir !== id` が 16 だった。 数を書くなら導出側を置く (#2044)。
    const table = JSON.parse(read('docs/layers.json')) as { layers: Layer[] };
    const diverging = table.layers.filter((l) => l.spec_dir !== l.id);
    expect(diverging.length, 'spec_dir が layer id と異なる layer が 1 件も無い').toBeGreaterThan(
      0,
    );

    const claim = /(\d+) layer 中 (\d+) で `spec_dir` が layer id と別/.exec(REVIEW);
    expect(claim, '§ 前提 に件数の記述が無い').toBeTruthy();
    expect(Number(claim![1]), 'layer の総数が実物と違う').toBe(table.layers.length);
    expect(Number(claim![2]), 'spec_dir が layer id と異なる件数が実物と違う').toBe(
      diverging.length,
    );
  });

  it('自分が持つ file に literal な tests/spec/{layer}/ 指示が残っていない', () => {
    // 走査するのは本 skill が所有する 2 file だけ。 `references/doc-language-selection.md` は
    // `kiwa-forge` 側の実体への symlink で 6 skill が共有しており、 そこにある
    // `tests/spec/{layer}/...` は `/kiwa-design` の出力先の記述。 別 skill の所有物なので
    // ここでは直さず、 対象外であることを明示して残す (#2044)。
    for (const rel of [
      '.claude/skills/kiwa-review/SKILL.md',
      '.claude/skills/kiwa-review/references/result-review-axes.md',
      '.claude/skills/kiwa-review/references/spec-review-axes.md',
      '.claude/skills/kiwa-review/references/test-review-axes.md',
    ]) {
      expect(read(rel), `${rel} に literal な spec path 指示が残っている`).not.toContain(
        'tests/spec/{layer}/',
      );
    }
  });
});

describe('result-review の軸 4 が推定で埋まらない', () => {
  it('推定を禁じ、 未測定の扱いを 3 点とも書いている', () => {
    const section = headingSectionIn(RESULT_AXES, /^### 読めなかった時に推定で埋めない$/m);
    expect(section, '推定の禁止が書かれていない').toMatch(/推定値を入れてはいけない/);

    // 3 点は **表の行** で見る。 節の地の文にも「再正規化しない」 が出てくるため、
    // 節全体を対象にすると行を書き換える変異が素通りする (実測 = 変異 m5)。
    const rows = section.split('\n').filter((l) => l.startsWith('|'));
    expect(rows.find((l) => l.includes('`—`')), '未測定の score 表記の行が無い').toBeTruthy();
    expect(rows.find((l) => l.includes('CONDITIONAL')), '未測定時の判定の行が無い').toBeTruthy();
    const denominator = rows.find((l) => l.includes('分母'));
    expect(denominator, '分母の扱いを書いた行が無い').toBeTruthy();
    expect(denominator!, '分母を 1.00 のままにする指示が無い').toContain('1.00');
    expect(denominator!, '再正規化しない指示が無い').toContain('再正規化しない');
  });

  it('子 report の path を組み立てない指示がある', () => {
    const section = headingSectionIn(RESULT_AXES, /^### 子 report の path は組み立てない$/m);
    expect(section, '統合 report から読む指示が無い').toContain('Section 2');
    expect(section, '組み立て禁止が書かれていない').toMatch(/組み立て/);
  });

  it('SKILL.md の判定表が未測定軸を CONDITIONAL にしている', () => {
    // **判定表そのもの** を切り出して見る。 file 全体から `|` 行を拾うと、 サマリ表の
    // Weighted Score 行 (「未生成 TC / 未測定軸が …… CONDITIONAL」) を拾ってしまい、
    // 判定表から行を消す変異が素通りする (実測 = 変異 m6)。
    const row = tableRows(REVIEW, /^\| 条件 \| 判定 \|$/m).find((l) => l.includes('未測定'));
    expect(row, '判定表に未測定軸の行が無い').toBeTruthy();
    expect(row!, '未測定軸が CONDITIONAL になっていない').toContain('CONDITIONAL');
  });
});

describe('review report の名前が writer と reader で一致する', () => {
  /**
   * `{mode}-review-{...}` 形の宣言が使う placeholder を全部集める。
   *
   * 書くのは `/kiwa-review` Step 3 の 1 箇所だけで、 名前は `--module` の値で決まる。
   * `{example}` で読む側は module と example が違う layer で必ず外し、 軸 4 が毎回
   * 未測定に落ちる。 `-foundry` / `-{tool}` のような suffix も writer には出せない。
   */
  function declaredPlaceholders(body: string): string[] {
    return [...body.matchAll(/(?:\{mode\}|spec|test|result)-review-\{(\w+)\}/g)].map((m) => m[1]!);
  }

  it('kiwa-review 側の宣言が {module} で揃っている', () => {
    const found = new Set(declaredPlaceholders(REVIEW));
    expect([...found].sort(), 'writer 以外の placeholder が混ざっている').toEqual(['module']);
  });

  it('kiwa-test 側が writer に出せない名前を宣言していない', () => {
    const found = new Set(declaredPlaceholders(TEST_SKILL));
    expect([...found].sort(), 'writer が出せない placeholder を宣言している').toEqual([
      'example',
      'module',
    ]);

    // suffix 付きの名前は `--out` を渡す時だけ caller が決められる。 名前だけ宣言して
    // `--out` が無ければ writer は出せないので、 全 occurrence を直前の flag と対応付ける。
    const explicit = [...TEST_SKILL.matchAll(/\/kiwa-review[^\n]*--out\s+(tests\/reports\/review\/\S+\.md)/g)].map(
      (m) => m[1]!,
    );
    expect(explicit.length, '子 review の明示 --out が 9 件でない').toBe(9);
    expect(new Set(explicit).size, '子 review の --out が衝突している').toBe(explicit.length);
    expect(explicit.every((p) => p.startsWith('tests/reports/review/'))).toBe(true);

    // `--out` を渡さない result-review は writer の既定名を使うため、
    // placeholder は `--module` と同じ module でなければならない。
    const implicit = TEST_SKILL.split('\n')
      .filter((line) => !line.includes('--out'))
      .flatMap((line) => [...line.matchAll(/(?:spec|test|result)-review-\{(\w+)\}/g)])
      .map((m) => m[1]!);
    expect(implicit, '既定出力名が module 以外の placeholder を使っている').toEqual(['module']);

    // **`--out` を伴わない suffix 付きの名前は残っていない**。 上の 3 行だけだと、
    // `--out` の無い行に `test-review-{example}-{tool}.{lang}.md` と書いた宣言が
    // 素通りする (実測 = 変異 m7)。 writer が出せるのは lang suffix までなので、
    // それ以外の形は同じ行に `--out` が無ければ誰も出せない名前になる。
    const unbacked = TEST_SKILL.split('\n')
      .filter((line) => !line.includes('--out'))
      .flatMap((line) => [...line.matchAll(/review-\{example\}([^\s`|)]*?)\.md/g)])
      .map((m) => m[1]!)
      .filter((middle) => !/^(?:\.\{(?:lang|\$DOC_LANG)\})?$/.test(middle));
    expect(unbacked, '--out を伴わない suffix 付きの名前が残っている').toEqual([]);
  });

  it('kiwa-test は子の自動 review を止めて一意な --out で直接 review する', () => {
    const lines = TEST_SKILL.split('\n');
    for (const step of [
      'Step 3a',
      'Step 3b',
      'Step 3c',
      'Step 4a',
      'Step 4b',
      'Step 4w-e2e-a',
      'Step 4w-e2e-b',
      'Step 4w-a11y-a',
      'Step 4w-a11y-b',
    ]) {
      const at = lines.findIndex((l) => l.startsWith(`[${step}]`));
      expect(at, `${step} の生成側起動が無い`).toBeGreaterThanOrEqual(0);
      expect(
        lines.slice(at, at + 3).join('\n'),
        `${step} が子の自動 review を止めていない`,
      ).toContain('--no-review');
    }

    // 初回 chain だけでなく auto-fix loop の再生成も同じ規約に従う。 Step 名だけを
    // 列挙すると loop 内の command が検査対象から落ち、 FAIL 後だけ既定 report を
    // 再び上書きする回帰が素通りする。
    // **行頭で anchor せず、 fence の中だけを見る**。 起動行は cwd の指示
    // (`examples/{example}/ へ cd して`) を前置する形になったため、 `[Step 3a] /kiwa-design ...`
    // の並びを前提にすると検出数が落ちて検査が空回りする (#2046 の review で実際に落ちた)。
    // 一方 anchor を外すだけだと、 description の 1 文や統合 report の表の行まで拾う。
    // 起動が書かれるのは fence の中だけなので、 対象をそこに絞る。
    // fence は **言語で選ぶ**。 `mermaid` の node label (`C1["/kiwa-design --layer contract"]`)
    // は図のための省略表記で起動ではないため、 混ぜると `--no-review` の欠落として 7 件出る。
    const fenced: string[] = [];
    let lang: string | null = null;
    for (const line of TEST_SKILL.split('\n')) {
      const open = /^\s*```(\w*)/.exec(line);
      if (open) {
        lang = lang === null ? (open[1] || 'plain') : null;
        continue;
      }
      if (lang === 'text' || lang === 'bash') fenced.push(line);
    }
    // 起動行は **skill 名の直後に flag が続く**。 先頭の `/` を要求して review 行の
    // `--producer kiwa-forge` を外し、 直後の `--` を要求して fence 内の言及
    // (`# invoke /kiwa-forge` / 統合 report の表の `| /kiwa-hardhat |`) を外す。
    const generationInvocations = fenced.filter((line) =>
      /\/kiwa-(?:design|forge|hardhat|play|e2e|a11y)\s+--/.test(line),
    );
    expect(generationInvocations.length, '生成側の起動を十分に検出できていない').toBeGreaterThan(9);
    expect(
      generationInvocations.filter((line) => !line.includes('--no-review')),
      '子の自動 review が有効な生成側起動が残っている',
    ).toEqual([]);

    // `--no-review` だけでは再生成後の review が消える。 auto-fix 節自身が、 初回 chain と
    // 同じ一意な出力先を使う親の直接 review 経路まで保持していることを確認する。
    const autoFix = headingSectionIn(
      TEST_SKILL,
      /^### Step 5c: auto-fix loop \(review FAIL 時の自走修正、 上限なし\)$/m,
    );
    expect(autoFix, 'auto-fix 後の review が repo root 起点でない').toContain('repo root から');
    expect(autoFix, 'auto-fix 後に親が review を直接再実行していない').toContain(
      'spec-review / test-review を直接再実行',
    );
    expect(autoFix, 'auto-fix 後の review 出力先が一意でない').toContain(
      'Steps 3 / 4 と同じ一意な `--out`',
    );
  });

  it('Step 3 が書いた path を chain return に載せる', () => {
    const section = headingSectionIn(REVIEW, /^### Step 4: chain return$/m);
    expect(section, 'return に report path を載せる指示が無い').toMatch(/report path/);
  });

  it('kiwa-test が統合 report に child の返した path を書く', () => {
    const row = TEST_SKILL.split('\n').find((l) => l.startsWith('| review report'));
    expect(row, '統合 report Section 2 に review report 行が無い').toBeTruthy();
    expect(row!, 'child の返した path を書く指示になっていない').toContain('chain return');
  });

  it('result-review に example の project-root を渡し CONDITIONAL を受ける', () => {
    const section = headingSectionIn(TEST_SKILL, /^### Step 5b: kiwa-review 自動呼出 \(result-review mode\)$/m);
    expect(section, 'result-review に project-root が無い').toContain(
      '--project-root examples/{example}',
    );
    expect(section, 'result-review の CONDITIONAL 分岐が無い').toContain('CONDITIONAL');
  });
});
