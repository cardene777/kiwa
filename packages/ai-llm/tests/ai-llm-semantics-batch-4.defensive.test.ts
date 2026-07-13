import { describe, expect, it } from 'vitest';
import {
  startHallucinationSession,
  scoreSelfConsistency,
  scoreConfidence,
} from '../src/semantics/hallucination.js';
import {
  startSwarmSession,
  assignRoles,
  allocateTasks,
  reachConsensus,
} from '../src/semantics/agent-swarm.js';

describe('hallucination scoreSelfConsistency edge cases', () => {
  it('throws when samples has fewer than 2 entries', () => {
    const session = startHallucinationSession({
      target: 'openai',
      sessionId: 's1',
    });
    expect(() => scoreSelfConsistency(session, ['only-one'])).toThrow(
      /need at least 2 samples/,
    );
  });

  it('returns 0 score when both samples are empty (jaccard uni=0)', () => {
    const session = startHallucinationSession({
      target: 'openai',
      sessionId: 's2',
    });
    const { score } = scoreSelfConsistency(session, ['', '']);
    expect(score).toBe(0);
  });

  it('returns 1.0 score when both samples are identical', () => {
    const session = startHallucinationSession({
      target: 'openai',
      sessionId: 's3',
    });
    const { score } = scoreSelfConsistency(session, ['hello world', 'hello world']);
    expect(score).toBe(1);
  });

  it('returns fractional score when samples partially overlap', () => {
    const session = startHallucinationSession({
      target: 'openai',
      sessionId: 's4',
    });
    const { score } = scoreSelfConsistency(session, [
      'hello world',
      'hello mars',
    ]);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
  });

  it('scoreConfidence records confidence in session', () => {
    const session = startHallucinationSession({
      target: 'openai',
      sessionId: 's5',
    });
    scoreSelfConsistency(session, ['a', 'b']);
    const { step, score, hedgingRatio } = scoreConfidence(
      session,
      'The answer is definitely 42.',
    );
    expect(score).toBeGreaterThan(0);
    expect(hedgingRatio).toBe(0);
    expect(step).toBeDefined();
  });
});

describe('agent-swarm assignRoles + allocateTasks + reachConsensus edge cases', () => {
  it('assignRoles throws when reliability out of range', () => {
    const session = startSwarmSession({
      target: 'openai',
      sessionId: 's1',
      faultThreshold: 0.5,
    });
    expect(() =>
      assignRoles(session, {
        agents: [
          { id: 'a1', reliability: 1.5 },
          { id: 'a2', reliability: 0.5 },
        ],
        roles: ['worker', 'validator'],
      }),
    ).toThrow(/reliability must be in/);
  });

  it('assignRoles cycles roles when there are more agents than roles', () => {
    const session = startSwarmSession({
      target: 'openai',
      sessionId: 's2',
      faultThreshold: 0.5,
    });
    assignRoles(session, {
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
        { id: 'a3', reliability: 0.9 },
        { id: 'a4', reliability: 0.9 },
      ],
      roles: ['worker', 'validator'],
    });
    // Roles cycle: a1=worker, a2=validator, a3=worker, a4=validator
    expect(session.agents).toHaveLength(4);
  });

  it('allocateTasks assigns tasks round-robin to agents', () => {
    const session = startSwarmSession({
      target: 'openai',
      sessionId: 's3',
      faultThreshold: 0.5,
    });
    assignRoles(session, {
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const { allocations } = allocateTasks(session, {
      tasks: [
        { id: 't1', priority: 1 },
        { id: 't2', priority: 2 },
        { id: 't3', priority: 3 },
      ],
    });
    expect(allocations).toHaveLength(3);
    expect(allocations[0]?.assignee).toBeDefined();
  });

  it('reachConsensus reports majority when > 50% agree', () => {
    const session = startSwarmSession({
      target: 'openai',
      sessionId: 's4',
      faultThreshold: 0.5,
    });
    assignRoles(session, {
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
        { id: 'a3', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const { step } = reachConsensus(session, {
      votes: [
        { agentId: 'a1', proposal: 'option-A' },
        { agentId: 'a2', proposal: 'option-A' },
        { agentId: 'a3', proposal: 'option-B' },
      ],
    });
    expect(step.metadata.majority).toBe(true);
    expect(step.metadata.winner).toBe('option-A');
  });

  it('reachConsensus reports no majority when tied', () => {
    const session = startSwarmSession({
      target: 'openai',
      sessionId: 's5',
      faultThreshold: 0.5,
    });
    assignRoles(session, {
      agents: [
        { id: 'a1', reliability: 0.9 },
        { id: 'a2', reliability: 0.9 },
      ],
      roles: ['worker'],
    });
    const { step } = reachConsensus(session, {
      votes: [
        { agentId: 'a1', proposal: 'option-A' },
        { agentId: 'a2', proposal: 'option-B' },
      ],
    });
    expect(step.metadata.majority).toBe(false);
  });
});
