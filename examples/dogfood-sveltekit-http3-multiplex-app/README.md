# dogfood-sveltekit-http3-multiplex-app (v1.28-4)

A SvelteKit + nginx-quic HTTP/3 + QUIC stream multiplex + priority scheduling + HPACK dynamic table + 0-RTT resumption experience that exercises the QUIC multiplex axes across a provider-neutral `Http3MultiplexAdapter`. Both mock (`@kiwa-test/realtime` v0.2) and real (nginx-quic testcontainers, opt-in) implementations satisfy the same 9-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-sveltekit-http3-multiplex-app test
pnpm --filter dogfood-sveltekit-http3-multiplex-app test:e2e
```

The vitest suite drives the mock adapter through the same multi-stream + 0-RTT + HPACK handlers the SvelteKit runtime mounts in production. The Playwright suite additionally spawns two `BrowserContext` tabs against a minimal HTTP server so multi-tab regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export HTTP3_KEY=1
pnpm --filter dogfood-sveltekit-http3-multiplex-app test
```

The real adapter defers the nginx-quic testcontainers wiring to a follow-up milestone. Until `HTTP3_KEY=1` is set (which every non-integration environment leaves unset), every real op refuses with `KIWA_HTTP3_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`Http3MultiplexAdapter` covers 9 ops.

- `openConnection` — establish an HTTP/3 QUIC connection, possibly reusing a 0-RTT resumption ticket
- `closeConnection` — tear down the connection and release streams
- `openStream` — allocate a request stream with an explicit priority
- `concurrentSend` — open N streams and enqueue writes so the scheduler observes priority ordering
- `writeStream` — push a payload into a single request stream
- `readStream` — pull a chunk from a single request stream
- `closeStream` — finish a stream cleanly (FIN)
- `insertHpackHeader` — insert a header into the HPACK dynamic table so the compression ratio + table size are observable
- `resumeZeroRtt` — resume a prior connection with a 0-RTT ticket + early data payload; server may accept or refuse depending on anti-replay

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-test/quality-metrics` picks up for the 12-axis release gate. The doc counterpart lives at `docs/quality-reports/realtime/sveltekit-http3-multiplex-app.md`.
