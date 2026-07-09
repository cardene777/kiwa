# Fidelity — dogfood-supabase-realtime-chat (v1.13-3)

Real-vs-mock behavioural fidelity for the Supabase Realtime chat dogfood, produced by `examples/dogfood-supabase-realtime-chat/tests/emit-fidelity-report.test.ts`. Feeds `@kiwa-lab/quality-metrics` 7-axis release gate.

## Baseline (real mode skipped — no `SUPABASE_URL` / `SUPABASE_ANON_KEY`)

When the harness runs without Supabase credentials, the real adapter emits `SUPABASE_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/realtime/supabase-realtime-chat
version    : 0.1.0
verdict    : PASS
divergences: 4 (joinRoom / sendMessage / getPresence / sendTyping — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
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

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `SUPABASE_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 4 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-supabase-realtime-chat test
cat examples/dogfood-supabase-realtime-chat/quality-report/fidelity-latest.md
```

Live real-mode.

```bash
export SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_ANON_KEY=your-anon-key
pnpm --filter dogfood-supabase-realtime-chat test
```

When both env vars are set but `@supabase/supabase-js` is not vendored into the workspace (the default in this example), the adapter downgrades to `SUPABASE_SDK_MISSING` traces. Adding the dependency + wiring the connected paths in `src/adapters/real.ts` is a follow-up when a real Supabase project is provisioned — the adapter shape is ready.

## Ops under measurement

Four provider-neutral ops on `ChatRoomAdapter`.

- `joinRoom` — subscribe to a channel + track presence for a user
- `sendMessage` — broadcast a chat message on the channel
- `getPresence` — snapshot current room members
- `sendTyping` — broadcast typing events, debounced at 500 ms so mass keystrokes do not flood the channel

## Notes

The mock engine (`packages/realtime/src/engine.ts`) tracks presence as `channel -> Map<userId, PresenceMember>`, so multiple users joining the same room accumulate under a single channel subscription. Two-user tests drive both `joinRoom` calls through the same adapter to mirror how Supabase serves multiple clients over a shared connection.

The typing debounce is a client-side concern in the real Supabase SDK — this dogfood implements the same 500 ms window in `mock.ts` `sendTyping` so the fidelity harness can score the emitted / suppressed ratio as an observable behaviour, not a hidden implementation detail.

Provider prefix `@kiwa-lab/realtime/` triggers the common 7-axis branch of `evaluateReleaseGate` (`packages/quality-metrics/src/gate.ts`). The AI-LLM 4 axes (cost / latency / token / accuracy) do not apply because Supabase Realtime is a socket / pub-sub primitive, not a token-priced generative call. Socket round-trip latency feeds `perf.p95Ms` so realtime performance stays visible in the report.
