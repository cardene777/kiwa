/**
 * Provider-neutral OTel Collector + exemplar + baggage + W3C context surface
 * for the dogfood app.
 *
 * The dogfood app drives an OpenTelemetry Collector harness through this
 * contract only. Two implementations exist —
 *  - {@link makeMockAdapter} — walks the `@kiwa-lab/observability` v2.1
 *    `semantics/exemplar` + `semantics/otel-advanced` state machines
 *    deterministically without any backend. Every op emits the neutral
 *    event onto the trace so the fidelity harness can diff ordering
 *    against the real adapter.
 *  - {@link makeRealAdapter} — issues OTLP HTTP export requests + Jaeger
 *    trace-lookup / PromQL exemplar-scan queries against the
 *    `KIWA_MODE=real` testcontainers-driven OpenTelemetry Collector +
 *    Jaeger + Prometheus stack when `KIWA_OTEL_COLLECTOR_URL` /
 *    `KIWA_JAEGER_URL` / `KIWA_PROMETHEUS_URL` are wired; otherwise
 *    every op reports the sentinel `KIWA_OTEL_ENV_MISSING` so the app
 *    can budget the fallback path.
 *
 * The AC anchors this contract on 3 pipeline profiles that production
 * OTel Collector deployments commonly ship — traces (Jaeger backend) /
 * metrics (Prometheus backend with exemplars) / logs (Loki backend
 * correlated by trace_id) — × 4 canonical W3C baggage entry sets
 * (session / user / tenant / feature-flag). The 16 ops below cover the
 * OTel Collector + exemplar + baggage lifecycle end-to-end so the
 * fidelity harness can point at the exact op that drifted between mock
 * semantics and the real Collector + Jaeger + Prometheus pipeline.
 */

import type { semantics } from '@kiwa-lab/observability';

/** Re-export from observability semantics namespace. */
export type ObservabilityTarget = semantics.ObservabilityTarget;

/** OTel Collector pipeline profile — traces / metrics / logs. */
export type PipelineProfile = 'traces' | 'metrics' | 'logs';

/** OTel Collector pipeline configuration (receiver + processors + exporter). */
export interface PipelineConfig {
  profile: PipelineProfile;
  receiver: string;
  processors: readonly string[];
  exporter: string;
}

/** Result of starting an OTel Collector pipeline session. */
export interface StartPipelineResult {
  profile: PipelineProfile;
  receiver: string;
  processors: readonly string[];
  exporter: string;
}

/** Exemplar record — a single metric point with an attached trace pointer. */
export interface ExemplarInput {
  metricName: string;
  value: number;
  traceId: string;
  spanId: string;
  timestampMs: number;
}

/** Result of recording an exemplar-attached metric point. */
export interface RecordExemplarResult {
  metricName: string;
  value: number;
  traceId: string;
  spanId: string;
  exemplarCount: number;
}

/** Result of resolving metric → trace (Grafana metric drill-in). */
export interface MetricToTraceResult {
  metricName: string;
  traceIds: readonly string[];
  matchedCount: number;
}

/** Result of resolving trace → metric (Jaeger trace drill-out). */
export interface TraceToMetricResult {
  traceId: string;
  metricNames: readonly string[];
  matchedCount: number;
}

/** Result of enqueuing a span into the OTel batch processor. */
export interface EnqueueSpanResult {
  spanId: string;
  parentId: string | null;
  queueDepth: number;
}

/** Result of flushing a batch through the OTel batch processor. */
export interface FlushBatchResult {
  batchSize: number;
  remainingQueue: number;
  maxBatchSize: number;
}

/** Result of detecting resource attributes (service.name / host / etc). */
export interface DetectResourceResult {
  attributeCount: number;
  addedKeys: readonly string[];
}

/** Baggage entry set — 1-N key/value pairs for context propagation. */
export interface BaggageInput {
  entries: Record<string, string>;
}

/** Result of propagating baggage through the pipeline. */
export interface PropagateBaggageResult {
  entryCount: number;
  addedKeys: readonly string[];
}

/** W3C traceparent + optional tracestate headers. */
export interface W3CContextInput {
  traceparent: string;
  tracestate?: string | undefined;
}

/** Result of extracting a W3C context from incoming headers. */
export interface ExtractW3CResult {
  version: string;
  traceId: string;
  spanId: string;
  flags: string;
  hasTracestate: boolean;
}

/** Result of exporting a batch via OTLP HTTP. */
export interface ExportOtlpResult {
  profile: PipelineProfile;
  endpointUrl: string;
  itemCount: number;
  contentType: string;
}

/** Result of a Jaeger trace lookup for a given traceId. */
export interface QueryJaegerResult {
  traceId: string;
  serviceName: string;
  spanCount: number;
}

/** Result of a PromQL exemplar scan for a given metric. */
export interface QueryPromExemplarsResult {
  metricName: string;
  exemplarCount: number;
  traceIds: readonly string[];
}

/** Neutral trace event emitted by both adapters. */
export interface TraceEvent {
  op: string;
  bucket: string;
  neutralEvent: string;
  providerEvent: string;
  target: ObservabilityTarget;
  state: string;
  timestampMs: number;
  /**
   * Whether the op completed against a functional backend. Mock adapter
   * ops are always `ok: true` (in-memory state machine); real adapter
   * ops are `ok: false` with `errorKind: KIWA_OTEL_ENV_MISSING` when the
   * env vars are missing. The fidelity harness surfaces this asymmetry
   * as a behavioural divergence.
   */
  ok: boolean;
  errorKind?: string | undefined;
  metadata: Record<string, string | number | boolean>;
}

/**
 * The 16-op OTel Collector + exemplar + baggage harness contract that
 * both adapters satisfy.
 *
 * Ordering — a full run flows through 16 ops so an app / test can drive
 * the entire OTel pipeline + exemplar + baggage + W3C lifecycle once and
 * both adapters emit the same neutral event trace.
 */
export interface OtelExemplarAdapter {
  /** Provider target identifier. */
  readonly target: ObservabilityTarget;

  /** Start an OTel Collector pipeline session for the given profile. */
  startPipeline(config: PipelineConfig): Promise<StartPipelineResult>;

  /** Detect resource attributes (service.name / host.name / process id). */
  detectResource(input: {
    bucket: string;
    attributes: Record<string, string>;
  }): Promise<DetectResourceResult>;

  /** Enqueue a span into the OTel batch processor. */
  enqueueSpan(input: {
    bucket: string;
    spanId: string;
    parentId: string | null;
    attributes: Record<string, string>;
  }): Promise<EnqueueSpanResult>;

  /** Flush the batch processor queue up to `maxBatchSize`. */
  flushBatch(input: { bucket: string; maxBatchSize: number }): Promise<FlushBatchResult>;

  /** Record an exemplar-attached metric point. */
  recordExemplar(input: ExemplarInput & { bucket: string }): Promise<RecordExemplarResult>;

  /** Attach a trace pointer to an already-recorded metric (Prometheus /api/v1/metadata style). */
  attachTraceToMetric(input: {
    bucket: string;
    metricName: string;
    traceId: string;
    spanId: string;
  }): Promise<{ metricName: string; traceId: string; spanId: string }>;

  /**
   * Resolve metric → trace (Grafana metric drill-in — click on a spike
   * and jump to the trace that produced it).
   */
  resolveMetricToTrace(input: {
    bucket: string;
    metricName: string;
  }): Promise<MetricToTraceResult>;

  /**
   * Resolve trace → metric (Jaeger trace drill-out — click on a span and
   * jump to the RED metric it contributes to).
   */
  resolveTraceToMetric(input: {
    bucket: string;
    traceId: string;
  }): Promise<TraceToMetricResult>;

  /** Propagate W3C baggage entries through the pipeline. */
  propagateBaggage(input: {
    bucket: string;
    entries: Record<string, string>;
  }): Promise<PropagateBaggageResult>;

  /** Extract a W3C traceparent + optional tracestate from incoming headers. */
  extractW3CContext(input: {
    bucket: string;
    headers: W3CContextInput;
  }): Promise<ExtractW3CResult>;

  /** Export the current batch through OTLP HTTP against the Collector endpoint. */
  exportOtlp(input: {
    bucket: string;
    profile: PipelineProfile;
    itemCount: number;
  }): Promise<ExportOtlpResult>;

  /** Query the Jaeger backend for a given traceId (real path only). */
  queryJaegerTrace(input: { bucket: string; traceId: string }): Promise<QueryJaegerResult>;

  /** Scan Prometheus exemplars for a given metric (real path only). */
  queryPromExemplars(input: {
    bucket: string;
    metricName: string;
  }): Promise<QueryPromExemplarsResult>;

  /** Emit a structured log correlated by trace_id (Loki-style joining). */
  emitCorrelatedLog(input: {
    bucket: string;
    traceId: string;
    message: string;
    level: 'info' | 'warn' | 'error';
  }): Promise<{ traceId: string; message: string; level: 'info' | 'warn' | 'error' }>;

  /** Reset the adapter (drop all state, resettable across tests). */
  reset(): Promise<void>;

  /** Trace transcript for fidelity diffing. */
  trace(): TraceEvent[];
}

/**
 * The full 16 op names — used both to drive the fidelity harness and to
 * assert both adapters implement the same surface.
 *
 * The list mirrors the 15 Promise-returning methods on the adapter plus
 * a synthesised `resetVerified` step the fidelity harness emits at the
 * end of a lifecycle. `reset` itself is on the interface but is not
 * exercised in the multi-profile matrix (reset happens at the top of
 * each lifecycle, not per-lifecycle) so the OP list intentionally
 * captures the sequence a single lifecycle traces.
 */
export const OTEL_EXEMPLAR_HARNESS_OPS = [
  'startPipeline',
  'detectResource',
  'enqueueSpan',
  'flushBatch',
  'recordExemplar',
  'attachTraceToMetric',
  'resolveMetricToTrace',
  'resolveTraceToMetric',
  'propagateBaggage',
  'extractW3CContext',
  'exportOtlp',
  'queryJaegerTrace',
  'queryPromExemplars',
  'emitCorrelatedLog',
  'reset',
  'resetVerified',
] as const;

export type OtelExemplarHarnessOp = (typeof OTEL_EXEMPLAR_HARNESS_OPS)[number];

/** Sentinel error thrown by the real adapter when env is missing. */
export const KIWA_OTEL_ENV_MISSING = 'KIWA_OTEL_ENV_MISSING';
