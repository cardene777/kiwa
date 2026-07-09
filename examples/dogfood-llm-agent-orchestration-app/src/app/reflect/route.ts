/**
 * `/reflect` HTTP handler — reflect + self-correct cycle (critique rules
 * scan → revised output). Shape-neutral so the fidelity harness can
 * drive mock and real symmetrically.
 *
 * The reflect surface pairs the parent v1.38-1 `agent-orchestration`
 * axis (reflection + self-correction) with `@kiwa-lab/ai-llm` v0.4 —
 * every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type {
  LlmAgentAdapter,
  ReflectInput,
  ReflectResult,
} from '../../adapters/interface.js';

export interface ReflectRequest {
  sessionId: string;
  reflect: ReflectInput;
}

export interface ReflectResponse {
  ok: boolean;
  sessionId: string;
  result?: ReflectResult;
  errorKind?: string;
}

export function validateReflectRequest(
  body: unknown,
):
  | { ok: true; value: ReflectRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!b['reflect'] || typeof b['reflect'] !== 'object') {
    return { ok: false, errorKind: 'reflect_required' };
  }
  const r = b['reflect'] as Record<string, unknown>;
  if (typeof r['output'] !== 'string') {
    return { ok: false, errorKind: 'reflect.output_required' };
  }
  if (!Array.isArray(r['critiqueRules'])) {
    return { ok: false, errorKind: 'reflect.critiqueRules_required' };
  }
  for (const rule of r['critiqueRules']) {
    if (typeof rule !== 'string') {
      return { ok: false, errorKind: 'reflect.critiqueRules[]_must_be_string' };
    }
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      reflect: {
        output: r['output'],
        critiqueRules: r['critiqueRules'] as string[],
      },
    },
  };
}

export async function handleReflectRequest(
  adapter: LlmAgentAdapter,
  request: ReflectRequest,
): Promise<ReflectResponse> {
  try {
    const result = await adapter.reflect({
      sessionId: request.sessionId,
      reflect: request.reflect,
    });
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
