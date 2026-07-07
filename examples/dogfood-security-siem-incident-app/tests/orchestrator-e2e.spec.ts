/**
 * Orchestrator end-to-end fidelity spec (orchestrator axis: fused
 * SIEM correlation → incident decision).
 *
 * Issue CAR-865 (v1.39-3) AC — the orchestrator surface enforces the
 * "trigger only when correlation matched" invariant, then walks the
 * same sev1-5 ladder the incident-response axis uses so the fused
 * decision can be diffed against the axis-only decision.
 *
 * The eight-case matrix covered here.
 *
 * | correlationMatched | dataClassification | serviceDown | affectedUsers | expected severity |
 * | ------------------ | ------------------ | ----------- | ------------- | ----------------- |
 * | false              | *                  | *           | *             | sev5              |
 * | true               | restricted         | true        | *             | sev1              |
 * | true               | restricted         | false       | *             | sev2              |
 * | true               | internal           | true        | 5_000         | sev1              |
 * | true               | internal           | true        | 200           | sev2              |
 * | true               | confidential       | false       | 5             | sev3              |
 * | true               | internal           | false       | 42            | sev4              |
 * | true               | public             | false       | 1             | sev5              |
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import {
  handleOrchestratorRequest,
  validateOrchestratorRequest,
} from '../src/app/ir-orchestrator/route.js';
import type { SecurityAdapter } from '../src/adapters/interface.js';

let mock: SecurityAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

async function decide(
  adapter: SecurityAdapter,
  sessionId: string,
  overrides: {
    correlationMatched: boolean;
    affectedUsers: number;
    dataClassification: 'public' | 'internal' | 'confidential' | 'restricted';
    serviceDown: boolean;
  },
) {
  await adapter.startOrchestrator({
    sessionId,
    siemTarget: 'siem-splunk',
    incidentTarget: 'siem-splunk',
  });
  const result = await adapter.orchestrateDecision({
    sessionId,
    ...overrides,
  });
  await adapter.closeOrchestrator({ sessionId });
  return result;
}

describe('mock adapter — orchestrator decideOrchestrator matrix', () => {
  it('does not trigger an incident when correlation did not match', async () => {
    const result = await decide(mock, 'o-nomatch', {
      correlationMatched: false,
      affectedUsers: 5_000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(result.incidentTriggered).toBe(false);
    expect(result.severity).toBe('sev5');
  });

  it('sev1 when correlation + restricted + serviceDown', async () => {
    const result = await decide(mock, 'o-sev1a', {
      correlationMatched: true,
      affectedUsers: 500,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(result.incidentTriggered).toBe(true);
    expect(result.severity).toBe('sev1');
  });

  it('sev2 when correlation + restricted + serviceUp', async () => {
    const result = await decide(mock, 'o-sev2a', {
      correlationMatched: true,
      affectedUsers: 500,
      dataClassification: 'restricted',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev2');
  });

  it('sev1 when correlation + serviceDown + > 1000 affected users', async () => {
    const result = await decide(mock, 'o-sev1b', {
      correlationMatched: true,
      affectedUsers: 5_000,
      dataClassification: 'internal',
      serviceDown: true,
    });
    expect(result.severity).toBe('sev1');
  });

  it('sev2 when correlation + serviceDown + 100 < affected users <= 1000', async () => {
    const result = await decide(mock, 'o-sev2b', {
      correlationMatched: true,
      affectedUsers: 200,
      dataClassification: 'internal',
      serviceDown: true,
    });
    expect(result.severity).toBe('sev2');
  });

  it('sev3 when correlation + confidential + serviceUp', async () => {
    const result = await decide(mock, 'o-sev3', {
      correlationMatched: true,
      affectedUsers: 5,
      dataClassification: 'confidential',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev3');
  });

  it('sev4 when correlation + > 10 affected users + no higher qualifier', async () => {
    const result = await decide(mock, 'o-sev4', {
      correlationMatched: true,
      affectedUsers: 42,
      dataClassification: 'internal',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev4');
  });

  it('sev5 default when correlation matches but no impact signals', async () => {
    const result = await decide(mock, 'o-sev5', {
      correlationMatched: true,
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(result.severity).toBe('sev5');
  });
});

describe('mock adapter — orchestrator session lifecycle', () => {
  it('startOrchestrator rejects duplicate session ids', async () => {
    await mock.startOrchestrator({
      sessionId: 'dup',
      siemTarget: 'siem-splunk',
      incidentTarget: 'siem-splunk',
    });
    await expect(
      mock.startOrchestrator({
        sessionId: 'dup',
        siemTarget: 'siem-splunk',
        incidentTarget: 'siem-splunk',
      }),
    ).rejects.toThrow(/orchestrator_session_exists/);
  });

  it('orchestrateDecision rejects when session missing', async () => {
    await expect(
      mock.orchestrateDecision({
        sessionId: 'ghost',
        correlationMatched: true,
        affectedUsers: 1,
        dataClassification: 'public',
        serviceDown: false,
      }),
    ).rejects.toThrow(/orchestrator_session_not_found/);
  });

  it('closeOrchestrator removes session from bookkeeping', async () => {
    await mock.startOrchestrator({
      sessionId: 'close',
      siemTarget: 'siem-splunk',
      incidentTarget: 'siem-splunk',
    });
    await mock.closeOrchestrator({ sessionId: 'close' });
    await expect(mock.closeOrchestrator({ sessionId: 'close' })).rejects.toThrow(
      /orchestrator_session_not_found/,
    );
  });
});

describe('mock adapter — /ir-orchestrator route validation', () => {
  it('accepts a well-formed decide request', () => {
    const parsed = validateOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      correlationMatched: true,
      affectedUsers: 1_000,
      dataClassification: 'restricted',
      serviceDown: true,
    });
    expect(parsed.ok).toBe(true);
  });

  it('rejects a request missing correlationMatched', () => {
    const parsed = validateOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      affectedUsers: 10,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) {
      expect(parsed.errorKind).toBe('correlationMatched_required_boolean');
    }
  });

  it('rejects a request with unknown dataClassification', () => {
    const parsed = validateOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      correlationMatched: true,
      affectedUsers: 10,
      dataClassification: 'top-secret',
      serviceDown: false,
    });
    expect(parsed.ok).toBe(false);
  });

  it('rejects a request with kind other than decide', () => {
    const parsed = validateOrchestratorRequest({
      kind: 'summary',
      sessionId: 'o1',
      correlationMatched: true,
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(parsed.ok).toBe(false);
    if (!parsed.ok) expect(parsed.errorKind).toBe('kind_must_be_decide');
  });

  it('rejects a request with negative affectedUsers', () => {
    const parsed = validateOrchestratorRequest({
      kind: 'decide',
      sessionId: 'o1',
      correlationMatched: true,
      affectedUsers: -1,
      dataClassification: 'public',
      serviceDown: false,
    });
    expect(parsed.ok).toBe(false);
  });
});

describe('mock adapter — /ir-orchestrator route handler', () => {
  it('serves a decide request end to end', async () => {
    await mock.startOrchestrator({
      sessionId: 'r-o',
      siemTarget: 'siem-splunk',
      incidentTarget: 'siem-splunk',
    });
    const parsed = validateOrchestratorRequest({
      kind: 'decide',
      sessionId: 'r-o',
      correlationMatched: true,
      affectedUsers: 5_000,
      dataClassification: 'internal',
      serviceDown: true,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleOrchestratorRequest(mock, parsed.value);
    expect(res.ok).toBe(true);
    expect(res.severity).toBe('sev1');
    expect(res.incidentTriggered).toBe(true);
  });

  it('reports an adapter error via errorKind on route response', async () => {
    const parsed = validateOrchestratorRequest({
      kind: 'decide',
      sessionId: 'ghost',
      correlationMatched: true,
      affectedUsers: 1,
      dataClassification: 'public',
      serviceDown: false,
    });
    if (!parsed.ok) throw new Error(parsed.errorKind);
    const res = await handleOrchestratorRequest(mock, parsed.value);
    expect(res.ok).toBe(false);
    expect(res.errorKind).toBe('orchestrator_session_not_found');
  });
});

describe('real adapter — orchestrator env-detect refusal', () => {
  it('orchestrateDecision refuses with env-missing message', async () => {
    const real = makeRealAdapter();
    await real.startOrchestrator({
      sessionId: 'r',
      siemTarget: 'siem-splunk',
      incidentTarget: 'siem-splunk',
    }).catch(() => {});
    await expect(
      real.orchestrateDecision({
        sessionId: 'r',
        correlationMatched: true,
        affectedUsers: 1,
        dataClassification: 'public',
        serviceDown: false,
      }),
    ).rejects.toThrow(/KIWA_SIEM/);
  });
});
