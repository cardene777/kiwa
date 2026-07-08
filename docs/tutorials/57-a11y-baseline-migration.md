# A11y baseline migration — transfer the pattern from 0 packages to 34+ in 15 min

## What you'll build

The v1.30 milestone (Issue #991) applied `@kiwa/a11y` v1.1 + `@kiwa/quality-metrics` v0.4 tier-aware a11y gates to every kiwa package — the earlier state was one package (`@kiwa/a11y` itself) with a `test:a11y` script, and 34 published packages (33 `@kiwa/*` + `release-invariants`) landed a `.axe-config.mjs` + `.a11y-baseline/{pkg}.json` + `test:a11y` script in the v1.30-1 through v1.30-3 sweep. This tutorial captures the exact recipe you follow when a new package (or a fork of the monorepo) needs to join the sweep — the same primitives from tutorial 56, wired up through the 4-tier threshold SSOT so a core / framework / SaaS / test-type package each get a per-tier floor in one pass. Follow the 6 steps below and any package gets an a11y baseline + tier gate in under 15 minutes. This is the pattern kiwa's 34 packages already use, spelled out step-by-step.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- A kiwa monorepo checkout (or a fork with the same `packages/*` layout)

## Step-by-step migration

### 1. Pick the tier

For a package you are onboarding, pick the tier that best describes the code axe-core runs over — **not** the package name. The 4 tiers and their ceilings live in `docs/quality/a11y-thresholds.md`.

| Tier | Ceiling (critical / serious / moderate) | Applies to |
|---|---|---|
| Core | 0 / 0 / 0-3 | Pure logic packages with no DOM output. `@kiwa/core` / `api` / `data` / `cli-test` / `cli` / `observability` / `perf-harness` / `quality-metrics` / `release-invariants`. |
| Framework | 0 / 0-3 / 0-10 | SSR / hydration / RSC / adapter-wrapper layers. `@kiwa/nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `solidjs` / `fresh` / `hono` / `auth`. |
| SaaS | 0 / 0 / 0 | Provider-specific adapters that expose no DOM. `@kiwa/ai-llm` / `payment` / `queue` / `cache` / `streaming` / `realtime` / `mcp` / `agent` / `search` / `orm` / `dapp`. |
| Test type | 0 / 0-3 / 0-10 | Harness packages with DOM / jsdom / browser fixture noise. `@kiwa/ui` / `a11y` / `visual` / `component` / `e2e`. |

The rule is that each new package picks the tier whose code shape it most resembles. If none fits, add a new tier row to the SSOT **first** and cite it from your PR body — the tier table is what makes future reviews cheap. `critical: 0` is an invariant across every tier because a critical WCAG 2.1 AA violation is a hard failure regardless of what the package does.

### 2. Create the `.axe-config.mjs`

`packages/my-package/.axe-config.mjs` — the header comment names the tier and links back to the SSOT. That comment is the on-the-spot receipt reviewers use to confirm the ceiling.

```js
/**
 * A11y (axe-core) config for @kiwa/my-package.
 * Tier: SaaS tier (critical 0 / serious 0 / moderate 0) — provider-specific
 * adapter, no DOM output.
 * SSOT: docs/quality/a11y-thresholds.md § SaaS tier.
 */
export default {
  runOptions: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  },
  thresholds: {
    critical: 0,
    serious: 0,
    moderate: 0,
  },
  baselinePath: '.a11y-baseline/my-package.json',
};
```

Three things to notice.

- The `runOnly.type: 'tag'` filter is the same across all 34 packages — `wcag2a` + `wcag2aa` + `wcag21a` + `wcag21aa`. Best-practice rules (`best-practice` tag) are excluded because they surface style suggestions, not conformance failures.
- `thresholds` mirrors the SSOT table for the chosen tier verbatim. Serious / moderate ceilings use the `{ max: N }` shape when the tier allows a non-zero cap; `critical` is always the literal `0`.
- `baselinePath` is the persisted-report location the runner writes on every invocation. `.a11y-baseline/{package}.json` is the convention; the package name in the path lets a single monorepo-wide sweep resolve overwrites without collisions.

### 3. Add the `test:a11y` script

`packages/my-package/package.json` — mirror the pattern used across the existing 34 packages.

```json
{
  "scripts": {
    "test:a11y": "node ../../scripts/run-axe-baseline.mjs"
  }
}
```

Root `package.json` — extend the workspace `test:a11y` sweep so `pnpm test:a11y` at the repo root includes the new package.

```json
{
  "scripts": {
    "test:a11y": "pnpm -r --filter '@kiwa/*' test:a11y"
  }
}
```

The `-r --filter '@kiwa/*'` glob picks up every workspace package named `@kiwa/…` automatically, so as long as your package name follows the convention no additional wiring is required. Add the new package to the `A11Y_PACKAGE_TIER` map in `scripts/check-a11y-gates.mjs` so the release gate reads the right ceiling.

### 4. Seed the baseline on the first run

```bash
pnpm --filter @kiwa/my-package test:a11y
```

On the first invocation, `scripts/run-axe-baseline.mjs` reads `.axe-config.mjs`, validates the shape against the SSOT tier table, runs `runLayerHarness` against whatever fixtures the config supplies (jsdom / Playwright / SSR-hydration), and writes the aggregated report to `.a11y-baseline/my-package.json`.

A package with no runtime DOM produces a `layers-absent` baseline — every layer records `applicable: false` with an explicit reason. This is the expected state for every current `@kiwa/*` package because they are test-adapter infrastructure that emit no runtime DOM.

```json
{
  "package": "@kiwa/my-package",
  "generatedAt": "2026-07-06T00:00:00.000Z",
  "layers": {
    "jsdom": {
      "layer": "jsdom",
      "applicable": false,
      "reason": "no jsdom fixture — package produces no static DOM output.",
      "violations": { "critical": 0, "serious": 0, "moderate": 0, "minor": 0 },
      "surviving": []
    },
    "playwright": {
      "layer": "playwright",
      "applicable": false,
      "reason": "no playwright fixture — package has no browser-runtime surface.",
      "violations": { "critical": 0, "serious": 0, "moderate": 0, "minor": 0 },
      "surviving": []
    },
    "ssrHydration": {
      "layer": "ssrHydration",
      "applicable": false,
      "reason": "no ssrHydration fixture — package emits no SSR string.",
      "violations": { "critical": 0, "serious": 0, "moderate": 0, "minor": 0 },
      "surviving": []
    }
  },
  "totals": { "critical": 0, "serious": 0, "moderate": 0, "minor": 0 },
  "ok": true
}
```

Commit the baseline JSON — the file is **tracked in git** so an a11y regression on a future PR shows up as a diff on the baseline JSON alongside the code diff. Reviewers see the exact rule that moved and the surviving-node count without opening the axe HTML report.

### 5. Register the tier + optional override

`scripts/check-a11y-gates.mjs` — add the package to the `A11Y_PACKAGE_TIER` map. Use the SaaS default; declare an `override` only when the baseline sweep lands above the tier ceiling and needs a follow-up PR to bring it back down.

```js
export const A11Y_PACKAGE_TIER = Object.freeze({
  // ...
  // SaaS tier (provider-specific adapters).
  '@kiwa/my-package': { tier: 'saas' },
  // Or with a documented looser override:
  '@kiwa/my-package-b': {
    tier: 'framework',
    override: { critical: 0, serious: 5, moderate: 15 },
    reason: 'router link internals — follow-up upstream PR brings serious back to 3.',
  },
});
```

Stricter overrides (lowering the ceiling below the tier default, e.g. `@kiwa/api` = 0/0/0 on Core) do **not** need a reason — a lower ceiling is always safe. Looser overrides require a one-line justification pinned to the follow-up work that will bring the ceiling back to the tier default (SSOT `docs/quality/a11y-thresholds.md` § Overrides). `critical` cannot be raised above 0 — the `A11yThreshold` TypeScript literal enforces this at compile time.

### 6. Wire the tier gate into `evaluateReleaseGate`

`tests/release-gate.test.ts` (or the equivalent quality report builder in your package) — pass `a11yTier` through the third argument of `evaluateReleaseGate` so the report gets measured against the 13-axis path.

```ts
import { describe, expect, it } from 'vitest';
import {
  a11yFromBaseline,
  assembleReport,
  coverageFromV8Summary,
  evaluateReleaseGate,
  fidelityFromMethodCounts,
  mutationFromCounts,
  perfFromSamples,
  resolveA11yTier,
  testCountFromCategories,
} from '@kiwa/quality-metrics';

describe('@kiwa/my-package — 13-axis release gate', () => {
  it('passes the tier ceiling when the a11y baseline holds', () => {
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
      mutation: mutationFromCounts({ mutations: 100, killed: 80 }),
      a11y: a11yFromBaseline({
        totals: { critical: 0, serious: 0, moderate: 0, minor: 0 },
      }),
    });

    const verdict = evaluateReleaseGate(report, {}, {
      a11yTier: resolveA11yTier('SaaS'),
    });

    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });
});
```

The 13-axis path is opt-in — the third argument (`context`) is optional. Consumers that pass no `a11yTier` continue to run the legacy 7-axis (non-AI-LLM) or 11-axis (AI-LLM) or 12-axis (with `mutationTier`) path — the SSOT stays backward compatible with every v1.11 – v1.29 consumer.

## Migration verification checklist

- [ ] `packages/my-package/.axe-config.mjs` exists with a tier-named header comment
- [ ] `.a11y-baseline/my-package.json` committed after the first `run-axe-baseline.mjs` run
- [ ] `test:a11y` script wired in `packages/my-package/package.json`
- [ ] Root `package.json` `test:a11y` sweep includes the new package
- [ ] `scripts/check-a11y-gates.mjs` `A11Y_PACKAGE_TIER` map updated with tier + optional override
- [ ] `pnpm test:a11y` at repo root includes the new package in the sweep
- [ ] `evaluateReleaseGate(..., { a11yTier: 'saas' })` in the release gate test / harness

## Pattern references — three real-world sweep examples

The v1.30 milestone seeded 34 packages on top of a 1-package baseline. Three of them are useful templates for future onboarding.

- [`packages/core/.axe-config.mjs`](https://github.com/cardene777/kiwa/blob/main/packages/core/.axe-config.mjs) — Core tier example. Pure parser + pool logic package with no DOM output; every layer records `applicable: false` and the baseline totals stay at 0/0/0/0. `thresholds` are the strictest — critical 0 / serious 0 / moderate 0-3.
- [`packages/nextjs/.axe-config.mjs`](https://github.com/cardene777/kiwa/blob/main/packages/nextjs/.axe-config.mjs) — Framework tier example. RSC + Server Actions + Middleware wrapper; the tier ceiling loosens serious to 0-3 and moderate to 0-10 to cover Next router link internals whose fix requires an upstream PR. The looser ceiling ships with a documented follow-up.
- [`packages/auth/.axe-config.mjs`](https://github.com/cardene777/kiwa/blob/main/packages/auth/.axe-config.mjs) — Framework tier with a `providers` block. Enumerates the 6 provider adapters (NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth) plus 4 protocol variants under one baseline, so downstream gates can prove the sweep considered every provider.

Follow any of the three as a template and the migration cost per new package is 10-15 minutes.

## Where to next

- [Tutorial 56 — A11y baseline (axe-core + WCAG 2.1 AA gate walkthrough)](./56-a11y-baseline)
- [Concept — A11y testing SSOT (WCAG 2.1 AA + 4-tier threshold + baseline persistence + 3-layer harness)](../concepts/a11y-testing-ssot)
- [Migration guide — v1.29 → v1.30](../migrations/v1.29-to-v1.30)
- [A11y thresholds SSOT (4-tier rationale)](../quality/a11y-thresholds)
- [Release gate SSOT (13-axis)](../quality/release-gate)
