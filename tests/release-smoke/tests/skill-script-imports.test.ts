import { execFileSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

import { REPO_ROOT, rootDependencies, skillBody, stepFence } from './skill-md.js';

const SKILL = 'kiwa-observe';
const STEP_ONE = /^### Step 1\b/m;

/**
 * skill が書けと言う script の import が、 書けと言う場所で解決するか (#1915)。
 *
 * `/kiwa-observe` の Step 1 は dashboard を書く本体で、 SKILL.md が TypeScript の script をそのまま
 * 示す。 その 1 行目が `@kiwa-lab/observability` の import だが、 chain が起動する repo root は
 * **この package を依存として宣言していなかった** ため、 書かれたまま実行すると
 * `ERR_MODULE_NOT_FOUND` で止まった (dogfood で実測)。
 *
 * #1908 と同じ形。 あちらは `kiwa` が PATH に無く chain の 1 step 目が落ちた。 検査が「書かれている
 * 形」 ではなく自前で組み立てた形を実行していたため、 どちらも緑のまま壊れていた。
 *
 * **Node は import 元 file の場所から解決する** (cwd ではない)。 したがって「repo が依存を宣言して
 * いる」 だけでは足りず、 **script を repo の中に書く** ことまでが条件になる。 SKILL.md がその
 * 置き場所を書いていることも併せて検査する。
 */

/**
 * 置き場所に言及する行を **file 全体から** 拾う正規表現。
 *
 * 領域を区切ると、 その外に打ち消しを置ける。 Round 2 は契約行の後ろ、 Round 3 は fence の後ろ /
 * fence 内 comment / Step 1 より前が抜けていた。 区切りを広げ続ける代わりに、 **file のどこであれ
 * 置き場所に触れる行は宣言と一致していること** を要求する。
 */
const PLACEMENT_MENTION = /repo の中に書く|repo の外|scratchpad|\.context\/scratch\//;

/**
 * 置き場所を語る行の全件 (契約)。
 *
 * この 3 行以外に置き場所へ触れる行があってはならない。 増えた行が指示でも例外でも、 まず差分に
 * 出る。
 *
 * **覆えていない形**。 場所を名指ししない打ち消し (「上記は原則にすぎない」 等) は拾えない。
 * 自然文の否定を機械で網羅する道は取らない = 本検査の review が 3 round かけて、 区切りを広げる
 * たびに別の抜け道が出ることを実測した。 実際の欠陥 (import が解決しない) は下の実行検査が押さえて
 * おり、 本検査は「指示が書き換わったら気付く」 ための guard として置く。
 */
const PLACEMENT_STATEMENTS = [
  '**script は repo の中に書く**。 置き場所は `<repo>/.context/scratch/` (git 追跡外)。',
  'Node は import を **script file の場所** から解決する (cwd ではない)。 repo の外 (harness の',
  'scratchpad 等) に書くと、 repo の `node_modules` に届かず 1 行目で',
];

function placementStatements(body: string): string[] {
  return body
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => PLACEMENT_MENTION.test(line));
}

/**
 * script が読む package と、 そこから取る名前。
 *
 * 名前まで取るのは、 解決できても **必要な export が無い** 形を分けるため。 package が解決する
 * だけでは script は走らない。
 */
function packageImport(script: string): { specifier: string; names: string[] } {
  const parsed = /import\s*\{([\s\S]*?)\}\s*from\s*'([^']+)'/.exec(script);
  expect(parsed, 'Step 1 に named import が無い').not.toBeNull();
  const names = parsed![1]!
    .split(',')
    .map((n) => n.trim())
    .filter((n) => n.length > 0);
  expect(names.length, 'import する名前を 1 つも読めない').toBeGreaterThan(0);
  return { specifier: parsed![2]!, names };
}

describe('kiwa-observe の Step 1 script が起動場所で解決する', () => {
  const { specifier, names } = packageImport(stepFence(SKILL, STEP_ONE, 'ts'));

  it('package から 5 つの関数を取っている', () => {
    // 生存確認。 抽出が壊れて空集合になると、 下の実行検査が何も import しない module を走らせて
    // 緑になる。
    expect(specifier).toBe('@kiwa-lab/observability');
    expect([...names].sort()).toEqual(
      ['analyzeSpecCoverage', 'collectRunHistory', 'detectFlaky', 'fromVitestJson', 'renderDashboard'].sort(),
    );
  });

  it('repo 内に置いた script から実際に解決する', () => {
    // **書かれている import 形をそのまま実行する**。 自前で相対 path を組み立てて読むと、 package 名が
    // 解決できない状態でも通ってしまう (#1908 と同じ罠)。
    const dir = resolve(REPO_ROOT, '.context/scratch');
    mkdirSync(dir, { recursive: true });
    const file = resolve(dir, `kiwa-observe-import-check-${process.pid}.mjs`);
    try {
      writeFileSync(
        file,
        [
          `import { ${names.join(', ')} } from '${specifier}';`,
          `const missing = Object.entries({ ${names.join(', ')} })`,
          `  .filter(([, v]) => typeof v !== 'function')`,
          `  .map(([k]) => k);`,
          `if (missing.length) { console.error('not a function: ' + missing.join(', ')); process.exit(1); }`,
          `console.log('ok');`,
        ].join('\n'),
        'utf-8',
      );
      const out = execFileSync('node', [file], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' });
      expect(out.trim()).toBe('ok');
    } finally {
      rmSync(file, { force: true });
    }
  });

  it('root が package を依存として宣言している', () => {
    // 実行検査は、 宣言を消した後も link が残っている限り通る。 消えるのは次の `pnpm install` で、
    // その時点で気付く手立てが無くなる。
    expect(Object.keys(rootDependencies())).toContain(specifier);
  });

  it('置き場所を語る行が宣言と一致する', () => {
    // 宣言だけでは足りない。 Node は import 元 file の場所から解決するので、 repo の外 (harness の
    // scratchpad 等) に書くと同じ `ERR_MODULE_NOT_FOUND` に戻る。
    //
    // **区切った領域の中だけを見ない**。 語の有無 (Round 1) / 先頭 1 行 (Round 2) / heading から fence
    // まで (Round 3) と広げるたびに、 その外に打ち消しを置けた。 file 全体で「置き場所に触れる行」 を
    // 数え、 宣言と一致することを要求する。
    expect(placementStatements(skillBody(SKILL))).toEqual(PLACEMENT_STATEMENTS);
  });

  it('どの位置に置いた打ち消しも拾う', () => {
    // 検査の識別力を helper 自身に当てて確かめる。 Round 2 / Round 3 が指摘した「境界の外」 を全て
    // 並べる。
    const body = skillBody(SKILL);
    const injections: [string, string][] = [
      ['Step 1 より前', `ただし script は repo の外に書く。\n${body}`],
      [
        '契約行の直後',
        body.replace(PLACEMENT_STATEMENTS[0]!, `${PLACEMENT_STATEMENTS[0]!}\n\nただし harness では repo の外に書く。`),
      ],
      [
        'fence の中の comment',
        body.replace('```ts\nimport {', '```ts\n// 実際は harness の scratchpad に書く\nimport {'),
      ],
      ['fence より後ろ', `${body}\n\n補足 = script は \`.context/scratch/\` でなくてもよい。`],
      ['file 末尾', `${body}\n\nscratchpad に書いてもよい。`],
    ];
    for (const [label, mutated] of injections) {
      expect(placementStatements(mutated), `打ち消しを拾えていない: ${label}`).not.toEqual(
        PLACEMENT_STATEMENTS,
      );
    }
    // 反転と削除も落ちる。
    expect(placementStatements(body.replace('repo の中に書く', 'repo の外に書く'))).not.toEqual(
      PLACEMENT_STATEMENTS,
    );
    expect(placementStatements(body.replace(PLACEMENT_STATEMENTS[0]!, ''))).not.toEqual(
      PLACEMENT_STATEMENTS,
    );
  });

  it('repo の外に置いた script は解決しない', () => {
    // 指示が **なぜ** 要るかを実行で押さえる。 prose の検査は書き換えを検知するだけで、 指示が今も
    // 効いている根拠にはならない。 package manager や Node の解決規則が変わって repo 外でも解決する
    // ようになったら、 この検査が落ちて指示を見直せる。
    const outside = resolve(tmpdir(), `kiwa-observe-outside-${process.pid}.mjs`);
    try {
      writeFileSync(outside, `import '${specifier}';\n`, 'utf-8');
      let failed = false;
      try {
        execFileSync('node', [outside], { cwd: REPO_ROOT, encoding: 'utf-8', stdio: 'pipe' });
      } catch (err) {
        failed = String((err as { stderr?: string }).stderr ?? '').includes('ERR_MODULE_NOT_FOUND');
      }
      expect(failed, 'repo 外の script が解決してしまう = 置き場所の指示が不要になっている').toBe(
        true,
      );
    } finally {
      rmSync(outside, { force: true });
    }
  });
});
