/**
 * `/pipeline` HTTP handler — full defense pipeline (analyze → classify →
 * block → redact → check). Composes the injection + guardrails surfaces
 * so a single call takes untrusted user input and returns either a safe
 * redacted string or a blocked-reason.
 *
 * The pipeline surface is the highest-level integration point v1.38-2
 * ships — it is the surface real-world integrators would hit, so the
 * fidelity harness weighs the pipeline op most heavily when scoring
 * behavioural drift.
 */

import type {
  ConstitutionalPrincipleInput,
  DefensePipelineResult,
  LlmSafetyAdapter,
} from '../../adapters/interface.js';

export interface PipelineRequest {
  sessionId: string;
  userInput: string;
  principles?: ConstitutionalPrincipleInput[];
  toxicityThreshold?: number;
}

export interface PipelineResponse {
  ok: boolean;
  sessionId: string;
  result?: DefensePipelineResult;
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
  if (typeof b['userInput'] !== 'string') {
    return { ok: false, errorKind: 'userInput_required' };
  }
  const req: PipelineRequest = {
    sessionId: b['sessionId'],
    userInput: b['userInput'],
  };
  if (Array.isArray(b['principles'])) {
    req.principles = b['principles'] as ConstitutionalPrincipleInput[];
  }
  if (typeof b['toxicityThreshold'] === 'number') {
    req.toxicityThreshold = b['toxicityThreshold'];
  }
  return { ok: true, value: req };
}

export async function handlePipelineRequest(
  adapter: LlmSafetyAdapter,
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
