/**
 * Swarm coordination end-to-end fidelity spec (swarm axis: role
 * assignment → task allocation → majority-vote consensus → Byzantine
 * fault tolerance).
 *
 * Sub-Issue CAR-889 (v1.40-2) AC — the mock adapter drives a full swarm
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across the axis.
 *
 *  1. assignRoles assigns roles by index modulo across all agents.
 *  2. allocateTasks distributes tasks by priority order round-robin.
 *  3. reachConsensus reports the majority winner and agreement ratio.
 *  4. tolerateByzantine passes when honest ratio >= 1 - threshold.
 *  5. closeSwarm records the session history length.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handleAllocateRequest,
  handleAssignRequest,
  handleByzantineRequest,
  handleConsensusRequest,
  validateAllocateRequest,
  validateAssignRequest,
  validateByzantineRequest,
  validateConsensusRequest,
} from '../src/app/swarm/route.js';
import type { LlmMaoSwarmAdapter } from '../src/adapters/interface.js';

let mock: LlmMaoSwarmAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — swarm role assignment', () => {
  it('assignRoles wraps roles by modulo', async () => {
    await mock.startSwarm({ sessionId: 's1' });
    const r = await mock.assignRoles({
      sessionId: 's1',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.8 },
        { id: 'a3', reliability: 0.7 },
      ],
      roles: ['scout', 'worker'],
    });
    expect(r.agentCount).toBe(3);
    expect(r.roleCount).toBe(2);
    expect(r.averageReliability).toBeCloseTo(0.8, 5);
  });

  it('assignRoles rejects reliability out of [0,1]', async () => {
    await mock.startSwarm({ sessionId: 's2' });
    await expect(
      mock.assignRoles({
        sessionId: 's2',
        agents: [{ id: 'a1', reliability: 1.5 }],
        roles: ['scout'],
      }),
    ).rejects.toThrow(/reliability must be in \[0, 1\]/);
  });

  it('assignRoles rejects empty roles list', async () => {
    await mock.startSwarm({ sessionId: 's3' });
    await expect(
      mock.assignRoles({
        sessionId: 's3',
        agents: [{ id: 'a1', reliability: 0.9 }],
        roles: [],
      }),
    ).rejects.toThrow(/roles must not be empty/);
  });

  it('assignRoles without startSwarm fails with MISSING_SESSION', async () => {
    await expect(
      mock.assignRoles({
        sessionId: 'missing',
        agents: [{ id: 'a1', reliability: 0.9 }],
        roles: ['scout'],
      }),
    ).rejects.toThrow(/no session missing/);
  });

  it('startSwarm applies default faultThreshold 0.34', async () => {
    await mock.startSwarm({ sessionId: 's4' });
    const trace = mock.traces().find((t) => t.op === 'startSwarm');
    expect(
      (trace?.detail as { faultThreshold?: number })?.faultThreshold,
    ).toBeCloseTo(0.34, 5);
  });

  it('startSwarm accepts custom faultThreshold', async () => {
    await mock.startSwarm({ sessionId: 's5', faultThreshold: 0.2 });
    const trace = mock.traces().find((t) => t.op === 'startSwarm');
    expect(
      (trace?.detail as { faultThreshold?: number })?.faultThreshold,
    ).toBeCloseTo(0.2, 5);
  });
});

describe('mock adapter — swarm task allocation', () => {
  it('allocateTasks orders by priority descending', async () => {
    await mock.startSwarm({ sessionId: 'a1' });
    await mock.assignRoles({
      sessionId: 'a1',
      agents: [
        { id: 'w1', reliability: 0.9 },
        { id: 'w2', reliability: 0.85 },
      ],
      roles: ['worker'],
    });
    const r = await mock.allocateTasks({
      sessionId: 'a1',
      tasks: [
        { id: 't-low', priority: 1 },
        { id: 't-high', priority: 5 },
        { id: 't-mid', priority: 3 },
      ],
    });
    expect(r.taskCount).toBe(3);
    expect(r.topPriority).toBe(5);
    expect(r.allocations[0]?.id).toBe('t-high');
    expect(r.allocations[0]?.assignee).toBe('w1');
    expect(r.allocations[1]?.id).toBe('t-mid');
    expect(r.allocations[1]?.assignee).toBe('w2');
  });

  it('allocateTasks rejects empty tasks list', async () => {
    await mock.startSwarm({ sessionId: 'a2' });
    await mock.assignRoles({
      sessionId: 'a2',
      agents: [{ id: 'w1', reliability: 0.9 }],
      roles: ['worker'],
    });
    await expect(
      mock.allocateTasks({ sessionId: 'a2', tasks: [] }),
    ).rejects.toThrow(/tasks must not be empty/);
  });

  it('allocateTasks before assignRoles fails', async () => {
    await mock.startSwarm({ sessionId: 'a3' });
    await expect(
      mock.allocateTasks({
        sessionId: 'a3',
        tasks: [{ id: 't1', priority: 1 }],
      }),
    ).rejects.toThrow(/assign roles first/);
  });
});

describe('mock adapter — majority-vote consensus', () => {
  it('reachConsensus picks the majority winner', async () => {
    await mock.startSwarm({ sessionId: 'c1' });
    await mock.assignRoles({
      sessionId: 'c1',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
        { id: 'a3', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const r = await mock.reachConsensus({
      sessionId: 'c1',
      votes: [
        { agentId: 'a1', proposal: 'yes' },
        { agentId: 'a2', proposal: 'yes' },
        { agentId: 'a3', proposal: 'no' },
      ],
    });
    expect(r.winner).toBe('yes');
    expect(r.agreementRatio).toBeCloseTo(2 / 3, 5);
    expect(r.majority).toBe(true);
  });

  it('reachConsensus returns null winner when tied', async () => {
    await mock.startSwarm({ sessionId: 'c2' });
    await mock.assignRoles({
      sessionId: 'c2',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const r = await mock.reachConsensus({
      sessionId: 'c2',
      votes: [
        { agentId: 'a1', proposal: 'yes' },
        { agentId: 'a2', proposal: 'no' },
      ],
    });
    expect(r.majority).toBe(false);
    expect(r.winner).toBeNull();
  });

  it('reachConsensus rejects empty votes list', async () => {
    await mock.startSwarm({ sessionId: 'c3' });
    await mock.assignRoles({
      sessionId: 'c3',
      agents: [{ id: 'a1', reliability: 0.9 }],
      roles: ['worker'],
    });
    await expect(
      mock.reachConsensus({ sessionId: 'c3', votes: [] }),
    ).rejects.toThrow(/votes must not be empty/);
  });
});

describe('mock adapter — Byzantine fault tolerance', () => {
  it('tolerateByzantine passes when honest ratio >= threshold', async () => {
    await mock.startSwarm({ sessionId: 'b1', faultThreshold: 0.34 });
    await mock.assignRoles({
      sessionId: 'b1',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
        { id: 'a3', reliability: 0.9 },
        { id: 'a4', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const r = await mock.tolerateByzantine({
      sessionId: 'b1',
      faultyAgentIds: ['a1'],
    });
    expect(r.totalAgents).toBe(4);
    expect(r.faultyCount).toBe(1);
    expect(r.honestRatio).toBeCloseTo(0.75, 5);
    expect(r.tolerated).toBe(true);
  });

  it('tolerateByzantine fails when honest ratio drops below threshold', async () => {
    await mock.startSwarm({ sessionId: 'b2', faultThreshold: 0.34 });
    await mock.assignRoles({
      sessionId: 'b2',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
        { id: 'a3', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const r = await mock.tolerateByzantine({
      sessionId: 'b2',
      faultyAgentIds: ['a1', 'a2'],
    });
    expect(r.tolerated).toBe(false);
  });

  it('tolerateByzantine ignores unknown faulty ids', async () => {
    await mock.startSwarm({ sessionId: 'b3' });
    await mock.assignRoles({
      sessionId: 'b3',
      agents: [{ id: 'a1', reliability: 0.9 }],
      roles: ['worker'],
    });
    const r = await mock.tolerateByzantine({
      sessionId: 'b3',
      faultyAgentIds: ['ghost'],
    });
    expect(r.faultyCount).toBe(0);
    expect(r.honestRatio).toBe(1);
  });

  it('startSwarm rejects faultThreshold outside [0, 1)', async () => {
    await expect(
      mock.startSwarm({ sessionId: 'b4', faultThreshold: 1 }),
    ).rejects.toThrow(/faultThreshold must be in \[0, 1\)/);
  });
});

describe('mock adapter — swarm session lifecycle', () => {
  it('closeSwarm records history length', async () => {
    await mock.startSwarm({ sessionId: 'x1' });
    await mock.assignRoles({
      sessionId: 'x1',
      agents: [{ id: 'a1', reliability: 0.9 }],
      roles: ['worker'],
    });
    await mock.closeSwarm({ sessionId: 'x1' });
    const trace = mock.traces().find((t) => t.op === 'closeSwarm');
    expect(trace?.ok).toBe(true);
    expect(
      (trace?.detail as { historyLength?: number })?.historyLength,
    ).toBeGreaterThan(0);
  });

  it('startSwarm twice throws DUPLICATE_SESSION', async () => {
    await mock.startSwarm({ sessionId: 'x2' });
    await expect(mock.startSwarm({ sessionId: 'x2' })).rejects.toThrow(
      /duplicate session x2/,
    );
  });

  it('full swarm ceremony records ordered ops', async () => {
    await mock.startSwarm({ sessionId: 'x3' });
    await mock.assignRoles({
      sessionId: 'x3',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    await mock.allocateTasks({
      sessionId: 'x3',
      tasks: [{ id: 't1', priority: 1 }],
    });
    await mock.reachConsensus({
      sessionId: 'x3',
      votes: [
        { agentId: 'a1', proposal: 'ok' },
        { agentId: 'a2', proposal: 'ok' },
      ],
    });
    await mock.tolerateByzantine({ sessionId: 'x3', faultyAgentIds: [] });
    await mock.closeSwarm({ sessionId: 'x3' });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual([
      'startSwarm',
      'assignRoles',
      'allocateTasks',
      'reachConsensus',
      'tolerateByzantine',
      'closeSwarm',
    ]);
  });
});

describe('swarm route validators', () => {
  it('rejects assign request with missing agents', () => {
    const r = validateAssignRequest({ sessionId: 's', roles: ['w'] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('agents_required');
  });

  it('accepts a valid assign request', () => {
    const r = validateAssignRequest({
      sessionId: 's',
      agents: [{ id: 'a1', reliability: 0.9 }],
      roles: ['w'],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.roles[0]).toBe('w');
  });

  it('rejects allocate request with non-numeric priority', () => {
    const r = validateAllocateRequest({
      sessionId: 's',
      tasks: [{ id: 't', priority: 'high' }],
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('task.priority_required');
  });

  it('accepts a valid allocate request', () => {
    const r = validateAllocateRequest({
      sessionId: 's',
      tasks: [{ id: 't', priority: 1 }],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects consensus request with empty votes', () => {
    const r = validateConsensusRequest({ sessionId: 's', votes: [] });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('votes_required');
  });

  it('accepts a valid consensus request', () => {
    const r = validateConsensusRequest({
      sessionId: 's',
      votes: [{ agentId: 'a1', proposal: 'yes' }],
    });
    expect(r.ok).toBe(true);
  });

  it('rejects byzantine request with non-array faultyAgentIds', () => {
    const r = validateByzantineRequest({ sessionId: 's', faultyAgentIds: 'a1' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('faultyAgentIds_required');
  });

  it('accepts a valid byzantine request', () => {
    const r = validateByzantineRequest({
      sessionId: 's',
      faultyAgentIds: [],
    });
    expect(r.ok).toBe(true);
  });
});

describe('swarm route handlers', () => {
  it('handleAssignRequest returns ok result', async () => {
    await mock.startSwarm({ sessionId: 'h1' });
    const res = await handleAssignRequest(mock, {
      sessionId: 'h1',
      agents: [{ id: 'a1', reliability: 0.9 }],
      roles: ['worker'],
    });
    expect(res.ok).toBe(true);
    expect(res.result?.agentCount).toBe(1);
  });

  it('handleAllocateRequest surfaces missing-session error', async () => {
    const res = await handleAllocateRequest(mock, {
      sessionId: 'ghost',
      tasks: [{ id: 't', priority: 1 }],
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });

  it('handleConsensusRequest returns majority winner', async () => {
    await mock.startSwarm({ sessionId: 'h2' });
    await mock.assignRoles({
      sessionId: 'h2',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const res = await handleConsensusRequest(mock, {
      sessionId: 'h2',
      votes: [
        { agentId: 'a1', proposal: 'ship' },
        { agentId: 'a2', proposal: 'ship' },
      ],
    });
    expect(res.ok).toBe(true);
    expect(res.result?.winner).toBe('ship');
  });

  it('handleByzantineRequest reports tolerated=false past threshold', async () => {
    await mock.startSwarm({ sessionId: 'h3', faultThreshold: 0.2 });
    await mock.assignRoles({
      sessionId: 'h3',
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const res = await handleByzantineRequest(mock, {
      sessionId: 'h3',
      faultyAgentIds: ['a1'],
    });
    expect(res.ok).toBe(true);
    expect(res.result?.tolerated).toBe(false);
  });
});
