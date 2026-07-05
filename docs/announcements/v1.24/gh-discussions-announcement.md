# kiwa v1.24 released — Edge / Serverless 深化 (advanced edge semantics 8 axis + 3 dogfood edge app)

v1.24 is out. After v1.14's `@kiwa-test/edge` v0.1 landed the fetch handler + KV / R2 / D1 / DurableObject minimal mocks baseline, v1.24 layers **8 axes of advanced edge semantics** on top — Durable Object hibernation + WebSocket edge + edge KV eventual consistency + geo-replicated + Cron trigger + subrequest limit + CPU time limit + streaming Response. Platform-neutral state machines + strict transition guards + fidelity harness across all 3 platforms (Cloudflare Workers + Vercel Edge + Deno Deploy). 120 new semantics behavior tests + 3 dogfood edge apps + 3 tutorials + concept doc SSOT.

## What shipped

- **`@kiwa-test/edge` v1.1.0** (8-axis advanced edge semantics). v0.1's fetch handler + minimal binding mocks (`invokeEdgeHandler` / `createKvNamespace` / `EdgeFetchHandler` / `EdgeEnvBindings` / `SimulatedExecutionContext`) keep every prior signature. v1.1 lands `packages/edge/src/semantics/*` — 1 axis = 1 file of pure state-machine helpers that operate on a shared `EdgePlatform` union (`'cloudflare' | 'vercel' | 'deno'`). Every axis emits a strongly typed `AxisStep` sequence so tests assert on the transitions, not the platform-specific event names.
  - `durable-object.ts` — Cloudflare Hibernation API envelope (`initialized` → `active` on request / alarm / storage-write, transactional storage guarantee)
  - `websocket-edge.ts` — edge WebSocket lifecycle (`pending` → `open` → `closed`, sendMessage rejects unless `open`)
  - `edge-kv.ts` — read-through cache with consistency envelope (`consistent` for Deno KV primary, `eventually-consistent` for Cloudflare KV / Vercel Edge Config / Deno KV replicas, cold read / cache-hit / cache-miss / range query)
  - `geo-replicated.ts` — primary-write / replica-lag / sync / conflict-resolve (`in-sync` → `lagging` → `in-sync` iff every replica lag returns to 0, or `conflict-detected` → `in-sync` on resolveConflict)
  - `cron-trigger.ts` — scheduled + queue + email 3-source trigger with retry policy (`scheduled` → `running` → `completed` or `failed`, retry backoff exponent)
  - `subrequest-limit.ts` — fetch quota + iteration + warning threshold + hard limit (`open` → `warning` → `blocked`)
  - `cpu-time-limit.ts` — budget tracking + warning + throttle (`open` → `warning` → `throttled` → `exhausted`)
  - `streaming-response.ts` — chunked + SSE + WebSocket streaming + backpressure resume (`open` → `chunking` → `paused` → `chunking` → `closed`)
- **`examples/dogfood-cloudflare-workers-durable-object-app`** — Cloudflare Workers Durable Object realtime chat app with Hibernation API + transactional storage + WebSocket edge broadcast. 40 vitest exercising room-per-DO state + alarm-driven message purge + 2-user broadcast fidelity. `KIWA_MODE=real` flips the same tests to hit real Miniflare without touching bodies.
- **`examples/dogfood-vercel-edge-function-app`** — Next.js 15 middleware + edge runtime + Vercel KV (Redis) + streaming Response (SSE) + geo-based routing (accept-language + geo IP → region) + edge cache invalidation. 45 vitest — the widest v1.24 dogfood app for edge because SSE streaming + geo routing double as backpressure + region-failover signal sources.
- **`examples/dogfood-deno-deploy-geo-app`** — Fresh + Deno KV geo-replicated with strong consistency + Deno Deploy Cron + queue trigger + read-your-writes. 50 vitest exercising multi-region KV write + eventual consistency observation + cron trigger fire + queue trigger dispatch. `KIWA_MODE=real` opts into the real Deno Deploy sandbox.
- **docs** — 3 new tutorials (42 Cloudflare Durable Object + 43 Vercel Edge streaming + 44 Deno Deploy geo) + concept doc `edge-runtime-testing.md` — SSOT for the 8 axes + platform-specific fidelity surface across all 3 dogfood edge apps. Migration guide v1.23 → v1.24 (additive-only). Snippet validation test `packages/edge/tests/docs-tutorial-v1.24.test.ts` (16 tests) re-runs every code snippet against the real `@kiwa-test/edge` API. Same drift-detection pattern as `docs-tutorial-v1.21.test.ts` + `docs-tutorial-v1.22.test.ts` + `docs-tutorial-v1.23.test.ts`. VitePress sidebar gains an `Edge / Serverless 深化 (v1.24)` tutorial section; gh-pages published via `/docs-publish-kiwa`.

## Numbers

- **6 sub-Issues resolved** (#914-#919)
- **6 PRs merged** (v1.24-1 + v1.24-2 + v1.24-3 + v1.24-4 + v1.24-5 + this publish PR)
- **1 npm minor bump** (`@kiwa-test/edge` v1.0.2 → v1.1.0) — kiwa runtime fixture count stays 34
- **3 new dogfood edge apps** with fidelity reports feeding the 7-axis release gate
- **~271 new tests** across 8 semantics axes (120) + Cloudflare (40) + Vercel (45) + Deno (50) + snippet validation (16)

## Why 8 axes (and not just fetch handler mock)

Edge testing has three failure modes that a `fetch`-only mock can't catch, no matter how many mock KV / R2 stubs you pack in.

- **Stateful drift** — a Durable Object's real lifecycle isn't `create → serve`; it's a 4-event trace (`created` / `requested` / `alarm-fired` / `storage-written`) with transactional storage + Hibernation-driven wake-up. Tests that assert `Response.status === 200` miss the state-machine drift, and production bugs surface as lost storage writes or duplicate broadcasts.
- **Consistency envelope** — real edge KV trades strong consistency for low-latency edge reads (Cloudflare KV, Vercel Edge Config, Deno KV replicas). Tests that skip the primary-vs-replica distinction miss read-your-writes bugs and let apps ship with stale-read races.
- **Cross-platform fidelity** — Cloudflare fires cron from 3 sources (scheduled + queue + email); Vercel exposes only scheduled + queue; Deno Deploy exposes scheduled + queue. Streaming Response backpressure is measured in bytes on Vercel, chunks on Cloudflare. A neutral test surface makes these differences **explicit assertions**, not silent regressions.

The 8 axes are the smallest set that reproduces the full edge envelope across the 3 target platforms. Each axis is an independent module under `@kiwa-test/edge/semantics/*`; each provides pure functions that operate on a session object + emit a strongly typed `AxisStep` sequence so tests can assert on transitions, not event shapes.

## 3 dogfood edge apps — one adapter surface, three edge envelopes

| App | Framework | Distinguishing axes |
|---|---|---|
| `dogfood-cloudflare-workers-durable-object-app` | Cloudflare Workers | Durable Object + Hibernation API + storage transactional + WebSocket edge broadcast + alarm purge |
| `dogfood-vercel-edge-function-app` | Next.js 15 middleware + edge runtime | Vercel KV Redis + streaming Response SSE + geo-based routing + edge cache invalidation |
| `dogfood-deno-deploy-geo-app` | Fresh + Deno Deploy | Deno KV geo-replicated + Deno Deploy Cron + queue trigger + read-your-writes + multi-region write |

All three share the same `KIWA_MODE=mock|real-optional|real` switch v1.22 established — mock branch runs in ~1 ms per test; `KIWA_MODE=real` flips to the actual platform sandbox without touching bodies.

## 14-milestone streak

v1.11 (release gate) → v1.12 (non-determinism) → v1.13 (time-axis) → v1.14 (horizontal expansion) → v1.15 (AI-LLM depth) → v1.16 (component depth) → v1.17 (Observability v2) → v1.18 (Blockchain depth) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → **v1.24 (Edge / Serverless 深化)**. Every milestone since v1.11 has landed 6 sub-Issues in full.

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data depth (Dragonfly / Materialize / Neon)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth (SurrealDB / EdgeDB / Turso)
- Edge / Serverless 深化 II — real driver layer (real Miniflare + wrangler dev + Vercel Edge sandbox + Deno Deploy sandbox testcontainers + `KIWA_MODE=real-required` nightly)

Feedback welcome on which of these should land next.
