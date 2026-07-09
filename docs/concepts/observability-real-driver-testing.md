# Observability real-driver testing — 8 axis × 4 provider = 32 cell grid + real-driver env-gate (SSOT)

kiwa's v1.17 observability work covered the **4 base axes** (dashboard mock / alert rule mock / trace flame mock / log correlation mock) as unified mocks for Grafana OSS + Prometheus + Loki + OpenTelemetry Collector — the `docs/concepts/observability-v2-testing.md` doc is the SSOT for those 4 axes. v1.35 adds **8 advanced axes on top of that base** — the ones production observability stacks hit once their mock-only Grafana suite is green but real Prometheus recording rules, real Tempo exemplar links, real Pyroscope flame graphs, and real Alertmanager silences start showing up in on-call rotation post-mortems. This concept doc is the SSOT for those 8 axes; the tutorials (70-72) and dogfood app new / v2 (v1.35-2/3/4) are the concrete implementations.

## The 8-axis grid

The 8 advanced axes are cover-oriented — each one names a real-world failure surface every non-trivial production observability stack hits within the first quarter.

| Axis | Real-world failure it catches | v2.1 API |
|---|---|---|
| SLO | "The SLO recording rule fired an MWMB alert at 14.4× burn but nobody paged because the multi-window path was single-window on the day of the outage" (no state machine, no threshold enumeration) | `startSLO` / `openSLOWindow` / `recordRequests` / `computeErrorBudget` / `evaluateBurnRate` / `fireMultiWindowMultiBurnRateAlert` |
| RED/USE | "The p95 dashboard showed green but the RED/USE panel had a stale saturation number because the aggregator dropped a sample" (no per-signal ledger, no four-golden-signal invariant) | `startRedUse` / `recordRequestRate` / `recordErrors` / `recordDuration` / `recordSaturation` / `computeFourGoldenSignals` |
| Exemplar | "The p99 latency panel showed red but clicking through the exemplar dot went nowhere because the trace was already dropped by tail-sampling" (no exemplar chain, no bidirectional resolve) | `startExemplarSession` / `recordExemplarMetric` / `attachTraceToMetric` / `resolveMetricToTrace` / `resolveTraceToMetric` |
| OTel advanced | "The Collector's batch processor stalled silently because a broken config set `send_batch_size = 0`; no baggage propagation error surfaced because the header was silently dropped" (no batch invariant, no baggage / W3C strict format check) | `startOtelAdvanced` / `enqueueSpan` / `flushBatch` / `detectResource` / `propagateBaggage` / `extractW3CContext` |
| Log-correlation advanced | "The LogQL query matched a log line but the PromQL join failed because the trace_id in the log was hex-only and the metric label was hex-with-prefix" (no join contract, no correlation index) | `startLogCorrelationAdvanced` / `emitStructuredLog` / `joinTraceIds` / `joinLogQLAndPromQL` / `buildCorrelationIndex` |
| Alert-routing advanced | "The silence fired but the inhibit rule leaked because the label matcher was inverted; the escalation chain skipped step 2 because the on-call rotation was empty" (no matcher unit test, no escalation-step invariant) | `startAlertRoutingAdvanced` / `applySilence` / `applyInhibit` / `setEscalationChain` / `advanceEscalation` / `pageOncall` / `isSilenced` |
| Profiling | "The Pyroscope flame graph rendered but the hottest frame was 3× off because the eBPF profiler dropped every third sample under load; the depth-first flatten reversed sibling order on the panel" (no root-invariant, no flatten contract) | `startProfiling` / `sampleCpu` / `sampleMemory` / `sampleOffCpu` / `buildFlameGraph` / `flattenFlameGraph` |
| Cardinality | "The Prometheus HEAD blew past 5 M series overnight because a request-id label was un-reduced; the histogram bucket boundaries drifted after a config rewrite and the p99 line broke silently" (no series-fingerprint scan, no bucket contract) | `startCardinalitySession` / `scanSeries` / `detectHighCardinality` / `reduceLabel` / `bucketHistogram` |

Each axis has 3 shapes — a mock-only path (fast inner loop, ms scale), a real-driver path (`KIWA_MODE=real` + real Grafana OSS / Prometheus / Loki / OpenTelemetry Collector / Pyroscope, seconds scale), and a fidelity assertion that the two produce the same output. Tutorial 70 covers the SLO axis end-to-end (open window → budget → burn → MWMB alert), tutorial 71 covers the exemplar + OTel-advanced axes (record → attach → m2t / t2m → batch flush → baggage → W3C context), tutorial 72 covers the profiling axis end-to-end (cpu / memory / off-cpu sample → flame graph build → flatten for panel render).

## The 4-provider × 8-axis = 32 cell grid

Every provider covers every axis. The mock shapes are provider-neutral (the API surface is the same across Grafana OSS + Prometheus + Loki + OpenTelemetry Collector), the emitted event dialects are provider-specific (`grafana.slo.window.open` vs `prom.slo.window.open` vs `loki.slo.window` vs `otel.slo.window`), and the fidelity harness reports the coverage explicitly.

| Provider | SLO | RED/USE | Exemplar | OTel | LogCorr | AlertRt | Profiling | Cardinality |
|---|---|---|---|---|---|---|---|---|
| Grafana OSS | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| Prometheus | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| Loki | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |
| OpenTelemetry Collector | implemented | implemented | implemented | implemented | implemented | implemented | implemented | implemented |

The v1.35 observability grid is fully covered — every provider implements every axis because the semantics are runtime-agnostic. That is what makes cross-provider reuse (a session that runs under Grafana OSS + Prometheus + Loki + OpenTelemetry Collector without change) even possible.

### Why the observability grid is fully covered

Grafana OSS + Prometheus + Loki + OpenTelemetry Collector converged on the same neutral events at the OTLP + PromQL + LogQL + trace-context layer — the "record a metric with a trace_id" primitive is the same shape across all 4 providers, even though the wire encodings differ. The `providerEventName(target, neutralEvent)` mapping table is the single point where the 4 dialects diverge; everything upstream stays neutral. The v1.35 fidelity grid at 32/32 = 100 % implemented reflects that convergence at the OpenTelemetry wire format level.

## The `KIWA_MODE=real` env-gate contract

`skipUnlessReal(env)` returns `{ skip: false, reason: 'KIWA_MODE=real detected' }` when `env.KIWA_MODE === 'real'` and `{ skip: true, reason: 'KIWA_MODE!=real — skip real-driver tests (mock semantics apply)' }` otherwise. A test that respects the contract combines the gate with a required-env presence check — the dogfood apps use this at each `describe.skipIf(gate.skip || envMissing.length > 0)` block.

Per-axis env mapping.

- **SLO dogfood** → `PROMETHEUS_URL` + `GRAFANA_URL` (Prometheus recording rule + Grafana panel query)
- **RED/USE dogfood** → `PROMETHEUS_URL` + `GRAFANA_URL` (same pair, different recording rules)
- **OTel exemplar dogfood** → `OTEL_COLLECTOR_URL` + `TEMPO_URL` (OpenTelemetry Collector OTLP + Grafana Tempo trace fetch)
- **OTel-advanced dogfood** → `OTEL_COLLECTOR_URL` (Collector batch + resource + baggage propagation)
- **Log-correlation-advanced dogfood** → `LOKI_URL` + `PROMETHEUS_URL` (LogQL + PromQL join)
- **Alert-routing-advanced dogfood** → `GRAFANA_URL` + `ALERTMANAGER_URL` (silence + inhibit + escalation route)
- **Profiling dogfood** → `PYROSCOPE_URL` (flame graph fetch)
- **Cardinality dogfood** → `PROMETHEUS_URL` (series count + label-value query)

A test that respects the contract runs the mock path unconditionally and the real-driver path only when both `KIWA_MODE=real` and the required env are present. That means CI stays cheap by default (mock only, ms scale), the nightly job flips `KIWA_MODE=real` + the required `_URL` envs, and the fidelity harness ties the two together.

Absent env means silently fall back to mock mode — the test still runs, the real-driver assertions get skipped. Absent `KIWA_MODE` means fall back to mock. An invalid `KIWA_MODE` value (anything other than `real`) also falls back to mock so a typo does not break tests.

## The dogfood app new / v2 pattern

The 3 dogfood apps (v1.35-2/3/4) each expose a `pnpm test:real` command that flips `KIWA_MODE=real` and routes through the real provider stack.

- `examples/dogfood-observability-slo-app` v2 — Grafana OSS + Prometheus + Alertmanager stack + docker-compose backend + `pnpm test:real` that walks the SLO burn-rate flow (open window → record requests → compute budget → evaluate burn → fire multi-window alert against a real Alertmanager silence route).
- `examples/dogfood-otel-exemplar-app` v2 — OpenTelemetry Collector + Grafana Tempo stack + docker-compose backend + `pnpm test:real` that walks the exemplar chain (record metric → attach trace → resolve m2t → resolve t2m → flush batch → propagate baggage → extract W3C context) against real OTLP + Tempo endpoints.
- `examples/dogfood-profiling-app` new — Grafana Pyroscope + eBPF profiler + docker-compose backend + `pnpm test:real` that walks the profiling flow (start session → sample cpu → sample memory → sample off-cpu → build flame graph → flatten for panel render) against a real Pyroscope endpoint.

The pattern each new / v2 app follows.

1. Keep the mock-only path (`pnpm test`) green — the fast inner loop stays sub-second.
2. Add a `pnpm test:e2e` command that spins the docker-compose stack (Grafana + Prometheus + Loki + OpenTelemetry Collector + Alertmanager + Tempo + Pyroscope, subset per app) and walks the real query flow.
3. Add a `pnpm test:real` command that requires the axis-specific `_URL` env(s) and routes through the real provider endpoint.
4. Run the same fidelity-harness assertions against the real driver; failure means "the mock diverged from real provider behavior" — the mock gets the fix.
5. Emit a `quality-report/fidelity-latest.md` + `.json` that the v1.29 3-layer defensive structure (release-invariants + docs-e2e + release-smoke) picks up on merge.

## The `not-implemented` failure mode

If the fidelity harness has a `planned` cell, the corresponding tutorial + dogfood + snippet-validation-test trio does not exist yet. The 32-cell grid at v1.35 has 0 `planned` cells — every intended cell is `implemented`. When a future milestone adds a 9th axis (e.g., `openslo` or `pyroscope-flame-diff`), it will start as `planned` for all 4 providers, then transition to `implemented` for the ones that cover it as the milestone lands its tutorial + dogfood + snippet test.

## How this ties into the 13-axis release gate

v1.35 does not add a 14th release-gate axis. The 8 advanced observability axes gate the observability package's own tests (via `pnpm --filter @kiwa-lab/observability test`) but do not surface as a per-package `@kiwa-lab/quality-metrics` axis. The reasoning — the fidelity harness is provider-shape-specific, and a package that does not export to Grafana OSS / Prometheus / Loki / OpenTelemetry Collector has nothing to assert on. When a future milestone adds an `observability.fidelity` axis that describes "which observability providers this package's tests hit," it will slot into the 13-axis release gate as the 14th; v1.35 keeps the axis count at 13.

## SSOT boundaries

- The 4 base observability axes (dashboard / alert / trace flame / log correlation) live in `docs/concepts/observability-v2-testing.md`. v1.35 does not modify that doc.
- The 8 advanced observability axes live in this doc. Tutorials 70-72 and the migration guide (v1.34 → v1.35) link back here for the axis SSOT.
- The 4-provider × 8-axis grid is the harness's data structure. The `collectFidelityCoverage()` implementation in `packages/observability/src/semantics/fidelity.ts` is the code SSOT — this doc's grid table is derived from that code.
- The `KIWA_MODE=real` env-gate contract is shared with the v1.22 real-driver testing tutorial (auth adapters + Keycloak), the v1.31 streaming real-driver concept doc, the v1.32 database real-driver concept doc, the v1.33 payment real-driver concept doc, and the v1.34 frontend real-driver concept doc. All five use the same `skipUnlessReal(env)` pattern; the observability axes just add provider `_URL` envs (`PROMETHEUS_URL` / `GRAFANA_URL` / `LOKI_URL` / `OTEL_COLLECTOR_URL` / `TEMPO_URL` / `PYROSCOPE_URL` / `ALERTMANAGER_URL`) instead of provider-specific `_KEY` or `_BROWSER_READY` envs.
