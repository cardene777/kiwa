import { describe, expect, it } from 'vitest';
import {
  computeFourGoldenSignals,
  recordDuration,
  recordErrors,
  recordRequestRate,
  recordSaturation,
  startRedUse,
} from '../../src/semantics/index.js';

describe('red-use axis — happy path', () => {
  it('records rate → errors → duration → saturation', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'api' });
    recordRequestRate(s, { requests: 100, windowSeconds: 10 });
    recordErrors(s, { errors: 5 });
    recordDuration(s, { durationMs: 42 });
    recordSaturation(s, { saturation: 0.75 });
    expect(s.state).toBe('saturation-tracked');
    expect(s.history).toHaveLength(4);
  });

  it('rps in metadata reflects rate', () => {
    const s = startRedUse({ target: 'grafana-oss', serviceName: 'api' });
    const step = recordRequestRate(s, { requests: 200, windowSeconds: 10 });
    expect(step.metadata.rps).toBe(20);
  });

  it('cumulative error rate is captured', () => {
    const s = startRedUse({ target: 'loki', serviceName: 'api' });
    recordRequestRate(s, { requests: 100, windowSeconds: 10 });
    const step = recordErrors(s, { errors: 25 });
    expect(step.metadata.errorRate).toBeCloseTo(0.25, 6);
  });

  it('duration samples accumulate', () => {
    const s = startRedUse({ target: 'otel-collector', serviceName: 'api' });
    recordRequestRate(s, { requests: 3, windowSeconds: 1 });
    recordDuration(s, { durationMs: 10 });
    recordDuration(s, { durationMs: 20 });
    recordDuration(s, { durationMs: 30 });
    expect(s.durationSamplesMs).toEqual([10, 20, 30]);
  });

  it('computes four golden signals correctly', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'api' });
    recordRequestRate(s, { requests: 100, windowSeconds: 10 });
    recordErrors(s, { errors: 10 });
    for (let i = 1; i <= 100; i++) {
      recordDuration(s, { durationMs: i });
    }
    recordSaturation(s, { saturation: 0.5 });
    recordSaturation(s, { saturation: 0.7 });
    const golden = computeFourGoldenSignals(s);
    expect(golden.errorRate).toBeCloseTo(0.1, 6);
    expect(golden.trafficRps).toBe(100);
    expect(golden.latencyP99Ms).toBe(99);
    expect(golden.saturation).toBeCloseTo(0.6, 6);
  });

  it('returns zeroed golden signals when no samples', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'empty' });
    const golden = computeFourGoldenSignals(s);
    expect(golden).toEqual({ latencyP99Ms: 0, trafficRps: 0, errorRate: 0, saturation: 0 });
  });

  it('translates provider event for each target', () => {
    const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;
    for (const target of targets) {
      const s = startRedUse({ target, serviceName: 'x' });
      const step = recordRequestRate(s, { requests: 1, windowSeconds: 1 });
      expect(step.providerEvent).not.toBe(step.neutralEvent);
    }
  });
});

describe('red-use axis — invariant guards', () => {
  it('rejects empty serviceName', () => {
    expect(() => startRedUse({ target: 'prometheus', serviceName: '' })).toThrow(/serviceName/);
  });

  it('rejects negative requests', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    expect(() => recordRequestRate(s, { requests: -1, windowSeconds: 1 })).toThrow(/non-negative/);
  });

  it('rejects non-positive windowSeconds', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    expect(() => recordRequestRate(s, { requests: 10, windowSeconds: 0 })).toThrow(/positive/);
  });

  it('cannot record errors before rate', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    expect(() => recordErrors(s, { errors: 1 })).toThrow(/rate must be recorded first/);
  });

  it('rejects negative errors', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 10, windowSeconds: 1 });
    expect(() => recordErrors(s, { errors: -1 })).toThrow(/non-negative/);
  });

  it('rejects errors exceeding total requests', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 10, windowSeconds: 1 });
    expect(() => recordErrors(s, { errors: 20 })).toThrow(/must not exceed/);
  });

  it('cannot record duration before rate', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    expect(() => recordDuration(s, { durationMs: 5 })).toThrow(/rate must be recorded first/);
  });

  it('rejects negative durationMs', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    recordRequestRate(s, { requests: 10, windowSeconds: 1 });
    expect(() => recordDuration(s, { durationMs: -1 })).toThrow(/non-negative/);
  });

  it('rejects saturation outside [0,1]', () => {
    const s = startRedUse({ target: 'prometheus', serviceName: 'x' });
    expect(() => recordSaturation(s, { saturation: -0.1 })).toThrow(/\[0, 1\]/);
    expect(() => recordSaturation(s, { saturation: 1.1 })).toThrow(/\[0, 1\]/);
  });
});
