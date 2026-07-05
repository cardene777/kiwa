# dogfood-nuxt-webtransport-stream-app (v1.28-3)

A Nuxt 3 + aioquic HTTP/3 + WebTransport uni/bi + Datagram + connection migration + 0-RTT resumption stream room that exercises the WebTransport axes across a provider-neutral `WebTransportStreamAdapter`. Both mock (`@kiwa-test/realtime` v0.2) and real (aioquic + Chrome experimental flag, opt-in) implementations satisfy the same 9-op contract so the fidelity harness can diff them side by side.

## Run

```bash
pnpm --filter dogfood-nuxt-webtransport-stream-app test
pnpm --filter dogfood-nuxt-webtransport-stream-app test:e2e
```

The vitest suite drives the mock adapter through the same stream + reset handlers the Nuxt 3 runtime mounts in production. The Playwright suite additionally spawns two `BrowserContext` tabs against a minimal HTTP server so multi-tab regression is captured.

## Real mode (opt-in)

```bash
export KIWA_MODE=real
export WEBTRANSPORT_KEY=1
pnpm --filter dogfood-nuxt-webtransport-stream-app test
```

The real adapter defers the aioquic + Chrome origin-trial wiring to a follow-up milestone. Until `WEBTRANSPORT_KEY=1` is set (which every non-integration environment leaves unset), every real op refuses with `KIWA_WEBTRANSPORT_ENV_MISSING`. The fidelity harness records those refusals as behavioral divergences — this is expected in the real-mode-skipped baseline.

## Adapter contract

`WebTransportStreamAdapter` covers 9 ops.

- `openSession` — establish an HTTP/3 WebTransport session (`await transport.ready`), possibly reusing a 0-RTT resumption ticket
- `closeSession` — tear down the session and release streams
- `openUniStream` — allocate a unidirectional stream for send-only payloads
- `openBiStream` — allocate a bidirectional stream with a flow-control window
- `writeStream` — push a payload into a stream (bi streams may emit backpressure when the window drains)
- `readStream` — pull a chunk from a bi-directional stream
- `resetStream` — abort a stream mid-flight with an error code
- `sendDatagram` — dispatch an unreliable / unordered datagram
- `migrateConnection` — trigger a path migration and observe the server's path-validation response

## Fidelity report

The vitest suite writes `quality-report/fidelity-latest.md` + `quality-report/fidelity-latest.json` that `@kiwa-test/quality-metrics` picks up for the 12-axis release gate. The doc counterpart lives at `docs/quality-reports/realtime/nuxt-webtransport-stream-app.md`.
