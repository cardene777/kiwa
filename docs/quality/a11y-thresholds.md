# A11y thresholds — SSOT

## Why this file exists

kiwa v1.16 introduced `@kiwa-test/a11y` (axe-core WCAG 2.1 AA wrapper) as a single test-adapter package.
v1.30 promotes accessibility from one-package coverage to a 37-package infra baseline mirroring the mutation-thresholds SSOT (`docs/quality/mutation-thresholds.md`, v1.27) and the perf-thresholds SSOT (`docs/quality/perf-thresholds.md`, v1.25).
(The Issue AC calls it "34 packages" — the count is the 33 `@kiwa-test/*` packages published in v1.29 + `release-invariants`. This SSOT covers all 37 published packages including `perf-harness` + `quality-metrics` because they are the same publish set and share the same 4-tier rationale.)

Every kiwa package publishes an `.axe-config.mjs` that pins its WCAG 2.1 AA rule set + tag filter + `.a11y-baseline/{pkg}.json` output path, and every `test:a11y` script writes a machine-readable baseline that downstream release gates (v1.30-4, 13th axis) can enforce.
Without a shared threshold rationale, each package would land its own bar and drift for the same reasons the mutation-testing rollout drifted before v1.27 — no documented "why 0 critical here" survives the review that lands the code six weeks later.

This doc pins every package to one of four rationale tiers.
The tiers are named after the shape of the code axe-core runs over — pure logic, SSR / hydration wrapper, provider adapter, test harness — not the package name.

## Tier table

| Tier | AA critical | AA serious | AA moderate | Applies to |
|---|---|---|---|---|
| Core | 0 | 0 | 0-3 | Pure logic packages with no DOM output. Bar is 0 across the board because "no DOM" means "no excuse". Moderate 0-3 covers axe incompleteness for headless test harnesses that still emit a jsdom fixture. |
| Framework | 0 | 0-3 | 0-10 | SSR / hydration / RSC / adapter-wrapper layers. Serious 0-3 is the tolerance for framework-owned markup (Next router link, Nuxt teleport, Astro island) whose fix requires an upstream PR. |
| Test type | 0 | 0-3 | 0-10 | Test harness packages (component / visual / a11y / e2e / ui) where DOM measurement noise + browser dependence produce false-positive violations that only reproduce inside our test runners. The bar is the same as Framework because the harness must not itself leak violations, but moderate 0-10 covers jsdom quirks. |
| SaaS | 0 | 0 | 0 | Provider-specific adapters (Stripe / Paddle / Anthropic / Ably / Redis / Prisma / …) that expose no DOM. Bar is a strict 0 because a SaaS adapter that emits any WCAG violation is emitting DOM it should not be emitting — the violation itself is a bug marker. |

`AA critical`, `AA serious`, `AA moderate` map to axe-core's `impact` field on `AxeViolation` (see `packages/a11y/src/types.ts`).
`minor` impact is not enforced; use it for team review only.

Kill line = `.a11y-baseline/{pkg}.json` reports one violation count per impact.
`critical > 0` fails the run in every tier.
`serious` and `moderate` counts are checked against the tier's allowed range.

## Tier assignment — 37-package matrix

| Package | Tier | Threshold (critical / serious / moderate) | Reason |
|---|---|---|---|
| `@kiwa-test/core` | Core | 0 / 0 / 0-3 | Pure parser + pool logic every adapter depends on. No DOM. |
| `@kiwa-test/api` | Core | 0 / 0 / 0-3 | HTTP request client + MSW bridge. No DOM. |
| `@kiwa-test/data` | Core | 0 / 0 / 0-3 | Fixture builders + assertion helpers. No DOM. |
| `@kiwa-test/cli-test` | Core | 0 / 0 / 0-3 | CLI expectation runner. No DOM. |
| `@kiwa-test/cli` | Core | 0 / 0 / 0-3 | CLI runtime. No DOM. |
| `@kiwa-test/observability` | Core | 0 / 0 / 0-3 | Flaky detection + coverage gap analysis. No DOM. |
| `@kiwa-test/perf-harness` | Core | 0 / 0 / 0-3 | Perf runner + tinybench wrapper. No DOM. |
| `@kiwa-test/quality-metrics` | Core | 0 / 0 / 0-3 | Release gate calculator. No DOM. |
| `@kiwa-test/release-invariants` | Core | 0 / 0 / 0-3 | Release script filter + provenance flag + gate script checkers. No DOM. |
| `@kiwa-test/nextjs` | Framework | 0 / 0-3 / 0-10 | RSC + Server Actions + Middleware. Serious tolerance for Next router link internals. |
| `@kiwa-test/nuxt` | Framework | 0 / 0-3 / 0-10 | SSR + hydration + Nitro adapter. Serious tolerance for Nuxt teleport. |
| `@kiwa-test/sveltekit` | Framework | 0 / 0-3 / 0-10 | SSR + hydration + load / actions. Serious tolerance for SvelteKit-owned markup. |
| `@kiwa-test/remix` | Framework | 0 / 0-3 / 0-10 | SSR + loader / action + client hydration. Serious tolerance for Remix-owned markup. |
| `@kiwa-test/astro` | Framework | 0 / 0-3 / 0-10 | Islands + SSR + partial hydration. Serious tolerance for Astro island wrappers. |
| `@kiwa-test/solidstart` | Framework | 0 / 0-3 / 0-10 | Solid SSR + resource + server-function. |
| `@kiwa-test/qwikcity` | Framework | 0 / 0-3 / 0-10 | Resumability + SSR + route loader. |
| `@kiwa-test/edge` | Framework | 0 / 0-3 / 0-10 | Workers / Deno / Bun edge runtimes with divergent APIs. |
| `@kiwa-test/solidjs` | Framework | 0 / 0-3 / 0-10 | Solid signal + resource + SSR. |
| `@kiwa-test/fresh` | Framework | 0 / 0-3 / 0-10 | Deno Fresh islands + SSR. |
| `@kiwa-test/hono` | Framework | 0 / 0-3 / 0-10 | Hono edge + node adapter. |
| `@kiwa-test/auth` | Framework | 0 / 0-3 / 0-10 | NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth. |
| `@kiwa-test/ai-llm` | SaaS | 0 / 0 / 0 | Anthropic / OpenAI / Vercel AI SDK / LangChain adapters. No DOM. |
| `@kiwa-test/payment` | SaaS | 0 / 0 / 0 | Stripe / Paddle / Lemon Squeezy. No DOM. |
| `@kiwa-test/queue` | SaaS | 0 / 0 / 0 | BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ. No DOM. |
| `@kiwa-test/cache` | SaaS | 0 / 0 / 0 | Redis / KeyDB / Memcached. No DOM. |
| `@kiwa-test/streaming` | SaaS | 0 / 0 / 0 | Kafka / NATS / Redpanda. No DOM. |
| `@kiwa-test/realtime` | SaaS | 0 / 0 / 0 | Supabase Realtime / Ably / Pusher / Socket.io. No DOM. |
| `@kiwa-test/mcp` | SaaS | 0 / 0 / 0 | MCP JSON-RPC protocol + transport. No DOM. |
| `@kiwa-test/agent` | SaaS | 0 / 0 / 0 | LangGraph + OpenAI Assistants v2. No DOM. |
| `@kiwa-test/search` | SaaS | 0 / 0 / 0 | Algolia / Meilisearch / Typesense. No DOM. |
| `@kiwa-test/orm` | SaaS | 0 / 0 / 0 | Prisma / Drizzle / Kysely. No DOM. |
| `@kiwa-test/dapp` | SaaS | 0 / 0 / 0 | viem + anvil + wallet fixture. No DOM. |
| `@kiwa-test/ui` | Test type | 0 / 0-3 / 0-10 | Vue / Solid / Lit / Qwik / Angular DOM harness. jsdom + framework noise. |
| `@kiwa-test/a11y` | Test type | 0 / 0-3 / 0-10 | axe-core WCAG 2.1 AA wrapper. Self-tests exercise DOM fixtures. |
| `@kiwa-test/visual` | Test type | 0 / 0-3 / 0-10 | Screenshot + baseline / diff / accept. DOM fixture noise. |
| `@kiwa-test/component` | Test type | 0 / 0-3 / 0-10 | Storybook + Playwright CT + Chromatic. DOM fixture noise. |
| `@kiwa-test/e2e` | Test type | 0 / 0-3 / 0-10 | Playwright fixture. Browser fixture noise. |

Any future adapter starts by picking the tier its code most resembles.
If none fits, add a new tier here first, then the config.

## How each package encodes this

Every `packages/*/.axe-config.mjs` starts with a header comment that names the tier and links back to this doc.

```js
/**
 * A11y (axe-core) config for @kiwa-test/<name>.
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

A package may sit one tier stricter than its default (e.g. `@kiwa-test/component` sets `moderate.max = 0` if its Storybook fixtures reach zero violations).
Stricter overrides do not need approval — they raise the floor.
A looser override requires a one-line justification in the PR body of the change that introduces it, and must not raise `critical` above `0`.
No override may ever raise the `critical` bar.

## Baseline snapshots

Each package writes a per-package baseline JSON to `.a11y-baseline/<pkg>.json` (folder is tracked, files are `.gitignore`d until baseline lands).
The baseline records the last known green a11y report — violation counts per impact + surviving-violation list + timestamp.
`pnpm test:a11y` compares against the baseline to surface regressions.
Baseline refresh happens in-PR when violation counts drop, and is written by the same PR that improves the underlying markup — never as a standalone commit.

## 13-axis release gate integration (v1.30-4)

v1.30-4 promotes the a11y violation count to a first-class 13th axis in the release gate (the 12th, mutation kill rate, was added in v1.27-4).
`@kiwa-test/quality-metrics` will expose three symbols mirroring the mutation tier interface.

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
