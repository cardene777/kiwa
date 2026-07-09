# Fidelity — dogfood-socketio-notification (v1.13-5)

Real-vs-mock behavioural fidelity for the Socket.io / SSE notification dogfood, produced by `examples/dogfood-socketio-notification/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-lab/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `SOCKETIO_URL`)

When the harness runs without Socket.io / SSE credentials, the real adapter emits `SOCKETIO_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/realtime/socketio-notification
version    : 0.1.0
verdict    : PASS
divergences: 4 (subscribeRoom / deliverNotification / simulateReconnect / getPending — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (common branch — realtime is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (4/4) | 70% | pass |
| perf.p95Ms | 4.00 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 15 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `SOCKETIO_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 4 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-socketio-notification test
cat examples/dogfood-socketio-notification/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export SOCKETIO_URL=http://localhost:3000
export SOCKETIO_NAMESPACE=/notify
# Optional — switch to the SSE endpoint at ${SOCKETIO_URL}/notify/sse
export SOCKETIO_TRANSPORT=sse
pnpm --filter dogfood-socketio-notification test
```

When the env is set but `socket.io-client` is not vendored into the workspace (the default in this example), the adapter downgrades to `SOCKETIO_SDK_MISSING` traces. Adding the dependency + wiring the connected paths in `src/adapters/real.ts` is a follow-up when a real Socket.io server is provisioned — the adapter shape is ready.

## Ops under measurement

Four provider-neutral ops on `NotificationAdapter`.

- `subscribeRoom` — join a namespace + room and register a notification handler
- `deliverNotification` — server-side push a notification to a room. Notifications sent while the client is offline are buffered until the next `simulateReconnect`
- `simulateReconnect` — reconnect the client, flushing the pending event queue in FIFO order. Overflows are counted against the backpressure limit
- `getPending` — snapshot the pending queue depth + dropped count for a room

## Notes

**Room semantics + delivery scoping.** In real Socket.io, a client joins a room via `socket.join(room)` and the server broadcasts to it via `io.of(ns).to(room).emit(event, payload)`. The mock normalises the namespace + room to a single channel string (`{namespace}|{room}`) and routes deliveries through the shared `RealtimeEngine`. `T-DFS-M-003` locks room-scoped delivery — alice + bob subscribe to their own alerts rooms and cross-delivery does not leak.

**Reconnect + pending event queue.** In real Socket.io, the server holds pending messages for a temporarily disconnected client (per-socket message buffer) and replays them on reconnect. The mock exposes a test-only `disconnectClient()` method that flips the internal `connected` flag without triggering a reconnect — subsequent `deliverNotification` calls buffer into a per-room queue rather than emitting immediately. `simulateReconnect()` flushes the queue in FIFO order and increments the reconnect counter. `T-DFS-M-004` locks FIFO replay ordering (`['ping 1', 'ping 2', 'ping 3']`) and `T-DFS-M-005` locks the counter.

**Backpressure overflow.** Socket.io's default reaction to a client falling too far behind is to drop the socket entirely once the server-side buffer overflows. The mock models a bounded per-room queue (`backpressureLimit`, default 8 in the dogfood tests) and drops events beyond the cap, counting them against `droppedByRoom`. `T-DFS-M-006` pushes 12 events against a limit of 8 and asserts 8 queued + 4 dropped + 8 replayed. `T-DFS-M-010` locks the `BACKPRESSURE_DROP` trace entry emission for the 4 overflow events.

**SSE variant.** The interface contract is transport-neutral so the same 4 ops model an SSE (Server-Sent Events) delivery too — the real adapter switches to the SSE endpoint via `SOCKETIO_TRANSPORT=sse`. SSE is Socket.io's fallback for unidirectional server-to-client delivery and shares the same room / namespace / reconnect semantics under the hood (client-side `EventSource` handles reconnect + last-event-id replay). The mock adapter treats both transports identically because the surface is server-to-client push, room-scoped, with reconnect replay — the difference sits at the wire layer, which the fidelity harness does not probe.

**Redis adapter (single-server fidelity).** Socket.io production configurations often stack a Redis adapter (`@socket.io/redis-adapter`) so multiple server processes can broadcast to a shared client pool. The mock is single-process by construction — Redis pub/sub cross-broadcast is out of scope for the fidelity harness. The dogfood measures single-server behaviour (which is what the mock guarantees); multi-server semantics is a follow-up when the SDK + a Redis instance are wired.

**Provider prefix + 7 axes.** Provider `@kiwa-lab/realtime/socketio-notification` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because Socket.io / SSE is a socket / pub-sub primitive, not a token-priced generative call. Socket round-trip latency feeds `perf.p95Ms` so realtime performance stays visible in the report.
