import {
  providerEventName,
  type NeutralEventName,
  type ObservabilityAxis,
  type ObservabilityTarget,
} from './types.js';

export interface FidelityRow {
  provider: ObservabilityTarget;
  axis: ObservabilityAxis;
  neutralEvents: NeutralEventName[];
  providerEvents: string[];
}

export interface FidelityCoverage {
  providers: ObservabilityTarget[];
  axes: ObservabilityAxis[];
  rows: FidelityRow[];
}

export const OBSERVABILITY_AXIS_TO_EVENTS: Record<ObservabilityAxis, NeutralEventName[]> = {
  // v2.1 baseline
  slo: [
    'slo.window_opened',
    'slo.error_budget_computed',
    'slo.burn_rate_evaluated',
    'slo.multi_window_alert_fired',
  ],
  'red-use': [
    'red.rate_recorded',
    'red.errors_recorded',
    'red.duration_recorded',
    'use.saturation_recorded',
  ],
  exemplar: [
    'exemplar.metric_recorded',
    'exemplar.trace_attached',
    'exemplar.metric_to_trace_resolved',
    'exemplar.trace_to_metric_resolved',
  ],
  'otel-advanced': [
    'otel.batch_flushed',
    'otel.resource_detected',
    'otel.baggage_propagated',
    'otel.w3c_context_extracted',
  ],
  'log-correlation-advanced': [
    'logcorr.structured_log_emitted',
    'logcorr.trace_id_joined',
    'logcorr.logql_promql_joined',
    'logcorr.correlation_index_built',
  ],
  'alert-routing-advanced': [
    'alertrt.silence_applied',
    'alertrt.inhibit_applied',
    'alertrt.escalation_advanced',
    'alertrt.oncall_paged',
  ],
  profiling: [
    'profile.cpu_sampled',
    'profile.memory_sampled',
    'profile.off_cpu_sampled',
    'profile.flame_graph_built',
  ],
  cardinality: [
    'cardinality.series_scanned',
    'cardinality.high_cardinality_detected',
    'cardinality.label_reduced',
    'cardinality.histogram_bucketed',
  ],
  // v2.2 advanced III
  iac: [
    'iac.plan_captured',
    'iac.drift_detected',
    'iac.policy_evaluated',
    'iac.cost_attributed',
  ],
  'service-mesh': [
    'mesh.mtls_handshaked',
    'mesh.sidecar_injected',
    'mesh.circuit_breaker_tripped',
    'mesh.traffic_split_applied',
  ],
  'ebpf-iii': [
    'ebpf.userspace_probed',
    'ebpf.kernel_traced',
    'ebpf.syscall_recorded',
    'ebpf.network_flow_captured',
  ],
  'llm-observability': [
    'llmobs.token_counted',
    'llmobs.prompt_logged',
    'llmobs.hallucination_flagged',
    'llmobs.budget_checked',
  ],
  finops: [
    'finops.cost_per_request_recorded',
    'finops.team_attributed',
    'finops.rightsizing_recommended',
    'finops.spot_optimized',
  ],
  chaos: [
    'chaos.fault_injected',
    'chaos.blast_radius_computed',
    'chaos.rollback_triggered',
    'chaos.game_day_recorded',
  ],
  'data-pipeline': [
    'pipeline.lineage_captured',
    'pipeline.freshness_evaluated',
    'pipeline.schema_drift_detected',
    'pipeline.data_quality_scored',
  ],
  aiops: [
    'aiops.anomaly_detected',
    'aiops.remediation_executed',
    'aiops.root_cause_analyzed',
    'aiops.alerts_correlated',
  ],
};

export function collectFidelityCoverage(
  providers: ObservabilityTarget[] = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'],
): FidelityCoverage {
  const axes = Object.keys(OBSERVABILITY_AXIS_TO_EVENTS) as ObservabilityAxis[];
  const rows: FidelityRow[] = [];
  for (const provider of providers) {
    for (const axis of axes) {
      const neutralEvents = OBSERVABILITY_AXIS_TO_EVENTS[axis];
      const providerEvents = neutralEvents.map((event) => providerEventName(provider, event));
      rows.push({ provider, axis, neutralEvents, providerEvents });
    }
  }
  return { providers, axes, rows };
}
