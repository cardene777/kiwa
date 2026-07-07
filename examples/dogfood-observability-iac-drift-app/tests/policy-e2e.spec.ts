/**
 * Policy end-to-end fidelity spec (policy axis: OPA rego evaluation +
 * team cost attribution + aggregate violation counting + session
 * lifecycle).
 *
 * Issue CAR-1047 (v1.42-2) AC — the mock adapter drives a full OPA
 * policy + cost attribution ceremony end to end and the fidelity harness
 * diffs the raw {@link TraceEvent} sequence across five axes.
 *
 *  1. startPolicy seats a policy session under a workspace + observability
 *     target, and rejects duplicate session ids.
 *  2. evaluatePolicy sums pass / fail / violation counts across rego
 *     results and enforces (non-empty results, session open).
 *  3. attributeCost sums monthly USD across teams and enforces (non-empty
 *     attributions, non-negative amounts).
 *  4. closePolicy tears down state and further ops on the same session id
 *     fail.
 *  5. Route handler dispatches / rejects the shape variations exposed
 *     over HTTP without spinning up a Node server.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { handlePolicyRequest, validatePolicyRequest } from '../src/app/policy/route.js';
import type { IacAdapter } from '../src/adapters/interface.js';

let mock: IacAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — policy session start', () => {
  it('axis 1: startPolicy seats a session under a workspace + observability target', async () => {
    await mock.startPolicy({
      sessionId: 'y1',
      workspace: 'prod',
      target: 'prometheus',
    });
    const trace = mock.traces().find((t) => t.op === 'startPolicy');
    expect(trace?.ok).toBe(true);
  });

  it('axis 1: startPolicy rejects duplicate session id', async () => {
    await mock.startPolicy({ sessionId: 'y2', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.startPolicy({ sessionId: 'y2', workspace: 'prod', target: 'prometheus' }),
    ).rejects.toThrow(/policy_session_exists/);
  });
});

describe('mock adapter — policy evaluation', () => {
  it('axis 2: evaluatePolicy sums pass / fail / violation counts', async () => {
    await mock.startPolicy({ sessionId: 'e1', workspace: 'prod', target: 'prometheus' });
    const result = await mock.evaluatePolicy({
      sessionId: 'e1',
      results: [
        { policyId: 'no-public-s3', passed: true, violationCount: 0 },
        { policyId: 'require-tags', passed: false, violationCount: 3 },
        { policyId: 'least-privilege', passed: false, violationCount: 2 },
      ],
    });
    expect(result.policyCount).toBe(3);
    expect(result.passed).toBe(1);
    expect(result.failed).toBe(2);
    expect(result.totalViolations).toBe(5);
  });

  it('axis 2: evaluatePolicy handles all-pass rego suite', async () => {
    await mock.startPolicy({ sessionId: 'e2', workspace: 'prod', target: 'prometheus' });
    const result = await mock.evaluatePolicy({
      sessionId: 'e2',
      results: [
        { policyId: 'p1', passed: true, violationCount: 0 },
        { policyId: 'p2', passed: true, violationCount: 0 },
      ],
    });
    expect(result.passed).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.totalViolations).toBe(0);
  });

  it('axis 2: evaluatePolicy refuses empty results', async () => {
    await mock.startPolicy({ sessionId: 'e3', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.evaluatePolicy({ sessionId: 'e3', results: [] }),
    ).rejects.toThrow(/results_must_not_be_empty/);
  });

  it('axis 2: evaluatePolicy refuses when session not started', async () => {
    await expect(
      mock.evaluatePolicy({
        sessionId: 'ghost',
        results: [{ policyId: 'p', passed: true, violationCount: 0 }],
      }),
    ).rejects.toThrow(/policy_session_not_found/);
  });
});

describe('mock adapter — cost attribution', () => {
  it('axis 3: attributeCost sums monthly cost across teams', async () => {
    await mock.startPolicy({ sessionId: 'a1', workspace: 'prod', target: 'prometheus' });
    const result = await mock.attributeCost({
      sessionId: 'a1',
      attributions: [
        { team: 'platform', monthlyCostUsd: 1500 },
        { team: 'growth', monthlyCostUsd: 800 },
        { team: 'data', monthlyCostUsd: 200 },
      ],
    });
    expect(result.teamCount).toBe(3);
    expect(result.totalMonthlyCostUsd).toBe(2500);
  });

  it('axis 3: attributeCost handles single-team plan', async () => {
    await mock.startPolicy({ sessionId: 'a2', workspace: 'prod', target: 'prometheus' });
    const result = await mock.attributeCost({
      sessionId: 'a2',
      attributions: [{ team: 'platform', monthlyCostUsd: 1000 }],
    });
    expect(result.teamCount).toBe(1);
    expect(result.totalMonthlyCostUsd).toBe(1000);
  });

  it('axis 3: attributeCost refuses empty attributions', async () => {
    await mock.startPolicy({ sessionId: 'a3', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.attributeCost({ sessionId: 'a3', attributions: [] }),
    ).rejects.toThrow(/attributions_must_not_be_empty/);
  });

  it('axis 3: attributeCost refuses negative monthly cost', async () => {
    await mock.startPolicy({ sessionId: 'a4', workspace: 'prod', target: 'prometheus' });
    await expect(
      mock.attributeCost({
        sessionId: 'a4',
        attributions: [{ team: 'platform', monthlyCostUsd: -100 }],
      }),
    ).rejects.toThrow(/monthly_cost_must_be_non_negative/);
  });

  it('axis 3: attributeCost refuses when session not started', async () => {
    await expect(
      mock.attributeCost({
        sessionId: 'ghost',
        attributions: [{ team: 'x', monthlyCostUsd: 1 }],
      }),
    ).rejects.toThrow(/policy_session_not_found/);
  });
});

describe('mock adapter — policy state machine', () => {
  it('axis 4: closePolicy removes session', async () => {
    await mock.startPolicy({ sessionId: 'sm1', workspace: 'prod', target: 'prometheus' });
    await mock.closePolicy({ sessionId: 'sm1' });
    await expect(
      mock.evaluatePolicy({
        sessionId: 'sm1',
        results: [{ policyId: 'p', passed: true, violationCount: 0 }],
      }),
    ).rejects.toThrow(/policy_session_not_found/);
  });

  it('axis 4: attributeCost following evaluatePolicy uses semantics-lifted state', async () => {
    await mock.startPolicy({ sessionId: 'sm2', workspace: 'prod', target: 'prometheus' });
    await mock.evaluatePolicy({
      sessionId: 'sm2',
      results: [{ policyId: 'p', passed: true, violationCount: 0 }],
    });
    const cost = await mock.attributeCost({
      sessionId: 'sm2',
      attributions: [{ team: 't', monthlyCostUsd: 100 }],
    });
    expect(cost.totalMonthlyCostUsd).toBe(100);
  });
});

describe('route handler — /policy shape validation', () => {
  it('axis 5: validatePolicyRequest rejects non-object body', () => {
    const result = validatePolicyRequest(null);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('body_not_object');
  });

  it('axis 5: validatePolicyRequest rejects unknown kind', () => {
    const result = validatePolicyRequest({ sessionId: 'r1', kind: 'burn' });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('kind_must_be_start_evaluate_attribute_or_close');
  });

  it('axis 5: validatePolicyRequest rejects invalid target', () => {
    const result = validatePolicyRequest({
      sessionId: 'r2',
      kind: 'start',
      workspace: 'prod',
      target: 'datadog',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('target_required_valid');
  });

  it('axis 5: validatePolicyRequest rejects result with non-boolean passed', () => {
    const result = validatePolicyRequest({
      sessionId: 'r3',
      kind: 'evaluate',
      results: [{ policyId: 'p', passed: 'yes', violationCount: 0 }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errorKind).toBe('result_passed_required_boolean');
  });

  it('axis 5: validatePolicyRequest rejects attribution with non-number cost', () => {
    const result = validatePolicyRequest({
      sessionId: 'r4',
      kind: 'attribute',
      attributions: [{ team: 't', monthlyCostUsd: 'lots' }],
    });
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errorKind).toBe('attribution_monthlyCostUsd_required_number');
  });

  it('axis 5: handlePolicyRequest dispatches the evaluate op and returns counts', async () => {
    await mock.startPolicy({ sessionId: 'r5', workspace: 'prod', target: 'prometheus' });
    const response = await handlePolicyRequest(mock, {
      kind: 'evaluate',
      sessionId: 'r5',
      results: [
        { policyId: 'p1', passed: true, violationCount: 0 },
        { policyId: 'p2', passed: false, violationCount: 1 },
      ],
    });
    expect(response.ok).toBe(true);
    expect(response.policyCount).toBe(2);
    expect(response.totalViolations).toBe(1);
  });

  it('axis 5: handlePolicyRequest surfaces errorKind on failure', async () => {
    const response = await handlePolicyRequest(mock, {
      kind: 'evaluate',
      sessionId: 'ghost',
      results: [{ policyId: 'p', passed: true, violationCount: 0 }],
    });
    expect(response.ok).toBe(false);
    expect(response.errorKind).toBe('policy_session_not_found');
  });
});

describe('real adapter — policy env-gate', () => {
  it('real adapter refuses evaluatePolicy with KIWA_IAC_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.evaluatePolicy({
        sessionId: 'r-real',
        results: [{ policyId: 'p', passed: true, violationCount: 0 }],
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'evaluatePolicy');
    expect(trace?.ok).toBe(false);
  });

  it('real adapter refuses attributeCost with KIWA_IAC_ENV_MISSING on hermetic systems', async () => {
    const real = makeRealAdapter();
    await expect(
      real.attributeCost({
        sessionId: 'r-real',
        attributions: [{ team: 't', monthlyCostUsd: 1 }],
      }),
    ).rejects.toThrow();
    const trace = real.traces().find((t) => t.op === 'attributeCost');
    expect(trace?.ok).toBe(false);
  });
});
