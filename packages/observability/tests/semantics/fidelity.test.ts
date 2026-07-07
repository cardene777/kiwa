import { describe, expect, it } from 'vitest';
import {
  OBSERVABILITY_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type ObservabilityAxis,
} from '../../src/semantics/index.js';

describe('observability fidelity coverage', () => {
  it('collects 4 targets x 16 axes = 64 grid', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    expect(coverage.axes).toHaveLength(16);
    expect(coverage.rows).toHaveLength(64);
  });

  it('maps every axis to four neutral events', () => {
    for (const events of Object.values(OBSERVABILITY_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('keeps the combined 16-axis story in one grid', () => {
    const axes = Object.keys(OBSERVABILITY_AXIS_TO_EVENTS) as ObservabilityAxis[];
    expect(axes).toEqual([
      // v2.1 baseline
      'slo',
      'red-use',
      'exemplar',
      'otel-advanced',
      'log-correlation-advanced',
      'alert-routing-advanced',
      'profiling',
      'cardinality',
      // v2.2 advanced III
      'iac',
      'service-mesh',
      'ebpf-iii',
      'llm-observability',
      'finops',
      'chaos',
      'data-pipeline',
      'aiops',
    ]);
  });

  it('translates grafana-oss and prometheus dialects differently', () => {
    expect(providerEventName('grafana-oss', 'slo.burn_rate_evaluated')).toBe('grafana.slo.burn.eval');
    expect(providerEventName('prometheus', 'slo.burn_rate_evaluated')).toBe('prom.slo.burn.eval');
  });

  it('translates loki and otel-collector dialects differently', () => {
    expect(providerEventName('loki', 'logcorr.trace_id_joined')).toBe('loki.log.trace_id.join');
    expect(providerEventName('otel-collector', 'logcorr.trace_id_joined')).toBe(
      'otel.log.trace_id.correlate',
    );
  });

  it('supports subset target collection', () => {
    const coverage = collectFidelityCoverage(['loki']);
    expect(coverage.rows).toHaveLength(16);
    expect(coverage.rows.every((row) => row.provider === 'loki')).toBe(true);
  });

  it('each row has matching neutral and provider event counts', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      expect(row.providerEvents).toHaveLength(row.neutralEvents.length);
    }
  });

  it('each row provider event dialect is non-neutral', () => {
    const coverage = collectFidelityCoverage();
    for (const row of coverage.rows) {
      for (let i = 0; i < row.neutralEvents.length; i++) {
        expect(row.providerEvents[i]).not.toBe(row.neutralEvents[i]);
      }
    }
  });

  it('provider events are unique across a single target', () => {
    const coverage = collectFidelityCoverage();
    for (const provider of coverage.providers) {
      const events = coverage.rows
        .filter((r) => r.provider === provider)
        .flatMap((r) => r.providerEvents);
      const unique = new Set(events);
      expect(unique.size).toBe(events.length);
    }
  });

  it('v2.2 advanced III axes translate for grafana-oss', () => {
    expect(providerEventName('grafana-oss', 'iac.drift_detected')).toBe('grafana.iac.drift');
    expect(providerEventName('grafana-oss', 'mesh.mtls_handshaked')).toBe('grafana.mesh.mtls');
    expect(providerEventName('grafana-oss', 'llmobs.token_counted')).toBe('grafana.llmobs.tokens');
    expect(providerEventName('grafana-oss', 'aiops.anomaly_detected')).toBe('grafana.aiops.anomaly');
  });

  it('v2.2 advanced III axes translate for prometheus', () => {
    expect(providerEventName('prometheus', 'chaos.fault_injected')).toBe('prom.chaos.faults_total');
    expect(providerEventName('prometheus', 'pipeline.freshness_evaluated')).toBe(
      'prom.pipeline.freshness.seconds',
    );
    expect(providerEventName('prometheus', 'finops.cost_per_request_recorded')).toBe(
      'prom.finops.cost_per_request',
    );
  });
});
