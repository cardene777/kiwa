# Mutation testing SSOT — kill rate + 4-tier threshold + baseline persistence + regression detection SSOT for kiwa v1.27

Introduced in v1.11 as `@kiwa/quality-metrics` v0.1 (`mutationFromCounts` + a fixed 60 % kill-rate axis on the 7-axis release gate), extended in v1.27-4 as v0.3 (`DEFAULT_MUTATION_TIER_THRESHOLDS` + `resolveMutationTier` + `assertMutationTier` + tier-aware 12-axis release gate), and rolled out to all 33 kiwa packages in the v1.27 milestone. This document is the SSOT for **what a kiwa mutation suite measures, how the kill rate is computed, and how a regression is decided**. Every downstream Stryker config (`packages/*/stryker.config.mjs`) and every downstream baseline JSON (`.mutation-baseline/*.json`) reads these rules from here — do not re-derive them locally.

## Why a mutation SSOT

Mutation tests without a shared standard fail three ways.

- **Threshold drift**. One package uses 90 / 80 / 80 as the gate, another uses 80 / 60 / 50, a third uses 65 / 55 / 50. When a mutation regression fires on package A but not on B, the reader cannot tell whether B is genuinely fine or whether B's gate is looser than A's. The 4-tier SSOT names the shape of the code Stryker runs over (`Core` / `Framework` / `SaaS` / `Test type`), and every downstream config picks the tier that fits its shape — not the tier that flatters its historic score.
- **Kill-rate formula drift**. Stryker's HTML report exposes multiple numbers: `total MSI`, `covered MSI`, `killed / mutations`, `killed / (killed + survived)`. The SSOT pins the kill rate at **`killed / (killed + survived + timeout + error)`** — the "% Mutation score / covered" column — so a package with a lot of `no-coverage` mutants is not penalised for lines the test suite never touches, and a package with `timeout` / `error` mutants is not silently rewarded.
- **Regression detection drift**. Rebuilding the baseline on every run misses regressions entirely. Comparing today's kill rate against a hard-coded number misses improvements. The SSOT pins baseline persistence at `.mutation-baseline/{package}.json`, tracked in git, so a mutation regression on a future PR shows up as a **diff on the baseline JSON alongside the code diff**.

The 4 rules below are the smallest set that make kiwa mutation suites comparable across packages, milestones, and forks.

## Rule 1 — kill rate = `killed / (killed + survived + timeout + error)`

Every `mutationFromCounts` call in the kiwa monorepo derives kill rate from the same denominator. `no-coverage` mutants (mutated lines that no test exercises) are **excluded** from the denominator — they inflate the "% Mutation score / total" column but say nothing about test suite quality.

```ts
import { mutationFromCounts } from '@kiwa/quality-metrics';

const metric = mutationFromCounts({
  mutations: 200, // killed + survived (no timeout or error in this suite)
  killed: 130,
});
// metric.killRate === 65
```

The SSOT matches Stryker's "% Mutation score / covered" column. The v0.3 `mutationFromCounts` helper takes `{ mutations, killed }` and derives `survived + killRate` from the two inputs; downstream code should not compute the ratio by hand.

### Exceptions

- **Provider-specific `testcontainers-*.js`** — when a file only exercises against a live container, its mutants land at `no-coverage` under the unit suite. Exclude those files from Stryker's `mutate` glob (see `@kiwa/queue` / `cache` / `realtime` `stryker.config.mjs`) and record the exclusion in the baseline JSON `note` field so a reviewer sees why. Live-container mutation testing is out of scope for the unit gate.
- **Effectful bridges** — thin re-exports of downstream helpers (`@kiwa/realtime/report.js` re-exports `@kiwa/quality-metrics`) are excluded from `mutate` because the mutation coverage belongs to the source module.

## Rule 2 — 4-tier threshold rationale

The v1.27 milestone pins every kiwa package to one of four rationale tiers, named after the shape of the code Stryker runs over — not the package name. The tiers and their `high` / `low` / `break` thresholds live in `docs/quality/mutation-thresholds.md`. The `high` value is the SSOT floor.

| Tier | `high` (SSOT floor) | `low` | `break` | Rationale |
|---|---|---|---|---|
| Core | 80 | 60 | 50 | Pure logic packages with fully deterministic tests and no external protocol drift. |
| Framework | 70 | 60 | 50 | SSR / hydration / RSC / adapter-wrapper layers where framework internals + client / server dual code paths lower the maximum practical kill-rate. |
| SaaS | 65 | 55 | 50 | Provider-specific adapters (Stripe / Paddle / Anthropic / Ably / Redis / Prisma / …) where mocks approximate a live external API and drift is expected. |
| Test type | 60 | 50 | 40 | Test harness packages (component / visual / a11y / e2e) where DOM / measurement noise + browser dependence inflates false-negative mutants. |

Kill rate ≥ `high` colours the Stryker HTML report green. Kill rate ≥ `low` colours it yellow. Kill rate < `break` fails the mutation run. The 4-tier table is the SSOT for the `high` column — Stryker configs, baseline JSON, `PACKAGE_TIER` in `scripts/check-mutation-gates.mjs`, and `DEFAULT_MUTATION_TIER_THRESHOLDS` in `@kiwa/quality-metrics` all agree by construction.

### Stricter and looser overrides

- **Stricter override** — a package may raise its floor above the tier default (e.g. `@kiwa/api` = Core-strict 90 / 80 / 80 because its historical bar already met it). Stricter overrides do not need approval — they raise the floor. The `stryker.config.mjs` header comment records the raised value.
- **Looser override** — a package may sit one point below tier `low` when the baseline sweep lands below the tier default and a follow-up PR is scoped to bring it back. Looser overrides require a one-line justification pinned to the follow-up work, and must **not** drop below the tier's `break` threshold. `@kiwa/auth` at 65 / `@kiwa/cache` / `realtime` / `orm` at 60 are the four Framework / SaaS packages that currently sit on a documented looser override.

### The `MutationTier` enum

The runtime enum is `type MutationTier = 'core' | 'framework' | 'saas' | 'test-type'`. The verbal labels written in `.mutation-baseline/*.json` (`Core` / `Framework` / `SaaS` / `Test type`) resolve through `resolveMutationTier`.

```ts
import { resolveMutationTier } from '@kiwa/quality-metrics';

resolveMutationTier('Core');       // → 'core'
resolveMutationTier('Framework');  // → 'framework'
resolveMutationTier(' SaaS ');     // → 'saas'   (trim + lowercase)
resolveMutationTier('Test type');  // → 'test-type'
resolveMutationTier('unknown');    // throws — silent drift refused
```

The verbal label and the machine enum agree by construction — the SSOT and the runtime read the same tier without a lookup table per call site.

## Rule 3 — baseline persistence is JSON, path is `.mutation-baseline/{package}.json`

Every `pnpm test:mutation` invocation writes a Stryker report to `packages/{package}/mutation-report/mutation.json`. That report is transient — regenerated on every run. The **persistent baseline** lives at `.mutation-baseline/{package}.json` (repo root, tracked in git), and it is the last known green mutation snapshot.

```json
{
  "package": "@kiwa/auth",
  "tier": "Framework",
  "thresholds": { "high": 70, "low": 60, "break": 50 },
  "killRate": 68.86,
  "totalMsi": 68.86,
  "coveredMsi": 68.86,
  "killed": 115,
  "survived": 52,
  "timeout": 0,
  "noCoverage": 3,
  "error": 0,
  "mutants": [
    { "file": ".vitest-dist/src/session.js", "line": 35, "column": 15, "mutator": "ConditionalExpression", "replacement": "false" }
  ],
  "capturedAt": "2026-07-05T12:00:19Z",
  "note": "Total MSI 68.86% / Covered MSI 68.86% (threshold high=70 / low=60 / break=50)."
}
```

Commit the baseline JSON so a mutation regression on a future PR shows up as a diff on the JSON alongside the code diff. Reviewers see the exact number that moved and the list of surviving mutants without opening the HTML report. Baseline refresh happens in-PR when kill rate improves, and is written by the same PR that raises test coverage — never as a standalone commit.

The 4-tier `tier` field is verbal (`Core` / `Framework` / `SaaS` / `Test type`) to keep the baseline JSON human-readable; the runtime helpers normalise it to the machine enum. The `note` field records the SSOT formula and any exclusions applied.

## Rule 4 — 12-axis release gate integration

v1.27-4 promotes the mutation kill rate to a first-class 12th axis in the release gate. `evaluateReleaseGate` gains an optional third parameter `context`:

```ts
import {
  evaluateReleaseGate,
  resolveMutationTier,
} from '@kiwa/quality-metrics';

const verdict = evaluateReleaseGate(report, {}, {
  mutationTier: resolveMutationTier('SaaS'),
  mutationTierThreshold: 60, // optional per-package looser override
});
// verdict.axesEvaluated === 8  (non-AI-LLM + tier)
// verdict.axesEvaluated === 12 (AI-LLM + tier)
```

When `mutationTier` is omitted the verdict stays at 7 (non-AI-LLM) or 11 (AI-LLM) axes for backward compatibility. When present the verdict count grows by 1 and any threshold miss surfaces as a `mutation.tier` blocker.

The tier axis surfaces **alongside** the legacy `mutation.killRate` axis — v1.11 consumers keep the old blocker shape, and 12-axis consumers additionally see the tier-aware bar. Both axes coexist so an SSOT change on the tier default does not silently invalidate a v1.11 consumer's overrides.

```ts
// A report with mutation kill rate at 50 % on a Core-tier package with a
// legacy override of 55 % sees both blockers:
const verdict = evaluateReleaseGate(
  report,
  { mutationKillRate: 55 },  // v1.11 override on the legacy axis
  { mutationTier: 'core' },  // v1.27-4 opt-in on the 12th axis
);
// verdict.blockers -> [
//   { axis: 'mutation.killRate', threshold: 55, actual: 50, op: '>=' },
//   { axis: 'mutation.tier',     threshold: 80, actual: 50, op: '>=' },
// ]
```

The `assertMutationTier` helper is available for callers that want to enforce the tier floor without going through the full release-gate report — useful in per-package test suites that gate their own PR.

```ts
import {
  assertMutationTier,
  mutationFromCounts,
  resolveMutationTier,
} from '@kiwa/quality-metrics';

const metric = mutationFromCounts({ mutations: 167, killed: 115 });
assertMutationTier({
  metric,
  tier: resolveMutationTier('Framework'),
  threshold: 65, // .mutation-baseline/auth.json override
});
```

The zero-mutation guard is deliberate. `assertMutationTier` throws when `metric.mutations === 0` with the message `no mutation signal` — an empty test suite would otherwise register as 0/0 = 0 % kill rate and slip past a naïve `>= threshold` check.

## The 3-layer harness alignment

`@kiwa/perf-harness` runs `serial + concurrent + memory` in one `runPerf3Layer` call. The mutation harness is single-layer by design — Stryker mutates one operator per run and re-executes the full vitest suite. That is expensive (a 200-mutant run over 30 tests is 6 000 vitest invocations), so kiwa runs mutation once per PR at the branch tip, not on every commit. The perf harness is 3-layer because contention + memory leaks slip past a serial p95; the mutation harness is 1-layer because test-suite quality already covers the concurrency + memory shapes through the same behavior tests Stryker mutates.

The kiwa release gate treats them as parallel axes.

| Axis | Layer | Cost | Runs when |
|---|---|---|---|
| `perf.p95Ms` (v1.13) | serial | ~90 s across 33 packages | every `pnpm test:perf` |
| perf 3-layer (v1.14) | serial + concurrent + memory | ~120 s per package | every `pnpm test:perf` |
| `mutation.killRate` (v1.11) | single | ~200 s per package | every `pnpm test:mutation` |
| `mutation.tier` (v1.27-4) | single | (piggybacks on above) | every `pnpm test:mutation` + `evaluateReleaseGate({ mutationTier })` |

Mutation runs are excluded from the default `pnpm test` sweep because a 33-package × ~200 s per-package run is ~110 minutes. `pnpm test:mutation` is the explicit opt-in — run it once per PR at the branch tip, commit the baseline JSON when kill rate improves, and let the diff surface any regression.

## Package coverage (v1.27)

The v1.27 milestone applied the tier gate to every kiwa package.

| Layer | Packages |
|---|---|
| Core (6) | `@kiwa/core` / `api` / `data` / `cli-test` / `cli` / `observability` |
| Framework (12) | `@kiwa/nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `solidjs` / `fresh` / `hono` / `auth` |
| SaaS (11) | `@kiwa/ai-llm` / `payment` / `queue` / `cache` / `streaming` / `realtime` / `mcp` / `agent` / `search` / `orm` / `dapp` |
| Test type (5) | `@kiwa/ui` / `a11y` / `visual` / `component` / `e2e` |

Every package writes a per-package baseline JSON to `.mutation-baseline/{package}.json`, runs Stryker on every `pnpm test:mutation` invocation, and gates on the tier floor via `assertMutationTier` (in package tests) or `evaluateReleaseGate({ mutationTier })` (at release time). The `PACKAGE_TIER` map in `scripts/check-mutation-gates.mjs` is the runtime SSOT for the tier assignment; the doc table above is the human-readable SSOT.

## Where each axis lands in the release gate

The 12-axis release gate exposes two mutation axes.

| Axis | Kind | Introduced | Threshold source |
|---|---|---|---|
| mutation — killRate | floor | v1.11 (7-axis) | `ReleaseGateThresholds.mutationKillRate` (default 60 %, overrideable) |
| mutation — tier | floor | v1.27-4 (12-axis) | `DEFAULT_MUTATION_TIER_THRESHOLDS[tier]` + optional `context.mutationTierThreshold` |

Both axes coexist. The legacy `mutation.killRate` axis stays at its v1.11 default (60 %) so downstream consumers that never adopt the 12-axis path keep the same shape. The `mutation.tier` axis is opt-in via `context.mutationTier` and gates on the 4-tier SSOT.

## Related

- [Tutorial 50 — Mutation testing baseline (Stryker + tier gate walkthrough)](../tutorials/50-mutation-testing-baseline)
- [Tutorial 51 — Mutation baseline migration (22 → 33 package sweep methodology)](../tutorials/51-mutation-baseline-migration)
- [Migration guide v1.26 → v1.27](../migrations/v1.26-to-v1.27)
- [Mutation thresholds SSOT (4-tier rationale + package assignment matrix)](../quality/mutation-thresholds)
- [Release gate SSOT (12-axis)](../quality/release-gate)
- [Perf-testing SSOT (parallel 3-layer harness)](./perf-testing-ssot)
