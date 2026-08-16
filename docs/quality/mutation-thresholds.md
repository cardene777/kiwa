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
| Test type | 60 % | 50 % | 40 % | Test harness packages (component / a11y / e2e) where DOM / measurement noise + browser dependence inflates false-negative mutants. |

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
| `@kiwa-lab/edge` | Framework | 70 / 60 / 50 | Workers / Deno / Bun edge runtimes with divergent APIs. |
| `@kiwa-lab/hono` | Framework | 70 / 60 / 50 | Hono edge + node adapter drift. |
| `@kiwa-lab/auth` | Framework | 70 / 60 / 50 | Adapter wraps NextAuth v5 / Lucia v3 / Better Auth / Clerk / Auth0 / Supabase Auth — SSR + RSC + provider drift. |
| `@kiwa-lab/ai-llm` | SaaS | 65 / 55 / 50 | Anthropic / OpenAI / Vercel AI SDK / LangChain — provider API surfaces evolve rapidly. |
| `@kiwa-lab/queue` | SaaS | 65 / 55 / 50 | BullMQ / Inngest / Cloudflare Queues / SQS / RabbitMQ — provider transport + semantics drift. v1.27-3 baseline mutates `sandbox-queue.js` only; `testcontainers-queue.js` is excluded because its assertions only fire against live containers (0 covered mutants under the unit suite). |
| `@kiwa-lab/cache` | SaaS | 65 / 55 / 50 | Redis / KeyDB / Memcached — client library + protocol drift. v1.27-3 baseline mutates `in-memory-cache.js` only; `testcontainers-cache.js` is excluded for the same reason as queue. |
| `@kiwa-lab/realtime` | SaaS | 65 / 55 / 50 | Supabase Realtime / Ably / Pusher / Socket.io — WebSocket API drift. v1.27-3 baseline mutates `engine.js` / `fidelity.js` / `ably.js` only; `pusher.js` + `socketio.js` require a live provider socket to exercise, and `report.js` is a thin adapter over `@kiwa-lab/quality-metrics` (mutation-tested there). |
| `@kiwa-lab/search` | SaaS | 65 / 55 / 50 | Algolia / Meilisearch / Typesense — index + query fidelity drift. |
| `@kiwa-lab/orm` | SaaS | 65 / 55 / 50 | Prisma / Drizzle / Kysely — SQL dialect + query planner drift. |
| `@kiwa-lab/dapp` | SaaS | 65 / 55 / 50 | viem + anvil + wallet fixture — chain protocol + wallet inject drift. |
| `@kiwa-lab/ui` | Test type | 60 / 50 / 40 | Vue / Solid / Lit / Qwik / Angular DOM harness — jsdom + framework noise. |
| `@kiwa-lab/a11y` | Test type | 90 / 80 / 80 (override) | axe-core WCAG 2.1 AA — measurement noise + jsdom limits, but the historical bar already met 90. |
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

## What goes in `mutate` (Issue #1944)

**Every file with behaviour of its own.** Two shapes have none, and only those are out of scope:

- a barrel, which forwards other modules and decides nothing itself
- a file that declares nothing but types and interfaces, which is gone before anything runs

Everything else belongs in `mutate`. A barrel does execute, but there is nothing in it to get wrong —
Stryker generates no mutants from a re-export.

The test below reads membership off what a file *exports*, as a stand-in for whether it has its own
behaviour. The two agree everywhere in this repo today. They would part company on a file whose only
job is a side effect — imports something, calls it, exports nothing. That file has behaviour and
belongs in scope, but the test cannot see it. Name those by hand if one appears.

**This is the target, not the current state.** As of #1944 only `hono` satisfies it; the repo sits at
16.8% and each package moves under its own Issue (§ Widening a package's scope). Read a green
mutation gate accordingly — until a package's Issue lands, "passed" covers whatever its config
happens to list.

Three configs currently name a barrel (`api`, `ui`, `a11y` all list their `index.js`). Harmless —
Stryker finds nothing to mutate there — but it makes the list read wider than it is. Drop them when
you widen that package.

### Telling the shapes apart

Compile the file with the types stripped and read what the emitted JavaScript still exports. Types,
interfaces, and `declare` forms leave nothing behind, so whatever remains is what exists at runtime.

Do **not** decide by reading the source and listing which declaration forms produce runtime values.
#1944 wrote that check and had to extend it in four consecutive review rounds — first for
`export { run }` written apart from its declaration, then `export default <expr>`, then
`export namespace`, then `export declare function`.

The first three dropped real implementation out of scope. The fourth erred the other way, counting a
type declaration as implementation. Both directions are wrong and neither announces itself, and
there is no point at which such a list is provably complete.

A file can be both shapes at once: `cli/detect/index.ts` and `component/fixture.ts` re-export *and*
implement. Count those as implementation. Their re-export lines then sit inside the implementation
total (442 lines, 0.7% of it), which matters only when the line count drives an estimate.

The rule is deliberately blunt. `mutate` lists paths by hand, so a file added later is outside the
scope until someone remembers to add it. #1936 is what that costs: `index.ts` was split into
`runCli.ts`, the list kept pointing at the old shape, and the argument parsing and command routing
that moved sat outside every gate while the report still read green. Adding the file back produced
611 mutants — none of which existed while it was out of scope, which is why nothing failed.
"Every file with behaviour of its own" removes the remembering.

### The measurement that produced this rule

Classified once by hand during #1944 (2026-08-17, 21 packages). Making this repeatable is #1948;
until it lands, re-derive the numbers the same way if a package's `mutate` changes.

| bucket | lines |
|---|---|
| implementation, in `mutate` | 10,878 |
| implementation, not in `mutate` | 53,875 |
| barrel | 3,057 |
| type-only | 704 |

So 16.8% of implementation lines were covered (10,878 of 64,753).

The "it's only types" explanation does not cover the gap. Everything outside `mutate` totals 57,636
lines, and barrel plus type-only accounts for 3,761 of them — the other 53,875 lines are
implementation. Per-package coverage ranged from `hono` at 100% to `auth` at 2.7% with no written
basis for the difference.

Widening to the full set means 64,753 implementation lines against 10,878 today — roughly 6x. At the
current density (6,271 mutants over 10,878 lines, about 0.58 per line) that projects to somewhere
near 37,000 mutants. Treat it as an order of magnitude, not a forecast: density varies by package,
and `a11y` came in at 0.55 per line while `core` sits at 1.42.

### Expect scores to drop, and do not read that as regression

Adding one 467-line file to `@kiwa-lab/a11y` moved it from 47 to 256 mutants, 95.74 to 82.42, and
9 to 36 seconds. The new file scored 79.43 on its own and diluted the 95.74 that the old, narrower
scope reported.

Nothing got worse. A range that was never measured became visible. Narrowing the scope back would
restore the high number by not looking, which is the failure this rule exists to prevent.

## Overrides

**Use the tier default.** An override is an exception and needs the reason recorded next to it.

**`scripts/check-mutation-gates.mjs` (`PACKAGE_TIER`) is what the gate reads.** The assignment table
above repeats those numbers for readability, so the two can drift — `@kiwa-lab/a11y` sat at
60 / 50 / 40 in the table while running at `override: 90` until #1944 corrected the row. When they
disagree, `check-mutation-gates.mjs` is right.

Overrides that *raise* the bar (`@kiwa-lab/api` 90, `@kiwa-lab/a11y` 90) came from a narrow scope
where a high number was easy to hold. They are not evidence that the widened scope can hold the same
bar, so they return to the tier default as each package's scope grows.

Overrides that *lower* the bar are temporary by construction and must not drop below the tier's
`break` threshold. Re-evaluate each one when its package's scope widens — `@kiwa-lab/orm` carried
`override: 60` with a "raises back to 65" note until #1941 covered the 18 mutants that had no test at
all, at which point the score reached 90.43 and the override was deleted rather than adjusted.

A looser override still requires a one-line justification in the PR body that introduces it.

## Widening a package's scope

One package per PR, sized by how much sits outside `mutate` today. The three groups below exist
because the work differs in kind, not just in volume: the large group needs its own test-writing
plan, while the small group is mostly a config edit plus a re-run.

| group | packages | uncovered lines each |
|---|---|---|
| large — one Issue each | `auth` (13,975), `orm` (5,032), `queue` (5,000), `observability` (4,996), `ai-llm` (4,759), `realtime` (3,975), `dapp` (3,523) | 3,000+ |
| medium — one Issue each | `edge` (2,820), `search` (2,191), `cache` (2,096), `cli` (2,059) | 1,000-3,000 |
| small — one Issue for all | `component`, `nextjs`, `a11y`, `ui`, `core`, `e2e`, `cli-test`, `api`, `data` | under 1,000 |

`hono` already sits at 100% and needs no Issue.

### What a widening PR has to show

The scope grows and the score moves, so both belong in the PR body:

- the files added to `mutate`, and for anything left out, which of the two out-of-scope shapes it is
- the score before and after, from an actual run
- the run time before and after — a package's scope can grow several times over (6x across the repo,
  more for the ones starting near 3%), so the number informs whether it needs `concurrency` tuning
- if the score landed below the tier, the tests written to bring it back, or the explicit plan to
  widen in further steps within the same Issue

A PR that only edits `mutate` and reports a passing gate has not shown the second half of the work.

### When the widened scope drops below the tier

**Write tests. Do not lower the bar.** The score fell because the newly visible code is less well
tested than the code that was already in scope — that is the finding, not an accident to be
configured away.

If reaching the tier in one PR is impractical, widen in steps *within that package's Issue*: add a
subset of files, cover them, land it, repeat. The scope only ever grows, and the threshold stays at
the tier default throughout. A temporary override with a "raise it back later" note is exactly the
shape #1941 removed, and it survived four milestones before anyone returned to it.

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
