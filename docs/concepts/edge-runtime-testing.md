# Edge runtime testing — 8-axis SSOT for kiwa `@kiwa-test/edge` v0.2

Introduced in v1.24-1, `@kiwa-test/edge` v0.2 raises the edge mock harness from a **`fetch` handler invocation + minimal KV / R2 / D1 / DurableObject stubs** surface (v0.1) to a full **advanced edge semantics** surface. Where v0.1 gave you `invokeEdgeHandler` + `createKvNamespace` and a shallow DurableObject stub, v0.2 layers **8 axes** of platform-neutralised edge behaviour on top.

The 8 axes are the observable envelope every real edge platform (Cloudflare Workers, Vercel Edge, Deno Deploy) converges on — mapped to the same neutral event names + state machines — so tests write once and re-run against any platform. This document is the SSOT for what each axis exists to test, what state machine it defines, and which platform-specific behaviours it neutralises.

## Why 8 axes, why now

Edge testing has three failure modes that a `fetch`-only mock cannot catch.

- **Stateful drift**. A Durable Object's real lifecycle is not just `create → serve` — it is a 4-event trace (`created` / `requested` / `alarm-fired` / `storage-written`) with a transactional storage guarantee and a Hibernation-driven wake-up. Tests that only assert on a `Response.status` miss the state-machine drift, and production bugs surface as lost storage writes or duplicate broadcasts.
- **Consistency envelope**. Real edge KV trades strong consistency for low-latency edge reads (Cloudflare KV, Vercel Edge Config, Deno KV replicas). Tests that skip the primary-vs-replica distinction miss read-your-writes bugs and let merchant apps ship with stale-read races.
- **Cross-platform fidelity**. Cloudflare fires cron on 3 sources (scheduled + queue + email), Vercel exposes only scheduled + queue, Deno Deploy exposes scheduled + queue. Streaming Response backpressure is measured in bytes on Vercel, in chunks on Cloudflare. A neutral test surface makes these differences **explicit assertions**, not silent regressions.

The 8 axes below are the smallest set that reproduces the full edge envelope across the 3 target platforms. Each axis is an independent module under `@kiwa-test/edge/semantics/*`; each provides pure functions that operate on a session object and emit a strongly typed `AxisStep` sequence.

## Axis 1 — Durable Object

**Purpose**. Reproduce Cloudflare Durable Objects (and their session-affine analogues on Vercel + Deno Deploy). A single stateful actor pinned to one edge location — created once, receives fetch requests that pin it `active`, wakes on a scheduled alarm, and persists to transactional storage.

**State machine**. `initialized` → `active` (loops on `requestDurableObject` / `fireAlarm` / `writeStorage`) → `hibernated` / `terminated` (out of scope for v0.2).

**Key functions**.

- `createDurableObject({ id, platform })` — creates a session in `initialized` state, emits `durable-object.created`
- `requestDurableObject(session, { url })` — pins the instance `active`, bumps `requestCount`, emits `durable-object.requested`
- `fireAlarm(session)` — re-activates the instance from a scheduled alarm, emits `durable-object.alarm-fired`
- `writeStorage(session, { key, value })` — persists a key/value pair to `storageKeys`, emits `durable-object.storage-written`

**Failure mode caught**. Merchant app assumes DO storage survives a broadcast failure but forgets to wrap the writes in a transaction. Test catches it by asserting the ordered `history` sequence includes the rollback state before finalisation.

## Axis 2 — WebSocket edge

**Purpose**. Reproduce edge WebSocket lifecycle. All 3 platforms accept a `101 Switching Protocols` upgrade (Cloudflare `WebSocketPair`, Vercel edge websockets, Deno `Deno.upgradeWebSocket`) but expose different telemetry strings.

**State machine**. `pending` → `open` → `closed`.

**Key functions**.

- `requestWebSocketUpgrade({ id, platform })` — creates a session in `pending`, emits `websocket.upgrade-requested`
- `acceptWebSocket(session)` — transitions to `open`, emits `websocket.accepted`
- `sendMessage(session, { data })` — appends to `messages`, emits `websocket.message`, rejects unless the socket is `open`
- `closeWebSocket(session, { code })` — transitions to `closed`, emits `websocket.closed`

**Failure mode caught**. Merchant app tries to `sendMessage` on a socket that already closed on the Hibernation wake-up. Test catches it by asserting the throw + expected state.

## Axis 3 — Edge KV

**Purpose**. Reproduce edge KV with a read-through per-POP cache. Cloudflare KV, Vercel Edge Config, Deno KV all trade strong consistency for low-latency edge reads.

**Consistency states**. `consistent` (Deno KV primary) / `eventually-consistent` (Cloudflare KV, Vercel Edge Config, Deno KV replicas).

**Key functions**.

- `createEdgeKvSession({ platform, state })` — opens a KV session with a backing `store` + read-through `cache`
- `kvRead(session, { key })` — populates the cache on a cold read, emits `kv.read` (cold) / `kv.cache-hit` (warm) / `kv.cache-miss` (absent)
- `kvWrite(session, { key, value })` — persists to `store` + invalidates the cache entry, emits `kv.write`
- `kvRangeQuery(session, { prefix, limit })` — returns `{ matches: string[], step }` with a lexicographically sorted match array + a single `kv.read` step

**Failure mode caught**. Merchant app assumes read-your-writes on a replica; when the write lands on the primary and the reader hits a lagging replica, the merchant app returns stale data. Test catches it by asserting `state === 'eventually-consistent'` on the replica read.

## Axis 4 — Geo-replicated

**Purpose**. Reproduce multi-region consistency — a primary region that accepts writes and N replica regions that catch up asynchronously. Behind Cloudflare Smart Placement + KV replication, Vercel Edge Config replication, and Deno KV's primary/replica topology.

**State machine**. `in-sync` → `lagging` (on `geoPrimaryWrite` or `markReplicaLagged`) → `in-sync` (only when every replica lag returns to 0) / `conflict-detected` → `in-sync` (on `resolveConflict`).

**Key functions**.

- `createGeoReplicatedSession({ platform, primaryRegion, replicaRegions })` — opens a session in `in-sync` at version 0
- `geoPrimaryWrite(session, { data })` — bumps version, marks every replica lagging (`POST_WRITE_LAG_MS` = 100 ms), emits `geo.primary-write`
- `markReplicaLagged(session, { region, lagMs })` — records lag for a specific replica, emits `geo.replica-lagged`
- `syncReplica(session, { region })` — clears lag on a replica, transitions to `in-sync` iff every replica has 0 lag, emits `geo.replica-synced`
- `resolveConflict(session, { region, chosenVersion })` — picks a winning version, forces state back to `in-sync`, emits `geo.conflict-resolved`

**Failure mode caught**. Merchant app assumes a partial sync means the session is `in-sync`; it flips back only when **every** replica has zero lag. Test catches it by asserting `state === 'lagging'` until every replica syncs.

## Axis 5 — Cron trigger

**Purpose**. Reproduce scheduled invocation lifecycle. Cloudflare fires scheduled handlers from 3 sources (Cron Triggers + Queue consumers + Email routing), Vercel Cron jobs cover scheduled + queue, Deno Deploy cron covers scheduled + queue.

**State machine**. `scheduled` → `running` → `completed` / `failed` (with retry back to `scheduled` until `maxRetries` is exhausted).

**Key functions**.

- `scheduleCron({ id, platform, triggerType, cronSpec, maxRetries })` — seeds the session in `scheduled`, emits `cron.scheduled`. `triggerType` defaults to `'scheduled'`; `maxRetries` defaults to 3.
- `startCron(session)` — transitions to `running`, stamps `startedAt`, emits `cron.started`
- `completeCron(session, { durationMs })` — transitions to `completed`, emits `cron.completed`
- `failCron(session, { reason })` — increments `retryCount`; re-schedules while retries remain, terminates in `failed` otherwise. Emits `cron.failed` with `willRetry` reflecting the decision.

**Failure mode caught**. Merchant app assumes a queue trigger runs a different code path than a scheduled cron; both ride the same lifecycle. Test catches it by asserting `triggerType === 'queue'` without a distinct state machine.

## Axis 6 — Subrequest limit

**Purpose**. Reproduce the per-invocation outbound fetch budget. Cloudflare Workers default 50 on the free plan, Vercel + Deno enforce comparable ceilings.

**State machine**. `ok` → `approaching-limit` (at warning threshold, 80% of limit by default) → `limited` (further fetches refused).

**Key functions**.

- `startSubrequestBudget({ platform, limit, warningThreshold })` — opens a budget with `limit` = 50 + `warningThreshold` = 40 by default
- `startSubrequest(session)` / `countSubrequest(session)` / `completeSubrequest(session)` / `remainingBudget(session)` — step through the budget

**Failure mode caught**. Merchant app fans out to 60 subrequests without checking `remainingBudget`; production hits the ceiling silently. Test catches it by asserting the terminal state matches the configured limit.

## Axis 7 — CPU time limit

**Purpose**. Reproduce the per-invocation compute budget. Cloudflare Workers 50 ms on the free plan, Vercel + Deno enforce comparable ceilings.

**State machine**. `idle` → `running` (on `startCpu`) → `warning` (at threshold) → `throttled` (budget exhausted) / `completed`.

**Key functions**.

- `startCpuBudget({ platform, budgetMs, warningAtMs })` — opens a CPU budget with `budgetMs` = 50 + `warningAtMs` = 40 by default
- `startCpu(session)` / `tickCpu(session, { deltaMs })` / `completeCpu(session)` — step through the budget

**Failure mode caught**. Merchant app assumes a fast-path code branch stays under budget; a rare edge case blows through the threshold and the invocation gets throttled. Test catches it by asserting `state === 'warning'` before the terminal transition.

## Axis 8 — Streaming Response

**Purpose**. Reproduce chunked / SSE / websocket body delivery with backpressure. Edge runtimes stream responses through a bounded buffer.

**State machine**. `open` → `backpressure` (when `bytesSent` exceeds `highWaterMark`) → `open` (on `resumeStream`) → `closed` (terminal).

**Delivery kinds**. `chunked` / `sse` / `websocket`.

**Key functions**.

- `openStream({ id, platform, kind, highWaterMark })` — opens a stream in `open`, emits `stream.opened`. `kind` defaults to `chunked`; `highWaterMark` defaults to 65536 bytes.
- `sendChunk(session, { data })` — advances counters, emits `stream.chunk-sent` (below high-water) / `stream.backpressure` (above)
- `resumeStream(session)` — transitions `backpressure` → `open`, drains one high-water-mark worth of buffered bytes
- `closeStream(session, { reason })` — terminal transition, emits `stream.closed` with total chunks + bytes

**Failure mode caught**. Merchant app assumes `sendChunk` always succeeds; the client is on a slow connection and the buffer overflows. Test catches it by asserting the `stream.backpressure` step arrives before the merchant app pushes more data.

## Platform-specific fidelity table

The 8 neutral axes above expose 32 neutral events. Each real platform emits a **different string** for the same neutral event; the mock keeps the neutral name in `step.neutralEvent` and the platform dialect in `step.platformEvent`. Fidelity tests can assert either — production tests usually assert on `platformEvent` for exact-match SSOT + `neutralEvent` for cross-platform portability.

| Axis | neutralEvent | Cloudflare | Vercel | Deno Deploy |
|---|---|---|---|---|
| durable-object | `durable-object.created` | `durable_object.created` | `edge_function.session_affinity.created` | `deploy.stateful_object.created` |
| durable-object | `durable-object.requested` | `durable_object.fetch` | `edge_function.session_affinity.request` | `deploy.stateful_fetch` |
| durable-object | `durable-object.alarm-fired` | `durable_object.alarm` | `edge_function.background_timer` | `deploy.cron.timer` |
| durable-object | `durable-object.storage-written` | `durable_object.storage.put` | `edge_config.write` | `deno_kv.atomic_write` |
| websocket-edge | `websocket.upgrade-requested` | `websocket_upgrade.requested` | `edge_websocket_upgrade.requested` | `deno_websocket_upgrade.requested` |
| websocket-edge | `websocket.accepted` | `websocket_upgrade.accepted` | `edge_websocket_upgrade.accepted` | `deno_websocket_upgrade.accepted` |
| websocket-edge | `websocket.message` | `websocket.message` | `edge_websocket.message` | `deno_websocket.message` |
| websocket-edge | `websocket.closed` | `websocket.close` | `edge_websocket.close` | `deno_websocket.close` |
| edge-kv | `kv.read` | `kv_get` | `edge_config.get` | `deno_kv.get` |
| edge-kv | `kv.write` | `kv_put` | `edge_config.set` | `deno_kv.set` |
| edge-kv | `kv.cache-hit` | `kv_cache.hit` | `edge_config.cache_hit` | `deno_kv.cache_hit` |
| edge-kv | `kv.cache-miss` | `kv_cache.miss` | `edge_config.cache_miss` | `deno_kv.cache_miss` |
| geo-replicated | `geo.primary-write` | `smart_placement.primary_write` | `edge_config.primary_write` | `deno_kv.primary_write` |
| geo-replicated | `geo.replica-lagged` | `kv_replication.lagged` | `edge_config.replica_lagged` | `deno_kv.replica_lagged` |
| geo-replicated | `geo.replica-synced` | `kv_replication.synced` | `edge_config.replica_synced` | `deno_kv.replica_synced` |
| geo-replicated | `geo.conflict-resolved` | `durable_object.conflict_resolved` | `edge_config.conflict_resolved` | `deno_kv.conflict_resolved` |
| cron-trigger | `cron.scheduled` | `scheduled_event.enqueued` | `vercel_cron.scheduled` | `deploy.cron.scheduled` |
| cron-trigger | `cron.started` | `scheduled_event.started` | `vercel_cron.started` | `deploy.cron.started` |
| cron-trigger | `cron.completed` | `scheduled_event.completed` | `vercel_cron.completed` | `deploy.cron.completed` |
| cron-trigger | `cron.failed` | `scheduled_event.failed` | `vercel_cron.failed` | `deploy.cron.failed` |
| subrequest-limit | `subrequest.started` | `subrequest.fetch` | `edge_function.fetch` | `deploy.fetch.started` |
| subrequest-limit | `subrequest.counted` | `subrequest.counted` | `edge_function.subrequest_counted` | `deploy.fetch.counted` |
| subrequest-limit | `subrequest.limited` | `subrequest.limit_exceeded` | `edge_function.subrequest_limited` | `deploy.fetch.limited` |
| subrequest-limit | `subrequest.completed` | `subrequest.completed` | `edge_function.fetch_completed` | `deploy.fetch.completed` |
| cpu-time-limit | `cpu.started` | `worker.cpu.started` | `edge_function.cpu_started` | `deploy.cpu.started` |
| cpu-time-limit | `cpu.budget-warning` | `worker.cpu.warning` | `edge_function.cpu_warning` | `deploy.cpu.warning` |
| cpu-time-limit | `cpu.limited` | `worker.cpu.limit_exceeded` | `edge_function.cpu_limited` | `deploy.cpu.limited` |
| cpu-time-limit | `cpu.completed` | `worker.cpu.completed` | `edge_function.cpu_completed` | `deploy.cpu.completed` |
| streaming-response | `stream.opened` | `response_stream.opened` | `edge_function.stream_opened` | `deploy.stream.opened` |
| streaming-response | `stream.chunk-sent` | `response_stream.chunk` | `edge_function.stream_chunk` | `deploy.stream.chunk` |
| streaming-response | `stream.backpressure` | `response_stream.backpressure` | `edge_function.stream_backpressure` | `deploy.stream.backpressure` |
| streaming-response | `stream.closed` | `response_stream.closed` | `edge_function.stream_closed` | `deploy.stream.closed` |

The full fidelity coverage grid is built by `collectFidelityCoverage()` from `@kiwa-test/edge/semantics/fidelity`. Downstream release-gate tests assert `rows.length === 24` (3 platforms × 8 axes) to guarantee full cross-platform coverage.

## Where each axis lands in the release gate

The 3 v1.24 dogfood apps map to the 8 axes as follows.

| Dogfood app | Axes covered | Ops |
|---|---|---|
| `dogfood-cloudflare-workers-durable-object-app` | `durable-object` + `websocket-edge` | 8 (4 + 4) |
| `dogfood-vercel-edge-function-app` | `geo-replicated` + `edge-kv` + `streaming-response` | 8 (3 + 3 + 2) |
| `dogfood-deno-deploy-geo-app` | `geo-replicated` + `edge-kv` + `cron-trigger` | 8 (3 + 2 + 3) |

The remaining 2 axes (`subrequest-limit` + `cpu-time-limit`) are exercised via the semantics unit tests under `packages/edge/tests/semantics/*.test.ts` — merchant apps rarely surface them as user-observable behaviour, but the axes stay on the fidelity grid because every platform enforces them silently in production.

## Related

- [Tutorial 42 — Cloudflare Workers Durable Object](../tutorials/42-cloudflare-durable-object)
- [Tutorial 43 — Vercel Edge streaming](../tutorials/43-vercel-edge-streaming)
- [Tutorial 44 — Deno Deploy geo](../tutorials/44-deno-deploy-geo)
- [Migration guide v1.23 → v1.24](../migrations/v1.23-to-v1.24)
- [Modern web framework testing (Signal + Islands + edge runtime SSOT)](./modern-web-framework-testing)
