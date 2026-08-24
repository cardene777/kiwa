// Smoke test for scripts/check-coverage-gates.mjs.
// Spawns the gate against fixture coverage-summary.json files to confirm exit
// codes for the pass/fail paths.
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = repoRoot(HERE);
const GATE_SCRIPT = resolve(REPO_ROOT, 'scripts/check-coverage-gates.mjs');
/**
 * gate が判定する package dir。
 *
 * **module から import する** (#2177 r1-f1)。 本 PR が `gate-inputs.mjs` を SSOT にした
 * 当のものなので、検査側に手書きの写しを置くと gate と検査が別々にずれる
 * (`rules/quality.md § 導出可能記述は人手で書かない` の経路 1)。
 */
const GATE_PACKAGE_DIRS: string[] = Object.values(
  (
    (await import(pathToFileURL(resolve(REPO_ROOT, 'scripts/lib/gate-inputs.mjs')).href)) as {
      COVERAGE_PKG_DIRS: Record<string, string>;
    }
  ).COVERAGE_PKG_DIRS,
);

function buildSummary(opts: { lines: number; branches: number; functions: number; statements: number }) {
  return {
    total: {
      lines: { total: 100, covered: Math.round(opts.lines), skipped: 0, pct: opts.lines },
      branches: { total: 100, covered: Math.round(opts.branches), skipped: 0, pct: opts.branches },
      functions: { total: 100, covered: Math.round(opts.functions), skipped: 0, pct: opts.functions },
      statements: { total: 100, covered: Math.round(opts.statements), skipped: 0, pct: opts.statements },
    },
  };
}

describe('scripts/check-coverage-gates.mjs', () => {
  it('exit 0 + ✅ for all packages when all summaries meet the thresholds', async () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'kiwa-gate-pass-'));
    try {
      const passing = buildSummary({ lines: 95, branches: 85, functions: 95, statements: 95 });
      for (const dir of GATE_PACKAGE_DIRS) {
        const covDir = resolve(fakeRoot, dir, 'coverage');
        mkdirSync(covDir, { recursive: true });
        writeFileSync(resolve(covDir, 'coverage-summary.json'), JSON.stringify(passing));
      }
      const { stdout, stderr } = await execFileAsync('node', [GATE_SCRIPT], { cwd: fakeRoot });
      expect(stderr).toContain('All packages passed coverage thresholds');
      expect(stdout).toMatch(/@kiwa-lab\/core.*✅/);

      // 判定された package を数える。 監視対象は 2 つの表 (PACKAGES と PKG_DIRS) に
      // 分かれて書かれており、片方にだけ足すと判定行の数が食い違う。 件数を固定して
      // おくと、対象を増減させる変更が必ずこの検査を通る。
      const judged = stdout.split('\n').filter((line) => line.startsWith('| @kiwa-lab/'));
      // packages/ 配下の全 package が対象。 新しい package を足したらここも増える。
      expect(judged).toHaveLength(26);
      expect(judged.filter((line) => !line.includes('✅'))).toEqual([]);

      // Issue #1938 で監視下に入れた 10 package。 fixture を用意しても対象一覧に
      // 載っていなければ判定行は現れない。
      for (const pkg of [
        'auth',
        'search',
        'security',
        'realtime',
        'cache',
        'ai-llm',
        'component',
        'perf-harness',
        'quality-metrics',
        'lean',
        // Issue #1939 で追加。 実ドライバ経路を除外せず、代替実装で覆って載せた。
        'queue',
        // Issue #1941 で追加。 prisma / kysely の分岐を代替実装で覆って載せた。
        'orm',
        // Issue #1945 で追加。 計測用の依存が入っておらず測れていなかった。
        'skill-test',
      ]) {
        expect(stdout, `${pkg} が判定対象に入っていない`).toContain(`| @kiwa-lab/${pkg} |`);
      }
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('exit non-zero + lists each failing metric when a package drops below threshold', async () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'kiwa-gate-fail-'));
    try {
      const passing = buildSummary({ lines: 95, branches: 85, functions: 95, statements: 95 });
      const failing = buildSummary({ lines: 50, branches: 40, functions: 60, statements: 50 });
      for (const dir of GATE_PACKAGE_DIRS.filter((dir) => dir !== 'packages/core')) {
        const covDir = resolve(fakeRoot, dir, 'coverage');
        mkdirSync(covDir, { recursive: true });
        writeFileSync(resolve(covDir, 'coverage-summary.json'), JSON.stringify(passing));
      }
      const failDir = resolve(fakeRoot, 'packages/core/coverage');
      mkdirSync(failDir, { recursive: true });
      writeFileSync(resolve(failDir, 'coverage-summary.json'), JSON.stringify(failing));

      let exitCode = 0;
      let stdout = '';
      let stderr = '';
      try {
        const result = await execFileAsync('node', [GATE_SCRIPT], { cwd: fakeRoot });
        stdout = result.stdout;
        stderr = result.stderr;
      } catch (error: unknown) {
        const err = error as { code?: number; stdout?: string; stderr?: string };
        exitCode = err.code ?? 1;
        stdout = err.stdout ?? '';
        stderr = err.stderr ?? '';
      }
      expect(exitCode).not.toBe(0);
      expect(stdout).toMatch(/@kiwa-lab\/core.*❌/);
      expect(stderr).toContain('Coverage gate failed');
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('高水位を下回ると固定閾値内でも失敗し、更新時も記録を下げない', async () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'kiwa-gate-high-water-'));
    try {
      const passing = buildSummary({ lines: 95, branches: 85, functions: 95, statements: 95 });
      for (const dir of GATE_PACKAGE_DIRS) {
        const covDir = resolve(fakeRoot, dir, 'coverage');
        mkdirSync(covDir, { recursive: true });
        writeFileSync(resolve(covDir, 'coverage-summary.json'), JSON.stringify(passing));
      }
      const highWaterPath = resolve(fakeRoot, 'coverage-high-water.json');
      writeFileSync(
        highWaterPath,
        JSON.stringify({
          '@kiwa-lab/core': { lines: 96, branches: 84, functions: 94, statements: 94 },
        }),
      );

      let exitCode = 0;
      let stderr = '';
      try {
        await execFileAsync('node', [GATE_SCRIPT, '--update-high-water'], { cwd: fakeRoot });
      } catch (error: unknown) {
        const err = error as { code?: number; stderr?: string };
        exitCode = err.code ?? 1;
        stderr = err.stderr ?? '';
      }

      expect(exitCode).not.toBe(0);
      expect(stderr).toContain('lines=95.00% (下限を割った: 高水位 96%)');
      expect(JSON.parse(readFileSync(highWaterPath, 'utf8'))['@kiwa-lab/core']).toEqual({
        lines: 96,
        branches: 85,
        functions: 95,
        statements: 95,
      });
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});
