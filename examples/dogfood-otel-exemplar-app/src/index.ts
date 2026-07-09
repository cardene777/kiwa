/**
 * Public surface for dogfood-otel-exemplar-app v0.0.1 (v1.35-3).
 *
 * A dogfood app that drives the `@kiwa-lab/observability` v2.1
 * exemplar + otel-advanced axes (pipeline start → resource detection
 * → span enqueue → batch flush → exemplar record → attach trace →
 * resolve metric↔trace → baggage propagation → W3C context extraction
 * → OTLP export → Jaeger query → Prom exemplars query → correlated log
 * emit) behind a provider-neutral 16-op contract, satisfied by both a
 * deterministic mock adapter and a `KIWA_MODE=real` testcontainers-driven
 * OpenTelemetry Collector + Jaeger + Prometheus + Loki real adapter.
 * The fidelity harness diffs both traces and feeds the divergence count
 * into the `@kiwa-lab/quality-metrics` 13-axis release gate.
 */

export { makeMockAdapter } from './adapters/mock.js';
export { makeRealAdapter, type RealAdapterConfig } from './adapters/real.js';
export {
  KIWA_OTEL_ENV_MISSING,
  OTEL_EXEMPLAR_HARNESS_OPS,
  type DetectResourceResult,
  type EnqueueSpanResult,
  type ExemplarInput,
  type ExportOtlpResult,
  type ExtractW3CResult,
  type FlushBatchResult,
  type MetricToTraceResult,
  type ObservabilityTarget,
  type OtelExemplarAdapter,
  type OtelExemplarHarnessOp,
  type PipelineConfig,
  type PipelineProfile,
  type PropagateBaggageResult,
  type QueryJaegerResult,
  type QueryPromExemplarsResult,
  type RecordExemplarResult,
  type StartPipelineResult,
  type TraceEvent,
  type TraceToMetricResult,
  type W3CContextInput,
} from './adapters/interface.js';

export {
  ALL_PIPELINES,
  PIPELINE_LOGS,
  PIPELINE_METRICS,
  PIPELINE_TRACES,
} from './policies/pipelines.js';

export {
  ALL_BAGGAGE_SETS,
  BAGGAGE_FEATURE_FLAG,
  BAGGAGE_SESSION,
  BAGGAGE_TENANT,
  BAGGAGE_USER,
} from './policies/baggage-sets.js';

export {
  ALL_W3C_HEADERS,
  W3C_NOT_SAMPLED_TRACEPARENT,
  W3C_SAMPLED_TRACEPARENT,
  W3C_TRACEPARENT_WITH_STATE,
} from './policies/w3c-headers.js';

export {
  ALL_LIFECYCLE_BAGGAGE,
  OPS_UNDER_TEST,
  diffTraces,
  runFullPipelineLifecycle,
  runMultiProfileMatrix,
  type LifecycleInput,
} from './flows/pipeline-flows.js';

export {
  runAdapterMatrix,
  runFidelityHarness,
  type FidelityRunInput,
  type FidelityRunOutput,
} from './flows/fidelity.js';
