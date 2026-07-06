import { describe, expect, it } from 'vitest';
import {
  collectFidelityCoverage,
  providerEventName,
  type ObservabilityAxis,
  type ObservabilityTarget,
} from '../../src/semantics/index.js';

const AXES: ObservabilityAxis[] = [
  'slo',
  'red-use',
  'exemplar',
  'otel-advanced',
  'log-correlation-advanced',
  'alert-routing-advanced',
  'profiling',
  'cardinality',
];
const TARGETS: ObservabilityTarget[] = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'];

describe('v2.1 observability target parity', () => {
  const coverage = collectFidelityCoverage();

  for (const provider of TARGETS) {
    for (const axis of AXES) {
      it(`${provider} x ${axis}: has non-empty provider events`, () => {
        const row = coverage.rows.find((r) => r.provider === provider && r.axis === axis);
        expect(row).toBeDefined();
        // Provider dialect must start with the provider prefix
        // (grafana / prom / loki / otel), not with a raw axis prefix
        // like `red.` / `use.` / `logcorr.` / `alertrt.` / `profile.` /
        // `cardinality.` / `exemplar.` (the raw neutral namespaces).
        const providerPrefix = {
          'grafana-oss': 'grafana',
          prometheus: 'prom',
          loki: 'loki',
          'otel-collector': 'otel',
        }[provider];
        for (const event of row?.providerEvents ?? []) {
          expect(event.length).toBeGreaterThan(0);
          expect(event).toMatch(new RegExp(`^${providerPrefix}\\.`));
        }
      });
    }
  }

  it('SLO burn rate differs across targets', () => {
    expect(providerEventName('grafana-oss', 'slo.burn_rate_evaluated')).toBe('grafana.slo.burn.eval');
    expect(providerEventName('prometheus', 'slo.burn_rate_evaluated')).toBe('prom.slo.burn.eval');
    expect(providerEventName('loki', 'slo.burn_rate_evaluated')).toBe('loki.slo.burn');
    expect(providerEventName('otel-collector', 'slo.burn_rate_evaluated')).toBe('otel.slo.burn');
  });

  it('exemplar attach differs across targets', () => {
    expect(providerEventName('grafana-oss', 'exemplar.trace_attached')).toBe('grafana.exemplar.trace.attach');
    expect(providerEventName('prometheus', 'exemplar.trace_attached')).toBe('prom.exemplar.attach');
    expect(providerEventName('otel-collector', 'exemplar.trace_attached')).toBe('otel.exemplar.attach');
  });

  it('cardinality reduce differs across targets', () => {
    expect(providerEventName('prometheus', 'cardinality.label_reduced')).toBe('prom.relabel.drop');
    expect(providerEventName('otel-collector', 'cardinality.label_reduced')).toBe(
      'otel.processor.attribute.drop',
    );
    expect(providerEventName('loki', 'cardinality.label_reduced')).toBe('loki.label.drop');
  });

  it('profiling flame differs across targets', () => {
    expect(providerEventName('grafana-oss', 'profile.flame_graph_built')).toBe('grafana.pyroscope.flame');
    expect(providerEventName('prometheus', 'profile.flame_graph_built')).toBe('prom.parca.flame');
  });
});
