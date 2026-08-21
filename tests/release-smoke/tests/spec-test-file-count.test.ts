// 仕様書が書く「探索した test file — N 件」 が実物と一致することを固定する (Issue #2142)。
//
// ## なぜ検査を置くか
//
// #2141 の review が `nextjs-app-router-full` の件数を 1 件ずれていると指摘した。
// 実測すると **8 file 中 7 file がずれており、しかも 3 通りの数え方が混ざっていた**。
//
// | example | 行頭固定 | 前置き込み | 仕様書の記載 |
// |---|---|---|---|
// | `dogfood-mysql-rls-tenant-app` | 66 | 69 | 72 |
// | `dogfood-postgres-cdc-outbox-app` | 55 | 58 | 55 |
// | `nextjs-app-router-full` | 48 | 49 | 49 |
//
// 実物から導ける値を人手で書いたので必ずずれた
// (`rules/quality.md § 導出可能記述は人手で書かない`)。
//
// ## なぜ test の件数ではなく file の件数を数えるか
//
// **test の定義を数えることは決着しない。** 全 example に `X.Y(` の形が 10 種あり、
// 3 群に割れる。
//
// | 群 | 形 |
// |---|---|
// | 定義 | `it.each` / `test.describe` / `describe.runIf` / `describe.skipIf` / `it.skipIf` |
// | 定義ではない | `test.beforeEach` / `test.afterEach` / `test.describe.configure` |
// | **両方** | `test.skip` |
//
// `test.skip` が決め手になる。
//
//     test.skip(!browsersInstalled(), 'reason');   // 条件付き skip の指示
//     test.skip('T-E2E-999 ...', async () => {});  // skip された test の定義
//
// 見分けは第 1 引数の型で、text 上の pattern では決まらない。 実測した 23 件は
// すべて前者なので、`test.skip` を数えれば現在は過大、数えなければ後者が追加された時に
// 過小になる。固定した text pattern では両方を正しく扱えない。
//
// file の件数にはこの分岐が無い。 path が glob に一致するかしないかで、
// 判断が 1 つも要らない。
//
// ## 何を見ないか
//
// **対応表の中身は見ない。** 各行が実 test の定義行を指していることは #2122 の
// 各 Phase が `sed -n '<line>p'` で全件確認しており、そちらは別の主張になる。
// 本 file が見るのは「探索の広さの申告が実物と合っているか」 だけ。

import { execFileSync } from 'node:child_process';
import {
  type Dirent,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  type Stats,
  statSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);

// helper は repo root 起点で読む。 相対 import は `.vitest-dist/` へ compile した側で
// 1 階層ずれる (`repo-root.ts` が同じ理由で存在する)。
const helper = (await import(
  pathToFileURL(resolve(REPO_ROOT, 'scripts/lib/spec-test-files.mjs')).href
)) as {
  listTestFiles: (
    dir: string,
    io?: {
      readdirSync?: (path: string, options: { withFileTypes: true }) => Dirent[];
      statSync?: (path: string) => Stats;
    },
  ) => string[];
  statedFileCount: (specMarkdown: string) => number | null;
  TEST_FILE_SUFFIXES: string[];
  SKIPPED_DIRS: Set<string>;
};
const { listTestFiles, SKIPPED_DIRS, statedFileCount } = helper;

/** 仕様書の置き場所。 example ごとに 1 dir。 */
const SPEC_REL = 'tests/spec/integration';

type Spec = { example: string; file: string; abs: string };

/** `examples/` 配下で e2e 仕様書を持つ example を全部集める。 */
function collectSpecs(): Spec[] {
  const examplesDir = resolve(REPO_ROOT, 'examples');
  const specs: Spec[] = [];
  for (const example of readdirSync(examplesDir, { withFileTypes: true })) {
    if (!example.isDirectory()) continue;
    const specDir = join(examplesDir, example.name, SPEC_REL);
    if (!existsSync(specDir)) continue;
    for (const entry of readdirSync(specDir)) {
      if (!entry.endsWith('.e2e.ja.md')) continue;
      specs.push({ example: example.name, file: entry, abs: join(specDir, entry) });
    }
  }
  return specs.sort((a, b) => (a.abs < b.abs ? -1 : 1));
}

const SPECS = collectSpecs();

const created: string[] = [];
afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

describe('e2e 仕様書 — 探索の広さの申告 (#2142)', () => {
  it('T-SFC-001 仕様書を 1 件以上見つけている', () => {
    // 集合が空だと以下の each が 1 度も走らず、検査の件数だけが並ぶ。
    expect(SPECS.length, 'e2e 仕様書を 1 件も見つけていない (検査が空振りしている)').toBeGreaterThan(0);
  });

  it.each(SPECS)('T-SFC-002 $example/$file の申告が実物と一致する', (spec) => {
    const body = readFileSync(spec.abs, 'utf8');
    const stated = statedFileCount(body);
    expect(
      stated,
      `${spec.example}/${spec.file} に「- 探索した test file — N 件」 の行が無い`,
    ).not.toBeNull();
    const actual = listTestFiles(resolve(REPO_ROOT, 'examples', spec.example)).length;
    expect(
      stated,
      `${spec.example} の申告は ${stated} 件だが実物は ${actual} 件`,
    ).toBe(actual);
  });

  it('T-SFC-003 走査が example ごとに 1 件以上の test file を見つけている', () => {
    // 走査が壊れて 0 を返すと、仕様書側も 0 と書けば T-SFC-002 は通ってしまう。
    const empty = [...new Set(SPECS.map((s) => s.example))].filter(
      (example) => listTestFiles(resolve(REPO_ROOT, 'examples', example)).length === 0,
    );
    expect(empty, `test file を 1 件も見つけられない example がある: ${empty.join(', ')}`).toEqual([]);
  });

  // 実 tree で確かめない。 `node_modules` を走査対象に含めると 1 example ぶんでも
  // 数分では終わらず、「除外が壊れた」 が FAIL ではなく hang として現れる。
  // fixture なら同じことを 1 ms で、しかも失敗として観測できる。
  it('T-SFC-004 走査が除外 dir を降りない', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    const skippedDirs = ['node_modules', '.next', '.turbo', 'dist', '.vitest-dist'];
    expect([...SKIPPED_DIRS].sort()).toEqual([...skippedDirs].sort());
    for (const dir of ['tests', 'tests/e2e', ...skippedDirs]) {
      mkdirSync(join(root, dir), { recursive: true });
    }
    writeFileSync(join(root, 'tests/a.test.ts'), '');
    writeFileSync(join(root, 'tests/e2e/b.spec.ts'), '');
    for (const dir of skippedDirs) writeFileSync(join(root, dir, 'ignored.test.ts'), '');
    // 数えるのは実 test file の 2 件だけ。 除外 dir の 5 件は入らない。
    expect(listTestFiles(root)).toEqual(['tests/a.test.ts', 'tests/e2e/b.spec.ts']);
  });

  it('T-SFC-007 directory symlink を辿るが祖先へ戻る cycle は辿らない', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    mkdirSync(join(root, 'tests'));
    mkdirSync(join(root, 'shared'));
    writeFileSync(join(root, 'shared/a.test.ts'), '');
    symlinkSync(join(root, 'shared'), join(root, 'tests/linked'), 'dir');
    symlinkSync(root, join(root, 'tests/loop'), 'dir');
    expect(listTestFiles(root)).toEqual(['shared/a.test.ts', 'tests/linked/a.test.ts']);
  });

  it('T-SFC-008 dangling symlink を test file として数えない', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    symlinkSync(join(root, 'missing'), join(root, 'dangling.test.ts'));
    expect(listTestFiles(root)).toEqual([]);
  });

  // dangling (ENOENT) は「数えるものが無い」 だが、権限で読めない link は
  // subtree を丸ごと隠しうる。 前者に倒すと、読めなかったことが「0 件だった」 に化ける。
  it('T-SFC-008b 参照先を読めない symlink は握り潰さない', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    mkdirSync(join(root, 'target'));
    writeFileSync(join(root, 'target/a.test.ts'), '');
    const link = join(root, 'linked');
    symlinkSync(join(root, 'target'), link, 'dir');
    expect(() =>
      listTestFiles(root, {
        statSync: ((path: string, ...rest: unknown[]) => {
          if (path === link) {
            const error = new Error('fixture permission failure') as Error & { code?: string };
            error.code = 'EACCES';
            throw error;
          }
          return (statSync as (...args: unknown[]) => unknown)(path, ...rest);
        }) as unknown as typeof statSync,
      }),
    ).toThrow('fixture permission failure');
  });

  // 名前が suffix に一致しても、通常 file でなければ test ではない。
  // 「test を書いた場所」 を数えるので、読めば block する fifo を 1 件に数えると
  // 申告が実物からずれる。
  it('T-SFC-005b 通常 file でない entry は数えない', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    mkdirSync(join(root, 'tests'));
    writeFileSync(join(root, 'tests/real.test.ts'), '');
    execFileSync('mkfifo', [join(root, 'tests/pipe.test.ts')]);
    expect(listTestFiles(root)).toEqual(['tests/real.test.ts']);
  });

  it('T-SFC-009 directory の読取失敗を部分的な成功にしない', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    const blocked = join(root, 'blocked');
    mkdirSync(blocked);
    writeFileSync(join(blocked, 'missed.test.ts'), '');
    expect(() =>
      listTestFiles(root, {
        readdirSync: (path, options) => {
          if (path === blocked) throw new Error('fixture read failure');
          return readdirSync(path, options);
        },
        statSync,
      }),
    ).toThrow('fixture read failure');
  });

  // 上限は SKIPPED_DIRS が壊れた時の backstop なので、通常の tree では 1 度も届かない。
  // 2 つを分けて確かめるため、除外 dir を 1 つも持たない tree で上限だけを越えさせる。
  it('T-SFC-006 走査が上限を越えたら hang せず落ちる', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    // 既定の上限 (20000) を越える entry を、除外対象でない名前だけで作る。
    for (let d = 0; d < 21; d += 1) {
      const dir = join(root, `d${d}`);
      mkdirSync(dir);
      for (let i = 0; i < 1000; i += 1) writeFileSync(join(dir, `f${i}.txt`), '');
    }
    expect(() => listTestFiles(root), '上限を越えても走査が止まらない').toThrow(/走査が/);
  });

  it('T-SFC-005 走査が 4 つの suffix をすべて数える', () => {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-sfc-'));
    created.push(root);
    mkdirSync(join(root, 'tests'), { recursive: true });
    for (const name of ['a.test.ts', 'b.test.tsx', 'c.spec.ts', 'd.spec.tsx', 'e.ts', 'f.md']) {
      writeFileSync(join(root, 'tests', name), '');
    }
    expect(listTestFiles(root)).toEqual([
      'tests/a.test.ts',
      'tests/b.test.tsx',
      'tests/c.spec.ts',
      'tests/d.spec.tsx',
    ]);
  });
});
