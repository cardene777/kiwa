/**
 * `/pipeline` HTTP handler — full code interpreter pipeline (sandbox
 * start → multi-execution → tool-use → rollback → tolerance gate).
 * Composes the sandbox + tool + rollback surfaces so a single call
 * takes an interpreter session config and returns either a completed
 * pipeline result or a blocked reason.
 *
 * The pipeline surface is the highest-level integration point v1.40-3
 * ships — it is the surface real-world integrators would hit, so the
 * fidelity harness weighs the pipeline op most heavily when scoring
 * behavioural drift.
 */

import type {
  CodeInterpreterPipelineResult,
  ExecuteInput,
  LlmCodeInterpreterAdapter,
  PipelineInput,
  ToolInput,
} from '../../adapters/interface.js';

export type PipelineRequest = PipelineInput;

export interface PipelineResponse {
  ok: boolean;
  sessionId: string;
  result?: CodeInterpreterPipelineResult;
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
  if (typeof b['sandboxId'] !== 'string' || !b['sandboxId']) {
    return { ok: false, errorKind: 'sandboxId_required' };
  }
  if (typeof b['timeoutMs'] !== 'number' || b['timeoutMs'] <= 0) {
    return { ok: false, errorKind: 'timeoutMs_required' };
  }
  if (!Array.isArray(b['executions'])) {
    return { ok: false, errorKind: 'executions_required' };
  }
  if (!Array.isArray(b['tools'])) {
    return { ok: false, errorKind: 'tools_required' };
  }
  if (typeof b['rollbackSteps'] !== 'number' || b['rollbackSteps'] < 0) {
    return { ok: false, errorKind: 'rollbackSteps_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      sandboxId: b['sandboxId'],
      timeoutMs: b['timeoutMs'],
      executions: b['executions'] as ExecuteInput[],
      tools: b['tools'] as ToolInput[],
      rollbackSteps: b['rollbackSteps'],
    },
  };
}

export async function handlePipelineRequest(
  adapter: LlmCodeInterpreterAdapter,
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
