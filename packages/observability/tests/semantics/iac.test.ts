import { describe, expect, it } from 'vitest';
import {
  attributeCost,
  capturePlan,
  detectDrift,
  evaluatePolicy,
  startIacSession,
} from '../../src/semantics/index.js';

const targets = ['grafana-oss', 'prometheus', 'loki', 'otel-collector'] as const;

describe('iac axis — happy path', () => {
  it('runs full 4-step lifecycle', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'prod' });
    capturePlan(s, {
      changes: [
        { address: 'aws_instance.web[0]', action: 'create' },
        { address: 'aws_instance.web[1]', action: 'update' },
        { address: 'aws_instance.old', action: 'delete' },
      ],
    });
    detectDrift(s, {
      expected: ['aws_instance.web[0]', 'aws_instance.web[1]'],
      actual: ['aws_instance.web[0]', 'aws_instance.web[1]'],
    });
    evaluatePolicy(s, {
      results: [{ policyId: 'no-public-s3', passed: true, violationCount: 0 }],
    });
    attributeCost(s, {
      attributions: [{ team: 'platform', monthlyCostUsd: 1000 }],
    });
    expect(s.state).toBe('cost-attributed');
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'iac.plan_captured',
      'iac.drift_detected',
      'iac.policy_evaluated',
      'iac.cost_attributed',
    ]);
  });

  it('capturePlan counts additions/modifications/deletions', () => {
    const s = startIacSession({ target: 'grafana-oss', workspace: 'prod' });
    const step = capturePlan(s, {
      changes: [
        { address: 'r1', action: 'create' },
        { address: 'r2', action: 'create' },
        { address: 'r3', action: 'update' },
        { address: 'r4', action: 'delete' },
        { address: 'r5', action: 'no-op' },
      ],
    });
    expect(step.metadata.additions).toBe(2);
    expect(step.metadata.modifications).toBe(1);
    expect(step.metadata.deletions).toBe(1);
    expect(step.metadata.changeCount).toBe(5);
  });

  it('detectDrift finds missing and extra resources', () => {
    const s = startIacSession({ target: 'loki', workspace: 'staging' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    const step = detectDrift(s, {
      expected: ['a', 'b', 'c'],
      actual: ['a', 'b', 'd'],
    });
    // c is expected but missing; d is extra
    expect(step.metadata.driftCount).toBe(2);
    expect(step.metadata.hasDrift).toBe(true);
    expect(s.driftedResources).toEqual(expect.arrayContaining(['c', 'd']));
  });

  it('detectDrift returns 0 when in sync', () => {
    const s = startIacSession({ target: 'otel-collector', workspace: 'x' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    const step = detectDrift(s, { expected: ['a', 'b'], actual: ['a', 'b'] });
    expect(step.metadata.driftCount).toBe(0);
    expect(step.metadata.hasDrift).toBe(false);
  });

  it('evaluatePolicy sums violation counts', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'w' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    const step = evaluatePolicy(s, {
      results: [
        { policyId: 'p1', passed: true, violationCount: 0 },
        { policyId: 'p2', passed: false, violationCount: 3 },
        { policyId: 'p3', passed: false, violationCount: 2 },
      ],
    });
    expect(step.metadata.passed).toBe(1);
    expect(step.metadata.failed).toBe(2);
    expect(step.metadata.totalViolations).toBe(5);
  });

  it('attributeCost sums monthly costs across teams', () => {
    const s = startIacSession({ target: 'grafana-oss', workspace: 'w' });
    capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    evaluatePolicy(s, { results: [{ policyId: 'p', passed: true, violationCount: 0 }] });
    const step = attributeCost(s, {
      attributions: [
        { team: 'platform', monthlyCostUsd: 1500 },
        { team: 'growth', monthlyCostUsd: 800 },
      ],
    });
    expect(step.metadata.totalMonthlyCostUsd).toBe(2300);
    expect(step.metadata.teamCount).toBe(2);
  });

  it.each(targets)('translates provider event for %s', (target) => {
    const s = startIacSession({ target, workspace: 'x' });
    const step = capturePlan(s, { changes: [{ address: 'r1', action: 'create' }] });
    expect(step.providerEvent).not.toBe(step.neutralEvent);
  });
});

describe('iac axis — invariant guards', () => {
  it('rejects empty workspace', () => {
    expect(() => startIacSession({ target: 'prometheus', workspace: '' })).toThrow(/workspace/);
  });

  it('rejects capturePlan out of state', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    capturePlan(s, { changes: [{ address: 'r', action: 'create' }] });
    expect(() => capturePlan(s, { changes: [{ address: 'r2', action: 'create' }] })).toThrow(
      /not idle/,
    );
  });

  it('rejects empty changes', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    expect(() => capturePlan(s, { changes: [] })).toThrow(/must not be empty/);
  });

  it('rejects detectDrift before plan', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    expect(() => detectDrift(s, { expected: [], actual: [] })).toThrow(/not plan-captured/);
  });

  it('rejects evaluatePolicy before drift', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    capturePlan(s, { changes: [{ address: 'r', action: 'create' }] });
    expect(() => evaluatePolicy(s, { results: [] })).toThrow(/not drift-detected/);
  });

  it('rejects evaluatePolicy with empty results', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    capturePlan(s, { changes: [{ address: 'r', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    expect(() => evaluatePolicy(s, { results: [] })).toThrow(/must not be empty/);
  });

  it('rejects attributeCost before policy', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    expect(() => attributeCost(s, { attributions: [] })).toThrow(/not policy-evaluated/);
  });

  it('rejects attributeCost with negative cost', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    capturePlan(s, { changes: [{ address: 'r', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    evaluatePolicy(s, { results: [{ policyId: 'p', passed: true, violationCount: 0 }] });
    expect(() =>
      attributeCost(s, { attributions: [{ team: 't', monthlyCostUsd: -1 }] }),
    ).toThrow(/non-negative/);
  });

  it('rejects attributeCost with empty attributions', () => {
    const s = startIacSession({ target: 'prometheus', workspace: 'x' });
    capturePlan(s, { changes: [{ address: 'r', action: 'create' }] });
    detectDrift(s, { expected: [], actual: [] });
    evaluatePolicy(s, { results: [{ policyId: 'p', passed: true, violationCount: 0 }] });
    expect(() => attributeCost(s, { attributions: [] })).toThrow(/must not be empty/);
  });
});
