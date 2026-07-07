import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Agent swarm axis — role-based + task allocation + consensus + Byzantine
 * fault tolerance state machine。
 *
 * Deterministic mock で 4 signal 系統。 roles assign by index modulo、
 * tasks allocated by round robin、 consensus via majority vote、 Byzantine
 * fault tolerance via > 2/3 honest agreement (PBFT-lite invariant)。
 */

export type SwarmState =
  | 'idle'
  | 'roles-assigned'
  | 'tasks-allocated'
  | 'consensus-reached'
  | 'byzantine-tolerated';

export interface SwarmAgent {
  id: string;
  role: string;
  reliability: number;
}

export interface SwarmTask {
  id: string;
  assignee: string;
  priority: number;
}

export interface SwarmVote {
  agentId: string;
  proposal: string;
}

export interface SwarmSession {
  target: AiLlmTarget;
  sessionId: string;
  state: SwarmState;
  history: AxisStep<SwarmState>[];
  agents: SwarmAgent[];
  tasks: SwarmTask[];
  votes: SwarmVote[];
  faultThreshold: number;
}

export function startSwarmSession(input: {
  target: AiLlmTarget;
  sessionId: string;
  faultThreshold?: number;
}): SwarmSession {
  if (input.sessionId.length === 0) {
    throw new Error('startSwarmSession: sessionId must not be empty');
  }
  const t = input.faultThreshold ?? 0.34;
  if (t < 0 || t >= 1) throw new Error('startSwarmSession: faultThreshold must be in [0, 1)');
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    agents: [],
    tasks: [],
    votes: [],
    faultThreshold: t,
  };
}

export function assignRoles(
  session: SwarmSession,
  input: { agents: Array<{ id: string; reliability: number }>; roles: string[] },
): { step: AxisStep<SwarmState>; assignments: SwarmAgent[] } {
  if (input.agents.length === 0) throw new Error('assignRoles: agents must not be empty');
  if (input.roles.length === 0) throw new Error('assignRoles: roles must not be empty');
  const assignments: SwarmAgent[] = input.agents.map((a, idx) => {
    if (a.reliability < 0 || a.reliability > 1)
      throw new Error('assignRoles: reliability must be in [0, 1]');
    return {
      id: a.id,
      role: input.roles[idx % input.roles.length] ?? input.roles[0]!,
      reliability: a.reliability,
    };
  });
  session.agents = assignments;
  session.state = 'roles-assigned';
  const step = emit(session, 'swarm.roles_assigned', {
    agentCount: assignments.length,
    roleCount: input.roles.length,
    averageReliability: avg(assignments.map((a) => a.reliability)),
  });
  return { step, assignments };
}

export function allocateTasks(
  session: SwarmSession,
  input: { tasks: Array<{ id: string; priority: number }> },
): { step: AxisStep<SwarmState>; allocations: SwarmTask[] } {
  if (session.state === 'idle') throw new Error('allocateTasks: assign roles first');
  if (input.tasks.length === 0) throw new Error('allocateTasks: tasks must not be empty');
  const sorted = [...input.tasks].sort((a, b) => b.priority - a.priority);
  const allocations: SwarmTask[] = sorted.map((t, idx) => {
    const agent = session.agents[idx % session.agents.length];
    return {
      id: t.id,
      assignee: agent?.id ?? '',
      priority: t.priority,
    };
  });
  session.tasks = allocations;
  session.state = 'tasks-allocated';
  const step = emit(session, 'swarm.tasks_allocated', {
    taskCount: allocations.length,
    agentCount: session.agents.length,
    topPriority: sorted[0]?.priority ?? 0,
  });
  return { step, allocations };
}

export function reachConsensus(
  session: SwarmSession,
  input: { votes: SwarmVote[] },
): { step: AxisStep<SwarmState>; winner: string | null; agreementRatio: number } {
  if (session.state === 'idle') throw new Error('reachConsensus: assign roles first');
  if (input.votes.length === 0) throw new Error('reachConsensus: votes must not be empty');
  session.votes = [...input.votes];
  const counts = new Map<string, number>();
  for (const v of input.votes) {
    counts.set(v.proposal, (counts.get(v.proposal) ?? 0) + 1);
  }
  let winner: string | null = null;
  let topCount = 0;
  for (const [proposal, count] of counts) {
    if (count > topCount) {
      topCount = count;
      winner = proposal;
    }
  }
  const agreementRatio = topCount / input.votes.length;
  const majority = agreementRatio > 0.5;
  session.state = 'consensus-reached';
  const step = emit(session, 'swarm.consensus_reached', {
    voteCount: input.votes.length,
    winner: winner ?? '',
    agreementRatio,
    majority,
  });
  return { step, winner: majority ? winner : null, agreementRatio };
}

export function tolerateByzantine(
  session: SwarmSession,
  input: { faultyAgentIds: string[] },
): { step: AxisStep<SwarmState>; tolerated: boolean; honestRatio: number } {
  if (session.state === 'idle') throw new Error('tolerateByzantine: assign roles first');
  if (session.agents.length === 0)
    throw new Error('tolerateByzantine: no agents assigned');
  const faultySet = new Set(input.faultyAgentIds);
  const faultyCount = session.agents.filter((a) => faultySet.has(a.id)).length;
  const honestRatio = (session.agents.length - faultyCount) / session.agents.length;
  const tolerated = honestRatio >= 1 - session.faultThreshold;
  session.state = 'byzantine-tolerated';
  const step = emit(session, 'swarm.byzantine_tolerated', {
    totalAgents: session.agents.length,
    faultyCount,
    honestRatio,
    tolerated,
    threshold: session.faultThreshold,
  });
  return { step, tolerated, honestRatio };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function emit(
  session: SwarmSession,
  neutralEvent: AxisStep<SwarmState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<SwarmState> {
  const step: AxisStep<SwarmState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
