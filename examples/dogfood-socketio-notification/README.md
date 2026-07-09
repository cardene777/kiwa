# dogfood-socketio-notification

Dogfood app 3 (v1.13-5) — a Socket.io / SSE notification app that exercises **server-to-client push + room-scoped delivery + reconnect + pending event replay + queue-overflow backpressure** across a provider-neutral interface so `@kiwa-lab/realtime`'s Socket.io mock can be measured against a real Socket.io / SSE call. The resulting fidelity report feeds `@kiwa-lab/quality-metrics` release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-lab/realtime` `createSocketioMock`, deterministic broadcast + room + reconnect + backpressure engine)
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that would talk to `socket.io-client` (or the SSE endpoint) when `SOCKETIO_URL` is set. When the variable is missing the adapter reports each method as `SOCKETIO_ENV_MISSING` so the fidelity harness records the gap without failing the test suite. When the env is set but the SDK is not installed (the default in this workspace, which does not vendor `socket.io-client`), the adapter downgrades to `SOCKETIO_SDK_MISSING` — the same harness path, one level closer to real IO.

Real-mode envs.

- `SOCKETIO_URL` — required to enable real mode (e.g. `http://localhost:3000`)
- `SOCKETIO_NAMESPACE` — optional, defaults to `/notify`
- `SOCKETIO_TRANSPORT` — optional, `socketio` (default) or `sse` to switch to the SSE endpoint at `{SOCKETIO_URL}/notify/sse`

## Layout

```
src/
  adapters/
    interface.ts       -- provider-neutral notification service contract
                          (subscribeRoom / deliverNotification /
                           simulateReconnect / getPending)
    mock.ts            -- kiwa mock adapter (createSocketioMock backend)
    real.ts            -- Socket.io / SSE adapter with graceful skip when
                          env / SDK absent
  flows/
    notification-flows.ts -- subscribe + deliver / multi-room / reconnect
                             + pending replay / backpressure overflow
    fidelity.ts           -- trace-diffing harness that feeds
                             @kiwa-lab/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- 10 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
```

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/realtime/socketio-notification.md` when they become canonical for a release.

## Release gate (7 axes)

Because the provider string is `@kiwa-lab/realtime/socketio-notification`, `evaluateReleaseGate` runs the common 7-axis branch. The AI-LLM 4 axes (cost per request / p95 latency / total tokens / accuracy) do not apply — Socket.io / SSE is a socket / pub-sub primitive, not a token-priced generative surface. Socket round-trip latency still feeds `perf.p95Ms` so the realtime performance axis stays visible in the report.

- `coverage.line` ≥ 85%
- `coverage.branch` ≥ 80%
- `coverage.function` ≥ 90%
- `fidelity.ratio` ≥ 70%
- `perf.p95Ms` ≤ 100 ms (mock socket round-trip)
- `mutation.killRate` ≥ 60%
- `testCount.behavior` ≥ 10

## Ops under measurement

Four provider-neutral ops on `NotificationAdapter`.

- `subscribeRoom(input)` — join a namespace + room and register a notification handler
- `deliverNotification(input)` — server-side push a notification to a room. Notifications sent while the client is disconnected are buffered until the next `simulateReconnect` flushes them (or dropped on backpressure overflow)
- `simulateReconnect()` — reconnect the client, flushing the pending event queue in FIFO order. Overflows counted against the backpressure limit
- `getPending(input)` — snapshot the pending queue depth + dropped count for a room. Used to assert backpressure overflow deterministically

The mock adapter also exposes a test-only `disconnectClient()` method so the fidelity harness can prime the offline queue without a real network drop. The real adapter does not expose this method — real-mode offline is driven by dropping the socket at the network level.

## Related

- v1.13-2 `@kiwa-lab/realtime` v0.1 (`packages/realtime/`)
- v1.13-3 `dogfood-supabase-realtime-chat` (`examples/dogfood-supabase-realtime-chat/`) — sibling dogfood for broadcast + presence + typing debounce
- v1.13-4 `dogfood-ably-collab-cursor` (`examples/dogfood-ably-collab-cursor/`) — sibling dogfood for cursor broadcast + throttle + history rewind
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.13 milestone parent [#709](https://github.com/cardene777/kiwa/issues/709), this sub [#713](https://github.com/cardene777/kiwa/issues/713)
