# A11y testing SSOT — WCAG 2.1 AA + 4-tier threshold + baseline persistence + 3-layer harness SSOT for kiwa v1.30

Introduced in v1.16 as `@kiwa-lab/a11y` v1.0 (`runAxe` + `reportViolations` + `expectNoViolations` — a thin axe-core wrapper over jsdom + Playwright pages), extended in v1.30-2 as v1.1 (`runLayerHarness` + `bucketViolations` + `unionByRule` + `computeTotals` + `isHarnessOk` + `summariseHarness` — the 3-layer harness on top of the v1.0 primitives), and rolled out to all 34 kiwa packages in the v1.30 milestone. This document is the SSOT for **what a kiwa a11y suite measures, how impact violations are counted, and how a regression is decided**. Every downstream axe config (`packages/*/.axe-config.mjs`) and every downstream baseline JSON (`.a11y-baseline/*.json`) reads these rules from here — do not re-derive them locally.

## Why an a11y SSOT

A11y tests without a shared standard fail three ways.

- **Threshold drift**. One package uses "0 critical" as the gate, another uses "0 critical + 0 serious", a third uses "0 critical + 5 serious + 20 moderate". When an a11y regression fires on package A but not on B, the reader cannot tell whether B is genuinely fine or whether B's gate is looser than A's. The 4-tier SSOT names the shape of the code axe-core runs over (`Core` / `Framework` / `SaaS` / `Test type`), and every downstream config picks the tier that fits its shape — not the tier that flatters its historic score. `critical: 0` is an invariant across every tier.
- **Rule set drift**. axe-core ships with `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`, `wcag22aa`, `best-practice`, `ACT`, and provider-specific tags. Running "everything" produces a moving target — the surviving-rules list changes on every axe-core version bump. The SSOT pins the tag filter at **`wcag2a` + `wcag2aa` + `wcag21a` + `wcag21aa`** — WCAG 2.1 AA conformance, no more no less. Best-practice suggestions are excluded because they are style, not conformance.
- **Fixture layer drift**. jsdom sees the SSR-parsed DOM but no client-side state changes. Playwright sees the runtime DOM after hydration but is expensive. SSR-hydration sees both. Running one layer and calling it "the a11y test" misses rules that only fire on one of the three. The SSOT pins the 3-layer harness at `runLayerHarness(pkg, { jsdom?, playwright?, ssrHydration? })` with per-layer applicable / absent tracking, so a package that participates in one layer records the other two as `applicable: false` with an explicit reason.

The 5 rules below are the smallest set that make kiwa a11y suites comparable across packages, milestones, and forks.

## Rule 1 — WCAG 2.1 AA is the rule set, `runOnly.type: 'tag'` is the filter

Every `runAxe` call in the kiwa monorepo passes the same tag filter. Best-practice rules are excluded because they surface style suggestions, not conformance failures.

```ts
import { runAxe } from '@kiwa-lab/a11y';

const results = await runAxe({
  context: document.body,
  runOptions: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  },
});
```

The SSOT matches WCAG 2.1 AA conformance. A future SSOT extension to WCAG 2.2 AA would add the `wcag22aa` tag; a future extension to AAA would loosen the operator to a superset. Neither is planned for v1.30.

### Exceptions

- **Provider-specific test-only fixtures** — when a jsdom fixture only exists to exercise the adapter's DOM output (e.g. `@kiwa-lab/component` Storybook 8 fixture), the audit runs against the rendered component tree, not against test-scaffolding markup. The `context` field of `runAxe` scopes the audit to a specific subtree.
- **Framework-owned markup** — when a framework internal (Next router link, Nuxt teleport, Astro island wrapper) surfaces a violation that requires an upstream PR to fix, the tier ceiling loosens `serious` to 0-3 and `moderate` to 0-10 so the package baseline can still commit while the upstream fix is in flight.

## Rule 2 — 4-tier threshold rationale

The v1.30 milestone pins every kiwa package to one of four rationale tiers, named after the shape of the code axe-core runs over — not the package name. The tiers and their critical / serious / moderate ceilings live in `docs/quality/a11y-thresholds.md`. `critical: 0` is a `A11yThreshold` TypeScript literal — no override can raise it above 0.

| Tier | critical | serious | moderate | Rationale |
|---|---|---|---|---|
| Core | 0 | 0 | 0-3 | Pure logic packages with no DOM output. Bar is 0 across the board because "no DOM" means "no excuse". Moderate 0-3 covers axe incompleteness for headless test harnesses that still emit a jsdom fixture. |
| Framework | 0 | 0-3 | 0-10 | SSR / hydration / RSC / adapter-wrapper layers. Serious 0-3 is the tolerance for framework-owned markup whose fix requires an upstream PR. |
| SaaS | 0 | 0 | 0 | Provider-specific adapters (Stripe / Paddle / Anthropic / Ably / Redis / Prisma / …) that expose no DOM. Bar is a strict 0 because a SaaS adapter that emits any WCAG violation is emitting DOM it should not be emitting — the violation itself is a bug marker. |
| Test type | 0 | 0-3 | 0-10 | Test harness packages (component / visual / a11y / e2e / ui) where DOM measurement noise + browser dependence produce false-positive violations that only reproduce inside our test runners. The bar is the same as Framework because the harness must not itself leak violations, but moderate 0-10 covers jsdom quirks. |

`critical` fails the run in every tier. `serious` and `moderate` counts are checked against the tier's allowed range. `minor` impact is not enforced; use it for team review only.

### Stricter and looser overrides

- **Stricter override** — a package may lower its ceiling below the tier default (e.g. `@kiwa-lab/api` at Core-strict 0/0/0 because its historical bar already met it). Stricter overrides do not need approval — they lower the ceiling. The `.axe-config.mjs` header comment records the lowered value.
- **Looser override** — a package may raise its serious / moderate ceiling above the tier default when the baseline sweep lands above the tier default and a follow-up PR is scoped to bring it back. Looser overrides require a one-line justification pinned to the follow-up work. `critical` cannot be raised — the type literal forbids it. `@kiwa-lab/auth` at Framework 0/5/15 is the sole current example (router link internals — follow-up upstream PR brings serious back to 3).

### The `A11yTier` enum

The runtime enum is `type A11yTier = 'core' | 'framework' | 'saas' | 'test-type'`. The verbal labels written in `.a11y-baseline/*.json` header comments (`Core` / `Framework` / `SaaS` / `Test type`) resolve through `resolveA11yTier`.

```ts
import { resolveA11yTier } from '@kiwa-lab/quality-metrics';

resolveA11yTier('Core');       // → 'core'
resolveA11yTier('Framework');  // → 'framework'
resolveA11yTier(' SaaS ');     // → 'saas'   (trim + lowercase)
resolveA11yTier('Test type');  // → 'test-type'
resolveA11yTier('unknown');    // throws — silent drift refused
```

The verbal label and the machine enum agree by construction — the SSOT and the runtime read the same tier without a lookup table per call site. Shape and behaviour are unified with `resolveMutationTier` for review economy.

## Rule 3 — baseline persistence is JSON, path is `.a11y-baseline/{package}.json`

Every `pnpm test:a11y` invocation runs `scripts/run-axe-baseline.mjs`, which reads `.axe-config.mjs`, executes the 3-layer harness against whatever fixtures the config supplies, and writes the aggregated report to `.a11y-baseline/{package}.json` (per-package, tracked in git). That file is the last known green a11y snapshot.

```json
{
  "package": "@kiwa-lab/auth",
  "generatedAt": "2026-07-06T01:47:54.816Z",
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

Commit the baseline JSON so an a11y regression on a future PR shows up as a diff on the JSON alongside the code diff. Reviewers see the exact rule that moved and the surviving-node count without opening the axe HTML report. Baseline refresh happens in-PR when violations drop, and is written by the same PR that improves the DOM output — never as a standalone commit.

`ok` is `true` when every applicable layer has zero critical + zero serious + zero moderate violations. `minor` never gates `ok` because it is unbounded on every current tier. `applicable: false` layers do not affect `ok`.

## Rule 4 — 3-layer harness (jsdom + Playwright + SSR-hydration)

The `runLayerHarness(pkg, fixtures)` primitive is the SSOT for multi-layer aggregation. Each layer has a distinct fixture shape and a distinct failure mode.

### jsdom layer

Fastest, cheapest, most common. axe-core runs over a jsdom Element / Document / selector. Perfect for pure-DOM validation (form structure, ARIA attributes, heading hierarchy). Blind to any client-side state change that happens after mount — a component that mounts with `aria-invalid="false"` and flips to `aria-invalid="true"` on a click event is only tested in the initial state.

```ts
const report = await runLayerHarness('my-component', {
  jsdom: {
    context: host,
    runOptions: {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] },
    },
  },
});
```

The harness attaches detached subtrees to `document.body` before running axe and restores the original parent + sibling in a `finally` block — a caller who hands us a detached subtree gets it back byte-identical (N1 regression fix from v1.30-3).

### Playwright layer

Slowest, most expensive, most faithful. axe-core runs inside a browser page after full hydration + interaction. Catches rules that only fire after client-side state changes (dynamic `aria-live` announcements, focus management on modal open, keyboard trap detection).

```ts
// axe-playwright caller pattern:
const results = await page.evaluate(async () => await (window as any).axe.run(...));

const report = await runLayerHarness('my-component', {
  playwright: { results },
});
```

The harness aggregates the pre-computed axe results verbatim to keep `@kiwa-lab/a11y` Playwright-free at build time (Playwright is a peerDep, not a dep). Missing `fixture.results.violations` is treated as an empty axe run rather than a thrown TypeError — a common shape when the caller wired the harness before the browser run completed.

### SSR-hydration layer

Medium cost. axe-core runs against the SSR HTML string parsed into a jsdom Element **and** an optional post-hydration Element. Violations from both sides are unioned by rule id with provenance recorded per layer. The layer catches SSR / hydration drift — a rule that fires in the SSR output but is fixed by hydration, or vice versa.

```ts
const report = await runLayerHarness('my-component', {
  ssrHydration: {
    ssrHtml: '<div><button>click</button></div>',
    hydrated: hydratedHost, // optional
  },
});
```

The union preserves the more severe impact when a rule fires on both sides (SSR minor + hydrated critical surfaces as critical, not stays pinned to whichever side landed first — N2 regression fix from v1.30-3). Cross-realm Elements (a caller who hands us an Element from a different JSDOM window) survive the branch selection via a duck-typed `isElementLike` check (N3 regression fix from v1.30-3).

### Aggregation

`computeTotals(layers)` sums impact counts across every applicable layer. `isHarnessOk(layers)` returns true iff every applicable layer has zero critical / serious / moderate violations. `summariseHarness(report)` returns a human-readable string with cross-layer dedup by rule id.

## Rule 5 — 13-axis release gate integration

v1.30-4 promotes the a11y tier to a first-class 13th axis in the release gate. `evaluateReleaseGate` gains a new `a11yTier` context field.

```ts
import {
  evaluateReleaseGate,
  resolveA11yTier,
} from '@kiwa-lab/quality-metrics';

const verdict = evaluateReleaseGate(report, {}, {
  a11yTier: resolveA11yTier('SaaS'),
  a11yTierThreshold: { critical: 0, serious: 5, moderate: 15 }, // optional per-package looser override
});
// verdict.axesEvaluated === 8  (non-AI-LLM + a11y tier)
// verdict.axesEvaluated === 9  (non-AI-LLM + mutation tier + a11y tier)
// verdict.axesEvaluated === 12 (AI-LLM + a11y tier)
// verdict.axesEvaluated === 13 (AI-LLM + mutation tier + a11y tier)
```

When `a11yTier` is omitted the verdict stays at 7 (non-AI-LLM) / 11 (AI-LLM) / 12 (with `mutationTier`) axes for backward compatibility. When present the verdict count grows by 1 and any threshold miss surfaces as an `a11y.tier` blocker.

The tier axis fails safe when `report.a11y` is missing — the gate coerces the missing block to `critical: Number.POSITIVE_INFINITY` and refuses to pass. Silent "no a11y data" pass is impossible by construction. This mirrors the AI-LLM axis `Number.POSITIVE_INFINITY` / `NEGATIVE_INFINITY` fallback pattern.

Only one blocker is emitted per tier evaluation — critical > serious > moderate is the priority. `axesEvaluated` counts the single `a11y.tier` lane regardless of how many impact ceilings were breached (mirrors `mutation.tier`: 1 tier check = 1 axis).

The `assertA11yTier` helper is available for callers that want to enforce the tier ceiling without going through the full release-gate report — useful in per-package test suites that gate their own PR.

```ts
import {
  a11yFromBaseline,
  assertA11yTier,
  resolveA11yTier,
} from '@kiwa-lab/quality-metrics';

const metric = a11yFromBaseline({
  totals: { critical: 0, serious: 0, moderate: 0, minor: 2 },
});
assertA11yTier({
  metric,
  tier: resolveA11yTier('Test type'),
});
```

Unlike `assertMutationTier`, `assertA11yTier` treats a zero-violation metric (0/0/0) as **pass** — a11y "no violation" is the ideal state, so a silent success is correct (SSOT § "Empty-violation metrics do not throw"). Contrast with `assertMutationTier`, which treats an empty test suite as `no mutation signal` and refuses to pass.

## jsdom vs Playwright vs SSR-hydration — when each layer fires

| Rule shape | jsdom | Playwright | SSR-hydration |
|---|---|---|---|
| Static ARIA attribute correctness (`aria-labelledby` target exists) | ✅ | ✅ | ✅ |
| Heading hierarchy (h1 → h2 skip) | ✅ | ✅ | ✅ |
| Colour contrast — computed style needs a browser | ⚠️ | ✅ | ⚠️ |
| Focus trap detection — needs runtime tab traversal | ❌ | ✅ | ❌ |
| Dynamic `aria-live` announcement — needs event dispatch | ❌ | ✅ | ❌ |
| SSR-only markup (server-rendered, hydrated away) | ❌ | ❌ | ✅ SSR side |
| Hydration-only markup (client-rendered, absent from SSR) | ❌ | ✅ | ✅ hydrated side |
| SSR / hydration diff — rule fires on SSR only, resolved by hydration | ❌ | ❌ | ✅ union preserves impact |

`⚠️` in the jsdom / SSR-hydration column means axe-core runs the rule but jsdom's incomplete CSS engine may false-negative — the rule surfaces as an `incomplete` result rather than a hard `violations` entry. Playwright is required for high-confidence colour contrast checks.

The rule of thumb is that packages with a Framework or Test type tier tend to need all 3 layers, packages with a SaaS or Core tier tend to need 0 layers (the `applicable: false` baseline is expected). If the tier assignment disagrees with the fixture set, the tier assignment is wrong.

## The parallel to perf-testing and mutation-testing

`@kiwa-lab/perf-harness` runs `serial + concurrent + memory` in one `runPerf3Layer` call — 3 layers, all mandatory when the package has any measured surface. `@kiwa-lab/a11y` runs `jsdom + Playwright + SSR-hydration` — 3 layers, opt-in per fixture. `@kiwa-lab/quality-metrics` mutation gate is single-layer by design (Stryker mutates one operator per run and re-executes the full vitest suite). The 3 harnesses converge on the same 4-tier SSOT for release-gate integration but keep their layer semantics distinct.

| Axis | Layers | Cost | Runs when |
|---|---|---|---|
| `perf.p95Ms` (v1.13) | serial | ~90 s across 33 packages | every `pnpm test:perf` |
| `perf` 3-layer (v1.14 / v1.25) | serial + concurrent + memory | ~120 s per package | every `pnpm test:perf` |
| `mutation.killRate` (v1.11) | single | ~200 s per package | every `pnpm test:mutation` |
| `mutation.tier` (v1.27-4) | single | (piggybacks on above) | every `pnpm test:mutation` + `evaluateReleaseGate({ mutationTier })` |
| `a11y.tier` (v1.30-4) | jsdom + Playwright + SSR-hydration | ~30 s per package (jsdom-only) / ~300 s per package (Playwright layer) | every `pnpm test:a11y` + `evaluateReleaseGate({ a11yTier })` |

A11y with Playwright runs opt-in per package because the browser boot cost is prohibitive for the 34-package sweep. Framework and Test type tier packages typically ship the Playwright layer; SaaS and Core tier packages skip it because they emit no DOM.

## Package coverage (v1.30)

The v1.30 milestone applied the tier gate to every kiwa package. Package tiers agree with the SSOT table verbatim.

| Layer | Packages |
|---|---|
| Core (9) | `@kiwa-lab/core` / `api` / `data` / `cli-test` / `cli` / `observability` / `perf-harness` / `quality-metrics` / `release-invariants` |
| Framework (12) | `@kiwa-lab/nextjs` / `nuxt` / `sveltekit` / `remix` / `astro` / `solidstart` / `qwikcity` / `edge` / `solidjs` / `fresh` / `hono` / `auth` |
| SaaS (11) | `@kiwa-lab/ai-llm` / `payment` / `queue` / `cache` / `streaming` / `realtime` / `mcp` / `agent` / `search` / `orm` / `dapp` |
| Test type (5) | `@kiwa-lab/ui` / `a11y` / `visual` / `component` / `e2e` |

Every package writes a per-package baseline JSON to `.a11y-baseline/{package}.json`, runs the 3-layer harness on every `pnpm test:a11y` invocation, and gates on the tier ceiling via `assertA11yTier` (in package tests) or `evaluateReleaseGate({ a11yTier })` (at release time). The `A11Y_PACKAGE_TIER` map in `scripts/check-a11y-gates.mjs` is the runtime SSOT for the tier assignment; the doc table above is the human-readable SSOT.

## Where each axis lands in the release gate

The 13-axis release gate exposes one a11y axis.

| Axis | Kind | Introduced | Threshold source |
|---|---|---|---|
| `a11y.tier` | ceiling | v1.30-4 (13-axis) | `DEFAULT_A11Y_TIER_THRESHOLDS[tier]` + optional `context.a11yTierThreshold` |

Unlike the v1.11 → v1.27 mutation lineage (legacy `mutation.killRate` axis + v1.27 `mutation.tier` axis coexisting), v1.30 ships a single `a11y.tier` axis — no legacy scalar to preserve because there was no v1.11 a11y axis to inherit. The design keeps the axis surface small and the SSOT drift-free.

## Related

- [Tutorial 56 — A11y baseline (axe-core + WCAG 2.1 AA gate walkthrough)](../tutorials/56-a11y-baseline)
- [Tutorial 57 — A11y baseline migration (0 → 34 package sweep methodology)](../tutorials/57-a11y-baseline-migration)
- [Migration guide v1.29 → v1.30](../migrations/v1.29-to-v1.30)
- [A11y thresholds SSOT (4-tier rationale + 37-package assignment matrix)](../quality/a11y-thresholds)
- [Release gate SSOT (13-axis)](../quality/release-gate)
- [Mutation testing SSOT (parallel 4-tier gate)](./mutation-testing-ssot)
- [Perf-testing SSOT (parallel 3-layer harness)](./perf-testing-ssot)
