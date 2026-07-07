/**
 * `/mao` HTTP handler — multi-agent orchestration ceremony (crew assembly
 * + supervisor delegation + graph transition + round completion). The
 * route is intentionally shape-neutral — the fidelity harness feeds plain
 * objects in and asserts on plain objects out, so the same test can
 * exercise mock and real without spinning up a real Vercel AI SDK client.
 *
 * The mao surface pairs the v1.40-1 `multi-agent-orchestration` axis
 * (CrewAI + AutoGen + LangGraph supervisor pattern) with
 * `@kiwa-test/ai-llm` v0.5 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type { MaoAgent } from '@kiwa-test/ai-llm';
import type {
  AssembleCrewResult,
  DelegateInput,
  DelegateResult,
  GraphInput,
  GraphTransitionResult,
  LlmMaoSwarmAdapter,
  RoundCompletionResult,
} from '../../adapters/interface.js';

export interface MaoAssembleRequest {
  sessionId: string;
  agents: MaoAgent[];
}

export interface MaoDelegateRequest {
  sessionId: string;
  delegation: DelegateInput;
}

export interface MaoGraphRequest {
  sessionId: string;
  graph: GraphInput;
}

export interface MaoRoundRequest {
  sessionId: string;
  minDelegations: number;
}

export interface MaoResponse<T> {
  ok: boolean;
  sessionId: string;
  result?: T;
  errorKind?: string;
}

export function validateAssembleRequest(
  body: unknown,
):
  | { ok: true; value: MaoAssembleRequest }
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
  for (const a of b['agents']) {
    if (!a || typeof a !== 'object') {
      return { ok: false, errorKind: 'agents_shape' };
    }
    const ao = a as Record<string, unknown>;
    if (typeof ao['id'] !== 'string' || !ao['id']) {
      return { ok: false, errorKind: 'agent.id_required' };
    }
    if (typeof ao['role'] !== 'string' || !ao['role']) {
      return { ok: false, errorKind: 'agent.role_required' };
    }
    if (!Array.isArray(ao['capabilities'])) {
      return { ok: false, errorKind: 'agent.capabilities_required' };
    }
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      agents: b['agents'] as MaoAgent[],
    },
  };
}

export function validateDelegateRequest(
  body: unknown,
):
  | { ok: true; value: MaoDelegateRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const d = b['delegation'];
  if (!d || typeof d !== 'object') {
    return { ok: false, errorKind: 'delegation_required' };
  }
  const dd = d as Record<string, unknown>;
  if (typeof dd['supervisorId'] !== 'string' || !dd['supervisorId']) {
    return { ok: false, errorKind: 'supervisorId_required' };
  }
  if (typeof dd['task'] !== 'string' || !dd['task']) {
    return { ok: false, errorKind: 'task_required' };
  }
  if (!Array.isArray(dd['workerIds']) || dd['workerIds'].length === 0) {
    return { ok: false, errorKind: 'workerIds_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      delegation: {
        supervisorId: dd['supervisorId'],
        task: dd['task'],
        workerIds: dd['workerIds'] as string[],
      },
    },
  };
}

export function validateGraphRequest(
  body: unknown,
):
  | { ok: true; value: MaoGraphRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const g = b['graph'];
  if (!g || typeof g !== 'object') {
    return { ok: false, errorKind: 'graph_required' };
  }
  const go = g as Record<string, unknown>;
  if (!Array.isArray(go['nodes']) || go['nodes'].length === 0) {
    return { ok: false, errorKind: 'graph.nodes_required' };
  }
  if (!Array.isArray(go['edges'])) {
    return { ok: false, errorKind: 'graph.edges_required' };
  }
  if (typeof go['entryNodeId'] !== 'string' || !go['entryNodeId']) {
    return { ok: false, errorKind: 'graph.entryNodeId_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      graph: go as unknown as GraphInput,
    },
  };
}

export function validateRoundRequest(
  body: unknown,
):
  | { ok: true; value: MaoRoundRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['minDelegations'] !== 'number' || b['minDelegations'] < 0) {
    return { ok: false, errorKind: 'minDelegations_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      minDelegations: b['minDelegations'],
    },
  };
}

export async function handleAssembleRequest(
  adapter: LlmMaoSwarmAdapter,
  request: MaoAssembleRequest,
): Promise<MaoResponse<AssembleCrewResult>> {
  try {
    const result = await adapter.assembleCrew(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleDelegateRequest(
  adapter: LlmMaoSwarmAdapter,
  request: MaoDelegateRequest,
): Promise<MaoResponse<DelegateResult>> {
  try {
    const result = await adapter.delegateBySupervisor(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleGraphRequest(
  adapter: LlmMaoSwarmAdapter,
  request: MaoGraphRequest,
): Promise<MaoResponse<GraphTransitionResult>> {
  try {
    const result = await adapter.transitionGraph(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleRoundRequest(
  adapter: LlmMaoSwarmAdapter,
  request: MaoRoundRequest,
): Promise<MaoResponse<RoundCompletionResult>> {
  try {
    const result = await adapter.completeRound(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
