# A11y thresholds — SSOT

## Why this file exists

kiwa v1.16 introduced `@kiwa-lab/a11y` (axe-core WCAG 2.1 AA wrapper) as a single test-adapter package.
v1.30 promotes accessibility from one-package coverage to a repository-wide infra baseline mirroring the mutation-thresholds SSOT (`docs/quality/mutation-thresholds.md`, v1.27) and the perf-thresholds SSOT (`docs/quality/perf-thresholds.md`, v1.25).
(The Issue AC calls it "34 packages" — the count is the 33 `@kiwa-lab/*` packages published in v1.29 + `release-invariants`. This SSOT covers the packages listed in § Tier assignment, including `perf-harness` + `quality-metrics` because they are the same publish set and share the same 4-tier rationale. The matrix and `A11Y_PACKAGE_TIER` in `scripts/check-a11y-gates.mjs` cover the same package set. Neither covers the full publish set: `security`, `lean` and `skill-test` sit outside the root a11y sweep, which predates #1865 and is not addressed here. Counts are deliberately not written down: they moved at #1785, #1803 and #1865, and a stale literal reads as the matrix having drifted.)

Every kiwa package publishes an `.axe-config.mjs` that pins its WCAG 2.1 AA rule set + tag filter + `.a11y-baseline/{pkg}.json` output path, and every `test:a11y` script writes a machine-readable baseline that downstream release gates (v1.30-4, 13th axis) can enforce.
Without a shared threshold rationale, each package would land its own bar and drift for the same reasons the mutation-testing rollout drifted before v1.27 — no documented "why 0 critical here" survives the review that lands the code six weeks later.

This doc pins every package to one of four rationale tiers.
The tiers are named after the shape of the code axe-core runs over — pure logic, SSR / hydration wrapper, provider adapter, test harness — not the package name.

## Tier table

| Tier | AA critical | AA serious | AA moderate | Applies to |
|---|---|---|---|---|
| Core | 0 | 0 | 0-3 | Pure logic packages with no DOM output. Bar is 0 across the board because "no DOM" means "no excuse". Moderate 0-3 covers axe incompleteness for headless test harnesses that still emit a jsdom fixture. |
| Framework | 0 | 0-3 | 0-10 | SSR / hydration / RSC / adapter-wrapper layers. Serious 0-3 is the tolerance for framework-owned markup (Next router link, Nuxt teleport, Astro island) whose fix requires an upstream PR. |
| Test type | 0 | 0-3 | 0-10 | Test harness packages (component / a11y / e2e / ui) where DOM measurement noise + browser dependence produce false-positive violations that only reproduce inside our test runners. The bar is the same as Framework because the harness must not itself leak violations, but moderate 0-10 covers jsdom quirks. |
| SaaS | 0 | 0 | 0 | Provider-specific adapters (Stripe / Paddle / Anthropic / Ably / Redis / Prisma / …) that expose no DOM. Bar is a strict 0 because a SaaS adapter that emits any WCAG violation is emitting DOM it should not be emitting — the violation itself is a bug marker. |

`AA critical`, `AA serious`, `AA moderate` map to axe-core's `impact` field on `AxeViolation` (see `packages/a11y/src/types.ts`).
`minor` impact is not enforced; use it for team review only.

Kill line = `.a11y-baseline/{pkg}.json` reports one violation count per impact.
`critical > 0` fails the run in every tier.
`serious` and `moderate` counts are checked against the tier's allowed range.

## Tier assignment — package matrix

| Package | Tier | Threshold (critical / serious / moderate) | Reason |
|---|---|---|---|
| `@kiwa-lab/core` | Core | 0 / 0 / 0-3 | Pure parser + pool logic every adapter depends on. No DOM. |
| `@kiwa-lab/api` | Core | 0 / 0 / 0-3 | HTTP request client + MSW bridge. No DOM. |
| `@kiwa-lab/data` | Core | 0 / 0 / 0-3 | Fixture builders + assertion helpers. No DOM. |
| `@kiwa-lab/cli-test` | Core | 0 / 0 / 0-3 | CLI expectation runner. No DOM. |
| `@kiwa-lab/cli` | Core | 0 / 0 / 0-3 | CLI runtime. No DOM. |
| `@kiwa-lab/observability` | Core | 0 / 0 / 0-3 | Flaky detection + coverage gap analysis. No DOM. |
| `@kiwa-lab/perf-harness` | Core | 0 / 0 / 0-3 | Perf runner + tinybench wrapper. No DOM. |
| `@kiwa-lab/quality-metrics` | Core | 0 / 0 / 0-3 | Release gate calculator. No DOM. |
| `@kiwa-lab/nextjs` | Framework | 0 / 0-3 / 0-10 | RSC + Server Actions + Middleware. Serious tolerance for Next router link internals. |
| `@kiwa-lab/edge` | Framework | 0 / 0-3 / 0-10 | Workers / Deno / Bun edge runtimes with divergent APIs. |
| `@kiwa-lab/hono` | Framework | 0 / 0-3 / 0-10 | Hono edge + node adapter. |
| `@kiwa-lab/auth` | Framework | 0 / 0-3 / 0-10 | NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth. |
| `@kiwa-lab/ai-llm` | SaaS | 0 / 0 / 0 | Anthropic / OpenAI / Vercel AI SDK / LangChain adapters. No DOM. |
| `@kiwa-lab/queue` | SaaS | 0 / 0 / 0 | BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ. No DOM. |
| `@kiwa-lab/cache` | SaaS | 0 / 0 / 0 | Redis / KeyDB / Memcached. No DOM. |
| `@kiwa-lab/realtime` | SaaS | 0 / 0 / 0 | Supabase Realtime / Ably / Pusher / Socket.io. No DOM. |
| `@kiwa-lab/search` | SaaS | 0 / 0 / 0 | Algolia / Meilisearch / Typesense. No DOM. |
| `@kiwa-lab/orm` | SaaS | 0 / 0 / 0 | Prisma / Drizzle / Kysely. No DOM. |
| `@kiwa-lab/dapp` | SaaS | 0 / 0 / 0 | viem + anvil + wallet fixture. No DOM. |
| `@kiwa-lab/ui` | Test type | 0 / 0-3 / 0-10 | Vue / Solid / Lit / Qwik / Angular DOM harness. jsdom + framework noise. |
| `@kiwa-lab/a11y` | Test type | 0 / 0-3 / 0-10 | axe-core WCAG 2.1 AA wrapper. Self-tests exercise DOM fixtures. |
| `@kiwa-lab/component` | Test type | 0 / 0-3 / 0-10 | Storybook + Playwright CT + Chromatic. DOM fixture noise. |
| `@kiwa-lab/e2e` | Test type | 0 / 0-3 / 0-10 | Playwright fixture. Browser fixture noise. |

Any future adapter starts by picking the tier its code most resembles.
If none fits, add a new tier here first, then the config.

## How each package encodes this

Every `packages/*/.axe-config.mjs` starts with a header comment that names the tier and links back to this doc.

```js
/**
 * A11y (axe-core) config for @kiwa-lab/<name>.
 * Tier: <tier> tier (critical 0 / serious <range> / moderate <range>) — <one-line reason>.
 * SSOT: docs/quality/a11y-thresholds.md § <tier> tier.
 */
```

The comment is the on-the-spot receipt.
This doc is the shared law.

## Config shape

`.axe-config.mjs` exports one default object with three top-level fields.

```js
export default {
  // WCAG 2.1 AA tag filter — axe-core scan will run only these rule tags.
  runOptions: {
    runOnly: {
      type: 'tag',
      values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
    },
  },
  // Impact threshold per this doc's tier table.
  thresholds: {
    critical: 0,
    serious: { max: 0 },
    moderate: { max: 3 },
  },
  // Where the machine-readable baseline gets written.
  baselinePath: '.a11y-baseline/<pkg>.json',
};
```

`serious` / `moderate` accept `{ max: N }` (upper bound tolerated) or a raw number (strict equality — used by SaaS + Core `critical` / `serious`).
`critical` is always a raw number and always `0` — enforced at the SSOT layer, never overridable.

## Overrides

A package may sit one tier stricter than its default (e.g. `@kiwa-lab/component` sets `moderate.max = 0` if its Storybook fixtures reach zero violations).
Stricter overrides do not need approval — they raise the floor.
A looser override requires a one-line justification in the PR body of the change that introduces it, and must not raise `critical` above `0`.
No override may ever raise the `critical` bar.

## Baseline snapshots

Each package writes a per-package baseline JSON to `.a11y-baseline/<pkg>.json`.
The baseline records the last known green a11y report — a 3-layer harness envelope (v1.30-2, `docs/quality/a11y-thresholds.md § 3-layer harness`) recording violation counts per impact + surviving-violation list per layer + timestamp.
`pnpm test:a11y` rewrites the baseline every run, and fails the run if the tier ceiling was breached (critical > 0 in every tier, serious > tier max, moderate > tier max).
Baseline refresh happens in-PR when violation counts drop, and is written by the same PR that improves the underlying markup — never as a standalone commit.

## 3-layer harness (v1.30-2)

Every applicable package participates in three layers, each running axe-core once and recording its verdict separately in the baseline.

| Layer | What it scans | Fixture shape |
|---|---|---|
| `jsdom` | Static DOM audit — a jsdom Element / Document that the package produces without spinning up a browser. Fastest of the three, catches every non-runtime rule. | `.axe-config.mjs > fixtures.jsdom.context: Element \| Document \| string` |
| `playwright` | Dynamic browser audit — axe-core inside a real Playwright page. Catches contrast + layout rules that jsdom's incomplete CSSOM cannot resolve. | `.axe-config.mjs > fixtures.playwright.results: AxeResults` (caller runs the Playwright evaluation, harness aggregates) |
| `ssrHydration` | SSR + hydration diff — axe-core over the SSR HTML string plus an optional post-hydration Element. Violations are unioned by rule id so SSR-only + hydration-only + shared violations each surface once. | `.axe-config.mjs > fixtures.ssrHydration.ssrHtml: string` (+ optional `hydrated: Element`) |

A package that intentionally does not participate in a layer omits the field, and the baseline records `applicable: false` with an explicit reason. Every current `@kiwa-lab/*` core + framework adapter (v1.30-2 scope) is a test-adapter package that emits no runtime DOM, so its baseline records `layers-absent` — every layer is `applicable: false`, `totals` is zero, `ok` is `true`. The harness ran, proved the wiring is intact, and left the tier ceilings in force for the day a fixture is added.

The harness lives in `packages/a11y/src/layer-harness.ts` and is exported from `@kiwa-lab/a11y` as `runLayerHarness`. Unit tests exhaust every branch — union dedupe, absent-layer reasons, tier breach detection, missing-document fallback — so the driver in `scripts/run-axe-baseline.mjs` stays thin.

## Provider provenance (v1.30-3)

SaaS-tier packages that wrap multiple provider SDKs (`auth` / `queue` / `cache` / `orm` / `payment` / `streaming`) declare an optional `providers` array on their `.axe-config.mjs`. The runner passes the list through to `.a11y-baseline/{pkg}.json` as a top-level `providers` field so downstream gates can prove the sweep considered every provider even when the baseline is layers-absent (no-DOM adapter has no violations to record but still needs provenance).

Each entry is an object with `name` required plus any of `protocol` / `semantics` / `backend` / `axis` optional strings — enough shape to record the AC's provider × axis matrices (`payment` = 3 × 9, `streaming` = 3 × 5, `orm` = 3 × 3 × 8, `auth` = 6 + 4 protocol).

| Package | Entry count | Shape |
|---|---|---|
| `@kiwa-lab/auth` | 10 | 6 provider (auth0 / better-auth / clerk / lucia / supabase / supabase-advanced) + 4 protocol (oauth21 / oidc / passkey / webauthn). |
| `@kiwa-lab/queue` | 5 | bullmq / inngest / cloudflare-queues / sqs / rabbitmq. `rabbitmq-advanced` is an axis of `rabbitmq`. |
| `@kiwa-lab/cache` | 3 | in-memory / keydb / memcached. |
| `@kiwa-lab/orm` | 72 | 3 brand (drizzle / prisma / kysely) × 3 backend (postgres / mysql / sqlite) × 8 axis (cdc / replication / mvcc / partitioning / connection-pool / logical-replication / rls / vector-store). |

Non-SaaS packages omit the field; the baseline shape is unchanged (no `providers` key). Adding a new provider adapter is a two-file edit — append to `.axe-config.mjs` `providers` and re-run `pnpm test:a11y` to refresh the baseline — no other config changes needed.

## 13-axis release gate integration (v1.30-4)

v1.30-4 promotes the a11y violation count to a first-class 13th axis in the release gate (the 12th, mutation kill rate, was added in v1.27-4).
`@kiwa-lab/quality-metrics` will expose three symbols mirroring the mutation tier interface.

- `DEFAULT_A11Y_TIER_THRESHOLDS` — the SSOT table (`core: {critical: 0, serious: 0, moderate: 3}`, `framework: {critical: 0, serious: 3, moderate: 10}`, `saas: {critical: 0, serious: 0, moderate: 0}`, `test-type: {critical: 0, serious: 3, moderate: 10}`), a `Readonly<Record<A11yTier, A11yThreshold>>`.
- `resolveA11yTier(label)` — normalises the verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) written in `.a11y-baseline/*.json` into the machine `A11yTier` enum. Case-insensitive, trim-tolerant.
- `assertA11yTier({ metric, tier, threshold? })` — asserts every impact count sits inside the tier's range. Empty-violation metrics do not throw (unlike mutation testing, an a11y run with zero violations is the desired state).

`evaluateReleaseGate` gains an optional third-parameter field `a11yTier` mirroring `mutationTier`.
When `a11yTier` is omitted the verdict stays at 12 axes for backward compatibility.
When present the verdict count grows by 1 (`axesEvaluated` becomes 13) and any threshold miss surfaces as an `a11y.tier` blocker.

## Related

- `docs/quality/release-gate.md` — 12-axis release gate; v1.30-4 promotes it to 13.
- `docs/quality/mutation-thresholds.md` — mutation-testing 4-tier SSOT this file is patterned after.
- `docs/quality/perf-thresholds.md` — perf p95 SSOT (the original three-rationale model).
- `packages/a11y/src/audit.ts` — `runAxe` / `reportViolations` / `expectNoViolations`, the runtime primitives every `.axe-config.mjs` composes on top of.
- `packages/*/.axe-config.mjs` — per-package configs.
- `scripts/check-a11y-gates.mjs` — CI gate (added in v1.30-4).
- root `package.json` `test:a11y` script — pnpm filter list covering all packages in this doc.
