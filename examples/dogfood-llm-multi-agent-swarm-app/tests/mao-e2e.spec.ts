/**
 * Multi-agent orchestration end-to-end fidelity spec (mao axis: crew
 * assembly → supervisor delegation → graph transition → round
 * completion).
 *
 * Sub-Issue CAR-889 (v1.40-2) AC — the mock adapter drives a full mao
 * ceremony end to end and the fidelity harness diffs the raw
 * {@link TraceEvent} sequence across the axis.
 *
 *  1. assembleCrew registers all agents on the session state.
 *  2. delegateBySupervisor round-robins the workers deterministically.
 *  3. transitionGraph walks the graph following the edge list.
 *  4. completeRound reports whether the delegation count reached the
 *     configured minimum.
 *  5. closeMao records the session history length.
 *
 * The real adapter is exercised through the env-detect skeleton and
 * every op refuses with `KIWA_LLM_ENV_MISSING` on every non-integration
 * environment (the default). Downstream tests inspect
 * {@link LlmMaoSwarmAdapter.mode} + the trace to skip real assertions on
 * those systems.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { detectRealEnvMissing, makeRealAdapter } from '../src/adapters/real.js';
import {
  handleAssembleRequest,
  handleDelegateRequest,
  handleGraphRequest,
  handleRoundRequest,
  validateAssembleRequest,
  validateDelegateRequest,
  validateGraphRequest,
  validateRoundRequest,
} from '../src/app/mao/route.js';
import type { LlmMaoSwarmAdapter } from '../src/adapters/interface.js';

let mock: LlmMaoSwarmAdapter;

beforeEach(() => {
  mock = makeMockAdapter({ latencyMs: 1 });
});

afterEach(async () => {
  await mock.reset();
});

describe('mock adapter — mao crew assembly', () => {
  it('assembleCrew registers all agents', async () => {
    await mock.startMao({ sessionId: 'c1' });
    const r = await mock.assembleCrew({
      sessionId: 'c1',
      agents: [
        { id: 'a1', role: 'planner', capabilities: ['plan'] },
        { id: 'a2', role: 'worker', capabilities: ['exec'] },
      ],
    });
    expect(r.agentCount).toBe(2);
    expect(r.roles).toEqual(['planner', 'worker']);
  });

  it('assembleCrew latency is positive', async () => {
    await mock.startMao({ sessionId: 'c2' });
    const r = await mock.assembleCrew({
      sessionId: 'c2',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    expect(r.latencyMs).toBeGreaterThan(0);
  });

  it('assembleCrew without startMao fails with MISSING_SESSION', async () => {
    await expect(
      mock.assembleCrew({
        sessionId: 'missing',
        agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
      }),
    ).rejects.toThrow(/no session missing/);
  });

  it('assembleCrew rejects duplicate agent ids', async () => {
    await mock.startMao({ sessionId: 'c3' });
    await expect(
      mock.assembleCrew({
        sessionId: 'c3',
        agents: [
          { id: 'a1', role: 'planner', capabilities: ['plan'] },
          { id: 'a1', role: 'worker', capabilities: ['exec'] },
        ],
      }),
    ).rejects.toThrow(/duplicate agent id a1/);
  });

  it('assembleCrew rejects empty agents list', async () => {
    await mock.startMao({ sessionId: 'c4' });
    await expect(
      mock.assembleCrew({ sessionId: 'c4', agents: [] }),
    ).rejects.toThrow(/agents must not be empty/);
  });
});

describe('mock adapter — supervisor delegation', () => {
  it('delegateBySupervisor assigns first worker on round 1', async () => {
    await mock.startMao({ sessionId: 'd1' });
    await mock.assembleCrew({
      sessionId: 'd1',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
        { id: 'w2', role: 'worker', capabilities: ['exec'] },
      ],
    });
    const r = await mock.delegateBySupervisor({
      sessionId: 'd1',
      delegation: {
        supervisorId: 'sup',
        task: 'fetch weather',
        workerIds: ['w1', 'w2'],
      },
    });
    expect(r.round).toBe(1);
    expect(r.supervisor).toBe('sup');
    expect(r.worker).toBe('w1');
  });

  it('delegateBySupervisor round-robins across rounds', async () => {
    await mock.startMao({ sessionId: 'd2' });
    await mock.assembleCrew({
      sessionId: 'd2',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
        { id: 'w2', role: 'worker', capabilities: ['exec'] },
      ],
    });
    const r1 = await mock.delegateBySupervisor({
      sessionId: 'd2',
      delegation: {
        supervisorId: 'sup',
        task: 'A',
        workerIds: ['w1', 'w2'],
      },
    });
    const r2 = await mock.delegateBySupervisor({
      sessionId: 'd2',
      delegation: {
        supervisorId: 'sup',
        task: 'B',
        workerIds: ['w1', 'w2'],
      },
    });
    const r3 = await mock.delegateBySupervisor({
      sessionId: 'd2',
      delegation: {
        supervisorId: 'sup',
        task: 'C',
        workerIds: ['w1', 'w2'],
      },
    });
    expect(r1.worker).toBe('w1');
    expect(r2.worker).toBe('w2');
    expect(r3.worker).toBe('w1');
  });

  it('delegateBySupervisor rejects unknown supervisor', async () => {
    await mock.startMao({ sessionId: 'd3' });
    await mock.assembleCrew({
      sessionId: 'd3',
      agents: [
        { id: 'a1', role: 'worker', capabilities: ['exec'] },
      ],
    });
    await expect(
      mock.delegateBySupervisor({
        sessionId: 'd3',
        delegation: {
          supervisorId: 'ghost',
          task: 'A',
          workerIds: ['a1'],
        },
      }),
    ).rejects.toThrow(/supervisor ghost not in crew/);
  });

  it('delegateBySupervisor rejects empty workerIds', async () => {
    await mock.startMao({ sessionId: 'd4' });
    await mock.assembleCrew({
      sessionId: 'd4',
      agents: [{ id: 'sup', role: 'supervisor', capabilities: ['plan'] }],
    });
    await expect(
      mock.delegateBySupervisor({
        sessionId: 'd4',
        delegation: { supervisorId: 'sup', task: 'A', workerIds: [] },
      }),
    ).rejects.toThrow(/workerIds must not be empty/);
  });

  it('delegateBySupervisor before assembleCrew fails', async () => {
    await mock.startMao({ sessionId: 'd5' });
    await expect(
      mock.delegateBySupervisor({
        sessionId: 'd5',
        delegation: { supervisorId: 'sup', task: 'A', workerIds: ['w1'] },
      }),
    ).rejects.toThrow(/assemble crew first/);
  });
});

describe('mock adapter — graph transition', () => {
  it('transitionGraph walks edges from entry to terminal', async () => {
    await mock.startMao({ sessionId: 'g1' });
    await mock.assembleCrew({
      sessionId: 'g1',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    const r = await mock.transitionGraph({
      sessionId: 'g1',
      graph: {
        nodes: [
          { id: 'n1', agentId: 'a1' },
          { id: 'n2', agentId: 'a1' },
          { id: 'n3', agentId: 'a1' },
        ],
        edges: [
          { from: 'n1', to: 'n2' },
          { from: 'n2', to: 'n3' },
        ],
        entryNodeId: 'n1',
      },
    });
    expect(r.nodeCount).toBe(3);
    expect(r.edgeCount).toBe(2);
    expect(r.visitedCount).toBe(3);
    expect(r.terminalNode).toBe('n3');
  });

  it('transitionGraph stops at leaf when no outgoing edge', async () => {
    await mock.startMao({ sessionId: 'g2' });
    await mock.assembleCrew({
      sessionId: 'g2',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    const r = await mock.transitionGraph({
      sessionId: 'g2',
      graph: {
        nodes: [
          { id: 'n1', agentId: 'a1' },
          { id: 'n2', agentId: 'a1' },
        ],
        edges: [],
        entryNodeId: 'n1',
      },
    });
    expect(r.terminalNode).toBe('n1');
    expect(r.visitedCount).toBe(1);
  });

  it('transitionGraph rejects entryNodeId not in nodes', async () => {
    await mock.startMao({ sessionId: 'g3' });
    await mock.assembleCrew({
      sessionId: 'g3',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    await expect(
      mock.transitionGraph({
        sessionId: 'g3',
        graph: {
          nodes: [{ id: 'n1', agentId: 'a1' }],
          edges: [],
          entryNodeId: 'ghost',
        },
      }),
    ).rejects.toThrow(/entry ghost not in nodes/);
  });

  it('transitionGraph rejects empty nodes list', async () => {
    await mock.startMao({ sessionId: 'g4' });
    await mock.assembleCrew({
      sessionId: 'g4',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    await expect(
      mock.transitionGraph({
        sessionId: 'g4',
        graph: { nodes: [], edges: [], entryNodeId: 'ghost' },
      }),
    ).rejects.toThrow(/nodes must not be empty/);
  });
});

describe('mock adapter — round completion', () => {
  it('completeRound reports sufficient when delegations meet minimum', async () => {
    await mock.startMao({ sessionId: 'r1' });
    await mock.assembleCrew({
      sessionId: 'r1',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
      ],
    });
    await mock.delegateBySupervisor({
      sessionId: 'r1',
      delegation: { supervisorId: 'sup', task: 'A', workerIds: ['w1'] },
    });
    await mock.delegateBySupervisor({
      sessionId: 'r1',
      delegation: { supervisorId: 'sup', task: 'B', workerIds: ['w1'] },
    });
    const r = await mock.completeRound({ sessionId: 'r1', minDelegations: 2 });
    expect(r.round).toBe(1);
    expect(r.totalDelegations).toBe(2);
    expect(r.sufficient).toBe(true);
  });

  it('completeRound reports insufficient when below minimum', async () => {
    await mock.startMao({ sessionId: 'r2' });
    await mock.assembleCrew({
      sessionId: 'r2',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
      ],
    });
    await mock.delegateBySupervisor({
      sessionId: 'r2',
      delegation: { supervisorId: 'sup', task: 'A', workerIds: ['w1'] },
    });
    const r = await mock.completeRound({ sessionId: 'r2', minDelegations: 3 });
    expect(r.sufficient).toBe(false);
  });

  it('completeRound rejects negative minDelegations', async () => {
    await mock.startMao({ sessionId: 'r3' });
    await mock.assembleCrew({
      sessionId: 'r3',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    await expect(
      mock.completeRound({ sessionId: 'r3', minDelegations: -1 }),
    ).rejects.toThrow(/must be non-negative/);
  });
});

describe('mock adapter — mao session lifecycle', () => {
  it('closeMao records history length', async () => {
    await mock.startMao({ sessionId: 'l1' });
    await mock.assembleCrew({
      sessionId: 'l1',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    await mock.closeMao({ sessionId: 'l1' });
    const trace = mock.traces().find((t) => t.op === 'closeMao');
    expect(trace?.ok).toBe(true);
    expect(
      (trace?.detail as { historyLength?: number })?.historyLength,
    ).toBeGreaterThan(0);
  });

  it('startMao twice throws DUPLICATE_SESSION', async () => {
    await mock.startMao({ sessionId: 'l2' });
    await expect(mock.startMao({ sessionId: 'l2' })).rejects.toThrow(
      /duplicate session l2/,
    );
  });

  it('full mao ceremony records ordered ops', async () => {
    await mock.startMao({ sessionId: 'l3' });
    await mock.assembleCrew({
      sessionId: 'l3',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
      ],
    });
    await mock.delegateBySupervisor({
      sessionId: 'l3',
      delegation: { supervisorId: 'sup', task: 'A', workerIds: ['w1'] },
    });
    await mock.transitionGraph({
      sessionId: 'l3',
      graph: {
        nodes: [{ id: 'n1', agentId: 'sup' }],
        edges: [],
        entryNodeId: 'n1',
      },
    });
    await mock.completeRound({ sessionId: 'l3', minDelegations: 1 });
    await mock.closeMao({ sessionId: 'l3' });
    const ops = mock.traces().map((t) => t.op);
    expect(ops).toEqual([
      'startMao',
      'assembleCrew',
      'delegateBySupervisor',
      'transitionGraph',
      'completeRound',
      'closeMao',
    ]);
  });
});

describe('real adapter — refuses without KIWA_MODE=real', () => {
  const originalMode = process.env['KIWA_MODE'];
  const originalKey = process.env['ANTHROPIC_API_KEY'];
  const originalBudget = process.env['KIWA_LLM_BUDGET_USD'];

  afterEach(() => {
    if (originalMode === undefined) {
      delete process.env['KIWA_MODE'];
    } else {
      process.env['KIWA_MODE'] = originalMode;
    }
    if (originalKey === undefined) {
      delete process.env['ANTHROPIC_API_KEY'];
    } else {
      process.env['ANTHROPIC_API_KEY'] = originalKey;
    }
    if (originalBudget === undefined) {
      delete process.env['KIWA_LLM_BUDGET_USD'];
    } else {
      process.env['KIWA_LLM_BUDGET_USD'] = originalBudget;
    }
  });

  it('default env reports KIWA_LLM_ENV_MISSING', () => {
    delete process.env['KIWA_MODE'];
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_ENV_MISSING');
  });

  it('KIWA_MODE=mock reports KIWA_MODE=mock', () => {
    process.env['KIWA_MODE'] = 'mock';
    expect(detectRealEnvMissing()).toBe('KIWA_MODE=mock');
  });

  it('KIWA_MODE=real without key reports ANTHROPIC_API_KEY_MISSING', () => {
    process.env['KIWA_MODE'] = 'real';
    delete process.env['ANTHROPIC_API_KEY'];
    delete process.env['KIWA_LLM_BUDGET_USD'];
    expect(detectRealEnvMissing()).toBe('ANTHROPIC_API_KEY_MISSING');
  });

  it('KIWA_MODE=real with key but no budget reports KIWA_LLM_BUDGET_USD_MISSING', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    delete process.env['KIWA_LLM_BUDGET_USD'];
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_MISSING');
  });

  it('KIWA_MODE=real with invalid budget reports KIWA_LLM_BUDGET_USD_INVALID', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = 'not-a-number';
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_INVALID');
  });

  it('KIWA_MODE=real with zero budget reports KIWA_LLM_BUDGET_USD_INVALID', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = '0';
    expect(detectRealEnvMissing()).toBe('KIWA_LLM_BUDGET_USD_INVALID');
  });

  it('all env set returns null (real available)', () => {
    process.env['KIWA_MODE'] = 'real';
    process.env['ANTHROPIC_API_KEY'] = 'sk-test';
    process.env['KIWA_LLM_BUDGET_USD'] = '10';
    expect(detectRealEnvMissing()).toBe(null);
  });

  it('real adapter assembleCrew refuses with env missing', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await expect(
      real.assembleCrew({
        sessionId: 'x',
        agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
      }),
    ).rejects.toThrow(/KIWA_LLM_ENV_MISSING/);
    const trace = real.traces().find((t) => t.op === 'assembleCrew');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_LLM_ENV_MISSING');
  });

  it('real adapter startMao records refusal without throwing', async () => {
    delete process.env['KIWA_MODE'];
    const real = makeRealAdapter();
    await real.startMao({ sessionId: 'x' });
    const trace = real.traces().find((t) => t.op === 'startMao');
    expect(trace?.ok).toBe(false);
    expect(trace?.errorKind).toBe('KIWA_LLM_ENV_MISSING');
  });
});

describe('mao route validators', () => {
  it('rejects non-object body for assemble', () => {
    const r = validateAssembleRequest('bad');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('body_not_object');
  });

  it('rejects missing sessionId on assemble', () => {
    const r = validateAssembleRequest({});
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('sessionId_required');
  });

  it('rejects missing agents on assemble', () => {
    const r = validateAssembleRequest({ sessionId: 's' });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('agents_required');
  });

  it('accepts a valid assemble request', () => {
    const r = validateAssembleRequest({
      sessionId: 's',
      agents: [{ id: 'a1', role: 'planner', capabilities: [] }],
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.agents.length).toBe(1);
  });

  it('rejects delegate request without workerIds', () => {
    const r = validateDelegateRequest({
      sessionId: 's',
      delegation: { supervisorId: 'sup', task: 't', workerIds: [] },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('workerIds_required');
  });

  it('accepts a valid delegate request', () => {
    const r = validateDelegateRequest({
      sessionId: 's',
      delegation: { supervisorId: 'sup', task: 't', workerIds: ['w1'] },
    });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.delegation.supervisorId).toBe('sup');
  });

  it('rejects graph request missing entryNodeId', () => {
    const r = validateGraphRequest({
      sessionId: 's',
      graph: { nodes: [{ id: 'n1', agentId: 'a1' }], edges: [], entryNodeId: '' },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('graph.entryNodeId_required');
  });

  it('accepts a valid graph request', () => {
    const r = validateGraphRequest({
      sessionId: 's',
      graph: {
        nodes: [{ id: 'n1', agentId: 'a1' }],
        edges: [],
        entryNodeId: 'n1',
      },
    });
    expect(r.ok).toBe(true);
  });

  it('rejects round request with negative minDelegations', () => {
    const r = validateRoundRequest({ sessionId: 's', minDelegations: -1 });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errorKind).toBe('minDelegations_required');
  });

  it('accepts a valid round request', () => {
    const r = validateRoundRequest({ sessionId: 's', minDelegations: 2 });
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.minDelegations).toBe(2);
  });
});

describe('mao route handlers', () => {
  it('handleAssembleRequest returns ok result', async () => {
    await mock.startMao({ sessionId: 'h1' });
    const res = await handleAssembleRequest(mock, {
      sessionId: 'h1',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    expect(res.ok).toBe(true);
    expect(res.result?.agentCount).toBe(1);
  });

  it('handleDelegateRequest surfaces missing-session error', async () => {
    const res = await handleDelegateRequest(mock, {
      sessionId: 'ghost',
      delegation: {
        supervisorId: 'sup',
        task: 't',
        workerIds: ['w1'],
      },
    });
    expect(res.ok).toBe(false);
    expect(res.errorKind).toContain('no session');
  });

  it('handleGraphRequest returns visited count for chain graph', async () => {
    await mock.startMao({ sessionId: 'h2' });
    await mock.assembleCrew({
      sessionId: 'h2',
      agents: [{ id: 'a1', role: 'planner', capabilities: ['plan'] }],
    });
    const res = await handleGraphRequest(mock, {
      sessionId: 'h2',
      graph: {
        nodes: [
          { id: 'n1', agentId: 'a1' },
          { id: 'n2', agentId: 'a1' },
        ],
        edges: [{ from: 'n1', to: 'n2' }],
        entryNodeId: 'n1',
      },
    });
    expect(res.ok).toBe(true);
    expect(res.result?.visitedCount).toBe(2);
  });

  it('handleRoundRequest reports sufficient=true when threshold met', async () => {
    await mock.startMao({ sessionId: 'h3' });
    await mock.assembleCrew({
      sessionId: 'h3',
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: ['plan'] },
        { id: 'w1', role: 'worker', capabilities: ['exec'] },
      ],
    });
    await mock.delegateBySupervisor({
      sessionId: 'h3',
      delegation: { supervisorId: 'sup', task: 't', workerIds: ['w1'] },
    });
    const res = await handleRoundRequest(mock, {
      sessionId: 'h3',
      minDelegations: 1,
    });
    expect(res.ok).toBe(true);
    expect(res.result?.sufficient).toBe(true);
  });
});
