/**
 * Pipeline end-to-end fidelity spec (multi-agent + swarm pipeline: crew
 * → supervisor delegation → graph → swarm allocation → majority-vote →
 * Byzantine tolerance).
 *
 * Sub-Issue CAR-889 (v1.40-2) AC — the mock adapter drives the highest-
 * level integration surface end to end so the fidelity harness can score
 * behavioural drift on the full workflow.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import {
  handlePipelineRequest,
  validatePipelineRequest,
} from '../src/app/pipeline/route.js';
import type {
  LlmMaoSwarmAdapter,
  PipelineInput,
} from '../src/adapters/interface.js';

function baseInput(overrides: Partial<PipelineInput> = {}): PipelineInput {
  return {
    sessionId: 'pipe',
    crew: [
      { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
      { id: 'w1', role: 'worker', capabilities: ['exec'] },
      { id: 'w2', role: 'worker', capabilities: ['exec'] },
    ],
    supervisorId: 'sup',
    workerIds: ['w1', 'w2'],
    task: 'plan-trip',
    graph: {
      nodes: [
        { id: 'n1', agentId: 'sup' },
        { id: 'n2', agentId: 'w1' },
        { id: 'n3', agentId: 'w2' },
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
      ],
      entryNodeId: 'n1',
    },
    swarmAgents: [
      { id: 'sa1', reliability: 0.9 },
      { id: 'sa2', reliability: 0.9 },
      { id: 'sa3', reliability: 0.9 },
    ],
    swarmRoles: ['scout', 'worker'],
    tasks: [
      { id: 't-low', priority: 1 },
      { id: 't-high', priority: 5 },
    ],
    votes: [
      { agentId: 'sa1', proposal: 'ship' },
      { agentId: 'sa2', proposal: 'ship' },
      { agentId: 'sa3', proposal: 'hold' },
    ],
    faultyAgentIds: [],
    minDelegations: 2,
    faultThreshold: 0.34,
    ...overrides,
  };
}

let mock: LlmMaoSwarmAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — pipeline happy path', () => {
  it('runPipeline reports stage=completed with majority + tolerated', async () => {
    const r = await mock.runPipeline(baseInput());
    expect(r.stage).toBe('completed');
    expect(r.blockedReason).toBeNull();
    expect(r.crew.agentCount).toBe(3);
    expect(r.delegation.rounds).toBe(2);
    expect(r.delegation.supervisor).toBe('sup');
    expect(r.delegation.workers).toEqual(['w1', 'w2']);
    expect(r.graph.visitedCount).toBe(3);
    expect(r.graph.terminalNode).toBe('n3');
    expect(r.swarm.taskCount).toBe(2);
    expect(r.swarm.consensusWinner).toBe('ship');
    expect(r.swarm.byzantineTolerated).toBe(true);
    expect(r.swarm.agreementRatio).toBeCloseTo(2 / 3, 5);
  });

  it('runPipeline records latency > 0', async () => {
    const r = await mock.runPipeline(baseInput({ sessionId: 'lat' }));
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('runPipeline appends a trace record', async () => {
    await mock.runPipeline(baseInput({ sessionId: 'tr' }));
    const trace = mock.traces().find((t) => t.op === 'runPipeline');
    expect(trace?.ok).toBe(true);
    expect((trace?.detail as { sessionId?: string })?.sessionId).toBe('tr');
  });
});

describe('mock adapter — pipeline blocked branches', () => {
  it('runPipeline reports blocked-no-consensus when votes tie', async () => {
    const r = await mock.runPipeline(
      baseInput({
        sessionId: 'tie',
        votes: [
          { agentId: 'sa1', proposal: 'ship' },
          { agentId: 'sa2', proposal: 'hold' },
        ],
      }),
    );
    expect(r.stage).toBe('blocked-no-consensus');
    expect(r.blockedReason).toContain('no majority');
    expect(r.swarm.consensusWinner).toBeNull();
  });

  it('runPipeline reports blocked-byzantine when faulty ratio too high', async () => {
    const r = await mock.runPipeline(
      baseInput({
        sessionId: 'byz',
        faultThreshold: 0.2,
        faultyAgentIds: ['sa1'],
      }),
    );
    expect(r.stage).toBe('blocked-byzantine');
    expect(r.swarm.byzantineTolerated).toBe(false);
  });

  it('runPipeline reports blocked-graph-empty when graph has no nodes', async () => {
    const r = await mock.runPipeline(
      baseInput({
        sessionId: 'gemp',
        graph: { nodes: [], edges: [], entryNodeId: '' },
      }),
    );
    expect(r.stage).toBe('blocked-graph-empty');
    expect(r.blockedReason).toContain('graph.nodes must not be empty');
    expect(r.graph.visitedCount).toBe(0);
  });
});

describe('mock adapter — pipeline delegation rotation', () => {
  it('runPipeline rotates delegation targets across rounds', async () => {
    const r = await mock.runPipeline(
      baseInput({ sessionId: 'rot', minDelegations: 4 }),
    );
    // The pipeline uses a fresh sub-session per call, so the rotation
    // is observable through the public `delegation.workers` payload
    // rather than the internal delegations() introspection.
    expect(r.delegation.workers).toEqual(['w1', 'w2', 'w1', 'w2']);
  });

  it('runPipeline records delegation count at swarm allocation stage', async () => {
    const r = await mock.runPipeline(
      baseInput({ sessionId: 'cnt', minDelegations: 3 }),
    );
    expect(r.delegation.rounds).toBe(3);
  });

  it('runPipeline delegations() returns [] for pipeline sub-sessions', async () => {
    await mock.runPipeline(baseInput({ sessionId: 'sub' }));
    // Pipeline creates its own mao sub-session outside the registry, so
    // the public delegations() introspection returns an empty snapshot
    // for the pipeline sessionId.
    expect(mock.delegations('sub')).toEqual([]);
  });

  it('mao-registered sessions expose delegations via delegations()', async () => {
    await mock.startMao({ sessionId: 'reg' });
    await mock.assembleCrew({
      sessionId: 'reg',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
      ],
    });
    await mock.delegateBySupervisor({
      sessionId: 'reg',
      delegation: { supervisorId: 'sup', task: 'A', workerIds: ['w1'] },
    });
    expect(mock.delegations('reg').length).toBe(1);
    expect(mock.delegations('reg')[0]?.worker).toBe('w1');
  });
});

describe('pipeline route validator', () => {
  it('rejects non-object body', () => {
    const r = validatePipelineRequest(null);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId', () => {
    const r = validatePipelineRequest({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects missing crew', () => {
    const r = validatePipelineRequest({ sessionId: 's' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('crew_required');
  });

  it('rejects missing faultThreshold', () => {
    const b = baseInput();
    const stripped: Record<string, unknown> = { ...b };
    delete stripped['faultThreshold'];
    const r = validatePipelineRequest(stripped);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('faultThreshold_required');
  });

  it('accepts a valid pipeline request', () => {
    const r = validatePipelineRequest(baseInput({ sessionId: 'ok' }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.sessionId).toBe('ok');
  });
});

describe('pipeline route handler', () => {
  it('handlePipelineRequest returns ok result for happy path', async () => {
    const res = await handlePipelineRequest(mock, baseInput({ sessionId: 'h1' }));
    expect(res.ok).toBe(true);
    expect(res.result?.stage).toBe('completed');
  });

  it('handlePipelineRequest reports blocked-byzantine', async () => {
    const res = await handlePipelineRequest(
      mock,
      baseInput({ sessionId: 'h2', faultThreshold: 0.2, faultyAgentIds: ['sa1'] }),
    );
    expect(res.ok).toBe(true);
    expect(res.result?.stage).toBe('blocked-byzantine');
  });
});
