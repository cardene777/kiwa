// Smoke test for scripts/check-coverage-gates.mjs.
// Spawns the gate against fixture coverage-summary.json files to confirm exit
// codes for the pass/fail paths.
import { execFile } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { describe, expect, it } from 'vitest';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');
const GATE_SCRIPT = resolve(REPO_ROOT, 'scripts/check-coverage-gates.mjs');

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
    const packages = [
      'packages/core',
      'packages/api',
      'packages/ui',
      'packages/data',
      'packages/cli-test',
      'packages/observability',
      'packages/e2e',
      'packages/cli',
      'packages/dapp',
      'packages/a11y',
      'packages/visual',
      'packages/nextjs',
      'packages/nuxt',
      'packages/sveltekit',
      'packages/remix',
      'packages/astro',
      'packages/solidstart',
      'packages/qwikcity',
      'packages/edge',
    ];
    try {
      const passing = buildSummary({ lines: 95, branches: 85, functions: 95, statements: 95 });
      for (const dir of packages) {
        const covDir = resolve(fakeRoot, dir, 'coverage');
        mkdirSync(covDir, { recursive: true });
        writeFileSync(resolve(covDir, 'coverage-summary.json'), JSON.stringify(passing));
      }
      const { stdout, stderr } = await execFileAsync('node', [GATE_SCRIPT], { cwd: fakeRoot });
      expect(stderr).toContain('All packages passed coverage thresholds');
      expect(stdout).toMatch(/@kiwa-test\/core.*✅/);
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });

  it('exit non-zero + lists each failing metric when a package drops below threshold', async () => {
    const fakeRoot = mkdtempSync(join(tmpdir(), 'kiwa-gate-fail-'));
    try {
      const passing = buildSummary({ lines: 95, branches: 85, functions: 95, statements: 95 });
      const failing = buildSummary({ lines: 50, branches: 40, functions: 60, statements: 50 });
      for (const dir of [
        'packages/api',
        'packages/ui',
        'packages/data',
        'packages/cli-test',
        'packages/observability',
        'packages/e2e',
        'packages/cli',
        'packages/dapp',
        'packages/a11y',
        'packages/visual',
        'packages/nextjs',
        'packages/nuxt',
        'packages/sveltekit',
        'packages/remix',
        'packages/astro',
        'packages/solidstart',
        'packages/qwikcity',
        'packages/edge',
      ]) {
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
      expect(stdout).toMatch(/@kiwa-test\/core.*❌/);
      expect(stderr).toContain('Coverage gate failed');
    } finally {
      rmSync(fakeRoot, { recursive: true, force: true });
    }
  });
});
