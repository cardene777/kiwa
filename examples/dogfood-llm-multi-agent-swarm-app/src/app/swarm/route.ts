/**
 * `/swarm` HTTP handler — swarm coordination ceremony (role assignment +
 * task allocation + majority-vote consensus + Byzantine tolerance gate).
 * The route is intentionally shape-neutral — the fidelity harness feeds
 * plain objects in and asserts on plain objects out, so the same test
 * can exercise mock and real without spinning up a real Vercel AI SDK
 * client.
 *
 * The swarm surface pairs the v1.40-1 `agent-swarm` axis (role-based
 * task allocation + PBFT-lite consensus) with `@kiwa-test/ai-llm` v0.5
 * — every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type { SwarmVote } from '@kiwa-test/ai-llm';
import type {
  AllocateTasksResult,
  AssignRolesResult,
  ByzantineToleranceResult,
  ConsensusResult,
  LlmMaoSwarmAdapter,
  SwarmAgentInput,
  TaskInput,
} from '../../adapters/interface.js';

export interface SwarmAssignRequest {
  sessionId: string;
  agents: SwarmAgentInput[];
  roles: string[];
}

export interface SwarmAllocateRequest {
  sessionId: string;
  tasks: TaskInput[];
}

export interface SwarmConsensusRequest {
  sessionId: string;
  votes: SwarmVote[];
}

export interface SwarmByzantineRequest {
  sessionId: string;
  faultyAgentIds: string[];
}

export interface SwarmResponse<T> {
  ok: boolean;
  sessionId: string;
  result?: T;
  errorKind?: string;
}

export function validateAssignRequest(
  body: unknown,
):
  | { ok: true; value: SwarmAssignRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!Array.isArray(b['agents']) || b['agents'].length === 0) {
    return { ok: false, errorKind: 'agents_required' };
  }
  if (!Array.isArray(b['roles']) || b['roles'].length === 0) {
    return { ok: false, errorKind: 'roles_required' };
  }
  for (const a of b['agents']) {
    if (!a || typeof a !== 'object') {
      return { ok: false, errorKind: 'agents_shape' };
    }
    const ao = a as Record<string, unknown>;
    if (typeof ao['id'] !== 'string' || !ao['id']) {
      return { ok: false, errorKind: 'agent.id_required' };
    }
    if (typeof ao['reliability'] !== 'number') {
      return { ok: false, errorKind: 'agent.reliability_required' };
    }
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      agents: b['agents'] as SwarmAgentInput[],
      roles: b['roles'] as string[],
    },
  };
}

export function validateAllocateRequest(
  body: unknown,
):
  | { ok: true; value: SwarmAllocateRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!Array.isArray(b['tasks']) || b['tasks'].length === 0) {
    return { ok: false, errorKind: 'tasks_required' };
  }
  for (const t of b['tasks']) {
    if (!t || typeof t !== 'object') {
      return { ok: false, errorKind: 'tasks_shape' };
    }
    const to = t as Record<string, unknown>;
    if (typeof to['id'] !== 'string' || !to['id']) {
      return { ok: false, errorKind: 'task.id_required' };
    }
    if (typeof to['priority'] !== 'number') {
      return { ok: false, errorKind: 'task.priority_required' };
    }
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      tasks: b['tasks'] as TaskInput[],
    },
  };
}

export function validateConsensusRequest(
  body: unknown,
):
  | { ok: true; value: SwarmConsensusRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!Array.isArray(b['votes']) || b['votes'].length === 0) {
    return { ok: false, errorKind: 'votes_required' };
  }
  for (const v of b['votes']) {
    if (!v || typeof v !== 'object') {
      return { ok: false, errorKind: 'votes_shape' };
    }
    const vo = v as Record<string, unknown>;
    if (typeof vo['agentId'] !== 'string' || !vo['agentId']) {
      return { ok: false, errorKind: 'vote.agentId_required' };
    }
    if (typeof vo['proposal'] !== 'string' || !vo['proposal']) {
      return { ok: false, errorKind: 'vote.proposal_required' };
    }
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      votes: b['votes'] as SwarmVote[],
    },
  };
}

export function validateByzantineRequest(
  body: unknown,
):
  | { ok: true; value: SwarmByzantineRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!Array.isArray(b['faultyAgentIds'])) {
    return { ok: false, errorKind: 'faultyAgentIds_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      faultyAgentIds: b['faultyAgentIds'] as string[],
    },
  };
}

export async function handleAssignRequest(
  adapter: LlmMaoSwarmAdapter,
  request: SwarmAssignRequest,
): Promise<SwarmResponse<AssignRolesResult>> {
  try {
    const result = await adapter.assignRoles(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleAllocateRequest(
  adapter: LlmMaoSwarmAdapter,
  request: SwarmAllocateRequest,
): Promise<SwarmResponse<AllocateTasksResult>> {
  try {
    const result = await adapter.allocateTasks(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleConsensusRequest(
  adapter: LlmMaoSwarmAdapter,
  request: SwarmConsensusRequest,
): Promise<SwarmResponse<ConsensusResult>> {
  try {
    const result = await adapter.reachConsensus(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleByzantineRequest(
  adapter: LlmMaoSwarmAdapter,
  request: SwarmByzantineRequest,
): Promise<SwarmResponse<ByzantineToleranceResult>> {
  try {
    const result = await adapter.tolerateByzantine(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
