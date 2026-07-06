/**
 * Error-budget policy tests — exercise the 3 policy branches (ship /
 * freeze / page) across the 3 canonical objectives (99.9 / 99.95 /
 * 99.99). Each policy encodes production judgement about when to pause
 * deploys versus paging the on-call.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { POLICY_99_9, POLICY_99_95, POLICY_99_99 } from '../src/policies/error-budget.js';

describe('dogfood-observability-slo-app — error-budget policy', () => {
  it('T-DFS-EB-001 policy 99.9 ships at 0.0 consumed (100% remaining)', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.0,
    });
    expect(result.action).toBe('ship');
    expect(result.remainingBudgetFraction).toBe(1.0);
  });

  it('T-DFS-EB-002 policy 99.9 ships until 75% consumed (25% remaining boundary)', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.7,
    });
    expect(result.action).toBe('ship');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.3, 5);
  });

  it('T-DFS-EB-003 policy 99.9 freezes deploys when remaining drops below 25%', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.8,
    });
    expect(result.action).toBe('freeze');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.2, 5);
  });

  it('T-DFS-EB-004 policy 99.9 pages when remaining drops below 10%', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.95,
    });
    expect(result.action).toBe('page');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.05, 5);
  });

  it('T-DFS-EB-005 policy 99.95 freezes deploys at tighter 30% threshold', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_95,
      consumedFraction: 0.75,
    });
    expect(result.action).toBe('freeze');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.25, 5);
  });

  it('T-DFS-EB-006 policy 99.95 pages at 15% remaining', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_95,
      consumedFraction: 0.9,
    });
    expect(result.action).toBe('page');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.1, 5);
  });

  it('T-DFS-EB-007 policy 99.99 (payment) freezes deploys at 50% threshold', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_99,
      consumedFraction: 0.55,
    });
    expect(result.action).toBe('freeze');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.45, 5);
  });

  it('T-DFS-EB-008 policy 99.99 pages at 25% remaining (payment surface strict)', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_99,
      consumedFraction: 0.8,
    });
    expect(result.action).toBe('page');
    expect(result.remainingBudgetFraction).toBeCloseTo(0.2, 5);
  });

  it('T-DFS-EB-009 policy at 100% consumed returns remaining=0 with page action', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 1.0,
    });
    expect(result.remainingBudgetFraction).toBe(0);
    expect(result.action).toBe('page');
  });

  it('T-DFS-EB-010 policy at >100% consumed clamps remaining to 0 (no negative)', async () => {
    const mock = makeMockAdapter();
    const result = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 1.5,
    });
    expect(result.remainingBudgetFraction).toBe(0);
    expect(result.action).toBe('page');
  });

  it('T-DFS-EB-011 policy freeze / page / ship reason text is human-readable', async () => {
    const mock = makeMockAdapter();
    const ship = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.1,
    });
    expect(ship.reason).toContain('ship');
    const freeze = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.8,
    });
    expect(freeze.reason).toContain('freeze');
    const page = await mock.evaluatePolicy({
      policy: POLICY_99_9,
      consumedFraction: 0.95,
    });
    expect(page.reason).toContain('page');
  });

  it('T-DFS-EB-012 evaluatePolicy trace emits slo.policy_evaluated event', async () => {
    const mock = makeMockAdapter();
    await mock.evaluatePolicy({ policy: POLICY_99_9, consumedFraction: 0.5 });
    const trace = mock.trace();
    expect(trace).toHaveLength(1);
    expect(trace[0]?.op).toBe('evaluatePolicy');
    expect(trace[0]?.neutralEvent).toBe('slo.policy_evaluated');
  });

  it('T-DFS-EB-013 3 policies have escalating strictness (99.9 < 99.95 < 99.99 freeze)', async () => {
    expect(POLICY_99_9.freezeThreshold).toBeLessThan(POLICY_99_95.freezeThreshold);
    expect(POLICY_99_95.freezeThreshold).toBeLessThan(POLICY_99_99.freezeThreshold);
    expect(POLICY_99_9.pageThreshold).toBeLessThan(POLICY_99_95.pageThreshold);
    expect(POLICY_99_95.pageThreshold).toBeLessThan(POLICY_99_99.pageThreshold);
  });
});
