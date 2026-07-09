# Realtime testing — time axis mocks, event ordering, drop, reconnect, backpressure

kiwa's provider mocks up to v1.12 all shared a request/response shape — the caller issues one call, the mock returns one reply. Auth mocks answer `signIn` synchronously. AI-LLM mocks answer `messages.create` after a bounded delay. RAG mocks answer `embed(...)` and `generateText(...)` on demand. Even the AI-LLM streaming path is still a caller-initiated pull — `for await (const chunk of stream)` drains at the caller's pace.

Realtime providers (Supabase Realtime, Ably, Pusher, Socket.io / SSE) break this shape. The **server pushes**, the client can be **disconnected** while the server keeps pushing, the pushes are **timed** and their **order matters**, and buffered messages can **overflow**. v1.13 is designed to absorb this second axis of non-triviality — time.

## What "time axis mock" actually means

The v1.11 gate cared about outputs — did the mock return the right value? The v1.12 gate cared about outputs + a scalar drift — did the mock's cost / latency / token / accuracy stay close enough to real? The v1.13 gate cares about outputs + a **sequence** — did the mock's *event stream* stay close enough to real's *event stream*, measured on 5 axes.

The v1.13 mocks do not open a real socket. Instead, they simulate the socket by **emitting scenario events on a virtual timeline**. `createSupabaseRealtimeMock` accepts `scenarios: { 'room:1': [{ kind: 'broadcast', event: 'chat', payload: {...}, delay: 10 }, ...] }` — a per-channel array of events keyed by a virtual `delay` field. Subscription attaches a handler; the engine walks the array; each event fires after its `delay` ms elapses (or immediately when `delay` is 0).

The 4 provider mocks (`createSupabaseRealtimeMock` / `createAblyMock` / `createPusherMock` / `createSocketioMock`) all sit on top of one **engine** (`packages/realtime/src/engine.ts`) that owns the timeline, per-channel handler chains, and the pending-event queue. Provider adapters translate SDK-shaped calls (`supabase.channel().on('broadcast', ...)`, `ably.channels.get().subscribe(...)`, `pusher.subscribeChannel(...)`, `io.of().to().emit(...)`) into engine-level primitives (`subscribe(channel, handler)`, `publish(channel, event, payload)`).

Because there is no real socket, tests can assert on:

- **The exact number of events delivered per channel** — real Supabase / Ably / Pusher / Socket.io does not expose this cleanly.
- **The exact ordering of events across channels** — hard to observe with real sockets under jitter.
- **The exact number of events dropped by backpressure** — real servers surface this as vague `disconnect` events at best.
- **The exact number of reconnect attempts** — real backoff is opaque.

The trade-off is that the mock's timeline is **discrete + synchronous** (event `n` fires exactly `sum(delay[0..n])` ms after subscribe, with no jitter) while real sockets have jitter, batching, and Nagle-style micro-delays. The fidelity harness measures how far the real stream drifts from the mock stream, per axis.

## Why v1.11 + v1.12 gates alone are not enough

The v1.11 gate measures test suite properties (coverage / test count / fidelity ratio / perf p95 / mutation kill rate). The v1.12 gate adds AI-LLM properties (cost / latency / token / accuracy). All 11 axes are **scalar** — one number per axis per report.

Realtime failures are not scalar. A chat app can pass all 11 axes and still be broken in production because:

| Realtime failure | Passes 11-axis gate? | Why |
|---|---|---|
| Messages arrive in wrong order under presence sync | Yes | Ordering is a property of the *sequence*, not a scalar |
| Presence roll-up loses a member after a reconnect | Yes | Presence-count assertions are point-in-time, not time-series |
| Server pushes 1k events while client is offline, 800 are silently dropped | Yes | Drop counts are provider-internal; the 11 axes never see them |
| Two rooms cross-leak (room A payload reaches room B subscriber) | Yes | Routing correctness is a sequence property |
| Reconnect happens but pending queue is never flushed | Yes | Queue flush is a control-plane event, not a data-plane count |

The v1.13 axes measure the *sequence* directly. Same-shape reports still feed `evaluateReleaseGate` — realtime providers stay on the common 7-axis branch — but the **fidelity axis** for realtime is computed by `runRealtimeFidelityCheck` on the sequence, not the surface method ratio, and the **perf axis** measures socket round-trip latency rather than one-shot API latency.

## The 5 primary axes

The v1.13 mocks and fidelity harness measure 5 time-axis semantics, tracked per scenario in `RealtimeFidelityRecord`.

| Axis | What it measures | Provider surface |
|---|---|---|
| **Order** | `kind` sequence Jaccard between real vs mock event streams | Every broadcast + presence + postgres_changes event, in the order emitted |
| **Timing** | `totalDurationDiffMs` — cumulative wall-clock drift across the scenario | Real sockets have jitter; mock timelines are discrete — the drift number surfaces the gap |
| **Drop** | `eventsDropped` from mock metrics + `droppedByBackpressure` from adapter reports | Server-side buffer overflow; client-side backpressure limit |
| **Reconnect** | `reconnectCount` + pending-queue flush behaviour on reconnect | Exponential backoff, jitter, `maxAttempts`, pending-event replay |
| **Backpressure** | `pendingByRoom.queuedCount` — how many events queued while offline before overflow | Per-room pending queue with configurable `backpressureLimit` (default `Infinity`, `8` in the socketio dogfood) |

The 5 axes are not thresholds on individual scalars. They are properties of the *event trace* the mock records — a `RealtimeMetrics` snapshot exposes 7 numbers per axis (`subscribeCount`, `publishCount`, `eventsDelivered`, `eventsDropped`, `reconnectCount`, `subscribeLatencyMs[]`, `publishLatencyMs[]`), and the fidelity harness diff produces `kindOrderMatch`, `payloadMatch`, and `accuracyScore` per scenario.

## Concept 1 — presence + broadcast + postgres_changes as one union

The 4 providers surface presence, broadcast, and DB CDC events with different names but the same underlying shape.

| Provider | Presence | Broadcast | Postgres-change |
|---|---|---|---|
| Supabase Realtime | `channel.on('presence', { event: 'sync' \| 'join' \| 'leave' }, ...)` | `channel.on('broadcast', { event }, ...)` + `channel.send(...)` | `channel.on('postgres_changes', filter, ...)` |
| Ably | `channel.presence.enter / leave / subscribe` | `channel.publish(event, data)` / `channel.subscribe(event, ...)` | (not native — broadcast + custom payload convention) |
| Pusher | `presence-<name>` channels + `pusher:subscription_succeeded / member_added / member_removed` | `channel.bind(event, ...)` + server-side trigger | (not native — same as Ably) |
| Socket.io | Custom (per-room member Map) | `io.of(ns).to(room).emit(event, payload)` + `socket.on(event, ...)` | (not native) |

The v1.13 mock engine normalises the union into a `RealtimeAnyEvent` type:

```ts
export type RealtimeAnyEvent =
  | ({ kind: 'presence' } & PresenceEvent)
  | ({ kind: 'broadcast' } & BroadcastEvent)
  | ({ kind: 'postgres_changes' } & PostgresChangeEvent)
  | { kind: 'connection'; state: ConnectionState; timestamp: number };
```

Provider adapters own the surface mapping — the mock engine owns the union. This is why one `RealtimeFidelityRecord` shape covers all 4 providers.

## Concept 2 — timeline as scenarios (not real clock)

The mock does not use `Date.now()` for scenario emission. It uses a **virtual timeline** driven by `delay` fields inside `RealtimeMockConfig.scenarios`:

```ts
const supabase = createSupabaseRealtimeMock({
  scenarios: {
    'room:1': [
      { kind: 'broadcast', event: 'chat', payload: { text: 'hello' }, delay: 10 },
      { kind: 'broadcast', event: 'chat', payload: { text: 'world' }, delay: 20 },
      { kind: 'presence', type: 'leave', members: [], delay: 5 },
    ],
  },
});
```

Subscribe → event 0 fires 10 ms later → event 1 fires 20 ms after event 0 → event 2 fires 5 ms after event 1. Total scenario duration is the sum of `delay` values (35 ms). Tests can `await` a fixed number of events or use `getMetrics().eventsDelivered` to synchronise.

Why virtual not real? Two reasons:

- **Determinism** — `Date.now()` on CI can slew mid-test (NTP correction, GC pause). A virtual timeline is bit-exact across runs.
- **Speed** — the mock's `artificialLatencyMs` field (default `5` ms) is the *only* wall-clock delay per subscribe / publish. A 100-event scenario at 20 ms virtual gaps completes in ~500 ms wall-clock, not 2 s.

The `perf.p95Ms` axis on the release gate uses `publishLatencyMs[]` samples (mock's wall-clock time from `publish` to subscriber-side receipt), not the virtual `delay`. The virtual timeline is a *test-time* construct — production would be measured by real socket round-trip.

## Concept 3 — reconnect policy as a first-class field

Every real provider ships an exponential-backoff reconnect implementation. The 4 provider mocks share one `ReconnectPolicy` type — 5 optional fields with sensible defaults:

```ts
export interface ReconnectPolicy {
  maxAttempts?: number;         // default 5
  initialBackoffMs?: number;    // default 100
  maxBackoffMs?: number;        // default 5000
  backoffMultiplier?: number;   // default 2
  jitter?: number;              // default 0.1 (0-1 fraction)
}
```

Tests can override the policy per mock to force fast reconnect (`initialBackoffMs: 1, maxAttempts: 2`) or realistic reconnect (`initialBackoffMs: 100, maxAttempts: 5`) without touching adapter code. The `disconnect()` + `reconnect()` methods on `RealtimeMock` are test-only handles — real adapters do not expose them because real disconnects are driven by the network layer.

The dogfood-socketio-notification app exposes an extra `disconnectClient()` method on the mock adapter (see [`examples/dogfood-socketio-notification/src/adapters/mock.ts:69`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/mock.ts)) so the fidelity harness can prime the offline queue without a real network drop. This is the pattern for any realtime dogfood — the mock adapter's surface is a *superset* of the real adapter's surface, and the extra methods are the ones the fidelity harness needs to reproduce time-axis scenarios.

## Concept 4 — backpressure as bounded queue overflow

Realtime servers cannot buffer forever. Every real provider drops the client (or messages) after a bounded queue overflows. The v1.13 mock engine expresses this as `backpressureLimit` on `RealtimeMockConfig`:

```ts
const socketio = createSocketioMock({ backpressureLimit: 8 });
// While disconnected, events 1..8 queue; event 9 is dropped and counted in
// eventsDropped. On reconnect, events 1..8 replay in FIFO order; the drop
// count stays.
```

Default is `Infinity` (no drop). Provider adapters implement per-room pending queues (see [`examples/dogfood-socketio-notification/src/adapters/mock.ts:100-108`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/mock.ts)) so tests can assert the exact drop count deterministically.

Why not model this as a scalar threshold on the release gate? Because the *correct* drop count is scenario-specific. A chat app with 8-message backpressure limit expects 0 drops in a 5-message scenario and 4 drops in a 12-message burst — the same "correct" behaviour, two different scalar outcomes. The gate measures the *drift* between real vs mock drop counts (via the fidelity harness), not an absolute count.

## Provider difference table

Each provider has semantics the others do not. The v1.13 harness covers all four via provider-neutral scenarios; the table below documents where provider surfaces diverge so adapter authors know what to translate.

| Semantic | Supabase Realtime | Ably | Pusher | Socket.io |
|---|---|---|---|---|
| Subscribe primitive | `channel.subscribe()` | `channel.subscribe(event, handler)` | `channel.bind(event, handler)` | `socket.on(event, handler)` |
| Broadcast primitive | `channel.send({ type: 'broadcast', event, payload })` | `channel.publish(event, data)` | Server-side `trigger(channel, event, data)` | `socket.emit(event, payload)` / `io.of(ns).to(room).emit(...)` |
| Presence surface | `channel.on('presence', ...)` + `channel.track()` | `channel.presence.enter / leave / subscribe` | `presence-<name>` prefix + `pusher:member_added / removed` | Custom (per-room member Map) |
| History rewind | Not native (persisted separately) | `channel.history({ limit })` — last N in reverse order | Not native | Not native |
| Postgres CDC | `channel.on('postgres_changes', filter, ...)` | Broadcast + custom payload | Broadcast + custom payload | Broadcast + custom payload |
| Namespace + room | Single channel string (`room:demo`) | Single channel string (`board-1`) | Single channel string (`chat-general`) | 2-level (`/notify` + `alerts:userId`) |
| Reconnect backoff | Client SDK default | Client SDK default | Client SDK default | Configurable in `io()` opts |
| Client-side throttle | Not native (app responsibility) | Not native (app responsibility) | Not native (app responsibility) | Not native (app responsibility) |
| Client-side debounce | Not native (app responsibility) | Not native (app responsibility) | Not native (app responsibility) | Not native (app responsibility) |

Two rows repeat "app responsibility" — client-side throttle (60 fps mousemove) and client-side debounce (500 ms typing) are not built into any of the 4 providers. The v1.13 dogfood apps show the pattern for the app layer to own these:

- Chat (`dogfood-supabase-realtime-chat`) — 500 ms typing debounce in `sendTyping` ([`src/adapters/mock.ts:129-155`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-supabase-realtime-chat/src/adapters/mock.ts))
- Cursor (`dogfood-ably-collab-cursor`) — 60 fps mousemove throttle in `moveCursor` ([`src/adapters/mock.ts:92-135`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-ably-collab-cursor/src/adapters/mock.ts))
- Notification (`dogfood-socketio-notification`) — backpressure-aware buffering in `deliverNotification` ([`src/adapters/mock.ts:164-223`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-socketio-notification/src/adapters/mock.ts))

## Test strategy — deterministic mock, sequence assertion

Realtime tests do not assert "mock returned X" against real. They assert two things:

- **Shape-level, on the mock side** — event counts, ordering, presence roll-up, backpressure drop counts are exact integers when driven by the mock. Every v1.13 dogfood test uses this — see [`examples/dogfood-supabase-realtime-chat/tests/e2e-mock-mode.test.ts:39-46`](https://github.com/cardene777/kiwa/blob/main/examples/dogfood-supabase-realtime-chat/tests/e2e-mock-mode.test.ts) for the debounce assertion (`emittedCount === 2` for 11 keystrokes at 50 ms).
- **Sequence-level, on the fidelity side** — the mock's event trace and the real's event trace are diffed per scenario. `kindOrderMatch` and `payloadMatch` land in `RealtimeFidelityRecord`, `avgAccuracyScore` lands in `RealtimeFidelityReport.summary`, and `buildRealtimeReport` maps that onto the release gate's fidelity axis.

The pattern is the same across the 3 dogfood apps:

```ts
// Mock-side, deterministic
it('debounces 11 keystrokes at 50ms to 2 emitted events', async () => {
  const adapter = makeMockAdapter();
  const result = await burstTyping(adapter);
  expect(result.typing.emittedCount).toBe(2);
  expect(result.typing.suppressedCount).toBe(9);
});

// Fidelity-side, real-vs-mock drift
it('emits fidelity report ready for the release gate', async () => {
  const report = await runRealtimeFidelityCheck({
    realDriver,
    mockDriver,
    scenarios: ['chat-message-broadcast', 'presence-join-leave', 'reconnect-with-pending'],
  });
  expect(report.summary.avgAccuracyScore).toBeGreaterThan(0.80);
});
```

The 0.80 accuracy floor is the same "meaningfully similar" bar the v1.12 AI-LLM concept doc landed on — a sequence Jaccard of 0.80 means the mock's event kind trace shares 80% of positions with the real event kind trace. Below that, the mock is drifting far enough that a v1.13 test written against the mock will not tell you much about production behaviour.

## Where the pieces live in code

- **Engine (timeline + queue)** — [`packages/realtime/src/engine.ts`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/engine.ts)
- **Provider adapters** — [`packages/realtime/src/supabase.ts`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/supabase.ts) + `ably.ts` + `pusher.ts` + `socketio.ts`
- **Union types (5 semantics SSOT)** — [`packages/realtime/src/types.ts`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts)
- **Fidelity harness** — [`packages/realtime/src/fidelity.ts`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/fidelity.ts) `runRealtimeFidelityCheck`
- **Quality-metrics adapter** — [`packages/realtime/src/report.ts`](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/report.ts) `buildRealtimeReport`

## When to use realtime tests

Rules of thumb.

- **Use realtime tests if** your app opens a socket (Supabase Realtime, Ably, Pusher, Socket.io, SSE) and its correctness depends on event ordering, presence roll-up, reconnect replay, or backpressure. All 3 v1.13 dogfood apps fit this shape.
- **Skip realtime tests if** your app polls a REST endpoint on an interval. Polling is a scalar problem — the v1.11 fidelity axis (mock method coverage) is enough.
- **Skip realtime tests for pure request/response WebSocket RPC** — if you use a socket only as a transport for req/res, model it as an API mock (v1.11) with a socket-shaped surface. The realtime axes measure *event streams*, not *RPC transports*.

## What is deliberately not in scope for v1.13

- **Persistence + rewind for all providers** — only Ably ships a native `history({ limit })` primitive. Supabase / Pusher / Socket.io rewind is a broadcast + persistence layer combined — the v1.13 mocks do not simulate the persistence layer. If your app relies on rewind past a reconnect on Supabase, model it as an application-level concern (e.g. a `getLastN` REST endpoint) and test that separately.
- **Cross-server (Redis adapter) semantics for Socket.io** — the mock is single-process. If your production runs multi-instance Socket.io with the Redis adapter, the mock's ordering guarantees hold *per instance* only. Cross-instance ordering is an integration-test concern.
- **Time-warp beyond scenario `delay`** — the mock does not expose a `vi.useFakeTimers()`-style time jump. Tests that need to simulate "3 hours pass while offline" should either use a real fake-timer library at the adapter layer or drive the scenario with a large `delay` value.
- **End-to-end latency under real network jitter** — the mock's timeline is discrete. Real-world latency percentiles need a real socket in a QA environment; the mock's `publishLatencyMs[]` samples measure only the mock's internal path.

## Reading list

- [Realtime chat tutorial](../tutorials/09-supabase-realtime-chat) — hands-on with `createSupabaseRealtimeMock`
- [Collab cursor tutorial](../tutorials/10-ably-collab-cursor) — hands-on with `createAblyMock`
- [Notification tutorial](../tutorials/11-socketio-notification) — hands-on with `createSocketioMock`
- [Migration v1.12 → v1.13](../migrations/v1.12-to-v1.13) — how to adopt the realtime harness
- [`@kiwa-lab/realtime` README](https://github.com/cardene777/kiwa/blob/main/packages/realtime/README.md) — full API reference for the 4 mocks + fidelity harness
- [AI-LLM testing concept guide](./ai-llm-testing) — sibling SSOT for the AI-LLM axes (v1.12)
- [Release gate SSOT](../quality/release-gate) — thresholds + overrides + how the gate is wired

## Takeaways

- Realtime is a time-axis mock problem. Request/response mocks (v1.11 + v1.12) do not model event streams; v1.13 does.
- The v1.13 mocks share one engine (`packages/realtime/src/engine.ts`) with 4 provider adapters that translate SDK surfaces into engine primitives. The union type `RealtimeAnyEvent` is the SSOT for the 3 event kinds.
- 5 primary axes — order, timing, drop, reconnect, backpressure — capture what scalar gates miss. All 5 land in `RealtimeFidelityRecord` per scenario; `RealtimeFidelityReport.summary.avgAccuracyScore` feeds the release gate.
- Client-side throttle + debounce is *not* in any of the 4 providers — the app layer owns them. The v1.13 dogfood apps show 3 canonical implementations (500 ms typing debounce, 60 fps mousemove throttle, backpressure-aware notification buffering).
- v1.13 is the realtime infrastructure; v1.14+ will build on it (real socket integration, persistence layer mocks, multi-instance Socket.io + Redis adapter simulation).
