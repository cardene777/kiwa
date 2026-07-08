/**
 * `/pipeline` HTTP handler — full multi-agent + swarm pipeline (crew →
 * supervisor delegation → graph transition → swarm allocation →
 * majority-vote consensus → Byzantine tolerance gate). Composes the mao
 * + swarm surfaces so a single call takes a crew + swarm config and
 * returns either a completed pipeline result or a blocked reason.
 *
 * The pipeline surface is the highest-level integration point v1.40-2
 * ships — it is the surface real-world integrators would hit, so the
 * fidelity harness weighs the pipeline op most heavily when scoring
 * behavioural drift.
 */

import type { MaoAgent } from '@kiwa/ai-llm';
import type {
  GraphInput,
  LlmMaoSwarmAdapter,
  MaoSwarmPipelineResult,
  PipelineInput,
  SwarmAgentInput,
  TaskInput,
} from '../../adapters/interface.js';

export type PipelineRequest = PipelineInput;

export interface PipelineResponse {
  ok: boolean;
  sessionId: string;
  result?: MaoSwarmPipelineResult;
  errorKind?: string;
}

export function validatePipelineRequest(
  body: unknown,
):
  | { ok: true; value: PipelineRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!Array.isArray(b['crew']) || b['crew'].length === 0) {
    return { ok: false, errorKind: 'crew_required' };
  }
  if (typeof b['supervisorId'] !== 'string' || !b['supervisorId']) {
    return { ok: false, errorKind: 'supervisorId_required' };
  }
  if (!Array.isArray(b['workerIds']) || b['workerIds'].length === 0) {
    return { ok: false, errorKind: 'workerIds_required' };
  }
  if (typeof b['task'] !== 'string' || !b['task']) {
    return { ok: false, errorKind: 'task_required' };
  }
  if (!b['graph'] || typeof b['graph'] !== 'object') {
    return { ok: false, errorKind: 'graph_required' };
  }
  if (!Array.isArray(b['swarmAgents']) || b['swarmAgents'].length === 0) {
    return { ok: false, errorKind: 'swarmAgents_required' };
  }
  if (!Array.isArray(b['swarmRoles']) || b['swarmRoles'].length === 0) {
    return { ok: false, errorKind: 'swarmRoles_required' };
  }
  if (!Array.isArray(b['tasks']) || b['tasks'].length === 0) {
    return { ok: false, errorKind: 'tasks_required' };
  }
  if (!Array.isArray(b['votes']) || b['votes'].length === 0) {
    return { ok: false, errorKind: 'votes_required' };
  }
  if (!Array.isArray(b['faultyAgentIds'])) {
    return { ok: false, errorKind: 'faultyAgentIds_required' };
  }
  if (typeof b['minDelegations'] !== 'number' || b['minDelegations'] < 0) {
    return { ok: false, errorKind: 'minDelegations_required' };
  }
  if (typeof b['faultThreshold'] !== 'number') {
    return { ok: false, errorKind: 'faultThreshold_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      crew: b['crew'] as MaoAgent[],
      supervisorId: b['supervisorId'],
      workerIds: b['workerIds'] as string[],
      task: b['task'],
      graph: b['graph'] as GraphInput,
      swarmAgents: b['swarmAgents'] as SwarmAgentInput[],
      swarmRoles: b['swarmRoles'] as string[],
      tasks: b['tasks'] as TaskInput[],
      votes: b['votes'] as PipelineInput['votes'],
      faultyAgentIds: b['faultyAgentIds'] as string[],
      minDelegations: b['minDelegations'],
      faultThreshold: b['faultThreshold'],
    },
  };
}

export async function handlePipelineRequest(
  adapter: LlmMaoSwarmAdapter,
  request: PipelineRequest,
): Promise<PipelineResponse> {
  try {
    const result = await adapter.runPipeline(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
