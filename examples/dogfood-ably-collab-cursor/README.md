# dogfood-ably-collab-cursor

Dogfood app 2 (v1.13-4) — an Ably shared-cursor board app that exercises **cursor broadcast + presence + 60 fps client-side throttle + history rewind** across a provider-neutral interface so `@kiwa-lab/realtime`'s Ably mock can be measured against a real Ably call. The resulting fidelity report feeds `@kiwa-lab/quality-metrics` release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-lab/realtime` `createAblyMock`, deterministic broadcast + presence + history rewind engine)
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that talks to `ably` when `ABLY_API_KEY` is set. When the variable is missing the adapter reports each method as `ABLY_ENV_MISSING` so the fidelity harness records the gap without failing the test suite. When the env is set but the SDK is not installed (the default in this workspace, which does not vendor `ably`), the adapter downgrades to `ABLY_SDK_MISSING` — the same harness path, one level closer to real IO.

Real-mode envs.

- `ABLY_API_KEY` — required to enable real mode
- `ABLY_CLIENT_ID` — optional, defaults to a random `client_xxxxxx`

## Layout

```
src/
  adapters/
    interface.ts       -- provider-neutral board contract
                          (joinBoard / moveCursor / rewindHistory / getPresence)
    mock.ts            -- kiwa mock adapter (createAblyMock backend)
    real.ts            -- Ably adapter with graceful skip when env / SDK absent
  flows/
    cursor-flows.ts    -- join + draw / two-user collab / burst mousemove / late-joiner rewind
    fidelity.ts        -- trace-diffing harness that feeds @kiwa-lab/quality-metrics
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

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/realtime/ably-collab-cursor.md` when they become canonical for a release.

## Release gate (7 axes)

Because the provider string is `@kiwa-lab/realtime/ably-collab-cursor`, `evaluateReleaseGate` runs the common 7-axis branch. The AI-LLM 4 axes (cost per request / p95 latency / total tokens / accuracy) do not apply — Ably is a socket / pub-sub primitive, not a token-priced generative surface. Socket round-trip latency still feeds `perf.p95Ms` so the realtime performance axis stays visible in the report.

- `coverage.line` ≥ 85%
- `coverage.branch` ≥ 80%
- `coverage.function` ≥ 90%
- `fidelity.ratio` ≥ 70%
- `perf.p95Ms` ≤ 100 ms (mock socket round-trip)
- `mutation.killRate` ≥ 60%
- `testCount.behavior` ≥ 10

## Ops under measurement

Four provider-neutral ops on `CursorBoardAdapter`.

- `joinBoard(input)` — subscribe to a board channel + presence enter for a user
- `moveCursor(input)` — broadcast a cursor position burst, throttled at 60 fps (16 ms window) so mass mousemove events do not flood the channel
- `rewindHistory(input)` — pull the last N cursor events from `channel.history` so a late-joining user recovers current state
- `getPresence(input)` — snapshot current board members

## Related

- v1.13-2 `@kiwa-lab/realtime` v0.1 (`packages/realtime/`)
- v1.13-3 `dogfood-supabase-realtime-chat` (`examples/dogfood-supabase-realtime-chat/`) — sibling dogfood with the same harness shape for Supabase Realtime
- v1.11-1 `@kiwa-lab/quality-metrics` (`packages/quality-metrics/`)
- v1.13 milestone parent [#709](https://github.com/cardene777/kiwa/issues/709), this sub [#712](https://github.com/cardene777/kiwa/issues/712)
