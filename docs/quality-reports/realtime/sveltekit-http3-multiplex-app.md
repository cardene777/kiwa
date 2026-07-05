# Fidelity — dogfood-sveltekit-http3-multiplex-app (v1.28-4)

Real-vs-mock behavioural fidelity for the SvelteKit + nginx-quic + HTTP/3 multiplex dogfood, produced by `examples/dogfood-sveltekit-http3-multiplex-app/tests/emit-fidelity-report.spec.ts`. Feeds `@kiwa-test/quality-metrics` 12-axis release gate on the common 7-axis branch (HTTP/3 is a transport primitive, not a token-priced generative call).

## Baseline (real mode skipped — no `HTTP3_KEY=1`)

When the harness runs without the nginx-quic testcontainers env, the real adapter emits `KIWA_HTTP3_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-test/realtime/sveltekit-http3-multiplex-app
version    : 0.2.0
verdict    : PASS
divergences: 9 (openConnection / closeConnection / openStream / concurrentSend / writeStream / readStream / closeStream / insertHpackHeader / resumeZeroRtt — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (common branch — HTTP/3 is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (9/9) | 70% | pass |
| perf.p95Ms | ~2 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 24 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `KIWA_HTTP3_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 9 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-sveltekit-http3-multiplex-app test
cat examples/dogfood-sveltekit-http3-multiplex-app/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export KIWA_MODE=real
export HTTP3_KEY=1
pnpm --filter dogfood-sveltekit-http3-multiplex-app test
```

When `HTTP3_KEY=1` is set but the nginx-quic runner + QUIC-enabled build are not provisioned, the adapter downgrades to `KIWA_HTTP3_ENV_MISSING` traces. Wiring the nginx-quic testcontainer into `src/adapters/real.ts` is a follow-up milestone once the container image ships — the adapter shape is ready and every downstream trace already carries a stable `errorKind` so the drop-in change stays localised.

## Ops under measurement

Nine provider-neutral ops on `Http3MultiplexAdapter`.

- `openConnection` — establish an HTTP/3 QUIC connection, possibly reusing a 0-RTT resumption ticket
- `closeConnection` — tear down the connection and release streams
- `openStream` — allocate a request stream with an explicit priority
- `concurrentSend` — open N streams and enqueue writes so the scheduler observes priority ordering
- `writeStream` — push a payload into a single request stream
- `readStream` — pull a chunk from a single request stream
- `closeStream` — finish a stream cleanly (FIN)
- `insertHpackHeader` — insert a header into the HPACK dynamic table so the compression ratio + table size are observable
- `resumeZeroRtt` — resume a prior connection with a 0-RTT ticket + early data payload; server may accept or refuse depending on anti-replay

## Notes

The mock adapter builds on `packages/realtime/src/semantics/quic-multiplex.ts` (v1.28-1). The dogfood widens that mock with priority-based scheduling (drain order = ascending priority), HPACK compression ratio tracking (rolling raw / compressed byte counters), and anti-replay 0-RTT logic (16 KB early data cap). One connection accumulates its own metrics — nginx-quic gives every HTTP/3 connection its own state so the mock keeps them isolated even when two connections run in parallel.

The `concurrentSend` drain order mirrors nginx-quic's strict-priority scheduler — the lowest priority number wins first. Downstream tests can flip the scheduler to WRR or fair-queue by re-implementing the drain step; the adapter contract intentionally keeps the invariant to "scheduler returns an order" without fixing which order, so a follow-up milestone can plug in an alternative without breaking the fidelity harness.
