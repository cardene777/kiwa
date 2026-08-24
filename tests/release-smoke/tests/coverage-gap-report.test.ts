// `scripts/coverage-gap-report.mjs` の出力を fixture で固定する (Issue #2193)。
//
// gap report は「次にどこを埋めるか」 を返すのが役目なので、**並び順**と**残り量**が
// 正しいことが本体になる。 出力できることだけを見ると、全部 0 件を返す実装でも通る。
//
// fixture を使うのは、実 repo の `coverage-final.json` が 1 通りの形しか持たないため。
// 実 file だけで検査すると「並び替えが効いているか」 を判定できない (どう並べても
// 同じ順になる入力では、比較子を壊しても落ちない)。 同じ罠を Issue #2185 で踏んでいる。
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/coverage-gap-report.mjs');

const roots: string[] = [];

afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

/** istanbul の 1 statement 分の map entry。 */
function stmt(line: number) {
  return { start: { line, column: 0 }, end: { line, column: 10 } };
}

type FileSpec = {
  rel: string;
  covered: number[];
  uncovered: number[];
  /** `[line, 各 path の hit 数]`。 0 を含む path が未覆分岐になる。 */
  branches?: [number, number[]][];
  /** `[関数名, line, hit 数]`。 hit 0 が未覆関数になる。 */
  fns?: [string, number, number][];
};

/**
 * fixture の package を 1 つ作る。
 *
 * `covered` / `uncovered` は行番号の配列で、`s` の hit 数をそれぞれ 1 / 0 にする。
 * `coverage-final.json` の path は実 repo と同じく `.vitest-dist` を指す形で書く
 * (実測で 6 package すべてがこの形だった)。
 */
function writePkg(root: string, pkgDir: string, files: FileSpec[]) {
  mkdirSync(join(root, pkgDir, 'coverage'), { recursive: true });
  const final: Record<string, unknown> = {};
  for (const f of files) {
    const abs = join(root, pkgDir, '.vitest-dist', f.rel.replace(/\.ts$/, '.js'));
    const statementMap: Record<string, unknown> = {};
    const s: Record<string, number> = {};
    let i = 0;
    for (const line of f.covered) {
      statementMap[String(i)] = stmt(line);
      s[String(i)] = 1;
      i += 1;
    }
    for (const line of f.uncovered) {
      statementMap[String(i)] = stmt(line);
      s[String(i)] = 0;
      i += 1;
    }
    const branchMap: Record<string, unknown> = {};
    const b: Record<string, number[]> = {};
    let bi = 0;
    for (const [line, hits] of f.branches ?? []) {
      branchMap[String(bi)] = {
        type: 'branch',
        line,
        loc: stmt(line),
        locations: hits.map(() => stmt(line)),
      };
      b[String(bi)] = hits;
      bi += 1;
    }
    const fnMap: Record<string, unknown> = {};
    const fn: Record<string, number> = {};
    let fi = 0;
    for (const [name, line, hits] of f.fns ?? []) {
      fnMap[String(fi)] = { name, decl: stmt(line), loc: stmt(line), line };
      fn[String(fi)] = hits;
      fi += 1;
    }
    final[abs] = { path: abs, all: true, statementMap, s, branchMap, b, fnMap, f: fn };
  }
  writeFileSync(join(root, pkgDir, 'coverage/coverage-final.json'), JSON.stringify(final));
}

function run(root: string, args: string[] = []): string {
  return execFileSync(process.execPath, [SCRIPT, '--json', ...args], {
    encoding: 'utf8',
    env: { ...process.env, KIWA_GATE_ROOT: root },
  });
}

function fixture(spec: Record<string, FileSpec[]>) {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-gap-'));
  roots.push(root);
  mkdirSync(join(root, 'packages'), { recursive: true });
  for (const [pkgDir, files] of Object.entries(spec)) writePkg(root, pkgDir, files);
  return root;
}

describe('coverage-gap-report', () => {
  it('T-CGR-001 未覆行の多い package を先に出す', () => {
    // `small` は 1 行、`big` は 3 行が未覆。 残り量の降順なので big が先。
    const root = fixture({
      'packages/small': [{ rel: 'src/a.ts', covered: [1, 2, 3], uncovered: [4] }],
      'packages/big': [{ rel: 'src/b.ts', covered: [1], uncovered: [2, 3, 4] }],
    });
    const out = JSON.parse(run(root)) as { packages: { dir: string; uncovered: number }[] };

    expect(
      out.packages.length,
      'gap が 1 件も出ていない (検査が空振りしている)',
    ).toBeGreaterThan(0);
    expect(out.packages.map((p) => p.dir)).toEqual(['packages/big', 'packages/small']);
    expect(out.packages.map((p) => p.uncovered)).toEqual([3, 1]);
  });

  it('T-CGR-002 100% の package は gap に出さない', () => {
    // 埋まっている package を勧めても意味が無い。 **消えることを直接見る**
    // (件数の下限だけを見ると、消していない実装でも通る)。
    const root = fixture({
      'packages/done': [{ rel: 'src/a.ts', covered: [1, 2], uncovered: [] }],
      'packages/todo': [{ rel: 'src/b.ts', covered: [1], uncovered: [2] }],
    });
    const out = JSON.parse(run(root)) as { packages: { dir: string }[] };

    expect(out.packages.map((p) => p.dir)).toEqual(['packages/todo']);
  });

  it('T-CGR-003 未覆行の行番号を file 単位で出す', () => {
    const root = fixture({
      'packages/x': [{ rel: 'src/a.ts', covered: [1], uncovered: [7, 9, 11] }],
    });
    const out = JSON.parse(run(root)) as {
      packages: { files: { source: string; lines: number[] }[] }[];
    };
    const file = out.packages[0]?.files[0];

    expect(file?.lines).toEqual([7, 9, 11]);
  });

  it('T-CGR-004 path を .vitest-dist から source へ戻す', () => {
    // coverage は compile 後の `.js` を指す。 そのまま出すと読み手が
    // 存在しない file を開くことになる。
    const root = fixture({
      'packages/x': [{ rel: 'src/nested/a.ts', covered: [1], uncovered: [2] }],
    });
    const out = JSON.parse(run(root)) as { packages: { files: { source: string }[] }[] };

    expect(out.packages[0]?.files[0]?.source).toBe('packages/x/src/nested/a.ts');
  });

  it('T-CGR-005 file の中でも未覆行の多い順に並べる', () => {
    const root = fixture({
      'packages/x': [
        { rel: 'src/few.ts', covered: [1], uncovered: [2] },
        { rel: 'src/many.ts', covered: [1], uncovered: [2, 3, 4, 5] },
      ],
    });
    const out = JSON.parse(run(root)) as { packages: { files: { source: string }[] }[] };

    expect(out.packages[0]?.files.map((f) => f.source)).toEqual([
      'packages/x/src/many.ts',
      'packages/x/src/few.ts',
    ]);
  });

  it('T-CGR-006 同数の時は path で並べて順序を決める', () => {
    // 同数を放置すると `Object.keys` の順に依存し、file を 1 つ増やすだけで
    // 出力順が変わる。 **順序が入力に対して決まっている**ことを固定する。
    const root = fixture({
      'packages/x': [
        { rel: 'src/b.ts', covered: [1], uncovered: [2] },
        { rel: 'src/a.ts', covered: [1], uncovered: [2] },
      ],
    });
    const out = JSON.parse(run(root)) as { packages: { files: { source: string }[] }[] };

    expect(out.packages[0]?.files.map((f) => f.source)).toEqual([
      'packages/x/src/a.ts',
      'packages/x/src/b.ts',
    ]);
  });

  it('T-CGR-007 test file は gap に数えない', () => {
    // 覆う対象は production code。 test 自身の未実行行を勧めると、
    // 「test の test を書く」 に誘導する。
    const root = fixture({
      'packages/x': [
        { rel: 'src/a.ts', covered: [1], uncovered: [2] },
        { rel: 'tests/a.test.ts', covered: [1], uncovered: [2, 3, 4, 5, 6] },
      ],
    });
    const out = JSON.parse(run(root)) as {
      packages: { uncovered: number; files: { source: string }[] }[];
    };

    expect(out.packages[0]?.files.map((f) => f.source)).toEqual(['packages/x/src/a.ts']);
    expect(out.packages[0]?.uncovered).toBe(1);
  });

  it('T-CGR-008 coverage-final.json が無い package は理由つきで別枠に出す', () => {
    // 「gap 0 件」 と「測っていない」 を同じ形にしない。 前者は埋まっている、
    // 後者は**何も分かっていない**。 潰すと未測定が達成に化ける。
    const root = mkdtempSync(join(tmpdir(), 'kiwa-gap-'));
    roots.push(root);
    mkdirSync(join(root, 'packages/nomeasure'), { recursive: true });
    writePkg(root, 'packages/x', [{ rel: 'src/a.ts', covered: [1], uncovered: [2] }]);

    const out = JSON.parse(run(root)) as {
      packages: { dir: string }[];
      unmeasured: { dir: string; reason: string }[];
    };

    expect(out.packages.map((p) => p.dir)).toEqual(['packages/x']);
    expect(out.unmeasured.map((u) => u.dir)).toEqual(['packages/nomeasure']);
    expect(out.unmeasured[0]?.reason).toMatch(/coverage-final\.json/);
  });

  it('T-CGR-009 Markdown でも同じ順序で出す', () => {
    // `--json` を付けない既定の出力。 JSON だけを検査すると、人が読む側が
    // 空でも通る。
    const root = fixture({
      'packages/small': [{ rel: 'src/a.ts', covered: [1, 2, 3], uncovered: [4] }],
      'packages/big': [{ rel: 'src/b.ts', covered: [1], uncovered: [2, 3, 4] }],
    });
    const md = execFileSync(process.execPath, [SCRIPT], {
      encoding: 'utf8',
      env: { ...process.env, KIWA_GATE_ROOT: root },
    });

    expect(md.indexOf('packages/big')).toBeGreaterThanOrEqual(0);
    expect(md.indexOf('packages/big')).toBeLessThan(md.indexOf('packages/small'));
  });

  it('T-CGR-010 --package で 1 つに絞れる', () => {
    const root = fixture({
      'packages/a': [{ rel: 'src/a.ts', covered: [1], uncovered: [2, 3] }],
      'packages/b': [{ rel: 'src/b.ts', covered: [1], uncovered: [2] }],
    });
    const out = JSON.parse(run(root, ['--package', 'packages/b'])) as {
      packages: { dir: string }[];
    };

    expect(out.packages.map((p) => p.dir)).toEqual(['packages/b']);
  });

  it('T-CGR-011 未覆分岐を数える', () => {
    // **これが無いと statement だけを見ることになる**。 実測で `coverage-high-water.json`
    // の 20 package が 100% 未満だった主因は branches で、statement は既に 100% の
    // package が多い。 分岐を数えないと gap report が「もう埋まっている」 と嘘をつく。
    const root = fixture({
      'packages/x': [
        { rel: 'src/a.ts', covered: [1], uncovered: [], branches: [[5, [3, 0]]] },
      ],
    });
    const out = JSON.parse(run(root)) as {
      packages: { uncovered: number; files: { branches: number[] }[] }[];
    };

    expect(out.packages.length, 'branch だけの gap が出ていない').toBe(1);
    expect(out.packages[0]?.files[0]?.branches).toEqual([5]);
    expect(out.packages[0]?.uncovered).toBe(1);
  });

  it('T-CGR-012 全 path を通った分岐は数えない', () => {
    // 陰性対照。 未覆が 0 の入力で「差を検出しない」 ことを確かめる。
    // これが無いと、分岐を無条件に数える実装 (恒真) が T-CGR-011 を通る。
    const root = fixture({
      'packages/x': [
        { rel: 'src/a.ts', covered: [1], uncovered: [], branches: [[5, [3, 2]]] },
      ],
    });
    const out = JSON.parse(run(root)) as { packages: unknown[] };

    expect(out.packages).toEqual([]);
  });

  it('T-CGR-013 1 分岐に未通過 path が 2 つあれば 2 と数える', () => {
    // 分岐単位で 1 と数えると、`switch` の未通過 case が何本あっても 1 に潰れる。
    const root = fixture({
      'packages/x': [
        { rel: 'src/a.ts', covered: [1], uncovered: [], branches: [[5, [1, 0, 0]]] },
      ],
    });
    const out = JSON.parse(run(root)) as { packages: { uncovered: number }[] };

    expect(out.packages[0]?.uncovered).toBe(2);
  });

  it('T-CGR-014 未呼出の関数を名前つきで数える', () => {
    const root = fixture({
      'packages/x': [
        {
          rel: 'src/a.ts',
          covered: [1],
          uncovered: [],
          fns: [
            ['used', 3, 2],
            ['unused', 9, 0],
          ],
        },
      ],
    });
    const out = JSON.parse(run(root)) as {
      packages: { uncovered: number; files: { functions: { name: string; line: number }[] }[] }[];
    };

    expect(out.packages[0]?.files[0]?.functions).toEqual([{ name: 'unused', line: 9 }]);
    expect(out.packages[0]?.uncovered).toBe(1);
  });

  it('T-CGR-015 残り量は statement / branch / function の合計', () => {
    // 3 種を別々に出すだけだと「どこが一番安いか」 を並べられない。
    // 合計で並べることを固定する = 片方を足し忘れる実装で落ちる。
    const root = fixture({
      'packages/x': [
        {
          rel: 'src/a.ts',
          covered: [1],
          uncovered: [2, 3],
          branches: [[5, [1, 0]]],
          fns: [['unused', 9, 0]],
        },
      ],
    });
    const out = JSON.parse(run(root)) as {
      packages: { uncovered: number; files: { uncovered: number }[] }[];
    };

    expect(out.packages[0]?.uncovered).toBe(4);
    expect(out.packages[0]?.files[0]?.uncovered).toBe(4);
  });

  it('T-CGR-016 statement が 0 でも branch が残る package を落とさない', () => {
    // 実 repo の形。 `packages/api` は lines 100% / branches 95.28% で、
    // statement だけを見ると gap から消える。 **消えないこと**を直接見る。
    const root = fixture({
      'packages/stmt-only': [{ rel: 'src/a.ts', covered: [1], uncovered: [2, 3] }],
      'packages/branch-only': [
        {
          rel: 'src/b.ts',
          covered: [1, 2, 3],
          uncovered: [],
          branches: [
            [5, [1, 0]],
            [8, [1, 0]],
            [9, [1, 0]],
          ],
        },
      ],
    });
    const out = JSON.parse(run(root)) as { packages: { dir: string; uncovered: number }[] };

    expect(out.packages.map((p) => p.dir)).toEqual([
      'packages/branch-only',
      'packages/stmt-only',
    ]);
    expect(out.packages.map((p) => p.uncovered)).toEqual([3, 2]);
  });


  it('T-CGR-017 package の並びが dir の作成順に依存しない', () => {
    // 残り量が同数の時、何が順序を決めているかを固定する。
    //
    // **変異試験で見つけた**。 package 側の tiebreak (`localeCompare`) を外しても
    // 1 件も落ちなかった。 理由は `packageDirs()` が `readdirSync` の結果を sort して
    // いるためで、tiebreak はその上でもう 1 度同じ順序を作っていただけだった。
    //
    // 順序を保証しているのは `packageDirs()` の sort なので、**そちらを検査する**。
    // 作成順を逆 (z → a) にして、出力が作成順ではなく path 順になることを見る。
    const root = fixture({
      'packages/zzz': [{ rel: 'src/a.ts', covered: [1], uncovered: [2] }],
      'packages/aaa': [{ rel: 'src/a.ts', covered: [1], uncovered: [2] }],
    });
    const out = JSON.parse(run(root)) as { packages: { dir: string }[] };

    expect(out.packages.map((p) => p.dir)).toEqual(['packages/aaa', 'packages/zzz']);
  });

});
