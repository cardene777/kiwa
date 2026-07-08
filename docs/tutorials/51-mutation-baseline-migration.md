# Mutation baseline migration — transfer the pattern from 22 packages to 33+ in 15 min

## What you'll build

The v1.27 milestone (Issue #955) applied `@kiwa/quality-metrics` v0.3 tier-aware mutation gates to every kiwa package — 22 packages already had a `stryker.config.mjs` from earlier milestones, and 11 new packages were added in the v1.27-1 through v1.27-3 sweep. This tutorial captures the exact recipe you follow when a new package (or a fork of the monorepo) needs to join the sweep — the same primitives from tutorial 50, wired up through the 4-tier threshold SSOT so a core / framework / SaaS / test-type package each get a per-tier floor in one pass. Follow the 6 steps below and any pure package gets a mutation baseline + tier gate in under 15 minutes. This is the pattern kiwa's 33 packages already use, spelled out step-by-step.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- A kiwa monorepo checkout (or a fork with the same `packages/*` layout)

## Step-by-step migration

### 1. Pick the tier

For a package you are onboarding, pick the tier that best describes the code Stryker runs over — **not** the package name. The 4 tiers and their floors live in `docs/quality/mutation-thresholds.md`.

| Tier | Kill-rate floor (`high`) | Applies to |
|---|---|---|
| Core | 80 % | Pure logic packages with deterministic tests. `@kiwa/core` / `data` / `cli-test` / `observability` / `cli`. |
| Framework | 70 % | SSR / hydration / RSC / adapter-wrapper layers. `@kiwa/nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `solidjs` / `fresh` / `hono` / `auth`. |
| SaaS | 65 % | Provider-specific adapters where mocks approximate a live external API. `@kiwa/ai-llm` / `payment` / `queue` / `cache` / `streaming` / `realtime` / `mcp` / `agent` / `search` / `orm` / `dapp`. |
| Test type | 60 % | Harness packages with DOM / measurement noise. `@kiwa/ui` / `a11y` / `visual` / `component` / `e2e`. |

The rule is that each new package picks the tier whose code shape it most resembles. If none fits, add a new tier row to the SSOT **first** and cite it from your PR body — the tier table is what makes future reviews cheap.

### 2. Create the Stryker config

`packages/my-package/stryker.config.mjs` — the header comment names the tier and links back to the SSOT. That comment is the on-the-spot receipt reviewers use to confirm the floor.

```js
/**
 * Mutation testing config for @kiwa/my-package.
 * Threshold: SaaS tier (high 65 / low 55 / break 50) — provider-specific
 * adapter, external API drift expected.
 * SSOT: docs/quality/mutation-thresholds.md § SaaS tier.
 */
export default {
  packageManager: 'pnpm',
  testRunner: 'vitest',
  testRunnerNodeArgs: ['--max-old-space-size=4096'],
  plugins: ['@stryker-mutator/vitest-runner'],
  vitest: { configFile: 'vitest.stryker.config.mjs' },
  mutate: ['.vitest-dist/src/adapter.js', '.vitest-dist/src/session.js'],
  thresholds: { high: 65, low: 55, break: 50 },
  ignorePatterns: ['dist/**', 'coverage/**', 'node_modules/**'],
  reporters: ['progress-append-only', 'html', 'clear-text', 'json'],
  jsonReporter: { fileName: 'mutation-report/mutation.json' },
  htmlReporter: { fileName: 'mutation-report/index.html' },
  warnings: { unknownOptions: false },
  concurrency: 4,
};
```

Three things to notice.

- The `mutate` glob points at `.vitest-dist/src/*.js` — Stryker mutates the compiled JS, not the TS source. The kiwa monorepo builds a per-package vitest dist under `.vitest-dist/` before Stryker runs so the mutators see the exact code the tests execute.
- Provider-specific files that **only** exercise against a live container (e.g. `testcontainers-queue.js` in `@kiwa/queue`) are excluded from `mutate`. Stryker would report every mutant on those files as `no-coverage` under the unit suite, which drags the `total MSI` down without a matching signal. The `.mutation-baseline/{package}.json` `note` field records the exclusion so a reviewer sees why.
- Set `thresholds.break` to the tier's `break` value (Core 50 / Framework 50 / SaaS 50 / Test type 40). `high` / `low` colour the HTML report but do not fail the build — `break` is the actual gate.

### 3. Add the `test:mutation` script

`packages/my-package/package.json` — mirror the pattern used across the existing 33 packages.

```json
{
  "scripts": {
    "test:mutation": "stryker run"
  }
}
```

Root `package.json` — extend the workspace `test:mutation` sweep so `pnpm test:mutation` at the repo root includes the new package.

```json
{
  "scripts": {
    "test:mutation": "pnpm -r --filter '@kiwa/*' test:mutation"
  }
}
```

The `-r --filter '@kiwa/*'` glob picks up every workspace package named `@kiwa/…` automatically, so as long as your package name follows the convention no additional wiring is required. Add the new package to the `PACKAGE_TIER` map in `scripts/check-mutation-gates.mjs` so the CI gate reads the right floor.

### 4. Seed the baseline on the first run

```bash
pnpm --filter @kiwa/my-package test:mutation
```

On the first invocation, Stryker writes `packages/my-package/mutation-report/mutation.json` with the full mutant list, killed / survived / timeout / noCoverage counts, and the total / covered MSI. Copy the relevant fields into `.mutation-baseline/my-package.json` following the SSOT schema.

```json
{
  "package": "@kiwa/my-package",
  "tier": "SaaS",
  "thresholds": { "high": 65, "low": 55, "break": 50 },
  "killRate": 68.86,
  "totalMsi": 68.86,
  "coveredMsi": 68.86,
  "killed": 115,
  "survived": 52,
  "timeout": 0,
  "noCoverage": 3,
  "error": 0,
  "mutants": [
    { "file": ".vitest-dist/src/adapter.js", "line": 22, "column": 17, "mutator": "ConditionalExpression", "replacement": "true" }
  ],
  "capturedAt": "2026-07-05T12:00:19Z",
  "note": "Total MSI 68.86% / Covered MSI 68.86% (threshold high=65 / low=55 / break=50)."
}
```

Commit the baseline JSON — the file is **tracked in git** so a mutation regression on a future PR shows up as a diff on the baseline JSON alongside the code diff. Reviewers see the exact number that moved and the list of surviving mutants without opening the HTML report.

### 5. Register the tier + optional override

`scripts/check-mutation-gates.mjs` — add the package to the `PACKAGE_TIER` map. Use the SaaS default; declare an `override` only when the baseline sweep lands below the tier floor and needs a follow-up PR to bring it back up.

```js
export const PACKAGE_TIER = Object.freeze({
  // ...
  // SaaS tier (provider-specific adapters).
  '@kiwa/my-package': { tier: 'saas' },
  // Or with a documented looser override:
  '@kiwa/my-package-b': {
    tier: 'saas',
    override: 60,
    reason: 'adapter.js branch coverage follow-up raises back to 65.',
  },
});
```

Stricter overrides (raising the floor above the tier default, e.g. `@kiwa/api` = 90 on Core) do **not** need a reason — a higher floor is always safe. Looser overrides require a one-line justification pinned to the follow-up work that will bring the floor back to the tier default (SSOT `docs/quality/mutation-thresholds.md` § Overrides).

### 6. Wire the tier gate into `evaluateReleaseGate`

`tests/release-gate.test.ts` (or the equivalent quality report builder in your package) — pass `mutationTier` through the third argument of `evaluateReleaseGate` so the report gets measured against the 12-axis path.

```ts
import { describe, expect, it } from 'vitest';
import {
  assembleReport,
  coverageFromV8Summary,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  resolveMutationTier,
  testCountFromCategories,
} from '@kiwa/quality-metrics';

describe('@kiwa/my-package — 12-axis release gate', () => {
  it('passes the tier floor when the mutation baseline holds', () => {
    const report = assembleReport({
      provider: '@kiwa/my-package',
      version: '0.1.0',
      coverage: coverageFromV8Summary({
        lines: { pct: 90 },
        branches: { pct: 82 },
        functions: { pct: 95 },
      }),
      testCount: testCountFromCategories({ behavior: 20, integration: 5, e2e: 2 }),
      fidelity: fidelityFromMethodCounts({ mockCoveredMethods: 8, realTotalMethods: 10 }),
      perf: perfFromSamples([5, 5, 5, 5, 5]),
      mutation: mutationFromCounts({ mutations: 167, killed: 115 }),
    });

    const verdict = evaluateReleaseGate(report, {}, {
      mutationTier: resolveMutationTier('SaaS'),
    });

    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });
});
```

The 12-axis path is opt-in — the third argument (`context`) is optional. Consumers that pass no `mutationTier` continue to run the legacy 7-axis (non-AI-LLM) or 11-axis (AI-LLM) path — the SSOT stays backward compatible with every v1.11 – v1.26 consumer.

## Migration verification checklist

- [ ] `packages/my-package/stryker.config.mjs` exists with a tier-named header comment
- [ ] `.mutation-baseline/my-package.json` committed after the first Stryker run
- [ ] `test:mutation` script wired in `packages/my-package/package.json`
- [ ] Root `package.json` `test:mutation` sweep includes the new package
- [ ] `scripts/check-mutation-gates.mjs` `PACKAGE_TIER` map updated with tier + optional override
- [ ] `pnpm test:mutation` at repo root includes the new package in the sweep
- [ ] `evaluateReleaseGate(..., { mutationTier: 'saas' })` in the release gate test / harness

## Pattern references — three real-world sweep examples

The v1.27 milestone seeded 11 new packages on top of the 22 existing ones. Three of them are useful templates for future onboarding.

- [`packages/nextjs/stryker.config.mjs`](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/stryker.config.mjs) — Framework tier example. The v1.27-1 rollout aimed at Core-strict 90 / 80 / 80, the v1.27-2 sweep landed at ~80 % MSI, and the config now sits at Framework default (70 / 60 / 50) with a documented follow-up to raise the bar back once tests reach 90 %.
- [`packages/auth/stryker.config.mjs`](https://github.com/cardene777/kiwa/blob/main/packages/auth/stryker.config.mjs) — Framework tier with a looser override. `.mutation-baseline/auth.json` records 68.86 % covered MSI (session.js at 56.76 % is the drag) and `PACKAGE_TIER` declares `override: 65, reason: "session.js 56.76 % — follow-up test raises back to 70."`. Override sits one point below tier low, still above tier break.
- [`packages/cache/stryker.config.mjs`](https://github.com/cardene777/kiwa/blob/main/packages/cache/stryker.config.mjs) — SaaS tier with an exclusion. `testcontainers-cache.js` is excluded from `mutate` (0 covered mutants under the unit suite), so the baseline mutates `in-memory-cache.js` only and the JSON `note` field records the exclusion.

Follow any of the three as a template and the migration cost per new package is 10-15 minutes.

## Where to next

- [Tutorial 50 — Mutation testing baseline (Stryker + tier gate walkthrough)](./50-mutation-testing-baseline)
- [Concept — Mutation testing SSOT (kill rate + 4-tier threshold + baseline persistence + 3-layer harness)](../concepts/mutation-testing-ssot)
- [Migration guide — v1.26 → v1.27](../migrations/v1.26-to-v1.27)
- [Mutation thresholds SSOT (4-tier rationale)](../quality/mutation-thresholds)
- [Release gate SSOT (12-axis)](../quality/release-gate)
