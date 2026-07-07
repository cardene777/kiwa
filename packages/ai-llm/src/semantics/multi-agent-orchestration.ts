import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Multi-agent orchestration axis — CrewAI + AutoGen + LangGraph +
 * supervisor pattern state machine。
 *
 * Deterministic mock で 4 signal 系統。 crew assembly is role list snapshot、
 * supervisor delegation is deterministic round-robin、 graph transition is
 * edge follow、 round completion is delegation count check。
 */

export type MaoState =
  | 'idle'
  | 'crew-assembled'
  | 'supervisor-delegated'
  | 'graph-transitioned'
  | 'round-completed';

export interface MaoAgent {
  id: string;
  role: string;
  capabilities: string[];
}

export interface MaoDelegation {
  round: number;
  supervisor: string;
  worker: string;
  task: string;
}

export interface MaoGraphNode {
  id: string;
  agentId: string;
}

export interface MaoGraphEdge {
  from: string;
  to: string;
}

export interface MaoSession {
  target: AiLlmTarget;
  sessionId: string;
  state: MaoState;
  history: AxisStep<MaoState>[];
  crew: MaoAgent[];
  delegations: MaoDelegation[];
  graphNodes: MaoGraphNode[];
  graphEdges: MaoGraphEdge[];
  currentNode: string | null;
  rounds: number;
}

export function startMaoSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): MaoSession {
  if (input.sessionId.length === 0) {
    throw new Error('startMaoSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    crew: [],
    delegations: [],
    graphNodes: [],
    graphEdges: [],
    currentNode: null,
    rounds: 0,
  };
}

export function assembleCrew(
  session: MaoSession,
  input: { agents: MaoAgent[] },
): { step: AxisStep<MaoState>; agentCount: number } {
  if (input.agents.length === 0) throw new Error('assembleCrew: agents must not be empty');
  const ids = new Set<string>();
  for (const a of input.agents) {
    if (a.id.length === 0) throw new Error('assembleCrew: agent id must not be empty');
    if (ids.has(a.id)) throw new Error(`assembleCrew: duplicate agent id ${a.id}`);
    ids.add(a.id);
  }
  session.crew = [...input.agents];
  session.state = 'crew-assembled';
  const step = emit(session, 'mao.crew_assembled', {
    agentCount: session.crew.length,
    roles: session.crew.map((a) => a.role).join(','),
  });
  return { step, agentCount: session.crew.length };
}

export function delegateBySupervisor(
  session: MaoSession,
  input: { supervisorId: string; task: string; workerIds: string[] },
): { step: AxisStep<MaoState>; delegation: MaoDelegation } {
  if (session.state === 'idle') throw new Error('delegateBySupervisor: assemble crew first');
  if (input.workerIds.length === 0)
    throw new Error('delegateBySupervisor: workerIds must not be empty');
  if (input.task.length === 0) throw new Error('delegateBySupervisor: task must not be empty');
  const supervisor = session.crew.find((a) => a.id === input.supervisorId);
  if (!supervisor) throw new Error(`delegateBySupervisor: supervisor ${input.supervisorId} not in crew`);
  const round = session.delegations.length + 1;
  const workerIdx = (round - 1) % input.workerIds.length;
  const worker = input.workerIds[workerIdx] ?? '';
  if (!session.crew.some((a) => a.id === worker))
    throw new Error(`delegateBySupervisor: worker ${worker} not in crew`);
  const delegation: MaoDelegation = {
    round,
    supervisor: input.supervisorId,
    worker,
    task: input.task,
  };
  session.delegations.push(delegation);
  session.state = 'supervisor-delegated';
  const step = emit(session, 'mao.supervisor_delegated', {
    round,
    supervisor: input.supervisorId,
    worker,
    workerCount: input.workerIds.length,
  });
  return { step, delegation };
}

export function transitionGraph(
  session: MaoSession,
  input: { nodes: MaoGraphNode[]; edges: MaoGraphEdge[]; entryNodeId: string },
): { step: AxisStep<MaoState>; visited: string[] } {
  if (session.state === 'idle') throw new Error('transitionGraph: assemble crew first');
  if (input.nodes.length === 0) throw new Error('transitionGraph: nodes must not be empty');
  if (!input.nodes.some((n) => n.id === input.entryNodeId))
    throw new Error(`transitionGraph: entry ${input.entryNodeId} not in nodes`);
  session.graphNodes = [...input.nodes];
  session.graphEdges = [...input.edges];
  session.currentNode = input.entryNodeId;
  const visited: string[] = [input.entryNodeId];
  let current = input.entryNodeId;
  const seen = new Set<string>([current]);
  while (true) {
    const edge = input.edges.find((e) => e.from === current && !seen.has(e.to));
    if (!edge) break;
    current = edge.to;
    seen.add(current);
    visited.push(current);
  }
  session.currentNode = current;
  session.state = 'graph-transitioned';
  const step = emit(session, 'mao.graph_transitioned', {
    nodeCount: input.nodes.length,
    edgeCount: input.edges.length,
    visitedCount: visited.length,
    terminalNode: current,
  });
  return { step, visited };
}

export function completeRound(
  session: MaoSession,
  input: { minDelegations: number },
): { step: AxisStep<MaoState>; roundsCompleted: number; sufficient: boolean } {
  if (session.state === 'idle') throw new Error('completeRound: assemble crew first');
  if (input.minDelegations < 0)
    throw new Error('completeRound: minDelegations must be non-negative');
  session.rounds += 1;
  const sufficient = session.delegations.length >= input.minDelegations;
  session.state = 'round-completed';
  const step = emit(session, 'mao.round_completed', {
    round: session.rounds,
    delegations: session.delegations.length,
    sufficient,
    minDelegations: input.minDelegations,
  });
  return { step, roundsCompleted: session.rounds, sufficient };
}

function emit(
  session: MaoSession,
  neutralEvent: AxisStep<MaoState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<MaoState> {
  const step: AxisStep<MaoState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
