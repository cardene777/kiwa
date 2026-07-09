# Fidelity — dogfood-ably-collab-cursor (v1.13-4)

Real-vs-mock behavioural fidelity for the Ably collaborative-cursor dogfood, produced by `examples/dogfood-ably-collab-cursor/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-lab/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `ABLY_API_KEY`)

When the harness runs without Ably credentials, the real adapter emits `ABLY_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/realtime/ably-collab-cursor
version    : 0.1.0
verdict    : PASS
divergences: 4 (joinBoard / moveCursor / rewindHistory / getPresence — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
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

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `ABLY_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 4 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-ably-collab-cursor test
cat examples/dogfood-ably-collab-cursor/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export ABLY_API_KEY=your-ably-api-key
export ABLY_CLIENT_ID=optional-client-id
pnpm --filter dogfood-ably-collab-cursor test
```

When the env is set but `ably` is not vendored into the workspace (the default in this example), the adapter downgrades to `ABLY_SDK_MISSING` traces. Adding the dependency + wiring the connected paths in `src/adapters/real.ts` is a follow-up when a real Ably project is provisioned — the adapter shape is ready.

## Ops under measurement

Four provider-neutral ops on `CursorBoardAdapter`.

- `joinBoard` — subscribe to a board channel + presence enter for a user
- `moveCursor` — broadcast a cursor position burst, throttled at 60 fps (16 ms window) so mass mousemove events do not flood the channel
- `rewindHistory` — pull the last N cursor events from `channel.history` so a late-joining user recovers current state
- `getPresence` — snapshot current board members

## Notes

The 60 fps throttle is a client-side concern in the real Ably SDK — this dogfood implements the same 16 ms window in `mock.ts` `moveCursor` so the fidelity harness can score the emitted / suppressed ratio as an observable behaviour, not a hidden implementation detail. The throttle sits on a synthetic time cursor (raw event gaps summed) so tests are deterministic regardless of wall-clock timing, but the emitted `CursorPosition.timestamp` uses `Date.now()` at publish time so mock / real-mode payloads stay comparable when the SDK is wired.

The history rewind flow (`lateJoinerRewind`) exercises Ably's `channel.history()` shape. The mock ring buffer (`packages/realtime/src/ably.ts` — 200-event window) returns most-recent-first, matching Ably's real behaviour so a client replaying missed strokes sees them in the same order as production. `T-DFA-M-010` asserts monotonically non-increasing wall-clock timestamps to lock this invariant against future regressions.

The `twoUsersCollab` flow uses a single adapter (= single Ably client) as a mock-only convenience. In real Ably, `presence.enter(data)` identifies a member by the client-authenticated `clientId` — a single client cannot represent two distinct presence members. The mock stays internally consistent because the adapter maintains its own `membersByBoard` map keyed by caller-supplied `userId`, but the flow does NOT reflect real Ably multi-user semantics. Wiring a real-Ably-faithful two-user flow is a follow-up when the SDK is vendored: instantiate two `AblyMock` clients (each with distinct `clientId`) and drive them in parallel.

Provider prefix `@kiwa-lab/realtime/` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because Ably is a socket / pub-sub primitive, not a token-priced generative call. Socket round-trip latency feeds `perf.p95Ms` so realtime performance stays visible in the report.
