/**
 * v1.40-5 docs 補強 (Issue #1135 / CAR-892) — tutorial 85-87 code snippet validation
 * for `@kiwa-test/ai-llm` v0.5 advanced III 8 axis (Multi-agent orchestration +
 * Agent swarm + Code interpreter + Fine-tuning pipeline + LLM ops + Prompt
 * engineering advanced + RAG III + Cost optimization).
 *
 * `docs/tutorials/85-multi-agent-swarm.md` /
 * `docs/tutorials/86-code-interpreter-fine-tuning.md` /
 * `docs/tutorials/87-llm-ops-rag-iii-cost.md` に載っている snippet が実際に動作する
 * ことを担保する。
 *
 * v1.23 → v1.40 で 18 milestone 連続 snippet validation streak を延伸。
 */
import { describe, expect, it } from 'vitest';
import {
  advanceRollout,
  allocateTasks,
  assembleCrew,
  assignRoles,
  cachePrompt,
  compareShadow,
  compressPrompt,
  completeRound,
  delegateBySupervisor,
  detectDrift,
  evaluateAb,
  executeCode,
  expandChainOfThought,
  expandParent,
  lookupSemanticCache,
  pinVersion,
  prepareDataset,
  promoteCanary,
  reachConsensus,
  rollback,
  runEvalLoop,
  selectFewShot,
  selfQuery,
  startCiSession,
  startCoSession,
  startFtpSession,
  startMaoSession,
  startOpsSession,
  startPeaSession,
  startRag3Session,
  startSandbox,
  startSwarmSession,
  stepAgentic,
  stepCascade,
  stepRlhf,
  submitBatch,
  tolerateByzantine,
  transitionGraph,
  traverseGraph,
  updateRegistry,
  useTool,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 85 — Multi-agent orchestration + Agent swarm
// (crew → delegate → graph → roles → tasks → consensus → Byzantine → round)
// ---------------------------------------------------------------------------

describe('tutorial 85 — mao crew assembly', () => {
  it('records the crew and moves state to crew-assembled (tutorial: assembleCrew snippet)', () => {
    const s = startMaoSession({ target: 'anthropic', sessionId: 's-1' });
    const { agentCount } = assembleCrew(s, {
      agents: [
        { id: 'a1', role: 'planner', capabilities: ['plan'] },
        { id: 'a2', role: 'worker', capabilities: ['exec'] },
      ],
    });
    expect(agentCount).toBe(2);
    expect(s.state).toBe('crew-assembled');
  });

  it('rejects duplicate agent ids (tutorial: duplicate-id snippet)', () => {
    const s = startMaoSession({ target: 'openai', sessionId: 's-2' });
    expect(() =>
      assembleCrew(s, {
        agents: [
          { id: 'a1', role: 'r', capabilities: [] },
          { id: 'a1', role: 'r', capabilities: [] },
        ],
      }),
    ).toThrow(/duplicate agent id/);
  });
});

describe('tutorial 85 — mao supervisor delegation', () => {
  it('rotates workers round-robin (tutorial: round-robin snippet)', () => {
    const s = startMaoSession({ target: 'vercel-ai', sessionId: 's-3' });
    assembleCrew(s, {
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: [] },
        { id: 'w1', role: 'worker', capabilities: [] },
        { id: 'w2', role: 'worker', capabilities: [] },
      ],
    });
    const r1 = delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 'task-1',
      workerIds: ['w1', 'w2'],
    });
    const r2 = delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 'task-2',
      workerIds: ['w1', 'w2'],
    });
    expect(r1.delegation.worker).toBe('w1');
    expect(r2.delegation.worker).toBe('w2');
  });

  it('throws when supervisor is not in crew (tutorial: ghost-supervisor snippet)', () => {
    const s = startMaoSession({ target: 'langchain', sessionId: 's-4' });
    assembleCrew(s, { agents: [{ id: 'w1', role: 'w', capabilities: [] }] });
    expect(() =>
      delegateBySupervisor(s, {
        supervisorId: 'ghost',
        task: 't',
        workerIds: ['w1'],
      }),
    ).toThrow(/supervisor ghost not in crew/);
  });
});

describe('tutorial 85 — mao graph transition', () => {
  it('walks entry → terminal via edge follow (tutorial: BFS graph snippet)', () => {
    const s = startMaoSession({ target: 'anthropic', sessionId: 's-5' });
    assembleCrew(s, {
      agents: [
        { id: 'a1', role: 'r', capabilities: [] },
        { id: 'a2', role: 'r', capabilities: [] },
      ],
    });
    const { visited } = transitionGraph(s, {
      nodes: [
        { id: 'n1', agentId: 'a1' },
        { id: 'n2', agentId: 'a2' },
        { id: 'n3', agentId: 'a1' },
      ],
      edges: [
        { from: 'n1', to: 'n2' },
        { from: 'n2', to: 'n3' },
      ],
      entryNodeId: 'n1',
    });
    expect(visited).toEqual(['n1', 'n2', 'n3']);
    expect(s.currentNode).toBe('n3');
    expect(s.state).toBe('graph-transitioned');
  });

  it('rejects an entry not in nodes (tutorial: ghost-entry snippet)', () => {
    const s = startMaoSession({ target: 'openai', sessionId: 's-6' });
    assembleCrew(s, { agents: [{ id: 'a1', role: 'r', capabilities: [] }] });
    expect(() =>
      transitionGraph(s, {
        nodes: [{ id: 'n1', agentId: 'a1' }],
        edges: [],
        entryNodeId: 'ghost',
      }),
    ).toThrow(/entry ghost not in nodes/);
  });
});

describe('tutorial 85 — swarm roles + tasks', () => {
  it('cycles roles by index modulo (tutorial: role-cycle snippet)', () => {
    const s = startSwarmSession({ target: 'anthropic', sessionId: 's-7' });
    const { assignments } = assignRoles(s, {
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.8 },
        { id: 'a3', reliability: 0.95 },
      ],
      roles: ['coder', 'reviewer'],
    });
    expect(assignments.map((a) => a.role)).toEqual([
      'coder',
      'reviewer',
      'coder',
    ]);
  });

  it('allocates highest-priority task to first agent (tutorial: priority-sort snippet)', () => {
    const s = startSwarmSession({ target: 'openai', sessionId: 's-8' });
    assignRoles(s, {
      agents: [
        { id: 'a1', reliability: 1 },
        { id: 'a2', reliability: 1 },
      ],
      roles: ['r'],
    });
    const { allocations } = allocateTasks(s, {
      tasks: [
        { id: 't1', priority: 1 },
        { id: 't2', priority: 10 },
      ],
    });
    expect(allocations[0]?.id).toBe('t2');
    expect(allocations[0]?.assignee).toBe('a1');
  });
});

describe('tutorial 85 — swarm consensus + Byzantine', () => {
  it('picks the majority proposal (tutorial: majority-vote snippet)', () => {
    const s = startSwarmSession({ target: 'vercel-ai', sessionId: 's-9' });
    assignRoles(s, {
      agents: [
        { id: 'a1', reliability: 1 },
        { id: 'a2', reliability: 1 },
        { id: 'a3', reliability: 1 },
      ],
      roles: ['voter'],
    });
    const { winner, agreementRatio } = reachConsensus(s, {
      votes: [
        { agentId: 'a1', proposal: 'X' },
        { agentId: 'a2', proposal: 'X' },
        { agentId: 'a3', proposal: 'Y' },
      ],
    });
    expect(winner).toBe('X');
    expect(agreementRatio).toBeGreaterThan(0.5);
  });

  it('tolerates minority faulty agents (tutorial: PBFT-lite 0.34 snippet)', () => {
    const s = startSwarmSession({
      target: 'langchain',
      sessionId: 's-10',
      faultThreshold: 0.34,
    });
    assignRoles(s, {
      agents: Array.from({ length: 10 }, (_, i) => ({
        id: `a${i}`,
        reliability: 1,
      })),
      roles: ['r'],
    });
    const { tolerated, honestRatio } = tolerateByzantine(s, {
      faultyAgentIds: ['a0', 'a1'],
    });
    expect(honestRatio).toBeCloseTo(0.8);
    expect(tolerated).toBe(true);
  });

  it('rejects majority faulty agents (tutorial: 5-of-10 snippet)', () => {
    const s = startSwarmSession({
      target: 'anthropic',
      sessionId: 's-11',
      faultThreshold: 0.34,
    });
    assignRoles(s, {
      agents: Array.from({ length: 10 }, (_, i) => ({
        id: `a${i}`,
        reliability: 1,
      })),
      roles: ['r'],
    });
    const { tolerated } = tolerateByzantine(s, {
      faultyAgentIds: ['a0', 'a1', 'a2', 'a3', 'a4'],
    });
    expect(tolerated).toBe(false);
  });
});

describe('tutorial 85 — mao round completion', () => {
  it('flags sufficient when delegations meet the floor (tutorial: minDelegations snippet)', () => {
    const s = startMaoSession({ target: 'openai', sessionId: 's-12' });
    assembleCrew(s, {
      agents: [
        { id: 'sup', role: 'supervisor', capabilities: [] },
        { id: 'w1', role: 'worker', capabilities: [] },
      ],
    });
    delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 't1',
      workerIds: ['w1'],
    });
    delegateBySupervisor(s, {
      supervisorId: 'sup',
      task: 't2',
      workerIds: ['w1'],
    });
    const { sufficient, roundsCompleted } = completeRound(s, {
      minDelegations: 2,
    });
    expect(sufficient).toBe(true);
    expect(roundsCompleted).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 86 — Code interpreter + Fine-tuning pipeline
// (sandbox → execute → tool → rollback → dataset → RLHF → eval → drift)
// ---------------------------------------------------------------------------

describe('tutorial 86 — ci sandbox binding', () => {
  it('starts a sandbox and moves state to sandbox-started (tutorial: startSandbox snippet)', () => {
    const s = startCiSession({ target: 'anthropic', sessionId: 's-1' });
    const { sandboxId } = startSandbox(s, {
      sandboxId: 'sbx-1',
      timeoutMs: 5000,
    });
    expect(sandboxId).toBe('sbx-1');
    expect(s.state).toBe('sandbox-started');
    expect(s.sandboxId).toBe('sbx-1');
  });

  it('refuses non-positive timeoutMs (tutorial: timeout-guard snippet)', () => {
    const s = startCiSession({ target: 'openai', sessionId: 's-2' });
    expect(() =>
      startSandbox(s, { sandboxId: 'sbx-2', timeoutMs: 0 }),
    ).toThrow(/timeoutMs must be positive/);
  });
});

describe('tutorial 86 — ci code execution', () => {
  it('records execution and applies assigns to memory (tutorial: executeCode snippet)', () => {
    const s = startCiSession({ target: 'vercel-ai', sessionId: 's-3' });
    startSandbox(s, { sandboxId: 'sbx-3', timeoutMs: 5000 });
    const { execution } = executeCode(s, {
      code: 'x = 42',
      assigns: { x: '42' },
    });
    expect(execution.ok).toBe(true);
    expect(execution.index).toBe(0);
    expect(s.memory.x).toBe('42');
    expect(s.state).toBe('code-executed');
  });

  it('flags a raise as an execution error without applying assigns (tutorial: raise snippet)', () => {
    const s = startCiSession({ target: 'langchain', sessionId: 's-4' });
    startSandbox(s, { sandboxId: 'sbx-4', timeoutMs: 5000 });
    const { execution } = executeCode(s, {
      code: 'raise ValueError("bad")',
      assigns: { x: '42' },
    });
    expect(execution.ok).toBe(false);
    expect(execution.stdout).toBe('ExecutionError');
    expect(s.memory.x).toBeUndefined();
  });
});

describe('tutorial 86 — ci tool + rollback', () => {
  it('records a tool call (tutorial: useTool snippet)', () => {
    const s = startCiSession({ target: 'openai', sessionId: 's-5' });
    startSandbox(s, { sandboxId: 'sbx-5', timeoutMs: 5000 });
    const { call } = useTool(s, {
      name: 'search',
      args: { q: 'kiwa' },
    });
    expect(call.name).toBe('search');
    expect(call.ok).toBe(true);
    expect(s.toolCalls).toHaveLength(1);
  });

  it('flags an unknown tool as ok=false (tutorial: unknown-tool snippet)', () => {
    const s = startCiSession({ target: 'anthropic', sessionId: 's-6' });
    startSandbox(s, { sandboxId: 'sbx-6', timeoutMs: 5000 });
    const { call } = useTool(s, { name: 'unknown', args: {} });
    expect(call.ok).toBe(false);
  });

  it('restores memory on rollback (tutorial: rollback snapshot snippet)', () => {
    const s = startCiSession({ target: 'vercel-ai', sessionId: 's-7' });
    startSandbox(s, { sandboxId: 'sbx-7', timeoutMs: 5000 });
    executeCode(s, { code: 'x = 1', assigns: { x: '1' } });
    executeCode(s, { code: 'x = 2', assigns: { x: '2' } });
    executeCode(s, { code: 'x = 3', assigns: { x: '3' } });
    const { poppedCount, remaining } = rollback(s, { steps: 2 });
    expect(poppedCount).toBe(2);
    expect(remaining).toBe(1);
    expect(s.memory.x).toBe('1');
  });
});

describe('tutorial 86 — ftp dataset preparation', () => {
  it('dedupes duplicate samples when dedupe is on (tutorial: dedupe-on snippet)', () => {
    const s = startFtpSession({ target: 'anthropic', sessionId: 's-8' });
    const { sampleCount, deduped } = prepareDataset(s, {
      samples: [
        { prompt: 'p', chosen: 'a', rejected: 'b' },
        { prompt: 'p', chosen: 'a', rejected: 'b' },
        { prompt: 'p2', chosen: 'a', rejected: 'b' },
      ],
      dedupe: true,
    });
    expect(sampleCount).toBe(2);
    expect(deduped).toBe(1);
    expect(s.state).toBe('dataset-prepared');
  });

  it('keeps duplicates when dedupe is off (tutorial: dedupe-off snippet)', () => {
    const s = startFtpSession({ target: 'openai', sessionId: 's-9' });
    const { sampleCount, deduped } = prepareDataset(s, {
      samples: [
        { prompt: 'p', chosen: 'a', rejected: 'b' },
        { prompt: 'p', chosen: 'a', rejected: 'b' },
      ],
      dedupe: false,
    });
    expect(sampleCount).toBe(2);
    expect(deduped).toBe(0);
  });
});

describe('tutorial 86 — ftp RLHF stepping', () => {
  it('records a step with deterministic policy delta (tutorial: stepRlhf snippet)', () => {
    const s = startFtpSession({ target: 'vercel-ai', sessionId: 's-10' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    const { totalStep } = stepRlhf(s, {
      rewards: [0.5, 0.7],
      learningRate: 0.1,
    });
    expect(totalStep.step).toBe(1);
    expect(totalStep.reward).toBeCloseTo(0.6);
    expect(totalStep.policyDelta).toBeCloseTo(0.06);
    expect(s.state).toBe('rlhf-stepped');
  });

  it('refuses a non-positive learning rate (tutorial: lr-guard snippet)', () => {
    const s = startFtpSession({ target: 'langchain', sessionId: 's-11' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    expect(() =>
      stepRlhf(s, { rewards: [0.5], learningRate: 0 }),
    ).toThrow(/learningRate must be positive/);
  });
});

describe('tutorial 86 — ftp eval + drift', () => {
  it('flags drift when latest deviates from baseline beyond threshold (tutorial: drift-fire snippet)', () => {
    const s = startFtpSession({ target: 'openai', sessionId: 's-12' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    runEvalLoop(s, { epochScores: [0.7, 0.65, 0.5] });
    const { drifted, delta } = detectDrift(s, { threshold: 0.15 });
    expect(drifted).toBe(true);
    expect(delta).toBeCloseTo(-0.2);
    expect(s.state).toBe('drift-detected');
  });

  it('stays undrifted when delta is under threshold (tutorial: drift-no-fire snippet)', () => {
    const s = startFtpSession({ target: 'anthropic', sessionId: 's-13' });
    prepareDataset(s, {
      samples: [{ prompt: 'p', chosen: 'a', rejected: 'b' }],
      dedupe: false,
    });
    runEvalLoop(s, { epochScores: [0.7, 0.72] });
    const { drifted } = detectDrift(s, { threshold: 0.15 });
    expect(drifted).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 87 — LLM ops + Prompt engineering advanced + RAG III + Cost opt
// (registry → rollout → A/B → canary → shadow → CoT → few-shot → cache →
//  version → graph → agentic → self-query → parent → batch → compress →
//  cascade → semantic-cache)
// ---------------------------------------------------------------------------

describe('tutorial 87 — ops registry + rollout', () => {
  it('registers and activates a version (tutorial: updateRegistry snippet)', () => {
    const s = startOpsSession({ target: 'anthropic', sessionId: 's-1' });
    const { registrySize } = updateRegistry(s, {
      version: 'v1.0',
      activate: true,
    });
    expect(registrySize).toBe(1);
    expect(s.registry[0]?.active).toBe(true);
    expect(s.state).toBe('registry-updated');
  });

  it('advances rollout toward target (tutorial: advanceRollout snippet)', () => {
    const s = startOpsSession({ target: 'openai', sessionId: 's-2' });
    updateRegistry(s, { version: 'v1.0', activate: true });
    const r1 = advanceRollout(s, {
      targetPercent: 50,
      incrementPercent: 20,
    });
    const r2 = advanceRollout(s, {
      targetPercent: 50,
      incrementPercent: 20,
    });
    const r3 = advanceRollout(s, {
      targetPercent: 50,
      incrementPercent: 20,
    });
    expect(r1.currentPercent).toBe(20);
    expect(r2.currentPercent).toBe(40);
    expect(r3.currentPercent).toBe(50);
    expect(r3.reachedTarget).toBe(true);
  });

  it('rejects duplicate versions (tutorial: duplicate-version snippet)', () => {
    const s = startOpsSession({ target: 'vercel-ai', sessionId: 's-3' });
    updateRegistry(s, { version: 'v1', activate: false });
    expect(() => updateRegistry(s, { version: 'v1', activate: false })).toThrow(
      /already registered/,
    );
  });
});

describe('tutorial 87 — ops A/B + canary', () => {
  it('picks the higher-mean variant with sufficient samples (tutorial: minSamples snippet)', () => {
    const s = startOpsSession({ target: 'langchain', sessionId: 's-4' });
    updateRegistry(s, { version: 'v1', activate: false });
    const { winner, delta } = evaluateAb(s, {
      results: [
        { variant: 'A', score: 0.75, samples: 20 },
        { variant: 'B', score: 0.8, samples: 20 },
      ],
      minSamples: 10,
    });
    expect(winner).toBe('B');
    expect(delta).toBeCloseTo(0.05);
  });

  it('drops variants under the minSamples floor (tutorial: sample-floor snippet)', () => {
    const s = startOpsSession({ target: 'anthropic', sessionId: 's-5' });
    updateRegistry(s, { version: 'v1', activate: false });
    const { winner } = evaluateAb(s, {
      results: [
        { variant: 'A', score: 0.5, samples: 3 },
        { variant: 'B', score: 0.9, samples: 5 },
      ],
      minSamples: 10,
    });
    expect(winner).toBe(null);
  });

  it('promotes a canary under the error threshold (tutorial: promoteCanary snippet)', () => {
    const s = startOpsSession({ target: 'openai', sessionId: 's-6' });
    updateRegistry(s, { version: 'v2', activate: false });
    const { promoted } = promoteCanary(s, {
      canaryVersion: 'v2',
      errorRate: 0.05,
      threshold: 0.1,
    });
    expect(promoted).toBe(true);
    expect(s.registry.find((e) => e.version === 'v2')?.active).toBe(true);
  });
});

describe('tutorial 87 — ops shadow compare', () => {
  it('reports better when shadow beats production (tutorial: compareShadow snippet)', () => {
    const s = startOpsSession({ target: 'vercel-ai', sessionId: 's-7' });
    updateRegistry(s, { version: 'v1', activate: true });
    const { delta, better } = compareShadow(s, {
      productionScores: [0.8, 0.82, 0.79],
      shadowScores: [0.85, 0.87, 0.88],
    });
    expect(better).toBe(true);
    expect(delta).toBeGreaterThan(0);
    expect(s.state).toBe('shadow-compared');
  });
});

describe('tutorial 87 — pea advanced prompt engineering', () => {
  it('expands CoT steps in order (tutorial: expandChainOfThought snippet)', () => {
    const s = startPeaSession({ target: 'anthropic', sessionId: 's-8' });
    const { steps } = expandChainOfThought(s, {
      thoughts: ['step 1', 'step 2', 'step 3'],
    });
    expect(steps).toHaveLength(3);
    expect(steps[0]?.index).toBe(0);
    expect(steps[2]?.index).toBe(2);
    expect(s.state).toBe('chain-of-thought-expanded');
  });

  it('picks top-k few-shot examples by score (tutorial: selectFewShot snippet)', () => {
    const s = startPeaSession({ target: 'openai', sessionId: 's-9' });
    expandChainOfThought(s, { thoughts: ['t'] });
    const { selected } = selectFewShot(s, {
      pool: [
        { id: 'e1', input: 'x', output: 'y', score: 0.5 },
        { id: 'e2', input: 'x', output: 'y', score: 0.9 },
        { id: 'e3', input: 'x', output: 'y', score: 0.7 },
      ],
      k: 2,
    });
    expect(selected.map((e) => e.id)).toEqual(['e2', 'e3']);
  });

  it('reports a cache hit on repeat key (tutorial: cachePrompt hit snippet)', () => {
    const s = startPeaSession({ target: 'vercel-ai', sessionId: 's-10' });
    expandChainOfThought(s, { thoughts: ['t'] });
    const first = cachePrompt(s, { key: 'k1', value: 'v1' });
    const second = cachePrompt(s, { key: 'k1', value: 'v2' });
    expect(first.wasHit).toBe(false);
    expect(second.wasHit).toBe(true);
  });

  it('pins a semver+hash version (tutorial: pinVersion snippet)', () => {
    const s = startPeaSession({ target: 'langchain', sessionId: 's-11' });
    expandChainOfThought(s, { thoughts: ['t'] });
    const { version } = pinVersion(s, { semver: '1.2.3', hash: 'abcd' });
    expect(version).toBe('1.2.3+abcd');
    expect(s.currentVersion).toBe('1.2.3+abcd');
  });

  it('refuses a non-semver string (tutorial: semver-guard snippet)', () => {
    const s = startPeaSession({ target: 'anthropic', sessionId: 's-12' });
    expandChainOfThought(s, { thoughts: ['t'] });
    expect(() =>
      pinVersion(s, { semver: 'v1', hash: 'abcd' }),
    ).toThrow(/semver must match N.N.N/);
  });
});

describe('tutorial 87 — rag3 GraphRAG traversal', () => {
  it('walks nodes via edge-weight BFS (tutorial: traverseGraph snippet)', () => {
    const s = startRag3Session({ target: 'openai', sessionId: 's-13' });
    const { visited, totalWeight } = traverseGraph(s, {
      nodes: [
        { id: 'n1', label: 'A' },
        { id: 'n2', label: 'B' },
        { id: 'n3', label: 'C' },
      ],
      edges: [
        { from: 'n1', to: 'n2', weight: 0.9 },
        { from: 'n1', to: 'n3', weight: 0.5 },
      ],
      startNodeId: 'n1',
      maxHops: 2,
    });
    expect(visited).toContain('n2');
    expect(visited).toContain('n3');
    expect(totalWeight).toBeGreaterThan(0);
  });

  it('decides answer when confidence >= threshold (tutorial: answer-branch snippet)', () => {
    const s = startRag3Session({ target: 'anthropic', sessionId: 's-14' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { action } = stepAgentic(s, {
      confidence: 0.85,
      threshold: 0.7,
      reason: 'top-hit score is high enough',
    });
    expect(action).toBe('answer');
  });

  it('decides fetch when confidence < threshold (tutorial: fetch-branch snippet)', () => {
    const s = startRag3Session({ target: 'vercel-ai', sessionId: 's-15' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { action } = stepAgentic(s, {
      confidence: 0.3,
      threshold: 0.7,
      reason: 'need more evidence',
    });
    expect(action).toBe('fetch');
  });

  it('builds a filter predicate from schema-field match (tutorial: selfQuery snippet)', () => {
    const s = startRag3Session({ target: 'langchain', sessionId: 's-16' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { predicate, matchedFields } = selfQuery(s, {
      question: 'find rows where title contains kiwa and priority is high',
      schemaFields: ['title', 'priority', 'author'],
    });
    expect(matchedFields).toEqual(['title', 'priority']);
    expect(predicate).toBe('title MATCHES AND priority MATCHES');
  });

  it('expands a chunk to its parent doc (tutorial: expandParent snippet)', () => {
    const s = startRag3Session({ target: 'openai', sessionId: 's-17' });
    traverseGraph(s, {
      nodes: [{ id: 'n1', label: 'A' }],
      edges: [],
      startNodeId: 'n1',
      maxHops: 1,
    });
    const { parent } = expandParent(s, {
      chunkId: 'c1',
      parents: [
        { id: 'p1', content: 'full doc text', chunkIds: ['c1', 'c2'] },
        { id: 'p2', content: 'other doc', chunkIds: ['c3'] },
      ],
    });
    expect(parent?.id).toBe('p1');
    expect(parent?.content).toBe('full doc text');
  });
});

describe('tutorial 87 — co cost optimization', () => {
  it('estimates 0.5x batch savings (tutorial: submitBatch snippet)', () => {
    const s = startCoSession({ target: 'anthropic', sessionId: 's-18' });
    const { estimatedSavings } = submitBatch(s, {
      requests: [
        { id: 'r1', tokens: 100 },
        { id: 'r2', tokens: 200 },
      ],
    });
    expect(estimatedSavings).toBe(150);
    expect(s.state).toBe('batch-submitted');
  });

  it('compresses prompt to maxChars (tutorial: compressPrompt snippet)', () => {
    const s = startCoSession({ target: 'openai', sessionId: 's-19' });
    submitBatch(s, { requests: [{ id: 'r1', tokens: 10 }] });
    const { compressed, ratio } = compressPrompt(s, {
      prompt: 'a'.repeat(100),
      maxChars: 40,
    });
    expect(compressed.length).toBe(40);
    expect(ratio).toBeCloseTo(0.4);
  });

  it('escalates when confidence falls below tier threshold (tutorial: cascade snippet)', () => {
    const s = startCoSession({ target: 'vercel-ai', sessionId: 's-20' });
    submitBatch(s, { requests: [{ id: 'r1', tokens: 10 }] });
    const { selectedTier, escalated } = stepCascade(s, {
      confidence: 0.5,
      tiers: [
        { name: 'cheap', costPerToken: 0.0001, confidenceThreshold: 0.8 },
        { name: 'mid', costPerToken: 0.001, confidenceThreshold: 0.4 },
      ],
    });
    expect(selectedTier).toBe('mid');
    expect(escalated).toBe(true);
  });

  it('backfills a semantic cache miss (tutorial: lookupSemanticCache snippet)', () => {
    const s = startCoSession({ target: 'langchain', sessionId: 's-21' });
    const first = lookupSemanticCache(s, {
      queryHash: 'h1',
      value: 'cached-answer',
    });
    const second = lookupSemanticCache(s, { queryHash: 'h1' });
    expect(first.hit).toBe(false);
    expect(second.hit).toBe(true);
    expect(second.cached).toBe('cached-answer');
  });
});
