/**
 * ABAC end-to-end fidelity spec (abac axis: attribute matching +
 * combining algorithm + combined RBAC/ABAC engine).
 *
 * Sub-Issue CAR-827 (v1.37-3) AC — the mock adapter drives a full ABAC
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across five axes.
 *
 *  1. attachRule grows the policy's rule list with a permit/deny effect
 *     + attribute predicate.
 *  2. evaluateAbac returns permit iff at least one rule matches under
 *     the selected combining algorithm.
 *  3. deny-overrides combining wins when both permit and deny match.
 *  4. permit-overrides combining wins the other way.
 *  5. first-applicable returns the first rule that matches.
 *  6. evaluateCombined couples RBAC decision + ABAC decision under the
 *     v0.1 evaluator.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleAbacRequest,
  validateAbacRequest,
} from '../src/app/abac/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — ABAC rule attach', () => {
  it('axis 1: attachRule records id + effect on a fresh policy', async () => {
    await mock.startAbac({ policyId: 'p1', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'p1',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    const trace = mock.traces().find((t) => t.op === 'attachRule');
    expect(trace?.ok).toBe(true);
    expect((trace?.detail as { ruleId?: string })?.ruleId).toBe('r1');
    expect((trace?.detail as { effect?: string })?.effect).toBe('permit');
  });

  it('axis 1: attachRule rejects duplicate rule id', async () => {
    await mock.startAbac({ policyId: 'p2', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'p2',
      rule: { id: 'r1', effect: 'permit', when: {} },
    });
    await expect(
      mock.attachRule({
        policyId: 'p2',
        rule: { id: 'r1', effect: 'deny', when: {} },
      }),
    ).rejects.toThrow(/abac_rule_duplicate/);
  });

  it('axis 1: attachRule without startAbac fails', async () => {
    await expect(
      mock.attachRule({
        policyId: 'missing',
        rule: { id: 'r1', effect: 'permit', when: {} },
      }),
    ).rejects.toThrow(/abac_session_missing/);
  });

  it('axis 1: attachRule after closeAbac fails', async () => {
    await mock.startAbac({ policyId: 'p3', algorithm: 'permit-overrides' });
    await mock.closeAbac({ policyId: 'p3' });
    await expect(
      mock.attachRule({
        policyId: 'p3',
        rule: { id: 'r1', effect: 'permit', when: {} },
      }),
    ).rejects.toThrow(/abac_session_closed/);
  });
});

describe('mock adapter — ABAC attribute matching', () => {
  it('axis 2: evaluateAbac permit when subject attribute matches', async () => {
    await mock.startAbac({ policyId: 'a1', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'a1',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'a1',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: {},
    });
    expect(result.effect).toBe('permit');
    expect(result.matchedRule).toBe('r1');
  });

  it('axis 2: evaluateAbac deny when no rule matches (default deny)', async () => {
    await mock.startAbac({ policyId: 'a2', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'a2',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'a2',
      subject: { department: 'sales' },
      resource: {},
      action: 'read',
      environment: {},
    });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBeNull();
  });

  it('axis 2: evaluateAbac matches action attribute', async () => {
    await mock.startAbac({ policyId: 'a3', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'a3',
      rule: { id: 'r1', effect: 'permit', when: { action: 'read' } },
    });
    const permit = await mock.evaluateAbac({
      policyId: 'a3',
      subject: {},
      resource: {},
      action: 'read',
      environment: {},
    });
    const deny = await mock.evaluateAbac({
      policyId: 'a3',
      subject: {},
      resource: {},
      action: 'write',
      environment: {},
    });
    expect(permit.effect).toBe('permit');
    expect(deny.effect).toBe('deny');
  });

  it('axis 2: evaluateAbac matches resource attribute', async () => {
    await mock.startAbac({ policyId: 'a4', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'a4',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { resource: { classification: 'public' } },
      },
    });
    const permit = await mock.evaluateAbac({
      policyId: 'a4',
      subject: {},
      resource: { classification: 'public' },
      action: 'read',
      environment: {},
    });
    expect(permit.effect).toBe('permit');
  });

  it('axis 2: evaluateAbac matches environment attribute', async () => {
    await mock.startAbac({ policyId: 'a5', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'a5',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { environment: { region: 'us-east' } },
      },
    });
    const permit = await mock.evaluateAbac({
      policyId: 'a5',
      subject: {},
      resource: {},
      action: 'read',
      environment: { region: 'us-east' },
    });
    const deny = await mock.evaluateAbac({
      policyId: 'a5',
      subject: {},
      resource: {},
      action: 'read',
      environment: { region: 'eu-west' },
    });
    expect(permit.effect).toBe('permit');
    expect(deny.effect).toBe('deny');
  });

  it('axis 2: evaluateAbac composite predicate (subject + action) matches when all satisfied', async () => {
    await mock.startAbac({ policyId: 'a6', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'a6',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: {
          subject: { department: 'eng' },
          action: 'read',
        },
      },
    });
    const permit = await mock.evaluateAbac({
      policyId: 'a6',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: {},
    });
    const denyAction = await mock.evaluateAbac({
      policyId: 'a6',
      subject: { department: 'eng' },
      resource: {},
      action: 'write',
      environment: {},
    });
    expect(permit.effect).toBe('permit');
    expect(denyAction.effect).toBe('deny');
  });
});

describe('mock adapter — ABAC combining algorithms', () => {
  it('axis 3: deny-overrides wins when both permit and deny match', async () => {
    await mock.startAbac({ policyId: 'c1', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'c1',
      rule: {
        id: 'r-permit',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    await mock.attachRule({
      policyId: 'c1',
      rule: {
        id: 'r-deny',
        effect: 'deny',
        when: { environment: { risk: 'high' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'c1',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: { risk: 'high' },
    });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('r-deny');
  });

  it('axis 3: deny-overrides falls to permit when no deny matches', async () => {
    await mock.startAbac({ policyId: 'c2', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'c2',
      rule: {
        id: 'r-permit',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    await mock.attachRule({
      policyId: 'c2',
      rule: {
        id: 'r-deny',
        effect: 'deny',
        when: { environment: { risk: 'high' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'c2',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: { risk: 'low' },
    });
    expect(result.effect).toBe('permit');
    expect(result.matchedRule).toBe('r-permit');
  });

  it('axis 3: permit-overrides wins when both permit and deny match', async () => {
    await mock.startAbac({ policyId: 'c3', algorithm: 'permit-overrides' });
    await mock.attachRule({
      policyId: 'c3',
      rule: {
        id: 'r-permit',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    await mock.attachRule({
      policyId: 'c3',
      rule: {
        id: 'r-deny',
        effect: 'deny',
        when: { environment: { risk: 'high' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'c3',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: { risk: 'high' },
    });
    expect(result.effect).toBe('permit');
    expect(result.matchedRule).toBe('r-permit');
  });

  it('axis 3: permit-overrides falls to deny when no permit matches', async () => {
    await mock.startAbac({ policyId: 'c4', algorithm: 'permit-overrides' });
    await mock.attachRule({
      policyId: 'c4',
      rule: {
        id: 'r-deny',
        effect: 'deny',
        when: { environment: { risk: 'high' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'c4',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: { risk: 'high' },
    });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('r-deny');
  });

  it('axis 3: first-applicable returns the first matching rule regardless of effect', async () => {
    await mock.startAbac({ policyId: 'c5', algorithm: 'first-applicable' });
    await mock.attachRule({
      policyId: 'c5',
      rule: {
        id: 'r-deny',
        effect: 'deny',
        when: { environment: { region: 'us-east' } },
      },
    });
    await mock.attachRule({
      policyId: 'c5',
      rule: {
        id: 'r-permit',
        effect: 'permit',
        when: { environment: { region: 'us-east' } },
      },
    });
    const result = await mock.evaluateAbac({
      policyId: 'c5',
      subject: {},
      resource: {},
      action: 'read',
      environment: { region: 'us-east' },
    });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('r-deny');
  });

  it('axis 3: evaluateAbac trace records effect + matchedRule', async () => {
    await mock.startAbac({ policyId: 'c6', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'c6',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { subject: { department: 'eng' } },
      },
    });
    await mock.evaluateAbac({
      policyId: 'c6',
      subject: { department: 'eng' },
      resource: {},
      action: 'read',
      environment: {},
    });
    const trace = mock.traces().find((t) => t.op === 'evaluateAbac');
    expect((trace?.detail as { effect?: string })?.effect).toBe('permit');
    expect((trace?.detail as { matchedRule?: string })?.matchedRule).toBe(
      'r1',
    );
  });
});

describe('mock adapter — combined RBAC + ABAC engine', () => {
  it('axis 4: evaluateCombined permit when RBAC grants + ABAC permits', async () => {
    await mock.startRbac({ policyId: 'x1' });
    await mock.attachRole({
      policyId: 'x1',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.startAbac({ policyId: 'x1', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'x1',
      rule: {
        id: 'r1',
        effect: 'permit',
        when: { environment: { region: 'us-east' } },
      },
    });
    const result = await mock.evaluateCombined({
      policyId: 'x1',
      rbac: {
        subjectId: 'alice',
        roles: ['viewer'],
        permission: 'post:read',
      },
      abac: {
        subject: {},
        resource: {},
        action: 'read',
        environment: { region: 'us-east' },
      },
    });
    expect(result.effect).toBe('permit');
  });

  it('axis 4: evaluateCombined deny when RBAC denies (regardless of ABAC)', async () => {
    await mock.startRbac({ policyId: 'x2' });
    await mock.attachRole({
      policyId: 'x2',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.startAbac({ policyId: 'x2', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'x2',
      rule: { id: 'r1', effect: 'permit', when: {} },
    });
    const result = await mock.evaluateCombined({
      policyId: 'x2',
      rbac: {
        subjectId: 'alice',
        roles: ['viewer'],
        permission: 'post:delete',
      },
      abac: {
        subject: {},
        resource: {},
        action: 'read',
        environment: {},
      },
    });
    expect(result.effect).toBe('deny');
    expect(result.matchedRule).toBe('rbac');
  });

  it('axis 4: evaluateCombined deny when ABAC denies + RBAC would permit', async () => {
    await mock.startRbac({ policyId: 'x3' });
    await mock.attachRole({
      policyId: 'x3',
      name: 'viewer',
      permissions: ['post:read'],
    });
    await mock.startAbac({ policyId: 'x3', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'x3',
      rule: {
        id: 'r1',
        effect: 'deny',
        when: { environment: { region: 'restricted' } },
      },
    });
    const result = await mock.evaluateCombined({
      policyId: 'x3',
      rbac: {
        subjectId: 'alice',
        roles: ['viewer'],
        permission: 'post:read',
      },
      abac: {
        subject: {},
        resource: {},
        action: 'read',
        environment: { region: 'restricted' },
      },
    });
    expect(result.effect).toBe('deny');
  });

  it('axis 4: evaluateCombined with only RBAC (no ABAC session) uses RBAC verdict', async () => {
    await mock.startRbac({ policyId: 'x4' });
    await mock.attachRole({
      policyId: 'x4',
      name: 'viewer',
      permissions: ['post:read'],
    });
    const result = await mock.evaluateCombined({
      policyId: 'x4',
      rbac: {
        subjectId: 'alice',
        roles: ['viewer'],
        permission: 'post:read',
      },
    });
    expect(result.effect).toBe('permit');
    expect(result.matchedRule).toBe('rbac');
  });

  it('axis 4: evaluateCombined trace records the final effect', async () => {
    await mock.startAbac({ policyId: 'x5', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'x5',
      rule: { id: 'r1', effect: 'permit', when: {} },
    });
    await mock.evaluateCombined({
      policyId: 'x5',
      abac: {
        subject: {},
        resource: {},
        action: 'read',
        environment: {},
      },
    });
    const trace = mock.traces().find((t) => t.op === 'evaluateCombined');
    expect((trace?.detail as { effect?: string })?.effect).toBe('permit');
  });
});

describe('mock adapter — ABAC trace ordering + session isolation', () => {
  it('axis 5: trace order matches lifecycle (start → attach → evaluate → close)', async () => {
    await mock.startAbac({ policyId: 'ord1', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'ord1',
      rule: { id: 'r1', effect: 'permit', when: {} },
    });
    await mock.evaluateAbac({
      policyId: 'ord1',
      subject: {},
      resource: {},
      action: 'read',
      environment: {},
    });
    await mock.closeAbac({ policyId: 'ord1' });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual([
      'startAbac',
      'attachRule',
      'evaluateAbac',
      'closeAbac',
    ]);
  });

  it('axis 5: separate policyIds do not leak rules', async () => {
    await mock.startAbac({ policyId: 'A', algorithm: 'permit-overrides' });
    await mock.startAbac({ policyId: 'B', algorithm: 'deny-overrides' });
    await mock.attachRule({
      policyId: 'A',
      rule: { id: 'r1', effect: 'permit', when: {} },
    });
    await mock.attachRule({
      policyId: 'B',
      rule: { id: 'r1', effect: 'deny', when: {} },
    });
    const inA = await mock.evaluateAbac({
      policyId: 'A',
      subject: {},
      resource: {},
      action: 'read',
      environment: {},
    });
    const inB = await mock.evaluateAbac({
      policyId: 'B',
      subject: {},
      resource: {},
      action: 'read',
      environment: {},
    });
    expect(inA.effect).toBe('permit');
    expect(inB.effect).toBe('deny');
  });
});

describe('ABAC route handler — validation', () => {
  it('validateAbacRequest requires policyId', () => {
    const res = validateAbacRequest({ kind: 'attach' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('policyId_required');
  });

  it('validateAbacRequest requires kind in {attach, evaluate, combined}', () => {
    const res = validateAbacRequest({ kind: 'other', policyId: 'p' });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errorKind).toBe('kind_must_be_attach_evaluate_or_combined');
  });

  it('validateAbacRequest attach requires rule.effect in {permit, deny}', () => {
    const res = validateAbacRequest({
      kind: 'attach',
      policyId: 'p',
      rule: { id: 'r1', effect: 'other', when: {} },
    });
    expect(res.ok).toBe(false);
    if (!res.ok)
      expect(res.errorKind).toBe('rule_effect_must_be_permit_or_deny');
  });

  it('validateAbacRequest evaluate requires attrs.action', () => {
    const res = validateAbacRequest({
      kind: 'evaluate',
      policyId: 'p',
      attrs: { subject: {}, resource: {}, environment: {} },
    });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('attrs_action_required');
  });

  it('validateAbacRequest combined requires attrs or rbac', () => {
    const res = validateAbacRequest({ kind: 'combined', policyId: 'p' });
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.errorKind).toBe('combined_requires_attrs_or_rbac');
  });

  it('handleAbacRequest attach then evaluate returns permit', async () => {
    await mock.startAbac({ policyId: 'h1', algorithm: 'deny-overrides' });
    const attach = await handleAbacRequest(mock, {
      kind: 'attach',
      policyId: 'h1',
      rule: { id: 'r1', effect: 'permit', when: {} },
    });
    expect(attach.ok).toBe(true);
    const evalRes = await handleAbacRequest(mock, {
      kind: 'evaluate',
      policyId: 'h1',
      attrs: {
        subject: {},
        resource: {},
        action: 'read',
        environment: {},
      },
    });
    expect(evalRes.ok).toBe(true);
    expect(evalRes.effect).toBe('permit');
  });

  it('handleAbacRequest reports errorKind on adapter throw', async () => {
    const res = await handleAbacRequest(mock, {
      kind: 'evaluate',
      policyId: 'missing',
      attrs: {
        subject: {},
        resource: {},
        action: 'read',
        environment: {},
      },
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('abac_session_missing');
  });
});
