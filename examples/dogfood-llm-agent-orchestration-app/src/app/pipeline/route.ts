/**
 * `/pipeline` HTTP handler — full agent pipeline (plan → tool → act →
 * reflect). Composes the ReAct + ToT + reflect + tool-select surfaces so
 * a single call takes an intent + candidate tools + plan branches and
 * returns either a completed pipeline result or a blocked-reason.
 *
 * The pipeline surface is the highest-level integration point v1.38-4
 * ships — it is the surface real-world integrators would hit, so the
 * fidelity harness weighs the pipeline op most heavily when scoring
 * behavioural drift.
 */

import type {
  AgentPipelineResult,
  LlmAgentAdapter,
  PipelineInput,
  ReactInput,
  ToolCandidateInput,
  TotInput,
} from '../../adapters/interface.js';

export type PipelineRequest = PipelineInput;

export interface PipelineResponse {
  ok: boolean;
  sessionId: string;
  result?: AgentPipelineResult;
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
  if (typeof b['intent'] !== 'string' || !b['intent']) {
    return { ok: false, errorKind: 'intent_required' };
  }
  if (!Array.isArray(b['candidates']) || b['candidates'].length === 0) {
    return { ok: false, errorKind: 'candidates_required' };
  }
  if (!b['plan'] || typeof b['plan'] !== 'object') {
    return { ok: false, errorKind: 'plan_required' };
  }
  if (!Array.isArray(b['reactSteps']) || b['reactSteps'].length === 0) {
    return { ok: false, errorKind: 'reactSteps_required' };
  }
  if (!b['reflect'] || typeof b['reflect'] !== 'object') {
    return { ok: false, errorKind: 'reflect_required' };
  }
  const req: PipelineRequest = {
    sessionId: b['sessionId'],
    intent: b['intent'],
    candidates: b['candidates'] as ToolCandidateInput[],
    plan: b['plan'] as TotInput,
    reactSteps: b['reactSteps'] as ReactInput[],
    reflect: b['reflect'] as { output: string; critiqueRules: string[] },
  };
  if (typeof b['toolScoreThreshold'] === 'number') {
    req.toolScoreThreshold = b['toolScoreThreshold'];
  }
  return { ok: true, value: req };
}

export async function handlePipelineRequest(
  adapter: LlmAgentAdapter,
  request: PipelineRequest,
): Promise<PipelineResponse> {
  try {
    const result = await adapter.runPipeline(request);
    return {
      ok: true,
      sessionId: request.sessionId,
      result,
    };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
