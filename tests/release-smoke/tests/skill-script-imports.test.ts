import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

function read(rel: string): string {
  return readFileSync(resolve(REPO_ROOT, rel), 'utf-8');
}

/**
 * skill が書けと言う script の import が、 書けと言う場所で解決するか (#1915)。
 *
 * `/kiwa-observe` の Step 1 は dashboard を書く本体で、 SKILL.md が TypeScript の
 * script をそのまま示す。 その 1 行目が `@kiwa-lab/observability` の import だが、
 * chain が起動する repo root は **この package を依存として宣言していなかった** ため、
 * 書かれたまま実行すると `ERR_MODULE_NOT_FOUND` で止まった (dogfood で実測)。
 *
 * #1908 と同じ形。 あちらは `kiwa` が PATH に無く chain の 1 step 目が落ちた。 検査が
 * 「書かれている形」 ではなく自前で組み立てた形を実行していたため、 どちらも緑のまま
 * 壊れていた。
 *
 * **Node は import 元 file の場所から解決する** (cwd ではない)。 したがって「repo が
 * 依存を宣言している」 だけでは足りず、 **script を repo の中に書く** ことまでが条件に
 * なる。 SKILL.md がその置き場所を書いていることも併せて検査する。
 */

/** Step 1 の code fence。 */
function stepOneScript(): string {
  const body = read('.claude/skills/kiwa-observe/SKILL.md');
  const start = body.indexOf('### Step 1');
  expect(start, 'Step 1 が見つからない').toBeGreaterThan(-1);
  const fence = /```ts\n([\s\S]*?)```/.exec(body.slice(start));
  expect(fence, 'Step 1 に ts の code fence が無い').not.toBeNull();
  return fence![1]!;
}

/**
 * script が読む package と、 そこから取る名前。
 *
 * 名前まで取るのは、 解決できても **必要な export が無い** 形を分けるため。 package が
 * 解決するだけでは script は走らない。
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
  const script = stepOneScript();
  const { specifier, names } = packageImport(script);

  it('package から 5 つの関数を取っている', () => {
    // 生存確認。 抽出が壊れて空集合になると、 下の実行検査が何も import しない
    // module を走らせて緑になる。
    expect(specifier).toBe('@kiwa-lab/observability');
    expect([...names].sort()).toEqual(
      ['analyzeSpecCoverage', 'collectRunHistory', 'detectFlaky', 'fromVitestJson', 'renderDashboard'].sort(),
    );
  });

  it('repo 内に置いた script から実際に解決する', () => {
    // **書かれている import 形をそのまま実行する**。 自前で相対 path を組み立てて
    // 読むと、 package 名が解決できない状態でも通ってしまう (#1908 と同じ罠)。
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
    // 実行検査は、 宣言を消した後も link が残っている限り通る。 消えるのは次の
    // `pnpm install` で、 その時点で気付く手立てが無くなる。
    const root = JSON.parse(read('package.json')) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    expect(Object.keys({ ...root.dependencies, ...root.devDependencies })).toContain(specifier);
  });

  it('script の置き場所が repo の中だと書いてある', () => {
    // 宣言だけでは足りない。 Node は import 元 file の場所から解決するので、 repo の
    // 外 (harness の scratchpad 等) に書くと同じ `ERR_MODULE_NOT_FOUND` に戻る。
    const body = read('.claude/skills/kiwa-observe/SKILL.md');
    const stepOne = body.slice(body.indexOf('### Step 1'), body.indexOf('```ts'));
    expect(stepOne, '置き場所を書いていない').toContain('.context/scratch/');
    expect(stepOne, 'なぜ repo の中なのかを書いていない').toMatch(/script file の場所/);
  });
});
