import { describe, expect, it } from 'vitest';
import {
  OBSERVABILITY_AXIS_TO_EVENTS,
  collectFidelityCoverage,
  providerEventName,
  type ObservabilityAxis,
} from '../../src/semantics/index.js';

describe('observability fidelity coverage', () => {
  it('collects 4 targets x 8 axes = 32 grid', () => {
    const coverage = collectFidelityCoverage();
    expect(coverage.providers).toEqual(['grafana-oss', 'prometheus', 'loki', 'otel-collector']);
    expect(coverage.axes).toHaveLength(8);
    expect(coverage.rows).toHaveLength(32);
  });

  it('maps every axis to four neutral events', () => {
    for (const events of Object.values(OBSERVABILITY_AXIS_TO_EVENTS)) {
      expect(events).toHaveLength(4);
    }
  });

  it('keeps the combined 8-axis story in one grid', () => {
    const axes = Object.keys(OBSERVABILITY_AXIS_TO_EVENTS) as ObservabilityAxis[];
    expect(axes).toEqual([
      'slo',
      'red-use',
      'exemplar',
      'otel-advanced',
      'log-correlation-advanced',
      'alert-routing-advanced',
      'profiling',
      'cardinality',
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
    expect(coverage.rows).toHaveLength(8);
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
});
