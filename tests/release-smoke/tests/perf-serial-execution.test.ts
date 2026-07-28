// Guard for the perf-measurement isolation invariant (Issue #1708).
//
// The perf suite exists to produce numbers that can be compared across commits.
// That only holds if one package is measured at a time. Root `package.json`
// used to run the workspace pass with `pnpm -r --parallel ... run test:perf`,
// and `--parallel` means "no concurrency limit" — so every workspace package
// carrying a `test:perf` script started at once (177 of them: 63 under
// `packages/`, 114 under `examples/`). Measurements then compete for the same
// cores and p95 tracks the machine load rather than the code, which is why the
// same commit produced different regression verdicts on consecutive runs.
//
// Two things have to stay true, and neither is visible from a passing perf run:
//   1. the root script pins the worker count to 1 — dropping `--parallel` alone
//      leaves pnpm's default of one worker per CPU core in place
//   2. no individual package re-introduces a concurrent workspace fan-out from
//      inside its own `test:perf`
//
// When this test fails, fix the script rather than the assertion. Serial
// execution costs 20-40 minutes of wall clock and that trade is deliberate —
// see `docs/quality/perf-thresholds.md` § Measurement isolation.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const HERE = dirname(fileURLToPath(import.meta.url));
// `.vitest-dist/tests/{this}` → 4 つ親 = repo root (`tests/release-smoke/.vitest-dist/tests/` 配下)
const REPO_ROOT = resolve(HERE, '..', '..', '..', '..');

// `pnpm-workspace.yaml` の glob と対応する。 単一 package を直接指す entry
// (`tests/release-smoke` / `promo` / `examples/dogfood-oidc-federation/rp`) は
// 子 dir を持たないため走査対象から外し、 `*` glob の親 dir だけを列挙する。
const WORKSPACE_PARENTS = ['packages', 'examples', 'tests/fixtures'] as const;

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8')) as T;
}

interface WorkspacePerfScript {
  /** repo 相対の package dir (失敗時に該当箇所を指すため) */
  dir: string;
  script: string;
}

function collectWorkspacePerfScripts(): WorkspacePerfScript[] {
  const found: WorkspacePerfScript[] = [];
  for (const parent of WORKSPACE_PARENTS) {
    const parentDir = resolve(REPO_ROOT, parent);
    if (!existsSync(parentDir)) continue;
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const rel = join(parent, entry.name);
      const manifest = resolve(REPO_ROOT, rel, 'package.json');
      if (!existsSync(manifest)) continue;
      let pkg: PackageJson;
      try {
        pkg = JSON.parse(readFileSync(manifest, 'utf-8')) as PackageJson;
      } catch {
        // package.json が壊れている件は本 axis の対象外 (別 axis が検出する)
        continue;
      }
      const script = pkg.scripts?.['test:perf'];
      if (typeof script === 'string') found.push({ dir: rel, script });
    }
  }
  return found;
}

describe('perf suite runs one package at a time', () => {
  it('root test:perf pins the workspace pass to a single worker', () => {
    const root = readJson<PackageJson>('package.json');
    const script = root.scripts?.['test:perf'];

    expect(script, 'root package.json must define a test:perf script').toBeTypeOf('string');
    expect(
      script,
      '`--parallel` removes the concurrency limit and lets 177 packages measure at once',
    ).not.toMatch(/--parallel\b/);
    expect(
      script,
      'dropping --parallel alone leaves pnpm defaulting to one worker per CPU core',
    ).toMatch(/--workspace-concurrency=1\b/);
  });

  it('no workspace package fans out its own test:perf concurrently', () => {
    const offenders = collectWorkspacePerfScripts().filter((entry) =>
      /--parallel\b/.test(entry.script),
    );

    expect(
      offenders.map((entry) => `${entry.dir}: ${entry.script}`),
      'a package-level --parallel re-creates the contention the root script avoids',
    ).toEqual([]);
  });

  it('the threshold SSOT documents the serial invocation', () => {
    const doc = readFileSync(resolve(REPO_ROOT, 'docs/quality/perf-thresholds.md'), 'utf-8');
    const perfInvocations = doc
      .split('\n')
      .filter((line) => line.includes('run test:perf') || line.includes('test:perf --if-present'));

    expect(perfInvocations.length, 'the doc should still show how to run the suite').toBeGreaterThan(
      0,
    );
    expect(
      perfInvocations.filter((line) => /--parallel\b/.test(line)),
      'a doc example using --parallel teaches the measurement error back in',
    ).toEqual([]);
  });
});
