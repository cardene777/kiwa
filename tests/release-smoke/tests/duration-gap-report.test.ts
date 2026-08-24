// `scripts/duration-gap-report.mjs` の出力を fixture で固定する (Issue #2193)。
//
// duration の gap report は coverage 側と 2 点で違う。
//
// 1. **判定材料が noise を持つ**。 coverage は決定的だが wall time は負荷で動く。
//    実測で `@kiwa-lab/orm` の分岐が並列測定時だけ 94.49% になり、直列で 2 回とも
//    94.5% だった。 時間は更に振れるので margin を持たせる。
// 2. **ratchet の向きが逆**。 coverage は高い方を残すが、時間は低い方を残す。
//
// lever の分類は実測から起こした。 `tests/release-smoke` の遅い上位 4 file を読むと、
// `mutation-scope-report` は test ごとに子プロセスを起動し (65 件)、
// `coverage-denominator` は `ts.createSourceFile` で全 package を parse し、
// `input-fingerprint` は一時 dir を 18 箇所с作る。 遅さの出所が違えば直し方も違う。
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const SCRIPT = resolve(REPO_ROOT, 'scripts/duration-gap-report.mjs');

const roots: string[] = [];

afterAll(() => {
  for (const r of roots) rmSync(r, { recursive: true, force: true });
});

type FileSpec = {
  /** repo 相対の test file path。 */
  rel: string;
  /** file 全体の所要 (ms)。 */
  ms: number;
  /** その file が持つ test の件数。 */
  tests?: number;
  /** file の中身。 lever 判定はここを静的に読む。 */
  body?: string;
};

/** vitest の `--reporter=json` 出力を fixture で組む。 */
function writeReport(root: string, files: FileSpec[]) {
  const testResults = files.map((f) => {
    const abs = join(root, f.rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, f.body ?? 'import { it } from "vitest";\nit("x", () => {});\n');
    return {
      name: abs,
      startTime: 1_000_000,
      endTime: 1_000_000 + f.ms,
      status: 'passed',
      message: '',
      assertionResults: Array.from({ length: f.tests ?? 1 }, (_, i) => ({
        ancestorTitles: [],
        fullName: `t${i}`,
        title: `t${i}`,
        status: 'passed',
        duration: f.ms / (f.tests ?? 1),
        failureMessages: [],
      })),
    };
  });
  const path = join(root, 'report.json');
  writeFileSync(path, JSON.stringify({ numTotalTests: files.length, testResults }));
  return path;
}

function fixture(files: FileSpec[]) {
  const root = mkdtempSync(join(tmpdir(), 'kiwa-dur-'));
  roots.push(root);
  return { root, report: writeReport(root, files) };
}

function run(root: string, report: string, args: string[] = []) {
  return execFileSync(process.execPath, [SCRIPT, '--report', report, '--json', ...args], {
    encoding: 'utf8',
    env: { ...process.env, KIWA_GATE_ROOT: root },
  });
}

function baseline(root: string, data: Record<string, number>) {
  writeFileSync(join(root, 'test-duration-baseline.json'), JSON.stringify(data, null, 2));
}

describe('duration-gap-report', () => {
  it('T-DGR-001 遅い file を先に出す', () => {
    const { root, report } = fixture([
      { rel: 'tests/fast.test.ts', ms: 100 },
      { rel: 'tests/slow.test.ts', ms: 5000 },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { file: string; ms: number }[] };

    expect(out.files.length, 'gap が 1 件も出ていない (検査が空振りしている)').toBeGreaterThan(0);
    expect(out.files.map((f) => f.file)).toEqual(['tests/slow.test.ts', 'tests/fast.test.ts']);
    expect(out.files.map((f) => f.ms)).toEqual([5000, 100]);
  });

  it('T-DGR-002 .vitest-dist と source の重複を 1 件に畳む', () => {
    // 素の `npx vitest run` は `tests/*.ts` と `.vitest-dist/tests/*.js` の**両方**を
    // 拾う (実測で 155 file のうち 76 file が compile 後だった)。 そのまま数えると
    // 同じ test を 2 回計上し、合計が倍に見える。
    const { root, report } = fixture([
      { rel: 'tests/a.test.ts', ms: 3000 },
      { rel: '.vitest-dist/tests/a.test.js', ms: 3100 },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { file: string; ms: number }[] };

    expect(out.files).toHaveLength(1);
    expect(out.files[0]?.file).toBe('tests/a.test.ts');
    // 遅い側を採る = 速い方を採ると「速くなった」 と誤報する。
    expect(out.files[0]?.ms).toBe(3100);
  });

  it('T-DGR-003 子プロセス起動を lever として分類する', () => {
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        tests: 20,
        body: 'import { execFileSync } from "node:child_process";\nexecFileSync("node", []);\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('subprocess');
  });

  it('T-DGR-004 実時間待ちを lever として分類する', () => {
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body: 'await new Promise((r) => setTimeout(r, 3000));\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('wall-clock');
  });

  it('T-DGR-005 fake timer を使っていれば実時間待ちとみなさない', () => {
    // 陰性対照。 `setTimeout` の出現だけで判定すると、fake timer で既に直した file を
    // 毎回「直せ」 と勧めることになる。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body: 'vi.useFakeTimers();\nawait new Promise((r) => setTimeout(r, 3000));\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).not.toBe('wall-clock');
  });

  it('T-DGR-006 実 I/O 起動を lever として分類する', () => {
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body: 'import { GenericContainer } from "testcontainers";\nawait new GenericContainer("x").start();\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('real-io');
  });

  it('T-DGR-007 TypeScript の parse を lever として分類する', () => {
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body: 'import ts from "typescript";\nts.createSourceFile("a.ts", "", 99);\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('compile');
  });

  it('T-DGR-008 どれにも当たらない file は inherent にする', () => {
    // **`unknown` にしない**。 分類できなかったことを「直し方が無い」 と読ませないため、
    // 対処のある lever と、対処を決めていない file を名前で区別する。
    const { root, report } = fixture([
      { rel: 'tests/a.test.ts', ms: 5000, body: 'import { it } from "vitest";\nit("x", () => {});\n' },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('inherent');
  });

  it('T-DGR-009 lever は 6 種のいずれかになる', () => {
    // 一覧の外の値が出ないことを固定する = 分類を増やす時に本検査も更新させる。
    const { root, report } = fixture([
      { rel: 'tests/a.test.ts', ms: 900, body: 'import { execSync } from "node:child_process";\n' },
      { rel: 'tests/b.test.ts', ms: 800, body: 'import ts from "typescript";\n' },
      { rel: 'tests/c.test.ts', ms: 700, body: 'await new Promise((r) => setTimeout(r, 1));\n' },
      { rel: 'tests/d.test.ts', ms: 600, body: 'import { chromium } from "playwright";\n' },
      { rel: 'tests/e.test.ts', ms: 500, body: 'import { mkdtempSync } from "node:fs";\n' },
      { rel: 'tests/f.test.ts', ms: 400, body: 'import { it } from "vitest";\n' },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };
    const known = ['subprocess', 'real-io', 'wall-clock', 'compile', 'filesystem', 'inherent'];

    expect(out.files, 'file が 1 件も出ていない').toHaveLength(6);
    for (const f of out.files) expect(known).toContain(f.lever);
  });

  it('T-DGR-010 baseline より遅くなったら回帰として出す', () => {
    const { root, report } = fixture([{ rel: 'tests/a.test.ts', ms: 5000 }]);
    baseline(root, { 'tests/a.test.ts': 1000 });
    const out = JSON.parse(run(root, report)) as {
      regressions: { file: string; ms: number; baselineMs: number }[];
    };

    expect(out.regressions).toHaveLength(1);
    expect(out.regressions[0]?.baselineMs).toBe(1000);
  });

  it('T-DGR-011 margin の内側の増加は回帰にしない', () => {
    // 陰性対照。 時間は負荷で振れるので、margin が無いと毎回 1 件は赤くなる。
    // 既定 margin は 30%。 1000ms → 1250ms は内側。
    const { root, report } = fixture([{ rel: 'tests/a.test.ts', ms: 1250 }]);
    baseline(root, { 'tests/a.test.ts': 1000 });
    const out = JSON.parse(run(root, report)) as { regressions: unknown[] };

    expect(out.regressions).toEqual([]);
  });

  it('T-DGR-012 margin の外側は回帰にする', () => {
    // T-DGR-011 と対。 境界のすぐ外を見ないと、margin を無限にする実装が通る。
    const { root, report } = fixture([{ rel: 'tests/a.test.ts', ms: 1400 }]);
    baseline(root, { 'tests/a.test.ts': 1000 });
    const out = JSON.parse(run(root, report)) as { regressions: { file: string }[] };

    expect(out.regressions.map((r) => r.file)).toEqual(['tests/a.test.ts']);
  });

  it('T-DGR-013 --update-baseline は速くなった時だけ書く', () => {
    const { root, report } = fixture([{ rel: 'tests/a.test.ts', ms: 400 }]);
    baseline(root, { 'tests/a.test.ts': 1000 });
    run(root, report, ['--update-baseline']);
    const after = JSON.parse(
      readFileSync(join(root, 'test-duration-baseline.json'), 'utf8'),
    ) as Record<string, number>;

    expect(after['tests/a.test.ts']).toBe(400);
  });

  it('T-DGR-014 --update-baseline は遅くなった値を焼き付けない', () => {
    // **これが無いと ratchet が意味を失う**。 遅い値を baseline にすれば常に緑になる。
    // coverage 側の `--update-high-water` が高い方だけを採るのと同じ向き (符号が逆)。
    const { root, report } = fixture([{ rel: 'tests/a.test.ts', ms: 9000 }]);
    baseline(root, { 'tests/a.test.ts': 1000 });
    run(root, report, ['--update-baseline']);
    const after = JSON.parse(
      readFileSync(join(root, 'test-duration-baseline.json'), 'utf8'),
    ) as Record<string, number>;

    expect(after['tests/a.test.ts']).toBe(1000);
  });

  it('T-DGR-015 baseline を持たない file は回帰にしない', () => {
    // 初回は比較対象が無い。 0 として扱うと必ず回帰になる
    // (`rules/quality.md § 判定できなかったことを値に潰さない`)。
    const { root, report } = fixture([{ rel: 'tests/new.test.ts', ms: 5000 }]);
    baseline(root, { 'tests/other.test.ts': 1000 });
    const out = JSON.parse(run(root, report)) as {
      regressions: unknown[];
      withoutBaseline: string[];
    };

    expect(out.regressions).toEqual([]);
    expect(out.withoutBaseline).toEqual(['tests/new.test.ts']);
  });

  it('T-DGR-016 測れなかった file を 0 として速い側に置かない', () => {
    // duration を出さない reporter 設定では全 file が 0 になる。 その状態を
    // 「速い」 と読ませない = 別枠に出して件数を見せる。
    const { root, report } = fixture([
      { rel: 'tests/a.test.ts', ms: 0 },
      { rel: 'tests/b.test.ts', ms: 3000 },
    ]);
    const out = JSON.parse(run(root, report)) as {
      files: { file: string }[];
      unmeasured: string[];
    };

    expect(out.files.map((f) => f.file)).toEqual(['tests/b.test.ts']);
    expect(out.unmeasured).toEqual(['tests/a.test.ts']);
  });

  it('T-DGR-017 1 件あたりの所要も出す', () => {
    // 総時間だけを見ると、test 件数の多い file が常に上位に来る。 1 件あたりで見ると
    // 「件数が多い」 と「1 件が遅い」 が分かれる。
    const { root, report } = fixture([
      { rel: 'tests/many.test.ts', ms: 4000, tests: 100 },
      { rel: 'tests/heavy.test.ts', ms: 3000, tests: 2 },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { file: string; msPerTest: number }[] };
    const byFile = new Map(out.files.map((f) => [f.file, f.msPerTest]));

    expect(byFile.get('tests/many.test.ts')).toBe(40);
    expect(byFile.get('tests/heavy.test.ts')).toBe(1500);
  });

  it('T-DGR-018 Markdown でも同じ順序で出す', () => {
    const { root, report } = fixture([
      { rel: 'tests/fast.test.ts', ms: 100 },
      { rel: 'tests/slow.test.ts', ms: 5000 },
    ]);
    const md = execFileSync(process.execPath, [SCRIPT, '--report', report], {
      encoding: 'utf8',
      env: { ...process.env, KIWA_GATE_ROOT: root },
    });

    expect(md.indexOf('tests/slow.test.ts')).toBeGreaterThanOrEqual(0);
    expect(md.indexOf('tests/slow.test.ts')).toBeLessThan(md.indexOf('tests/fast.test.ts'));
  });

  it('T-DGR-019 --report が無い呼出は理由を出して非 0 で終わる', () => {
    // 引数を忘れた時に空の report を返すと「遅い test は無い」 と読める。
    let code = 0;
    let stderr = '';
    try {
      execFileSync(process.execPath, [SCRIPT], { encoding: 'utf8', stdio: 'pipe' });
    } catch (err) {
      const e = err as { status: number; stderr: string };
      code = e.status;
      stderr = e.stderr;
    }

    expect(code).not.toBe(0);
    expect(stderr).toMatch(/--report/);
  });

  it('T-DGR-020 comment 内の言及では分類しない', () => {
    // **実測で踏んだ**。 `mutation-gate-coverage.test.ts` は playwright を 1 度も
    // 使わないのに `real-io` に分類された。 出現箇所は説明の comment 2 行だけだった。
    //
    // 使っていない lever の直し方を勧めると、読み手は該当箇所を探して見つけられない。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        // comment に **呼出名そのもの** を置く。 package 名だけでは module 指定子の判定が
        // 先に外すため、comment 除去を通らなくても同じ結果になる (変異試験で判明)。
        body:
          '// 以前は new GenericContainer("x").start() を使ったが mock に置き換えた\n' +
          '/* createAnvil() は使わない。 chromium.launch() も呼ばない */\n' +
          'import { execFileSync } from "node:child_process";\nexecFileSync("node", []);\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('subprocess');
  });

  it('T-DGR-021 module 指定子でない文字列一致では real-io にしない', () => {
    // package 名を data として並べる file (mutation config の一覧を読む検査など) が
    // real-io に落ちないことを見る。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body: 'const pkgs = ["playwright", "testcontainers"];\nexport { pkgs };\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).not.toBe('real-io');
  });

  it('T-DGR-022 import している時は real-io にする', () => {
    // T-DGR-021 の対。 これが無いと real-io を返さない実装が両方通る。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body: 'import { chromium } from "playwright";\nawait chromium.launch();\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('real-io');
  });


  it('T-DGR-023 type-only import では real-io にしない', () => {
    // **型だけの import は browser を起動しない**。 この repo の TS file は
    // `import type { Page } from '@playwright/test'` を書くので、module 指定子の
    // 一致だけで判定すると本当の原因 (子プロセス起動) を隠して
    // 「共有 fixture へ寄せろ」 と誤った直し方を勧める。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body:
          'import type { Page } from "@playwright/test";\n' +
          'import { execFileSync } from "node:child_process";\n' +
          'export function f(p: Page) { execFileSync("node", []); return p; }\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('subprocess');
  });

  it('T-DGR-024 値として import していれば real-io のまま', () => {
    // T-DGR-023 の対。 これが無いと real-io を返さない実装が両方通る。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body:
          'import { chromium } from "@playwright/test";\n' +
          'import { execFileSync } from "node:child_process";\n' +
          'await chromium.launch();\nexecFileSync("node", []);\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('real-io');
  });

  it('T-DGR-025 名前ごとの type 指定も値 import とみなさない', () => {
    // `import { type Page, chromium }` は混在形。 `type` が付いた名前だけを
    // 落とすので、値として使う `chromium` があれば real-io のまま。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body:
          'import { type Page } from "@playwright/test";\n' +
          'import { mkdtempSync } from "node:fs";\n' +
          'mkdtempSync("x");\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('filesystem');
  });


  it('T-DGR-026 type と値が混在する import は値として数える', () => {
    // **変異試験で見つけた**。 「type-only なら落とす」 を「brace があれば落とす」 に
    // 変えても 1 件も落ちなかった = 混在形 (`import { type Page, chromium }`) を
    // 通す検査が無かった。
    //
    // 混在形を落とすと、値として browser を起動している file が real-io から外れ、
    // 「子プロセスが原因」 と誤った直し方を勧める。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        body:
          // **呼出を置かない**。 `chromium.launch()` を書くと real-io の `calls` 側が
          // 一致してしまい、module 指定子の判定を壊しても落ちない (変異試験で実測)。
          // module 指定子だけが手掛かりになる形にする。
          'import { type Page, request } from "@playwright/test";\n' +
          'import { execFileSync } from "node:child_process";\n' +
          'export function f(p: Page) { execFileSync("node", []); return request; }\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('real-io');
  });

  it('T-DGR-027 brace の外に名前がある import を値として数える', () => {
    // brace の外に名前がある形。 `outsideBraces` の判定を落とすとここが通らなくなる。
    const { root, report } = fixture([
      {
        rel: 'tests/a.test.ts',
        ms: 5000,
        // brace の**外**に名前があり、中は type だけ。 `outsideBraces` の判定を
        // 外すと値の取り込みを見落とす (変異試験で実測)。
        // `createSourceFile` を書かないのは、書くと `calls` 側が覆って
        // module 指定子の判定を壊しても落ちないため。
        body:
          'import ts, { type Node } from "typescript";\n' +
          'import { mkdtempSync } from "node:fs";\n' +
          'export function f(n: Node) { mkdtempSync("x"); return ts; }\n',
      },
    ]);
    const out = JSON.parse(run(root, report)) as { files: { lever: string }[] };

    expect(out.files[0]?.lever).toBe('compile');
  });

});
