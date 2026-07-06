/**
 * Advanced observability semantics — target-neutral axis SSOT (v2.1).
 *
 * The helpers model 4 canonical observability stacks (Grafana OSS + Prometheus +
 * Loki + OpenTelemetry Collector) as pure state machines. Tests can assert the
 * neutral event while still seeing a target-specific dialect through
 * providerEventName.
 *
 * Provider targets:
 * - grafana-oss ... Grafana OSS dashboard + Alerting + Loki integration
 * - prometheus ... PromQL rules + Alertmanager + exemplars
 * - loki ... LogQL structured logs + label indexes
 * - otel-collector ... OpenTelemetry Collector pipelines + processors
 *
 * Axes (8):
 * - slo ... SLO / SLI / error budget + burn rate + multi-window multi-burn-rate
 * - red-use ... RED / USE / four golden signals
 * - exemplar ... exemplar tracing (trace-to-metric + metric-to-trace)
 * - otel-advanced ... batch processor + resource detection + baggage + W3C context
 * - log-correlation-advanced ... structured log + trace_id/span_id + LogQL + PromQL join
 * - alert-routing-advanced ... silence + inhibit + escalation + oncall
 * - profiling ... continuous profiling (pyroscope / parca / eBPF)
 * - cardinality ... high-cardinality detection + label reduction + histogram/summary
 */

export type ObservabilityTarget = 'grafana-oss' | 'prometheus' | 'loki' | 'otel-collector';

export type ObservabilityAxis =
  | 'slo'
  | 'red-use'
  | 'exemplar'
  | 'otel-advanced'
  | 'log-correlation-advanced'
  | 'alert-routing-advanced'
  | 'profiling'
  | 'cardinality';

export type NeutralEventName =
  // slo
  | 'slo.window_opened'
  | 'slo.error_budget_computed'
  | 'slo.burn_rate_evaluated'
  | 'slo.multi_window_alert_fired'
  // red-use
  | 'red.rate_recorded'
  | 'red.errors_recorded'
  | 'red.duration_recorded'
  | 'use.saturation_recorded'
  // exemplar
  | 'exemplar.metric_recorded'
  | 'exemplar.trace_attached'
  | 'exemplar.metric_to_trace_resolved'
  | 'exemplar.trace_to_metric_resolved'
  // otel-advanced
  | 'otel.batch_flushed'
  | 'otel.resource_detected'
  | 'otel.baggage_propagated'
  | 'otel.w3c_context_extracted'
  // log-correlation-advanced
  | 'logcorr.structured_log_emitted'
  | 'logcorr.trace_id_joined'
  | 'logcorr.logql_promql_joined'
  | 'logcorr.correlation_index_built'
  // alert-routing-advanced
  | 'alertrt.silence_applied'
  | 'alertrt.inhibit_applied'
  | 'alertrt.escalation_advanced'
  | 'alertrt.oncall_paged'
  // profiling
  | 'profile.cpu_sampled'
  | 'profile.memory_sampled'
  | 'profile.off_cpu_sampled'
  | 'profile.flame_graph_built'
  // cardinality
  | 'cardinality.series_scanned'
  | 'cardinality.high_cardinality_detected'
  | 'cardinality.label_reduced'
  | 'cardinality.histogram_bucketed';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  timestampMs: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<ObservabilityTarget, Partial<Record<NeutralEventName, string>>> = {
  'grafana-oss': {
    'slo.window_opened': 'grafana.slo.window.open',
    'slo.error_budget_computed': 'grafana.slo.budget.compute',
    'slo.burn_rate_evaluated': 'grafana.slo.burn.eval',
    'slo.multi_window_alert_fired': 'grafana.slo.mwmb.fire',
    'red.rate_recorded': 'grafana.red.rate',
    'red.errors_recorded': 'grafana.red.errors',
    'red.duration_recorded': 'grafana.red.duration',
    'use.saturation_recorded': 'grafana.use.saturation',
    'exemplar.metric_recorded': 'grafana.exemplar.metric',
    'exemplar.trace_attached': 'grafana.exemplar.trace.attach',
    'exemplar.metric_to_trace_resolved': 'grafana.exemplar.m2t',
    'exemplar.trace_to_metric_resolved': 'grafana.exemplar.t2m',
    'otel.batch_flushed': 'grafana.otel.batch.flush',
    'otel.resource_detected': 'grafana.otel.resource.detect',
    'otel.baggage_propagated': 'grafana.otel.baggage',
    'otel.w3c_context_extracted': 'grafana.otel.w3c',
    'logcorr.structured_log_emitted': 'grafana.log.structured',
    'logcorr.trace_id_joined': 'grafana.log.trace_id.join',
    'logcorr.logql_promql_joined': 'grafana.log.logql.promql.join',
    'logcorr.correlation_index_built': 'grafana.log.index.build',
    'alertrt.silence_applied': 'grafana.alerting.silence.apply',
    'alertrt.inhibit_applied': 'grafana.alerting.inhibit.apply',
    'alertrt.escalation_advanced': 'grafana.alerting.escalation.advance',
    'alertrt.oncall_paged': 'grafana.oncall.page',
    'profile.cpu_sampled': 'grafana.pyroscope.cpu',
    'profile.memory_sampled': 'grafana.pyroscope.memory',
    'profile.off_cpu_sampled': 'grafana.pyroscope.off_cpu',
    'profile.flame_graph_built': 'grafana.pyroscope.flame',
    'cardinality.series_scanned': 'grafana.cardinality.scan',
    'cardinality.high_cardinality_detected': 'grafana.cardinality.detect',
    'cardinality.label_reduced': 'grafana.cardinality.reduce',
    'cardinality.histogram_bucketed': 'grafana.cardinality.bucket',
  },
  prometheus: {
    'slo.window_opened': 'prom.slo.window.open',
    'slo.error_budget_computed': 'prom.slo.budget.compute',
    'slo.burn_rate_evaluated': 'prom.slo.burn.eval',
    'slo.multi_window_alert_fired': 'prom.alert.mwmb',
    'red.rate_recorded': 'prom.counter.requests_total',
    'red.errors_recorded': 'prom.counter.errors_total',
    'red.duration_recorded': 'prom.histogram.duration_seconds',
    'use.saturation_recorded': 'prom.gauge.saturation',
    'exemplar.metric_recorded': 'prom.exemplar.record',
    'exemplar.trace_attached': 'prom.exemplar.attach',
    'exemplar.metric_to_trace_resolved': 'prom.exemplar.jump',
    'exemplar.trace_to_metric_resolved': 'prom.exemplar.query',
    'otel.batch_flushed': 'prom.remote_write.flush',
    'otel.resource_detected': 'prom.resource.discovery',
    'otel.baggage_propagated': 'prom.baggage.forward',
    'otel.w3c_context_extracted': 'prom.trace_context.extract',
    'logcorr.structured_log_emitted': 'prom.log.pipeline',
    'logcorr.trace_id_joined': 'prom.log.trace_id.label',
    'logcorr.logql_promql_joined': 'prom.log.join.rule',
    'logcorr.correlation_index_built': 'prom.log.index.rebuild',
    'alertrt.silence_applied': 'prom.alertmanager.silence',
    'alertrt.inhibit_applied': 'prom.alertmanager.inhibit',
    'alertrt.escalation_advanced': 'prom.alertmanager.route.escalate',
    'alertrt.oncall_paged': 'prom.alertmanager.page',
    'profile.cpu_sampled': 'prom.parca.cpu',
    'profile.memory_sampled': 'prom.parca.memory',
    'profile.off_cpu_sampled': 'prom.parca.off_cpu',
    'profile.flame_graph_built': 'prom.parca.flame',
    'cardinality.series_scanned': 'prom.tsdb.head.scan',
    'cardinality.high_cardinality_detected': 'prom.tsdb.high_cardinality',
    'cardinality.label_reduced': 'prom.relabel.drop',
    'cardinality.histogram_bucketed': 'prom.histogram.bucket',
  },
  loki: {
    'slo.window_opened': 'loki.slo.window',
    'slo.error_budget_computed': 'loki.slo.budget',
    'slo.burn_rate_evaluated': 'loki.slo.burn',
    'slo.multi_window_alert_fired': 'loki.ruler.mwmb.fire',
    'red.rate_recorded': 'loki.metric.rate',
    'red.errors_recorded': 'loki.metric.errors',
    'red.duration_recorded': 'loki.metric.duration',
    'use.saturation_recorded': 'loki.metric.saturation',
    'exemplar.metric_recorded': 'loki.metric.exemplar',
    'exemplar.trace_attached': 'loki.exemplar.attach',
    'exemplar.metric_to_trace_resolved': 'loki.exemplar.jump',
    'exemplar.trace_to_metric_resolved': 'loki.exemplar.query',
    'otel.batch_flushed': 'loki.push.batch',
    'otel.resource_detected': 'loki.discovery.resource',
    'otel.baggage_propagated': 'loki.baggage.forward',
    'otel.w3c_context_extracted': 'loki.trace_context.extract',
    'logcorr.structured_log_emitted': 'loki.log.structured',
    'logcorr.trace_id_joined': 'loki.log.trace_id.join',
    'logcorr.logql_promql_joined': 'loki.logql.promql.join',
    'logcorr.correlation_index_built': 'loki.chunk.index.build',
    'alertrt.silence_applied': 'loki.ruler.silence',
    'alertrt.inhibit_applied': 'loki.ruler.inhibit',
    'alertrt.escalation_advanced': 'loki.ruler.escalate',
    'alertrt.oncall_paged': 'loki.ruler.page',
    'profile.cpu_sampled': 'loki.profile.cpu',
    'profile.memory_sampled': 'loki.profile.memory',
    'profile.off_cpu_sampled': 'loki.profile.off_cpu',
    'profile.flame_graph_built': 'loki.profile.flame',
    'cardinality.series_scanned': 'loki.label.scan',
    'cardinality.high_cardinality_detected': 'loki.label.high_cardinality',
    'cardinality.label_reduced': 'loki.label.drop',
    'cardinality.histogram_bucketed': 'loki.histogram.bucket',
  },
  'otel-collector': {
    'slo.window_opened': 'otel.slo.window',
    'slo.error_budget_computed': 'otel.slo.budget',
    'slo.burn_rate_evaluated': 'otel.slo.burn',
    'slo.multi_window_alert_fired': 'otel.processor.mwmb.fire',
    'red.rate_recorded': 'otel.metric.rate',
    'red.errors_recorded': 'otel.metric.errors',
    'red.duration_recorded': 'otel.metric.duration',
    'use.saturation_recorded': 'otel.metric.saturation',
    'exemplar.metric_recorded': 'otel.metric.exemplar',
    'exemplar.trace_attached': 'otel.exemplar.attach',
    'exemplar.metric_to_trace_resolved': 'otel.exemplar.jump',
    'exemplar.trace_to_metric_resolved': 'otel.exemplar.query',
    'otel.batch_flushed': 'otel.batch_processor.flush',
    'otel.resource_detected': 'otel.resource_detector.detect',
    'otel.baggage_propagated': 'otel.baggage_propagator.inject',
    'otel.w3c_context_extracted': 'otel.tracecontext_propagator.extract',
    'logcorr.structured_log_emitted': 'otel.log.record',
    'logcorr.trace_id_joined': 'otel.log.trace_id.correlate',
    'logcorr.logql_promql_joined': 'otel.log.exporter.join',
    'logcorr.correlation_index_built': 'otel.log.index.correlate',
    'alertrt.silence_applied': 'otel.alertrouter.silence',
    'alertrt.inhibit_applied': 'otel.alertrouter.inhibit',
    'alertrt.escalation_advanced': 'otel.alertrouter.escalate',
    'alertrt.oncall_paged': 'otel.alertrouter.page',
    'profile.cpu_sampled': 'otel.profile.cpu',
    'profile.memory_sampled': 'otel.profile.memory',
    'profile.off_cpu_sampled': 'otel.profile.off_cpu',
    'profile.flame_graph_built': 'otel.profile.flame',
    'cardinality.series_scanned': 'otel.metric.scan',
    'cardinality.high_cardinality_detected': 'otel.metric.high_cardinality',
    'cardinality.label_reduced': 'otel.processor.attribute.drop',
    'cardinality.histogram_bucketed': 'otel.histogram.bucket',
  },
};

export function providerEventName(
  target: ObservabilityTarget,
  neutral: NeutralEventName,
): string {
  return dialect[target][neutral] ?? neutral;
}
