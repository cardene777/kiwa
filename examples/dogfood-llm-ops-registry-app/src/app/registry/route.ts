/**
 * `/registry` HTTP handler — LLM ops registry ceremony (register a
 * new model version + optionally activate + report the resulting
 * registry state). The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up
 * a real Vercel AI SDK client or deployment control plane.
 *
 * The registry surface pairs the v1.40-1 `llm-ops` axis (model
 * registry + version activation state machine) with `@kiwa-test/ai-llm`
 * v0.5 — every op has a neutral event counterpart the fidelity harness
 * can compare across mock vs real.
 */

import type {
  AbInput,
  AdvanceRolloutResult,
  EvaluateAbResult,
  LlmOpsAdapter,
  RegistryInput,
  RolloutInput,
  UpdateRegistryResult,
} from '../../adapters/interface.js';

export interface RegistryUpdateRequest {
  sessionId: string;
  entry: RegistryInput;
}

export interface RolloutAdvanceRequest {
  sessionId: string;
  rollout: RolloutInput;
}

export interface AbEvaluateRequest {
  sessionId: string;
  ab: AbInput;
}

export interface RegistryResponse<T> {
  ok: boolean;
  sessionId: string;
  result?: T;
  errorKind?: string;
}

export function validateRegistryRequest(
  body: unknown,
):
  | { ok: true; value: RegistryUpdateRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const e = b['entry'];
  if (!e || typeof e !== 'object') {
    return { ok: false, errorKind: 'entry_required' };
  }
  const eo = e as Record<string, unknown>;
  if (typeof eo['version'] !== 'string' || !eo['version']) {
    return { ok: false, errorKind: 'entry.version_required' };
  }
  if (typeof eo['activate'] !== 'boolean') {
    return { ok: false, errorKind: 'entry.activate_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      entry: {
        version: eo['version'],
        activate: eo['activate'],
      },
    },
  };
}

export function validateRolloutRequest(
  body: unknown,
):
  | { ok: true; value: RolloutAdvanceRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const r = b['rollout'];
  if (!r || typeof r !== 'object') {
    return { ok: false, errorKind: 'rollout_required' };
  }
  const ro = r as Record<string, unknown>;
  if (typeof ro['targetPercent'] !== 'number') {
    return { ok: false, errorKind: 'rollout.targetPercent_required' };
  }
  if (typeof ro['incrementPercent'] !== 'number' || ro['incrementPercent'] <= 0) {
    return { ok: false, errorKind: 'rollout.incrementPercent_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      rollout: {
        targetPercent: ro['targetPercent'],
        incrementPercent: ro['incrementPercent'],
      },
    },
  };
}

export function validateAbRequest(
  body: unknown,
):
  | { ok: true; value: AbEvaluateRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const a = b['ab'];
  if (!a || typeof a !== 'object') {
    return { ok: false, errorKind: 'ab_required' };
  }
  const ao = a as Record<string, unknown>;
  if (!Array.isArray(ao['results'])) {
    return { ok: false, errorKind: 'ab.results_required' };
  }
  if (typeof ao['minSamples'] !== 'number' || ao['minSamples'] < 0) {
    return { ok: false, errorKind: 'ab.minSamples_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      ab: {
        results: ao['results'] as AbInput['results'],
        minSamples: ao['minSamples'],
      },
    },
  };
}

export async function handleRegistryRequest(
  adapter: LlmOpsAdapter,
  request: RegistryUpdateRequest,
): Promise<RegistryResponse<UpdateRegistryResult>> {
  try {
    const result = await adapter.updateRegistry(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleRolloutRequest(
  adapter: LlmOpsAdapter,
  request: RolloutAdvanceRequest,
): Promise<RegistryResponse<AdvanceRolloutResult>> {
  try {
    const result = await adapter.advanceRollout(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleAbRequest(
  adapter: LlmOpsAdapter,
  request: AbEvaluateRequest,
): Promise<RegistryResponse<EvaluateAbResult>> {
  try {
    const result = await adapter.evaluateAb(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
