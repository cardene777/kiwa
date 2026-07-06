import { describe, expect, it } from 'vitest';
import {
  computeErrorBudget,
  evaluateBurnRate,
  fireMultiWindowMultiBurnRateAlert,
  openSLOWindow,
  recordRequests,
  startSLO,
} from '../../src/semantics/index.js';

const threshold = {
  shortWindowMinutes: 5,
  longWindowMinutes: 60,
  burnRate: 14.4,
};

describe('slo axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'api-availability', targetObjective: 0.999, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 1_000_000, errors: 500 });
    computeErrorBudget(s);
    evaluateBurnRate(s, threshold);
    fireMultiWindowMultiBurnRateAlert(s, { thresholds: [threshold], page: true });
    expect(s.state).toBe('alert-fired');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'slo.window_opened',
      'slo.error_budget_computed',
      'slo.burn_rate_evaluated',
      'slo.multi_window_alert_fired',
    ]);
  });

  it('computes error budget seconds from objective', () => {
    const s = startSLO({ target: 'grafana-oss', sloId: 'api-availability', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    computeErrorBudget(s);
    expect(s.errorBudgetSeconds).toBeCloseTo(0.01 * 30 * 86400, 6);
  });

  it('burn rate reflects actual vs allowed error rate', () => {
    const s = startSLO({ target: 'loki', sloId: 'ingest', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 10_000, errors: 200 });
    computeErrorBudget(s);
    evaluateBurnRate(s, threshold);
    // actual = 0.02, allowed = 0.01, burn = 2
    expect(s.burnRate).toBeCloseTo(2, 6);
  });

  it('fires alert when burn rate exceeds threshold', () => {
    const s = startSLO({ target: 'otel-collector', sloId: 'ingest', targetObjective: 0.999, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 100, errors: 20 });
    computeErrorBudget(s);
    evaluateBurnRate(s, threshold);
    const step = fireMultiWindowMultiBurnRateAlert(s, { thresholds: [threshold], page: true });
    expect(step.metadata.fired).toBe(true);
  });

  it('does not fire alert when burn rate is below threshold', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'ingest', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 1_000_000, errors: 100 });
    computeErrorBudget(s);
    evaluateBurnRate(s, threshold);
    const step = fireMultiWindowMultiBurnRateAlert(s, { thresholds: [threshold], page: false });
    expect(step.metadata.fired).toBe(false);
  });

  it('translates provider event for each target', () => {
    for (const target of ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const) {
      const s = startSLO({ target, sloId: 'x', targetObjective: 0.99, windowDays: 7 });
      const step = openSLOWindow(s);
      expect(step.providerEvent).not.toBe(step.neutralEvent);
      expect(step.providerEvent).toMatch(/\.(slo|alert|ruler|processor)\./);
    }
  });
});

describe('slo axis — invariant guards', () => {
  it('rejects empty sloId', () => {
    expect(() =>
      startSLO({ target: 'prometheus', sloId: '', targetObjective: 0.99, windowDays: 30 }),
    ).toThrow(/sloId must not be empty/);
  });

  it('rejects target objective out of range', () => {
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0, windowDays: 30 }),
    ).toThrow(/targetObjective/);
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 1, windowDays: 30 }),
    ).toThrow(/targetObjective/);
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: -0.1, windowDays: 30 }),
    ).toThrow(/targetObjective/);
  });

  it('rejects non-positive windowDays', () => {
    expect(() =>
      startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 0 }),
    ).toThrow(/windowDays/);
  });

  it('cannot open window twice', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    expect(() => openSLOWindow(s)).toThrow(/not idle/);
  });

  it('cannot record before window opened', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    expect(() => recordRequests(s, { requests: 10, errors: 1 })).toThrow(/window must be opened/);
  });

  it('rejects negative requests / errors', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    expect(() => recordRequests(s, { requests: -1, errors: 0 })).toThrow(/non-negative/);
    expect(() => recordRequests(s, { requests: 10, errors: -1 })).toThrow(/non-negative/);
  });

  it('rejects errors exceeding requests', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    expect(() => recordRequests(s, { requests: 5, errors: 10 })).toThrow(/must not exceed/);
  });

  it('cannot compute error budget before opening window', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    expect(() => computeErrorBudget(s)).toThrow(/not window-open/);
  });

  it('cannot evaluate burn rate before computing budget', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    expect(() => evaluateBurnRate(s, threshold)).toThrow(/not budget-computed/);
  });

  it('cannot fire alert before evaluating burn rate', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    computeErrorBudget(s);
    expect(() => fireMultiWindowMultiBurnRateAlert(s, { thresholds: [threshold], page: false })).toThrow(
      /not burn-evaluated/,
    );
  });

  it('rejects empty thresholds when firing alert', () => {
    const s = startSLO({ target: 'prometheus', sloId: 'x', targetObjective: 0.99, windowDays: 30 });
    openSLOWindow(s);
    recordRequests(s, { requests: 10, errors: 2 });
    computeErrorBudget(s);
    evaluateBurnRate(s, threshold);
    expect(() => fireMultiWindowMultiBurnRateAlert(s, { thresholds: [], page: false })).toThrow(
      /thresholds must not be empty/,
    );
  });
});
