/**
 * The 3 canonical OTel Collector pipeline profiles the dogfood app
 * targets.
 *
 * The trio (traces / metrics / logs) covers the entire OpenTelemetry
 * signal set — a `traces` pipeline exports spans through OTLP HTTP to
 * Jaeger, a `metrics` pipeline exports metric points (with exemplars)
 * to Prometheus, and a `logs` pipeline exports structured logs to Loki
 * correlated by trace_id. Each profile is exercised end-to-end so the
 * fidelity harness diffs mock vs real semantics across every canonical
 * production signal.
 */

import type { PipelineConfig } from '../adapters/interface.js';

/**
 * Traces pipeline — OTLP receiver, batch + resource processors, OTLP
 * exporter to Jaeger. This is the default OpenTelemetry Collector
 * shape for trace export.
 */
export const PIPELINE_TRACES: PipelineConfig = {
  profile: 'traces',
  receiver: 'otlp',
  processors: ['batch', 'resourcedetection', 'attributes'],
  exporter: 'otlp/jaeger',
};

/**
 * Metrics pipeline — OTLP receiver, batch + resource processors,
 * Prometheus remote_write exporter with exemplars enabled. Metrics
 * carry inline exemplars so Grafana can drill from a metric spike to
 * the trace that produced it.
 */
export const PIPELINE_METRICS: PipelineConfig = {
  profile: 'metrics',
  receiver: 'otlp',
  processors: ['batch', 'resourcedetection', 'metricstransform'],
  exporter: 'prometheusremotewrite',
};

/**
 * Logs pipeline — OTLP receiver, batch + resource processors, Loki
 * exporter. Logs carry a trace_id label so LogQL joins line up with
 * PromQL / Jaeger queries.
 */
export const PIPELINE_LOGS: PipelineConfig = {
  profile: 'logs',
  receiver: 'otlp',
  processors: ['batch', 'resourcedetection', 'attributes'],
  exporter: 'loki',
};

/** All 3 pipelines — used by the fidelity harness to walk every profile. */
export const ALL_PIPELINES: readonly PipelineConfig[] = [
  PIPELINE_TRACES,
  PIPELINE_METRICS,
  PIPELINE_LOGS,
];
