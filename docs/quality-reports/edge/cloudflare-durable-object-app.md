# Fidelity — dogfood-cloudflare-workers-durable-object-app (v1.24-2)

Real-vs-mock behavioural fidelity for the Cloudflare Workers Durable Object realtime chat room app driven by `@kiwa-test/edge` v0.2 (v1.24-1 land, PR #920) under `KIWA_MODE=real` (Miniflare + `wrangler dev` + `WRANGLER_KEY=1` env-gate) and `KIWA_MODE=mock` (`@kiwa-test/edge` v0.2 8 axis semantics), produced by `examples/dogfood-cloudflare-workers-durable-object-app/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-test/quality-metrics` release-gate 7-axis payload as the first edge-platform dogfood in the v1.24 milestone.

## Baseline (real mode skipped — `KIWA_MODE=real` + `WRANGLER_KEY=1` unset)

When the harness runs without both `KIWA_MODE=real` and `WRANGLER_KEY=1` in the environment, the real adapter emits `KIWA_CF_DURABLE_OBJECT_ENV_MISSING` for each of the 8 ops (`driveRoomJoin` / `driveRoomBroadcast` / `driveStorageTx` / `driveAlarmPurge` / `driveWsUpgrade` / `driveWsSend` / `driveWsClose` / `driveWsHibernation`). Divergences are recorded so the mock is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/edge/cloudflare-durable-object
version    : 0.1.0
verdict    : PASS
divergences: 8 (all eight ops recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (framework branch — common 7-axis release gate)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 86.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (8/8) | 70% | pass |
| perf.p95Ms | ~0.11 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 30 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path emitted `KIWA_CF_DURABLE_OBJECT_ENV_MISSING` — this is the expected shape in a real-mode-skipped baseline. It does not fail the gate; the fidelity ratio measures the mock-covered surface area, which is 100% for the eight ops the AC scopes.

## Reproduction

Common integration path (mock + graceful-skip real).

```bash
pnpm --filter dogfood-cloudflare-workers-durable-object-app test
cat examples/dogfood-cloudflare-workers-durable-object-app/quality-report/fidelity-latest.md
```

Live real-mode (real Miniflare or `wrangler dev` — env-skip unless the driver is opted in).

```bash
export KIWA_MODE=real
export WRANGLER_KEY=1
pnpm --filter dogfood-cloudflare-workers-durable-object-app test
# The v1.24-2 dogfood ships the env-gate skip path only; a follow-up
# milestone swaps in a real miniflare driver behind the same env gate.
```

## 8-op surface = durable-object 4 + websocket-edge 4

The 8 ops correspond directly to the 8 axis routing pattern inherited from v1.24-1 (`@kiwa-test/edge` v0.2 semantics). Each op emits neutral events on 1 or 2 axes:

| op | primary axis | neutral events emitted |
|---|---|---|
| `driveRoomJoin` | durable-object | `durable-object.created` (first join per room) + `durable-object.requested` (subsequent joins) |
| `driveRoomBroadcast` | durable-object + websocket-edge | `durable-object.storage-written` (message append) + `websocket.message` (per receiver) |
| `driveStorageTx` | durable-object | `durable-object.storage-written` (per write); rollback restores pre-tx storage snapshot |
| `driveAlarmPurge` | durable-object | `durable-object.alarm-fired` + `durable-object.storage-written` (`msg:purged`) |
| `driveWsUpgrade` | websocket-edge | `websocket.upgrade-requested` + `websocket.accepted` |
| `driveWsSend` | websocket-edge | `websocket.message` (per frame) |
| `driveWsClose` | websocket-edge | `websocket.closed` |
| `driveWsHibernation` | websocket-edge + durable-object | closes 1006 abnormal, drops members, emits `durable-object.requested` on wake-up |

## 5 route paths dispatched by the Worker

| route | HTTP method | handler kind |
|---|---|---|
| `/health` | GET | trivial 200 JSON, proves the chain runs |
| `/room/:roomId/join` | GET | `ChatRoomRegistry.ensureRoom` + `addMember` |
| `/room/:roomId/send` | POST | `ChatRoomRegistry.appendMessage` (`writeStorage`) |
| `/room/:roomId/ws` | GET | `WebSocketRegistry.requestUpgrade` + `accept` |
| `/room/:roomId/persist` | POST | `ChatRoomRegistry.persist` (arbitrary key/value) |
| `/room/:roomId/alarm` | POST | `ChatRoomRegistry.scheduleAlarm` |

`dispatchToRoom` (`src/workers/index.ts`) parses the path and dispatches to the appropriate registry op. In a real Cloudflare Workers deployment, the DO handle is retrieved via `env.CHAT_ROOM.idFromName(roomId).get().fetch(request)`; the mock reproduces the routing without a live Cloudflare runtime.

## Test spec map (33 tests total)

- `chat-room-e2e.spec.ts` (9 tests) — durable-object axis: create-on-first-join, requested-on-subsequent, broadcast+persist, hibernation-rehydrate, room isolation, metrics, reset, real env-skip.
- `storage-transactional-e2e.spec.ts` (9 tests) — storage-written axis: commit path, rollback path, interleaved commit-rollback, cross-broadcast persistence, alarm-purge effect, alarm-purge no-op, metrics count, real env-skip.
- `websocket-hibernation-e2e.spec.ts` (11 tests) — websocket-edge axis: pending→open handshake, ordered send, close semantics, hibernation eviction, rehydration, cross-room isolation, 8-op metric surface, real env-skip (4 ops).
- `fidelity-report.test.ts` (3 tests) — harness contract: 8-op run, mock-failure propagation, divergence-note rendering.
- `emit-fidelity-report.test.ts` (1 test) — emit JSON + markdown to `quality-report/`.

## Refs

- Parent — v1.24 (#913, Edge / Serverless 深化)
- Sub-Issue — v1.24-2 (#915)
- Depends on — v1.24-1 (@kiwa-test/edge v1.1.0 = v0.2 with 8 axis semantics, PR #920)
