# dogfood-cloudflare-workers-durable-object-app

Dogfood app v1.24-2 — a Cloudflare Workers Durable Object realtime chat room app that exercises the `durable-object` + `websocket-edge` axes of `@kiwa/edge` v0.2 end-to-end. Drivable in both `KIWA_MODE=real` (Miniflare + `wrangler dev` + `WRANGLER_KEY=1` env-gate) and `KIWA_MODE=mock` (`@kiwa/edge` v0.2 8 axis semantics) so behavioural fidelity feeds the release gate 7 axis.

Sub-Issue #915, land-order 2/6 in the v1.24 milestone.

## Two run modes

- `KIWA_MODE=real` — Miniflare v3 + `wrangler dev` behind `WRANGLER_KEY=1` env-gate. Runs a real Durable Object + WebSocket + storage stack against a local miniflare workerd. Skipped when the environment cannot reach a working miniflare (no `WRANGLER_KEY=1`, no miniflare install, no local port).
- `KIWA_MODE=mock` — `@kiwa/edge` v0.2 `createDurableObject` / `requestDurableObject` / `fireAlarm` / `writeStorage` / `requestWebSocketUpgrade` / `acceptWebSocket` / `sendMessage` / `closeWebSocket` deterministic mocks. Always runs.

`makeMockAdapter` (`src/lib/mock.ts`) drives the mock path; `makeRealAdapter` (`src/lib/real.ts`) drives the real path or falls back to the env-gate skip.

## 8-op surface = durable-object 4 + websocket-edge 4

| op | axis | neutral events emitted |
|---|---|---|
| `driveRoomJoin` | durable-object | `durable-object.created` (first join) + `durable-object.requested` |
| `driveRoomBroadcast` | durable-object + websocket-edge | `durable-object.storage-written` + `websocket.message` |
| `driveStorageTx` | durable-object | `durable-object.storage-written` (rollback restores pre-tx state) |
| `driveAlarmPurge` | durable-object | `durable-object.alarm-fired` (24-h retention purge) |
| `driveWsUpgrade` | websocket-edge | `websocket.upgrade-requested` + `websocket.accepted` |
| `driveWsSend` | websocket-edge | `websocket.message` |
| `driveWsClose` | websocket-edge | `websocket.closed` |
| `driveWsHibernation` | websocket-edge + durable-object | drops members, closes 1006, emits `durable-object.requested` on wake-up |

The 8 ops feed the fidelity harness (`src/lib/fidelity.ts`) which diffs mock-vs-real traces, computes the 7-axis release gate verdict, and emits a JSON + markdown report under `quality-report/`.

## Layout

```
src/
  workers/
    chat-room.ts    — ChatRoomRegistry: per-room state + DO axis session wiring
    index.ts        — dispatchToRoom (5 route paths) + WebSocketRegistry
  alarm/
    purge.ts        — 24-h retention alarm (runPurgeAlarm)
  lib/
    cf-adapter.ts   — CloudflareDurableObjectAdapter interface (8 ops)
    mock.ts         — makeMockAdapter (backed by @kiwa/edge v0.2 semantics)
    real.ts         — makeRealAdapter (env-gate skip via KIWA_MODE + WRANGLER_KEY)
    fidelity.ts     — runFidelityHarness + runAdapterMatrix
tests/
  chat-room-e2e.spec.ts             — durable-object axis end-to-end
  storage-transactional-e2e.spec.ts — storage-written + rollback + alarm purge
  websocket-hibernation-e2e.spec.ts — websocket-edge axis + hibernation
  fidelity-report.test.ts           — harness contract
  emit-fidelity-report.test.ts      — emit JSON + markdown to quality-report/
```

## Reproduction

Mock-only (default local dev):

```bash
pnpm --filter dogfood-cloudflare-workers-durable-object-app test
cat examples/dogfood-cloudflare-workers-durable-object-app/quality-report/fidelity-latest.md
```

Real Miniflare (env-gated):

```bash
export KIWA_MODE=real
export WRANGLER_KEY=1
pnpm --filter dogfood-cloudflare-workers-durable-object-app test
# The v1.24-2 dogfood ships the env-gate skip path only; a follow-up
# lands the miniflare driver behind the same env gate.
```

## Refs

- Parent — v1.24 (#913)
- Sub-Issue — v1.24-2 (#915)
- Depends on — v1.24-1 (@kiwa/edge v1.1.0 = v0.2 with 8 axis semantics, PR #920)
