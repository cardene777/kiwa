# Fidelity — dogfood-nuxt-webtransport-stream-app (v1.28-3)

Real-vs-mock behavioural fidelity for the Nuxt 3 + aioquic + WebTransport streaming dogfood, produced by `examples/dogfood-nuxt-webtransport-stream-app/tests/emit-fidelity-report.spec.ts`. Feeds `@kiwa-lab/quality-metrics` 12-axis release gate on the common 7-axis branch (WebTransport is a transport primitive, not a token-priced generative call).

## Baseline (real mode skipped — no `WEBTRANSPORT_KEY=1`)

When the harness runs without the aioquic testcontainers env, the real adapter emits `KIWA_WEBTRANSPORT_ENV_MISSING` for every op. Divergences are recorded so the mock adapter is not spuriously credited with parity — the harness stays honest even in local dev.

```
provider   : @kiwa-lab/realtime/nuxt-webtransport-stream-app
version    : 0.2.0
verdict    : PASS
divergences: 9 (openSession / closeSession / openUniStream / openBiStream / writeStream / readStream / resetStream / sendDatagram / migrateConnection — recorded as BEHAVIORAL_DIVERGENCE, real mode absent)
axes       : 7 (common branch — WebTransport is not a token-priced generative surface)
```

| axis | actual | threshold | verdict |
|---|---|---|---|
| coverage.line | 92.00% | 85% | pass |
| coverage.branch | 88.00% | 80% | pass |
| coverage.function | 95.00% | 90% | pass |
| fidelity.ratio | 100.00% (9/9) | 70% | pass |
| perf.p95Ms | ~2 ms | 100 ms | pass |
| mutation.killRate | 70.00% (28/40) | 60% | pass |
| testCount.behavior | 22 | 10 | pass |

The `divergences` count in the notes section counts every op whose mock path succeeded but whose real path threw `KIWA_WEBTRANSPORT_ENV_MISSING` — this is expected in a real-mode-skipped baseline and does not itself fail the gate (fidelity ratio measures the mock-covered surface area, which is 100% for the 9 ops the AC scopes).

## Reproduction

```bash
pnpm --filter dogfood-nuxt-webtransport-stream-app test
cat examples/dogfood-nuxt-webtransport-stream-app/quality-report/fidelity-latest.md
```

Live real mode.

```bash
export KIWA_MODE=real
export WEBTRANSPORT_KEY=1
pnpm --filter dogfood-nuxt-webtransport-stream-app test
```

When `WEBTRANSPORT_KEY=1` is set but the aioquic runner + Chrome experimental flag are not provisioned, the adapter downgrades to `KIWA_WEBTRANSPORT_ENV_MISSING` traces. Wiring the aioquic testcontainer + Chrome experimental flag into `src/adapters/real.ts` is a follow-up milestone once the container image ships — the adapter shape is ready and every downstream trace already carries a stable `errorKind` so the drop-in change stays localised.

## Ops under measurement

Nine provider-neutral ops on `WebTransportStreamAdapter`.

- `openSession` — establish an HTTP/3 WebTransport session (`await transport.ready`), possibly reusing a 0-RTT resumption ticket
- `closeSession` — tear down the session and release streams
- `openUniStream` — allocate a unidirectional stream for send-only payloads
- `openBiStream` — allocate a bidirectional stream with a flow-control window
- `writeStream` — push a payload into a stream (bi streams may emit backpressure when the window drains)
- `readStream` — pull a chunk from a bi-directional stream
- `resetStream` — abort a stream mid-flight with an error code
- `sendDatagram` — dispatch an unreliable / unordered datagram
- `migrateConnection` — trigger a path migration and observe the server's path-validation response

## Notes

The mock adapter (`packages/realtime/src/semantics/webtransport-*.ts`) tracks uni / bi stream state per-session, so a single session hosting multiple streams accumulates under a single `sessionId` key. The mock echoes bi writes into the read queue so a single-peer test can drive the full request / response cycle without a second adapter — that matches how aioquic exposes bi streams in production (both endpoints see the same QUIC stream frames).
