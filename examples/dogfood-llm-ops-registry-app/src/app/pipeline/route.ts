/**
 * `/pipeline` HTTP handler — full LLM ops pipeline (registry updates →
 * rollout advancement → A/B evaluation → canary promotion → shadow
 * comparison → tolerance gate). Composes the registry + rollout + A/B
 * + canary + shadow surfaces so a single call takes an ops session
 * config and returns either a completed pipeline result or a blocked
 * reason.
 *
 * The pipeline surface is the highest-level integration point v1.40-4
 * ships — it is the surface real-world integrators would hit, so the
 * fidelity harness weighs the pipeline op most heavily when scoring
 * behavioural drift.
 */

import type {
  AbInput,
  CanaryInput,
  LlmOpsAdapter,
  OpsPipelineResult,
  PipelineInput,
  RegistryInput,
  RolloutInput,
  ShadowInput,
} from '../../adapters/interface.js';

export type PipelineRequest = PipelineInput;

export interface PipelineResponse {
  ok: boolean;
  sessionId: string;
  result?: OpsPipelineResult;
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
  if (!Array.isArray(b['registry'])) {
    return { ok: false, errorKind: 'registry_required' };
  }
  const r = b['rollout'];
  if (!r || typeof r !== 'object') {
    return { ok: false, errorKind: 'rollout_required' };
  }
  const a = b['ab'];
  if (!a || typeof a !== 'object') {
    return { ok: false, errorKind: 'ab_required' };
  }
  const c = b['canary'];
  if (!c || typeof c !== 'object') {
    return { ok: false, errorKind: 'canary_required' };
  }
  const s = b['shadow'];
  if (!s || typeof s !== 'object') {
    return { ok: false, errorKind: 'shadow_required' };
  }
  if (typeof b['shadowMinDelta'] !== 'number') {
    return { ok: false, errorKind: 'shadowMinDelta_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      registry: b['registry'] as RegistryInput[],
      rollout: r as RolloutInput,
      ab: a as AbInput,
      canary: c as CanaryInput,
      shadow: s as ShadowInput,
      shadowMinDelta: b['shadowMinDelta'],
    },
  };
}

export async function handlePipelineRequest(
  adapter: LlmOpsAdapter,
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
