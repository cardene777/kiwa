# Mutation testing baseline — Stryker + kill-rate baseline + tier gate in 15 min

## What you'll build

A `stryker.config.mjs` wired to `@stryker-mutator/vitest-runner`, a per-package baseline JSON on disk at `.mutation-baseline/{package}.json`, and a `@kiwa/quality-metrics` v0.3 tier gate that fails your `pnpm test:mutation` run when kill-rate drops below the tier floor. The exact pattern all 33 kiwa packages (v1.27 sweep) use — same 4-tier threshold table (Core 80 / Framework 70 / SaaS 65 / Test type 60), same `mutationFromCounts` + `assertMutationTier` + `resolveMutationTier` primitives, same JSON schema on disk. You leave this tutorial with a runnable Stryker suite, a persisted baseline, and a working tier gate for any package you point it at.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-mutation-baseline && cd kiwa-mutation-baseline
pnpm init
pnpm add -D @stryker-mutator/core@^8 @stryker-mutator/vitest-runner@^8 \
  @kiwa/quality-metrics@^0.3 vitest typescript @types/node
```

Add the vitest + Stryker scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:mutation": "stryker run"
  }
}
```

### 2. Write the target function

`src/index.ts` — a pure function whose behavior you want Stryker to mutate against. The tutorial uses a small conditional so the mutants are easy to reason about (Stryker will flip the `>`, negate the boolean, delete the branch body, and so on).

```ts
export function classifyKillRate(rate: number): 'green' | 'yellow' | 'red' {
  if (rate >= 80) return 'green';
  if (rate >= 60) return 'yellow';
  return 'red';
}
```

The rule of thumb is that the function should be pure — deterministic, no I/O, no framework noise. Stryker mutates one operator per run and re-executes the vitest suite; any non-determinism inflates false-negative mutants and drops the kill-rate for reasons that have nothing to do with the tests.

### 3. Write the behavior tests

`tests/classify.test.ts` — one assertion per branch, plus the two boundary values. Stryker fails to kill a mutant when no test exercises the mutated line, so the goal is to touch every conditional both ways.

```ts
import { describe, expect, it } from 'vitest';
import { classifyKillRate } from '../src/index.js';

describe('classifyKillRate', () => {
  it('returns green at or above 80', () => {
    expect(classifyKillRate(80)).toBe('green');
    expect(classifyKillRate(95)).toBe('green');
  });

  it('returns yellow at 60-79', () => {
    expect(classifyKillRate(60)).toBe('yellow');
    expect(classifyKillRate(79)).toBe('yellow');
  });

  it('returns red below 60', () => {
    expect(classifyKillRate(59)).toBe('red');
    expect(classifyKillRate(0)).toBe('red');
  });
});
```

Note the boundary values (`80` and `60`). Stryker's `EqualityOperator` mutator flips `>=` to `>`, which changes the result at exactly the boundary. Without the `80` and `60` assertions, that mutant survives and the kill-rate drops even though line coverage is still 100 %.

### 4. Wire the Stryker config

`stryker.config.mjs` — one `mutate` glob, one `testRunner`, one `thresholds` block. The header comment names the tier so the SSOT (`docs/quality/mutation-thresholds.md`) can be resolved by a reviewer in one hop.

```js
/**
 * Mutation testing config for @kiwa/example.
 * Threshold: Core tier (high 80 / low 60 / break 50) — pure logic package.
 * SSOT: docs/quality/mutation-thresholds.md § Core tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: {
    configFile: 'vitest.config.ts',
  },
  mutate: ['src/**/*.ts'],
  thresholds: { high: 80, low: 60, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
```

Three things to notice.

- `thresholds.break: 50` fails the mutation run when kill-rate drops below 50 %. `high` / `low` colour the HTML report; `break` is the actual gate.
- `jsonReporter.fileName: 'mutation-report/mutation.json'` writes the Stryker report to a stable path — the tier gate reads that JSON in step 6 below.
- `concurrency: 4` runs 4 test workers in parallel. Higher concurrency speeds up the run but uses more RAM; 4 is the shared floor across all 33 kiwa packages.

### 5. Persist a baseline

`.mutation-baseline/example.json` — write the current Stryker report to a stable location so future runs can diff against it. This is what turns the run from "did the test suite pass" into "did the test suite regress".

```json
{
  "package": "@kiwa/example",
  "tier": "Core",
  "thresholds": { "high": 80, "low": 60, "break": 50 },
  "killRate": 100,
  "totalMsi": 100,
  "coveredMsi": 100,
  "killed": 8,
  "survived": 0,
  "timeout": 0,
  "noCoverage": 0,
  "error": 0,
  "mutants": [],
  "capturedAt": "2026-07-05T12:00:00Z",
  "note": "Total MSI 100% / Covered MSI 100% (threshold high=80 / low=60 / break=50)."
}
```

The baseline JSON lives under `.mutation-baseline/{package}.json` and is **tracked in git** — a mutation regression on a future PR shows up as a diff on the JSON alongside the code diff. Reviewers see the exact number that moved and the list of surviving mutants.

The verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) matches what the SSOT (`docs/quality/mutation-thresholds.md`) writes — the runtime helpers normalise both spellings to the machine `MutationTier` enum via `resolveMutationTier` (see step 7).

### 6. Wire the tier gate

`tests/gate.test.ts` — feed the Stryker report into `@kiwa/quality-metrics` v0.3 and fail the vitest suite when the kill-rate drops below the tier floor.

```ts
import { describe, expect, it } from 'vitest';
import {
  assertMutationTier,
  mutationFromCounts,
  resolveMutationTier,
} from '@kiwa/quality-metrics';

describe('classifyKillRate — tier gate', () => {
  it('passes when kill-rate meets Core tier floor', () => {
    const metric = mutationFromCounts({ mutations: 8, killed: 8 });
    expect(() =>
      assertMutationTier({ metric, tier: resolveMutationTier('Core') }),
    ).not.toThrow();
  });

  it('fails when kill-rate drops below Core tier floor', () => {
    const metric = mutationFromCounts({ mutations: 8, killed: 5 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).toThrow(/core.*80/);
  });

  it('rejects an empty suite as "no mutation signal"', () => {
    const metric = mutationFromCounts({ mutations: 0, killed: 0 });
    expect(() =>
      assertMutationTier({ metric, tier: 'core' }),
    ).toThrow(/no mutation signal/i);
  });
});
```

`assertMutationTier` throws when `metric.killRate < threshold ?? DEFAULT_MUTATION_TIER_THRESHOLDS[tier]`. Both the verbal `Core` / `Framework` / `SaaS` / `Test type` spelling (via `resolveMutationTier`) and the machine `core` / `framework` / `saas` / `test-type` enum work — the SSOT and the runtime agree by construction.

The zero-mutation guard is deliberate. An empty test suite would otherwise register as 0/0 = 0 % kill-rate and slip past a naïve `>= threshold` check. `assertMutationTier` treats a zero-mutation metric as "no signal" and refuses to pass.

### 7. Gate the release with the 12th axis

`tests/release-gate.test.ts` — pass `mutationTier` through the third argument of `evaluateReleaseGate` so the report is measured against the tier-aware 12th axis alongside the legacy 7 / 11 axes.

```ts
import { describe, expect, it } from 'vitest';
import {
  evaluateReleaseGate,
  mutationFromCounts,
  type QualityReport,
} from '@kiwa/quality-metrics';

function baseReport(): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '0.1.0',
    reportedAt: '2026-07-05T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 100, killed: 80, survived: 20, killRate: 80 },
  };
}

describe('release gate — 12-axis mutation tier', () => {
  it('adds a 12th axis when mutationTier is passed', () => {
    const verdict = evaluateReleaseGate(baseReport(), {}, { mutationTier: 'core' });
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('blocks a report when kill-rate falls below the tier floor', () => {
    const report = baseReport();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 70 });
    const verdict = evaluateReleaseGate(report, {}, { mutationTier: 'core' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'mutation.tier');
    expect(blocker?.threshold).toBe(80);
    expect(blocker?.actual).toBe(70);
  });

  it('accepts a looser per-package override when the SSOT documents one', () => {
    const report = baseReport();
    report.mutation = mutationFromCounts({ mutations: 100, killed: 66 });
    const verdict = evaluateReleaseGate(
      report,
      {},
      { mutationTier: 'framework', mutationTierThreshold: 65 },
    );
    expect(verdict.passed).toBe(true);
  });
});
```

`evaluateReleaseGate(report, thresholdOverrides, context)` keeps the third argument optional. Without `mutationTier`, the verdict count stays at 7 (non-AI-LLM) or 11 (AI-LLM) — backward compatible with every v1.11-1.26 consumer. With `mutationTier`, the count grows by one (`axesEvaluated` becomes 8 or 12) and a threshold miss surfaces as a `mutation.tier` blocker.

The optional `mutationTierThreshold` field is where per-package looser overrides live — the SSOT (`docs/quality/mutation-thresholds.md` § Overrides) requires a one-line justification in the PR that introduces a looser floor, and the value must stay above the tier's `break` bar.

### 8. Run it

```bash
pnpm test:mutation
```

First run seeds the mutation report in `mutation-report/mutation.json`. Copy the key numbers into `.mutation-baseline/example.json` and commit — the baseline is now the last-known-green mutation score. Subsequent runs regenerate the report; a regression on any future PR shows up as a diff on the baseline JSON alongside the code change.

The full end-to-end pattern lives in `packages/quality-metrics/tests/docs-tutorial-v1.27.test.ts` — the snippet validation test that guarantees every code sample in this tutorial keeps matching the real `@kiwa/quality-metrics` v0.3 API.

## Where to next

- [Tutorial 51 — Mutation baseline migration (22 → 33 package sweep methodology)](./51-mutation-baseline-migration)
- [Concept — Mutation testing SSOT (kill rate + 4-tier threshold + baseline persistence + 3-layer harness)](../concepts/mutation-testing-ssot)
- [Migration guide — v1.26 → v1.27](../migrations/v1.26-to-v1.27)
- [Mutation thresholds SSOT (4-tier rationale)](../quality/mutation-thresholds)
- [Release gate SSOT (12-axis)](../quality/release-gate)
