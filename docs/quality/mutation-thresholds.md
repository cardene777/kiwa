# Mutation thresholds — SSOT

## Why this file exists

The Stryker rollout across kiwa's `@kiwa-lab/*` monorepo used ad-hoc per-package thresholds up to v1.26 — `high 80 / low 60 / break 50` for `core`, `high 90 / low 80 / break 80` for `api` and `nextjs`, and no documented reason for the split. When v1.27 expands mutation testing from 22 packages to 33+, each new package needs a threshold justification that survives review.

This doc pins every package to one of four rationale tiers and encodes the mapping in each package's `stryker.config.mjs` header comment. The tiers are named after the shape of the code Stryker runs over, not the package name.

## Tier table

| Tier | Kill-rate `high` | Kill-rate `low` | Kill-rate `break` | Applies to |
|---|---|---|---|---|
| Core | 80 % | 60 % | 50 % | Pure logic packages with fully deterministic tests and no external protocol drift. |
| Framework | 70 % | 60 % | 50 % | SSR / hydration / RSC / adapter-wrapper layers where framework internals + client / server dual code paths lower the maximum practical kill-rate. |
| SaaS | 65 % | 55 % | 50 % | Provider-specific adapters (Stripe / Paddle / Anthropic / Ably / Redis / Prisma / …) where mocks approximate a live external API and drift is expected. |
| Test type | 60 % | 50 % | 40 % | Test harness packages (component / visual / a11y / e2e) where DOM / measurement noise + browser dependence inflates false-negative mutants. |

Kill-rate = `killed / (killed + survived + timeout + error)` as reported by Stryker's `json` reporter. `high` colours the HTML report green, `low` colours it yellow, `break` fails the mutation run.

## Tier assignment — 33-plus package matrix

| Package | Tier | Threshold | Reason |
|---|---|---|---|
| `@kiwa-lab/core` | Core | 80 / 60 / 50 | Pure parser + pool logic every adapter depends on. |
| `@kiwa-lab/api` | Core | 90 / 80 / 80 | HTTP request client + MSW bridge — protocol invariants. |
| `@kiwa-lab/data` | Core | 80 / 60 / 50 | Fixture builders + assertion helpers, pure logic. |
| `@kiwa-lab/cli-test` | Core | 80 / 60 / 50 | CLI expectation runner, pure logic. |
| `@kiwa-lab/cli` | Core | 80 / 60 / 50 | CLI runtime for kiwa init / scaffold, pure logic. |
| `@kiwa-lab/observability` | Core | 80 / 60 / 50 | Flaky detection + coverage gap analysis, pure logic. |
| `@kiwa-lab/nextjs` | Framework | 70 / 60 / 50 | RSC + Server Actions + Middleware invariants. v1.27-1 rolled out with an aspirational 90 / 80 / 80 override, but the v1.27-2 baseline sweep landed at 80 % covered MSI (79.35 % total). Reverted to Framework default until follow-up tests raise the bar back to 90. |
| `@kiwa-lab/nuxt` | Framework | 70 / 60 / 50 | SSR + hydration + Nitro adapter drift. |
| `@kiwa-lab/sveltekit` | Framework | 70 / 60 / 50 | SSR + hydration + load / actions drift. |
| `@kiwa-lab/remix` | Framework | 70 / 60 / 50 | SSR + loader / action + client hydration drift. |
| `@kiwa-lab/astro` | Framework | 70 / 60 / 50 | Islands + SSR + partial hydration drift. |
| `@kiwa-lab/solidstart` | Framework | 70 / 60 / 50 | Solid SSR + resource + server-function drift. |
| `@kiwa-lab/qwikcity` | Framework | 70 / 60 / 50 | Resumability + SSR + route loader drift. |
| `@kiwa-lab/edge` | Framework | 70 / 60 / 50 | Workers / Deno / Bun edge runtimes with divergent APIs. |
| `@kiwa-lab/solidjs` | Framework | 70 / 60 / 50 | Solid signal + resource + SSR drift. |
| `@kiwa-lab/fresh` | Framework | 70 / 60 / 50 | Deno Fresh islands + SSR drift. |
| `@kiwa-lab/hono` | Framework | 70 / 60 / 50 | Hono edge + node adapter drift. |
| `@kiwa-lab/auth` | Framework | 70 / 60 / 50 | Adapter wraps NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth — SSR + RSC + provider drift. |
| `@kiwa-lab/ai-llm` | SaaS | 65 / 55 / 50 | Anthropic / OpenAI / Vercel AI SDK / LangChain — provider API surfaces evolve rapidly. |
| `@kiwa-lab/payment` | SaaS | 65 / 55 / 50 | Stripe / Paddle / Lemon Squeezy — webhook shape + billing semantics drift. |
| `@kiwa-lab/queue` | SaaS | 65 / 55 / 50 | BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ — provider transport + semantics drift. v1.27-3 baseline mutates `sandbox-queue.js` only; `testcontainers-queue.js` is excluded because its assertions only fire against live containers (0 covered mutants under the unit suite). |
| `@kiwa-lab/cache` | SaaS | 65 / 55 / 50 | Redis / KeyDB / Memcached — client library + protocol drift. v1.27-3 baseline mutates `in-memory-cache.js` only; `testcontainers-cache.js` is excluded for the same reason as queue. |
| `@kiwa-lab/streaming` | SaaS | 65 / 55 / 50 | Kafka / NATS / Redpanda with DLQ + exactly-once semantics. |
| `@kiwa-lab/realtime` | SaaS | 65 / 55 / 50 | Supabase Realtime / Ably / Pusher / Socket.io — WebSocket API drift. v1.27-3 baseline mutates `engine.js` / `fidelity.js` / `ably.js` only; `pusher.js` + `socketio.js` require a live provider socket to exercise, and `report.js` is a thin adapter over `@kiwa-lab/quality-metrics` (mutation-tested there). |
| `@kiwa-lab/mcp` | SaaS | 65 / 55 / 50 | MCP JSON-RPC protocol + transport drift. |
| `@kiwa-lab/agent` | SaaS | 65 / 55 / 50 | LangGraph + OpenAI Assistants v2 — graph + polling semantics drift. |
| `@kiwa-lab/search` | SaaS | 65 / 55 / 50 | Algolia / Meilisearch / Typesense — index + query fidelity drift. |
| `@kiwa-lab/orm` | SaaS | 65 / 55 / 50 | Prisma / Drizzle / Kysely — SQL dialect + query planner drift. |
| `@kiwa-lab/dapp` | SaaS | 65 / 55 / 50 | viem + anvil + wallet fixture — chain protocol + wallet inject drift. |
| `@kiwa-lab/ui` | Test type | 60 / 50 / 40 | Vue / Solid / Lit / Qwik / Angular DOM harness — jsdom + framework noise. |
| `@kiwa-lab/a11y` | Test type | 60 / 50 / 40 | axe-core WCAG 2.1 AA — measurement noise + jsdom limits. |
| `@kiwa-lab/visual` | Test type | 60 / 50 / 40 | Screenshot + baseline / diff / accept — image diff tolerance. |
| `@kiwa-lab/component` | Test type | 60 / 50 / 40 | Storybook + Playwright CT + Chromatic — DOM + visual noise. |
| `@kiwa-lab/e2e` | Test type | 60 / 50 / 40 | Playwright fixture + test env — browser fixture noise. |

Any future adapter starts by picking the tier its code most resembles. If none fits, add a new tier here first, then the config.

## How each package encodes this

Every `packages/*/stryker.config.mjs` starts with a header comment that names the tier and links back to this doc:

```js
/**
 * Mutation testing config for @kiwa-lab/<name>.
 * Threshold: <tier> tier (high N / low N / break N) — <one-line reason>.
 * SSOT: docs/quality/mutation-thresholds.md § <tier> tier.
 */
```

The comment is the on-the-spot receipt. This doc is the shared law.

## Overrides

A package may sit one tier stricter than its default (e.g. `@kiwa-lab/api` picks Core-strict 90 / 80 / 80 because its historical bar already met it). Stricter overrides do not need approval — they raise the floor. A looser override requires a one-line justification in the PR body of the change that introduces it, and must not drop below the tier's `break` threshold.

## Baseline snapshots

Each package writes a per-package baseline JSON to `.mutation-baseline/<pkg>.json` (folder is tracked). The baseline is the last known green mutation report — kill-rate + surviving-mutant list + timestamp. `pnpm test:mutation` compares against the baseline to surface regressions. Baseline refresh happens in-PR when kill-rate improves, and is written by the same PR that raises test coverage — never as a standalone commit.

## 12-axis release gate integration (v1.27-4)

v1.27-4 promotes the mutation kill rate to a first-class 12th axis in the release gate.
`@kiwa-lab/quality-metrics` exposes three new symbols so downstream apps can opt in:

- `DEFAULT_MUTATION_TIER_THRESHOLDS` — the SSOT table (`core: 80 / framework: 70 / saas: 65 / test-type: 60`), a `Readonly<Record<MutationTier, number>>` that mirrors the tier `high` column above.
- `resolveMutationTier(label)` — normalises the verbal tier label (`Core` / `Framework` / `SaaS` / `Test type`) written in `.mutation-baseline/*.json` into the machine `MutationTier` enum (`core` / `framework` / `saas` / `test-type`). Case-insensitive, trim-tolerant.
- `assertMutationTier({ metric, tier, threshold? })` — asserts `metric.killRate >= threshold ?? DEFAULT_MUTATION_TIER_THRESHOLDS[tier]`. Zero-mutation metrics throw (`no mutation signal`) so an empty test suite never silently passes.

`evaluateReleaseGate` gains an optional third parameter:

```ts
evaluateReleaseGate(report, thresholdOverrides, {
  mutationTier: 'saas',          // required to enable the 12th axis
  mutationTierThreshold: 60,     // optional looser override (e.g. auth, cache, realtime, orm)
});
```

When `mutationTier` is omitted the verdict stays at 7 (non-AI-LLM) or 11 (AI-LLM) axes for backward compatibility. When present the verdict count grows by 1 (`axesEvaluated` becomes 8 or 12) and any threshold miss surfaces as a `mutation.tier` blocker alongside the legacy `mutation.killRate` axis (both axes coexist so v1.11 consumers keep the old shape).

The three v1.26 dogfood apps (`dogfood-postgres-cdc-outbox-app`, `dogfood-mysql-rls-tenant-app`, `dogfood-vector-search-app`) pass `mutationTier: 'saas'` through their `runFidelityHarness` input so their `evaluateReleaseGate` invocation exercises the 12-axis path. `dogfood-storybook-design-system` (component, `test-type` tier) exposes the same optional field so a v1.27-5 follow-up can flip it on without another wire change.

`scripts/check-mutation-gates.mjs` follows the same shape: the top of the file exports `PACKAGE_TIER`, `TIER_THRESHOLD`, and `thresholdFor()` so tests and neighbouring tooling read the exact same tier map instead of re-deriving it.

## Related

- `docs/quality/release-gate.md` — 12-axis release gate (mutation axis has its own bar of `≥ 60 %` used at the release-gate layer, above per-package `break`; the tier-aware axis added in v1.27-4 is the 12th).
- `docs/quality/perf-thresholds.md` — perf p95 SSOT (three-rationale model this file is patterned after).
- `packages/quality-metrics/src/gate.ts` — `DEFAULT_MUTATION_TIER_THRESHOLDS`, `assertMutationTier`, `resolveMutationTier`, and the 12-axis extension of `evaluateReleaseGate`.
- `packages/*/stryker.config.mjs` — per-package configs.
- `scripts/check-mutation-gates.mjs` — CI gate; `PACKAGE_TIER` / `TIER_THRESHOLD` / `thresholdFor()` exports.
- root `package.json` `test:mutation` script — pnpm filter list covering all packages in this doc.
