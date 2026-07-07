/**
 * Advanced observability semantics — target-neutral axis SSOT (v2.2).
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
 * Axes (16 — v2.1 baseline 8 + v2.2 advanced III 8):
 *
 * v2.1 baseline (8):
 * - slo ... SLO / SLI / error budget + burn rate + multi-window multi-burn-rate
 * - red-use ... RED / USE / four golden signals
 * - exemplar ... exemplar tracing (trace-to-metric + metric-to-trace)
 * - otel-advanced ... batch processor + resource detection + baggage + W3C context
 * - log-correlation-advanced ... structured log + trace_id/span_id + LogQL + PromQL join
 * - alert-routing-advanced ... silence + inhibit + escalation + oncall
 * - profiling ... continuous profiling (pyroscope / parca / eBPF)
 * - cardinality ... high-cardinality detection + label reduction + histogram/summary
 *
 * v2.2 advanced III (8):
 * - iac ... IaC observability (Terraform + drift + OPA + cost attribution)
 * - service-mesh ... Istio / Linkerd + mTLS + sidecar + circuit breaker
 * - ebpf-iii ... eBPF profiling III (user-space + kernel + LSM + syscall + network flow)
 * - llm-observability ... LLM ops (token + prompt log + hallucination + tool-call + budget)
 * - finops ... cost per request + team attribution + rightsizing + spot instance
 * - chaos ... fault injection + blast radius + auto-rollback + game day
 * - data-pipeline ... Airflow/Dagster lineage + freshness + schema drift + data quality
 * - aiops ... anomaly detection + auto-remediation + RCA + alert correlation
 */

export type ObservabilityTarget = 'grafana-oss' | 'prometheus' | 'loki' | 'otel-collector';

export type ObservabilityAxis =
  // v2.1 baseline
  | 'slo'
  | 'red-use'
  | 'exemplar'
  | 'otel-advanced'
  | 'log-correlation-advanced'
  | 'alert-routing-advanced'
  | 'profiling'
  | 'cardinality'
  // v2.2 advanced III
  | 'iac'
  | 'service-mesh'
  | 'ebpf-iii'
  | 'llm-observability'
  | 'finops'
  | 'chaos'
  | 'data-pipeline'
  | 'aiops';

export type NeutralEventName =
  // slo (v2.1)
  | 'slo.window_opened'
  | 'slo.error_budget_computed'
  | 'slo.burn_rate_evaluated'
  | 'slo.multi_window_alert_fired'
  // red-use (v2.1)
  | 'red.rate_recorded'
  | 'red.errors_recorded'
  | 'red.duration_recorded'
  | 'use.saturation_recorded'
  // exemplar (v2.1)
  | 'exemplar.metric_recorded'
  | 'exemplar.trace_attached'
  | 'exemplar.metric_to_trace_resolved'
  | 'exemplar.trace_to_metric_resolved'
  // otel-advanced (v2.1)
  | 'otel.batch_flushed'
  | 'otel.resource_detected'
  | 'otel.baggage_propagated'
  | 'otel.w3c_context_extracted'
  // log-correlation-advanced (v2.1)
  | 'logcorr.structured_log_emitted'
  | 'logcorr.trace_id_joined'
  | 'logcorr.logql_promql_joined'
  | 'logcorr.correlation_index_built'
  // alert-routing-advanced (v2.1)
  | 'alertrt.silence_applied'
  | 'alertrt.inhibit_applied'
  | 'alertrt.escalation_advanced'
  | 'alertrt.oncall_paged'
  // profiling (v2.1)
  | 'profile.cpu_sampled'
  | 'profile.memory_sampled'
  | 'profile.off_cpu_sampled'
  | 'profile.flame_graph_built'
  // cardinality (v2.1)
  | 'cardinality.series_scanned'
  | 'cardinality.high_cardinality_detected'
  | 'cardinality.label_reduced'
  | 'cardinality.histogram_bucketed'
  // iac (v2.2)
  | 'iac.plan_captured'
  | 'iac.drift_detected'
  | 'iac.policy_evaluated'
  | 'iac.cost_attributed'
  // service-mesh (v2.2)
  | 'mesh.mtls_handshaked'
  | 'mesh.sidecar_injected'
  | 'mesh.circuit_breaker_tripped'
  | 'mesh.traffic_split_applied'
  // ebpf-iii (v2.2)
  | 'ebpf.userspace_probed'
  | 'ebpf.kernel_traced'
  | 'ebpf.syscall_recorded'
  | 'ebpf.network_flow_captured'
  // llm-observability (v2.2)
  | 'llmobs.token_counted'
  | 'llmobs.prompt_logged'
  | 'llmobs.hallucination_flagged'
  | 'llmobs.budget_checked'
  // finops (v2.2)
  | 'finops.cost_per_request_recorded'
  | 'finops.team_attributed'
  | 'finops.rightsizing_recommended'
  | 'finops.spot_optimized'
  // chaos (v2.2)
  | 'chaos.fault_injected'
  | 'chaos.blast_radius_computed'
  | 'chaos.rollback_triggered'
  | 'chaos.game_day_recorded'
  // data-pipeline (v2.2)
  | 'pipeline.lineage_captured'
  | 'pipeline.freshness_evaluated'
  | 'pipeline.schema_drift_detected'
  | 'pipeline.data_quality_scored'
  // aiops (v2.2)
  | 'aiops.anomaly_detected'
  | 'aiops.remediation_executed'
  | 'aiops.root_cause_analyzed'
  | 'aiops.alerts_correlated';

export interface AxisStep<TState extends string> {
  neutralEvent: NeutralEventName;
  providerEvent: string;
  state: TState;
  timestampMs: number;
  metadata: Record<string, string | number | boolean>;
}

const dialect: Record<ObservabilityTarget, Partial<Record<NeutralEventName, string>>> = {
  'grafana-oss': {
    // v2.1
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
    // v2.2
    'iac.plan_captured': 'grafana.iac.plan',
    'iac.drift_detected': 'grafana.iac.drift',
    'iac.policy_evaluated': 'grafana.iac.opa.eval',
    'iac.cost_attributed': 'grafana.iac.cost',
    'mesh.mtls_handshaked': 'grafana.mesh.mtls',
    'mesh.sidecar_injected': 'grafana.mesh.sidecar.inject',
    'mesh.circuit_breaker_tripped': 'grafana.mesh.cb.trip',
    'mesh.traffic_split_applied': 'grafana.mesh.traffic.split',
    'ebpf.userspace_probed': 'grafana.ebpf.uprobe',
    'ebpf.kernel_traced': 'grafana.ebpf.kprobe',
    'ebpf.syscall_recorded': 'grafana.ebpf.syscall',
    'ebpf.network_flow_captured': 'grafana.ebpf.netflow',
    'llmobs.token_counted': 'grafana.llmobs.tokens',
    'llmobs.prompt_logged': 'grafana.llmobs.prompt',
    'llmobs.hallucination_flagged': 'grafana.llmobs.hallucination',
    'llmobs.budget_checked': 'grafana.llmobs.budget',
    'finops.cost_per_request_recorded': 'grafana.finops.cpr',
    'finops.team_attributed': 'grafana.finops.team',
    'finops.rightsizing_recommended': 'grafana.finops.rightsize',
    'finops.spot_optimized': 'grafana.finops.spot',
    'chaos.fault_injected': 'grafana.chaos.fault',
    'chaos.blast_radius_computed': 'grafana.chaos.blast',
    'chaos.rollback_triggered': 'grafana.chaos.rollback',
    'chaos.game_day_recorded': 'grafana.chaos.gameday',
    'pipeline.lineage_captured': 'grafana.pipeline.lineage',
    'pipeline.freshness_evaluated': 'grafana.pipeline.freshness',
    'pipeline.schema_drift_detected': 'grafana.pipeline.schema.drift',
    'pipeline.data_quality_scored': 'grafana.pipeline.dq.score',
    'aiops.anomaly_detected': 'grafana.aiops.anomaly',
    'aiops.remediation_executed': 'grafana.aiops.remediate',
    'aiops.root_cause_analyzed': 'grafana.aiops.rca',
    'aiops.alerts_correlated': 'grafana.aiops.correlate',
  },
  prometheus: {
    // v2.1
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
    // v2.2
    'iac.plan_captured': 'prom.iac.plan.export',
    'iac.drift_detected': 'prom.iac.drift.gauge',
    'iac.policy_evaluated': 'prom.iac.opa.result',
    'iac.cost_attributed': 'prom.iac.cost.metric',
    'mesh.mtls_handshaked': 'prom.mesh.mtls.total',
    'mesh.sidecar_injected': 'prom.mesh.sidecar.total',
    'mesh.circuit_breaker_tripped': 'prom.mesh.circuit_breaker.state',
    'mesh.traffic_split_applied': 'prom.mesh.traffic_split.applied',
    'ebpf.userspace_probed': 'prom.ebpf.uprobe.samples',
    'ebpf.kernel_traced': 'prom.ebpf.kprobe.samples',
    'ebpf.syscall_recorded': 'prom.ebpf.syscall.samples',
    'ebpf.network_flow_captured': 'prom.ebpf.flow.bytes_total',
    'llmobs.token_counted': 'prom.llm.tokens_total',
    'llmobs.prompt_logged': 'prom.llm.prompt.length',
    'llmobs.hallucination_flagged': 'prom.llm.hallucination_total',
    'llmobs.budget_checked': 'prom.llm.budget.spend_ratio',
    'finops.cost_per_request_recorded': 'prom.finops.cost_per_request',
    'finops.team_attributed': 'prom.finops.team_cost_total',
    'finops.rightsizing_recommended': 'prom.finops.rightsize.gauge',
    'finops.spot_optimized': 'prom.finops.spot.savings_ratio',
    'chaos.fault_injected': 'prom.chaos.faults_total',
    'chaos.blast_radius_computed': 'prom.chaos.blast_radius.gauge',
    'chaos.rollback_triggered': 'prom.chaos.rollbacks_total',
    'chaos.game_day_recorded': 'prom.chaos.game_day.duration',
    'pipeline.lineage_captured': 'prom.pipeline.lineage.edges',
    'pipeline.freshness_evaluated': 'prom.pipeline.freshness.seconds',
    'pipeline.schema_drift_detected': 'prom.pipeline.schema_drift_total',
    'pipeline.data_quality_scored': 'prom.pipeline.dq.score',
    'aiops.anomaly_detected': 'prom.aiops.anomalies_total',
    'aiops.remediation_executed': 'prom.aiops.remediations_total',
    'aiops.root_cause_analyzed': 'prom.aiops.rca_total',
    'aiops.alerts_correlated': 'prom.aiops.correlations_total',
  },
  loki: {
    // v2.1
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
    // v2.2
    'iac.plan_captured': 'loki.iac.plan.log',
    'iac.drift_detected': 'loki.iac.drift.log',
    'iac.policy_evaluated': 'loki.iac.opa.log',
    'iac.cost_attributed': 'loki.iac.cost.log',
    'mesh.mtls_handshaked': 'loki.mesh.mtls.log',
    'mesh.sidecar_injected': 'loki.mesh.sidecar.log',
    'mesh.circuit_breaker_tripped': 'loki.mesh.cb.log',
    'mesh.traffic_split_applied': 'loki.mesh.traffic.log',
    'ebpf.userspace_probed': 'loki.ebpf.uprobe.log',
    'ebpf.kernel_traced': 'loki.ebpf.kprobe.log',
    'ebpf.syscall_recorded': 'loki.ebpf.syscall.log',
    'ebpf.network_flow_captured': 'loki.ebpf.flow.log',
    'llmobs.token_counted': 'loki.llm.tokens.log',
    'llmobs.prompt_logged': 'loki.llm.prompt.log',
    'llmobs.hallucination_flagged': 'loki.llm.hallucination.log',
    'llmobs.budget_checked': 'loki.llm.budget.log',
    'finops.cost_per_request_recorded': 'loki.finops.cpr.log',
    'finops.team_attributed': 'loki.finops.team.log',
    'finops.rightsizing_recommended': 'loki.finops.rightsize.log',
    'finops.spot_optimized': 'loki.finops.spot.log',
    'chaos.fault_injected': 'loki.chaos.fault.log',
    'chaos.blast_radius_computed': 'loki.chaos.blast.log',
    'chaos.rollback_triggered': 'loki.chaos.rollback.log',
    'chaos.game_day_recorded': 'loki.chaos.gameday.log',
    'pipeline.lineage_captured': 'loki.pipeline.lineage.log',
    'pipeline.freshness_evaluated': 'loki.pipeline.freshness.log',
    'pipeline.schema_drift_detected': 'loki.pipeline.schema.log',
    'pipeline.data_quality_scored': 'loki.pipeline.dq.log',
    'aiops.anomaly_detected': 'loki.aiops.anomaly.log',
    'aiops.remediation_executed': 'loki.aiops.remediation.log',
    'aiops.root_cause_analyzed': 'loki.aiops.rca.log',
    'aiops.alerts_correlated': 'loki.aiops.correlate.log',
  },
  'otel-collector': {
    // v2.1
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
    // v2.2
    'iac.plan_captured': 'otel.iac.plan.span',
    'iac.drift_detected': 'otel.iac.drift.metric',
    'iac.policy_evaluated': 'otel.iac.opa.event',
    'iac.cost_attributed': 'otel.iac.cost.metric',
    'mesh.mtls_handshaked': 'otel.mesh.mtls.span',
    'mesh.sidecar_injected': 'otel.mesh.sidecar.event',
    'mesh.circuit_breaker_tripped': 'otel.mesh.circuitbreaker.event',
    'mesh.traffic_split_applied': 'otel.mesh.trafficsplit.event',
    'ebpf.userspace_probed': 'otel.ebpf.uprobe.span',
    'ebpf.kernel_traced': 'otel.ebpf.kprobe.span',
    'ebpf.syscall_recorded': 'otel.ebpf.syscall.span',
    'ebpf.network_flow_captured': 'otel.ebpf.netflow.metric',
    'llmobs.token_counted': 'otel.genai.tokens',
    'llmobs.prompt_logged': 'otel.genai.prompt.log',
    'llmobs.hallucination_flagged': 'otel.genai.hallucination.event',
    'llmobs.budget_checked': 'otel.genai.budget.metric',
    'finops.cost_per_request_recorded': 'otel.finops.cpr.metric',
    'finops.team_attributed': 'otel.finops.team.attribute',
    'finops.rightsizing_recommended': 'otel.finops.rightsize.event',
    'finops.spot_optimized': 'otel.finops.spot.event',
    'chaos.fault_injected': 'otel.chaos.fault.event',
    'chaos.blast_radius_computed': 'otel.chaos.blast.metric',
    'chaos.rollback_triggered': 'otel.chaos.rollback.event',
    'chaos.game_day_recorded': 'otel.chaos.gameday.event',
    'pipeline.lineage_captured': 'otel.pipeline.lineage.event',
    'pipeline.freshness_evaluated': 'otel.pipeline.freshness.metric',
    'pipeline.schema_drift_detected': 'otel.pipeline.schema.event',
    'pipeline.data_quality_scored': 'otel.pipeline.dq.metric',
    'aiops.anomaly_detected': 'otel.aiops.anomaly.event',
    'aiops.remediation_executed': 'otel.aiops.remediation.event',
    'aiops.root_cause_analyzed': 'otel.aiops.rca.event',
    'aiops.alerts_correlated': 'otel.aiops.correlation.event',
  },
};

export function providerEventName(
  target: ObservabilityTarget,
  neutral: NeutralEventName,
): string {
  return dialect[target][neutral] ?? neutral;
}
