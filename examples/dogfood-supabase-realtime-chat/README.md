# dogfood-supabase-realtime-chat

Dogfood app 1 (v1.13-3) — a Supabase Realtime chat app that exercises **broadcast + presence + typing debounce** across a provider-neutral interface so `@kiwa-test/realtime`'s Supabase mock can be measured against a real Supabase Realtime call. The resulting fidelity report feeds `@kiwa-test/quality-metrics` release gate.

## Modes

- `KIWA_MODE=mock` (default) — driven by `makeMockAdapter()` (`@kiwa-test/realtime` `createSupabaseRealtimeMock`, deterministic broadcast + presence engine)
- `KIWA_MODE=real` — driven by `makeRealAdapter()` that talks to `@supabase/supabase-js` when `SUPABASE_URL` + `SUPABASE_ANON_KEY` are set. When either variable is missing the adapter reports each method as `SUPABASE_ENV_MISSING` so the fidelity harness records the gap without failing the test suite. When both are set but the SDK is not installed (the default in this workspace, which does not vendor `@supabase/supabase-js`), the adapter downgrades to `SUPABASE_SDK_MISSING` — the same harness path, one level closer to real IO.

Real-mode envs.

- `SUPABASE_URL` — required to enable real mode
- `SUPABASE_ANON_KEY` — required to enable real mode

## Layout

```
src/
  adapters/
    interface.ts       -- provider-neutral chat room contract
                          (joinRoom / sendMessage / getPresence / sendTyping)
    mock.ts            -- kiwa mock adapter (createSupabaseRealtimeMock backend)
    real.ts            -- Supabase adapter with graceful skip when env / SDK absent
  flows/
    chat-flows.ts      -- join + hi / two-user chat / burst typing / leave transition
    fidelity.ts        -- trace-diffing harness that feeds @kiwa-test/quality-metrics
tests/
  e2e-mock-mode.test.ts        -- 8 mock-mode e2e tests
  fidelity-report.test.ts      -- 3 harness tests
  emit-fidelity-report.test.ts -- writes the actual JSON + markdown snapshot
```

## Emit a fidelity report

```bash
pnpm test
cat quality-report/fidelity-latest.md
cat quality-report/fidelity-latest.json
```

The `quality-report/` directory is git-ignored — promote snapshots to `docs/quality-reports/realtime/supabase-realtime-chat.md` when they become canonical for a release.

## Release gate (7 axes)

Because the provider string is `@kiwa-test/realtime/supabase-realtime-chat`, `evaluateReleaseGate` runs the common 7-axis branch. The AI-LLM 4 axes (cost per request / p95 latency / total tokens / accuracy) do not apply — Supabase Realtime is a socket / pub-sub primitive, not a token-priced generative surface. Socket round-trip latency still feeds `perf.p95Ms` so the realtime performance axis stays visible in the report.

- `coverage.line` ≥ 85%
- `coverage.branch` ≥ 80%
- `coverage.function` ≥ 90%
- `fidelity.ratio` ≥ 70%
- `perf.p95Ms` ≤ 100 ms (mock socket round-trip)
- `mutation.killRate` ≥ 60%
- `testCount.behavior` ≥ 10

## Ops under measurement

Four provider-neutral ops on `ChatRoomAdapter`.

- `joinRoom(input)` — subscribe to a channel + track presence for a user
- `sendMessage(input)` — broadcast a chat message on the channel
- `getPresence(input)` — snapshot current room members
- `sendTyping(input)` — broadcast typing events, debounced at 500ms so mass keystrokes do not flood the channel

## Related

- v1.13-2 `@kiwa-test/realtime` v0.1 (`packages/realtime/`)
- v1.11-1 `@kiwa-test/quality-metrics` (`packages/quality-metrics/`)
- v1.13 milestone parent [#709](https://github.com/cardene777/kiwa/issues/709), this sub [#711](https://github.com/cardene777/kiwa/issues/711)
