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

// `pnpm-workspace.yaml` の `*` glob に対応する親 dir。
const WORKSPACE_PARENTS = ['packages', 'examples', 'tests/fixtures'] as const;

// glob ではなく単一 package を直接指す entry。 子 dir を持たないので
// `WORKSPACE_PARENTS` の走査では拾えない。 ここへ perf config や
// `test:perf` が足された場合も検査の対象にする。
const WORKSPACE_LITERALS = [
  'examples/dogfood-oidc-federation/rp',
  'tests/release-smoke',
  'promo',
] as const;

interface PackageJson {
  name?: string;
  scripts?: Record<string, string>;
}

function readJson<T>(rel: string): T {
  return JSON.parse(readFileSync(resolve(REPO_ROOT, rel), 'utf-8')) as T;
}

// 3 層測定 (serial + concurrent + memory) が終わり切るまでの猶予。 これを下回る
// 設定は、 遅い package で測定を打ち切って判定そのものを消してしまう。
const MIN_PERF_TIMEOUT_MS = 60_000;

interface WorkspacePerfScript {
  /** repo 相対の package dir (失敗時に該当箇所を指すため) */
  dir: string;
  script: string;
}

interface PerfConfigFile {
  /** repo 相対の config path (失敗時に該当箇所を指すため) */
  file: string;
  source: string;
}

function collectPerfConfigs(): PerfConfigFile[] {
  const found: PerfConfigFile[] = [];
  for (const dir of workspaceDirs()) {
    const rel = join(dir, 'vitest.perf.config.ts');
    const absolute = resolve(REPO_ROOT, rel);
    if (!existsSync(absolute)) continue;
    found.push({ file: rel, source: readFileSync(absolute, 'utf-8') });
  }
  return found;
}

/** `pnpm-workspace.yaml` が指す package dir を repo 相対で全て返す。 */
function workspaceDirs(): string[] {
  const dirs: string[] = [];
  for (const parent of WORKSPACE_PARENTS) {
    const parentDir = resolve(REPO_ROOT, parent);
    if (!existsSync(parentDir)) continue;
    for (const entry of readdirSync(parentDir, { withFileTypes: true })) {
      if (entry.isDirectory()) dirs.push(join(parent, entry.name));
    }
  }
  for (const literal of WORKSPACE_LITERALS) {
    if (existsSync(resolve(REPO_ROOT, literal))) dirs.push(literal);
  }
  return dirs;
}

function collectWorkspacePerfScripts(): WorkspacePerfScript[] {
  const found: WorkspacePerfScript[] = [];
  for (const rel of workspaceDirs()) {
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

  it('every perf config disables vitest file parallelism', () => {
    const offenders = collectPerfConfigs()
      .filter(({ source }) => !/fileParallelism:\s*false/.test(source))
      .map(({ file }) => file);

    expect(
      offenders,
      'vitest runs test files in parallel by default, so perf files inside one package still contend',
    ).toEqual([]);
  });

  it('every perf config sets a timeout long enough to finish a measurement', () => {
    const offenders: string[] = [];
    for (const { file, source } of collectPerfConfigs()) {
      const declared = /testTimeout:\s*([0-9_]+)/.exec(source);
      if (declared === null) {
        offenders.push(`${file}: no testTimeout (vitest defaults to 5s)`);
        continue;
      }
      const timeout = Number(declared[1]?.replace(/_/g, ''));
      if (!Number.isFinite(timeout) || timeout < MIN_PERF_TIMEOUT_MS) {
        offenders.push(`${file}: testTimeout=${declared[1]}`);
      }
    }

    expect(
      offenders,
      'a measurement cut short by the framework produces no verdict at all, which reads as a failure rather than as missing data',
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
