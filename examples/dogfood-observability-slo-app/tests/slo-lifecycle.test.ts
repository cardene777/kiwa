/**
 * SLO lifecycle tests — walk one full lifecycle end-to-end and assert
 * every op appears exactly once on the neutral trace and returns the
 * expected result shape. These tests cover the mock adapter path
 * (state-machine walk) so the observability v2.1 SLO axis semantics
 * remain observable.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import type { SloAdapter } from '../src/adapters/interface.js';
import { runFullSloLifecycle } from '../src/flows/slo-flows.js';
import { SLO_TARGET_99_9, SLO_TARGET_99_95, SLO_TARGET_99_99 } from '../src/policies/objectives.js';
import { POLICY_99_9, POLICY_99_95, POLICY_99_99 } from '../src/policies/error-budget.js';
import { MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN } from '../src/policies/thresholds.js';

function newMock(): SloAdapter {
  return makeMockAdapter();
}

describe('dogfood-observability-slo-app — SLO lifecycle', () => {
  it('T-DFS-LC-001 startSlo returns the requested objective + windowDays', async () => {
    const mock = newMock();
    const result = await mock.startSlo(SLO_TARGET_99_9);
    expect(result.sloId).toBe(SLO_TARGET_99_9.sloId);
    expect(result.targetObjective).toBe(0.999);
    expect(result.windowDays).toBe(28);
  });

  it('T-DFS-LC-002 startSlo emits slo.session_started onto the trace', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('startSlo');
    expect(trace[0]?.neutralEvent).toBe('slo.session_started');
    expect(trace[0]?.ok).toBe(true);
  });

  it('T-DFS-LC-003 openWindow flips the session into window-open state', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    const trace = mock.trace();
    expect(trace).toHaveLength(2);
    expect(trace[1]?.op).toBe('openWindow');
    expect(trace[1]?.neutralEvent).toBe('slo.window_opened');
  });

  it('T-DFS-LC-004 queryRequestCounts returns zero totals before recordRequests', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    const result = await mock.queryRequestCounts({
      sloId: SLO_TARGET_99_9.sloId,
      metricName: 'http_requests_total',
    });
    expect(result.totalRequests).toBe(0);
    expect(result.totalErrors).toBe(0);
    expect(result.errorRate).toBe(0);
    expect(result.metricName).toBe('http_requests_total');
  });

  it('T-DFS-LC-005 recordRequests accumulates counters onto the session', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    await mock.recordRequests({ sloId: SLO_TARGET_99_9.sloId, requests: 100, errors: 5 });
    await mock.recordRequests({ sloId: SLO_TARGET_99_9.sloId, requests: 200, errors: 10 });
    const result = await mock.queryRequestCounts({
      sloId: SLO_TARGET_99_9.sloId,
      metricName: 'http_requests_total',
    });
    expect(result.totalRequests).toBe(300);
    expect(result.totalErrors).toBe(15);
    expect(result.errorRate).toBeCloseTo(0.05, 5);
  });

  it('T-DFS-LC-006 computeErrorBudget returns budget seconds proportional to windowDays', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    const result = await mock.computeErrorBudget(SLO_TARGET_99_9.sloId);
    // 99.9% over 28 days = 0.001 * 28 * 86400 = 2419.2 sec
    expect(result.allowedErrorRate).toBeCloseTo(0.001, 6);
    expect(result.windowSeconds).toBe(28 * 86_400);
    expect(result.errorBudgetSeconds).toBeCloseTo(2419.2, 1);
  });

  it('T-DFS-LC-007 computeErrorBudget for 99.99 is 10x tighter than 99.9', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_99);
    await mock.openWindow(SLO_TARGET_99_99.sloId);
    const result = await mock.computeErrorBudget(SLO_TARGET_99_99.sloId);
    expect(result.allowedErrorRate).toBeCloseTo(0.0001, 7);
    // 99.9 -> 2419.2, 99.99 -> 241.92 (10x tighter)
    expect(result.errorBudgetSeconds).toBeCloseTo(241.92, 2);
  });

  it('T-DFS-LC-008 evaluateBurnRate reports 0 burn rate when no requests observed', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    await mock.computeErrorBudget(SLO_TARGET_99_9.sloId);
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    expect(result.burnRate).toBe(0);
    expect(result.thresholdShortMinutes).toBe(5);
    expect(result.thresholdLongMinutes).toBe(60);
    expect(result.thresholdRate).toBe(14.4);
  });

  it('T-DFS-LC-009 evaluateBurnRate scales with observed error rate ÷ allowed rate', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    // 1% observed vs 0.1% allowed => burn rate 10
    await mock.recordRequests({ sloId: SLO_TARGET_99_9.sloId, requests: 10_000, errors: 100 });
    await mock.computeErrorBudget(SLO_TARGET_99_9.sloId);
    const result = await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    expect(result.burnRate).toBeCloseTo(10, 4);
  });

  it('T-DFS-LC-010 fireMwmbrAlert reports fired when any threshold burn rate is exceeded', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    // burn rate 10 hits ticket (rate 3) + slow (rate 6) but not fast (rate 14.4)
    await mock.recordRequests({ sloId: SLO_TARGET_99_9.sloId, requests: 10_000, errors: 100 });
    await mock.computeErrorBudget(SLO_TARGET_99_9.sloId);
    await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    const result = await mock.fireMwmbrAlert({
      sloId: SLO_TARGET_99_9.sloId,
      thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
      page: true,
    });
    expect(result.fired).toBe(true);
    expect(result.matchedSeverities).toContain('slow');
    expect(result.thresholdCount).toBe(3);
    expect(result.pagerEnabled).toBe(true);
  });

  it('T-DFS-LC-011 fireMwmbrAlert reports not fired when burn rate below all thresholds', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.openWindow(SLO_TARGET_99_9.sloId);
    // burn rate 2 hits nothing
    await mock.recordRequests({ sloId: SLO_TARGET_99_9.sloId, requests: 10_000, errors: 20 });
    await mock.computeErrorBudget(SLO_TARGET_99_9.sloId);
    await mock.evaluateBurnRate({
      sloId: SLO_TARGET_99_9.sloId,
      threshold: MWMBR_FAST_BURN,
    });
    const result = await mock.fireMwmbrAlert({
      sloId: SLO_TARGET_99_9.sloId,
      thresholds: [MWMBR_FAST_BURN, MWMBR_SLOW_BURN, MWMBR_TICKET_BURN],
      page: true,
    });
    expect(result.fired).toBe(false);
    expect(result.matchedSeverities).toHaveLength(0);
  });

  it('T-DFS-LC-012 runFullSloLifecycle emits >=10 trace entries in a single pass', async () => {
    const mock = newMock();
    await runFullSloLifecycle(mock, {
      target: SLO_TARGET_99_9,
      policy: POLICY_99_9,
      consumedFraction: 0.9,
      workload: { requests: 10_000, errors: 100 },
      page: true,
      silenceRoute: true,
    });
    const trace = mock.trace();
    expect(trace.length).toBeGreaterThanOrEqual(10);
    const ops = trace.map((t) => t.op);
    expect(ops).toContain('startSlo');
    expect(ops).toContain('openWindow');
    expect(ops).toContain('queryRequestCounts');
    expect(ops).toContain('recordRequests');
    expect(ops).toContain('computeErrorBudget');
    expect(ops).toContain('evaluateBurnRate');
    expect(ops).toContain('fireMwmbrAlert');
    expect(ops).toContain('evaluatePolicy');
    expect(ops).toContain('routeAlert');
    expect(ops).toContain('silenceAlert');
  });

  it('T-DFS-LC-013 reset drops all sessions and clears the trace', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    await mock.reset();
    expect(mock.trace()).toHaveLength(0);
    await expect(mock.openWindow(SLO_TARGET_99_9.sloId)).rejects.toThrow(/has not been started/);
  });

  it('T-DFS-LC-014 requireSession throws when queryRequestCounts hits an unstarted sloId', async () => {
    const mock = newMock();
    await expect(
      mock.queryRequestCounts({ sloId: 'unknown', metricName: 'x' }),
    ).rejects.toThrow(/has not been started/);
  });

  it('T-DFS-LC-015 SLO 99.95 policy freezes deploys at 30% remaining threshold', async () => {
    const mock = newMock();
    // 70% consumed = 30% remaining exactly on threshold boundary
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_95,
      consumedFraction: 0.71,
    });
    expect(result.action).toBe('freeze');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.29, 5);
    expect(result.reason).toContain('freeze');
  });

  it('T-DFS-LC-016 SLO 99.99 policy pages on-call when remaining below 25%', async () => {
    const mock = newMock();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_99,
      consumedFraction: 0.9,
    });
    expect(result.action).toBe('page');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.1, 5);
    expect(result.reason).toContain('page');
  });

  it('T-DFS-LC-017 policy ships when budget is healthy (well above freeze)', async () => {
    const mock = newMock();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.1,
    });
    expect(result.action).toBe('ship');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.9, 5);
  });

  it('T-DFS-LC-018 silenceAlert marks subsequent routeAlert results as silenced', async () => {
    const mock = newMock();
    await mock.startSlo(SLO_TARGET_99_9);
    const route = await mock.routeAlert({
      sloId: SLO_TARGET_99_9.sloId,
      severity: 'fast',
      channel: 'pager',
    });
    expect(route.silenced).toBe(false);
    await mock.silenceAlert({ routeId: route.routeId, silenceMinutes: 60 });
    const route2 = await mock.routeAlert({
      sloId: SLO_TARGET_99_9.sloId,
      severity: 'fast',
      channel: 'pager',
    });
    expect(route2.silenced).toBe(true);
  });
});
