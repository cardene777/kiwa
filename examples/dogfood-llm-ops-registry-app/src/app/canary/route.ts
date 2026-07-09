/**
 * `/canary` HTTP handler — LLM ops canary + shadow ceremony (canary
 * promotion by error-rate gate + shadow-vs-production score delta).
 * The route is intentionally shape-neutral — the fidelity harness feeds
 * plain objects in and asserts on plain objects out, so the same test
 * can exercise mock and real without spinning up a real Vercel AI SDK
 * client or deployment control plane.
 *
 * The canary + shadow surface pairs the v1.40-1 `llm-ops` axis (canary
 * promotion + shadow comparison) with `@kiwa-lab/ai-llm` v0.5 — every
 * op has a neutral event counterpart the fidelity harness can compare
 * across mock vs real.
 */

import type {
  CanaryInput,
  CompareShadowResult,
  LlmOpsAdapter,
  PromoteCanaryResult,
  ShadowInput,
} from '../../adapters/interface.js';

export interface CanaryPromoteRequest {
  sessionId: string;
  canary: CanaryInput;
}

export interface ShadowCompareRequest {
  sessionId: string;
  shadow: ShadowInput;
}

export interface CanaryResponse<T> {
  ok: boolean;
  sessionId: string;
  result?: T;
  errorKind?: string;
}

export function validateCanaryRequest(
  body: unknown,
):
  | { ok: true; value: CanaryPromoteRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const c = b['canary'];
  if (!c || typeof c !== 'object') {
    return { ok: false, errorKind: 'canary_required' };
  }
  const co = c as Record<string, unknown>;
  if (typeof co['canaryVersion'] !== 'string' || !co['canaryVersion']) {
    return { ok: false, errorKind: 'canary.canaryVersion_required' };
  }
  if (typeof co['errorRate'] !== 'number') {
    return { ok: false, errorKind: 'canary.errorRate_required' };
  }
  if (typeof co['threshold'] !== 'number') {
    return { ok: false, errorKind: 'canary.threshold_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      canary: {
        canaryVersion: co['canaryVersion'],
        errorRate: co['errorRate'],
        threshold: co['threshold'],
      },
    },
  };
}

export function validateShadowRequest(
  body: unknown,
):
  | { ok: true; value: ShadowCompareRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const s = b['shadow'];
  if (!s || typeof s !== 'object') {
    return { ok: false, errorKind: 'shadow_required' };
  }
  const so = s as Record<string, unknown>;
  if (!Array.isArray(so['productionScores'])) {
    return { ok: false, errorKind: 'shadow.productionScores_required' };
  }
  if (!Array.isArray(so['shadowScores'])) {
    return { ok: false, errorKind: 'shadow.shadowScores_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      shadow: {
        productionScores: so['productionScores'] as number[],
        shadowScores: so['shadowScores'] as number[],
      },
    },
  };
}

export async function handleCanaryRequest(
  adapter: LlmOpsAdapter,
  request: CanaryPromoteRequest,
): Promise<CanaryResponse<PromoteCanaryResult>> {
  try {
    const result = await adapter.promoteCanary(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}

export async function handleShadowRequest(
  adapter: LlmOpsAdapter,
  request: ShadowCompareRequest,
): Promise<CanaryResponse<CompareShadowResult>> {
  try {
    const result = await adapter.compareShadow(request);
    return { ok: true, sessionId: request.sessionId, result };
  } catch (err) {
    return {
      ok: false,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
