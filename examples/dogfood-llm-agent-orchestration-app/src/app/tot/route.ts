/**
 * `/tot` HTTP handler — Tree-of-Thought plan expansion (root → branches →
 * depth). Shape-neutral so the fidelity harness can drive mock and real
 * symmetrically.
 *
 * The ToT surface pairs the parent v1.38-1 `agent-orchestration` axis
 * (tree of thoughts) with `@kiwa/ai-llm` v0.4 — every op has a
 * neutral event counterpart the fidelity harness can compare across
 * mock vs real.
 */

import type {
  LlmAgentAdapter,
  TotExpandResult,
  TotInput,
} from '../../adapters/interface.js';

export interface TotRequest {
  sessionId: string;
  plan: TotInput;
}

export interface TotResponse {
  ok: boolean;
  sessionId: string;
  result?: TotExpandResult;
  errorKind?: string;
}

export function validateTotRequest(
  body: unknown,
):
  | { ok: true; value: TotRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!b['plan'] || typeof b['plan'] !== 'object') {
    return { ok: false, errorKind: 'plan_required' };
  }
  const p = b['plan'] as Record<string, unknown>;
  if (!p['root'] || typeof p['root'] !== 'object') {
    return { ok: false, errorKind: 'plan.root_required' };
  }
  const root = p['root'] as Record<string, unknown>;
  if (typeof root['thought'] !== 'string') {
    return { ok: false, errorKind: 'plan.root.thought_required' };
  }
  if (!Array.isArray(p['branches']) || p['branches'].length === 0) {
    return { ok: false, errorKind: 'plan.branches_required' };
  }
  for (const br of p['branches']) {
    if (!br || typeof br !== 'object') {
      return { ok: false, errorKind: 'plan.branches[]_must_be_object' };
    }
    const b2 = br as Record<string, unknown>;
    if (typeof b2['thought'] !== 'string') {
      return { ok: false, errorKind: 'plan.branches[].thought_required' };
    }
    if (typeof b2['score'] !== 'number') {
      return { ok: false, errorKind: 'plan.branches[].score_required' };
    }
  }
  if (typeof p['depth'] !== 'number' || p['depth'] <= 0) {
    return { ok: false, errorKind: 'plan.depth_must_be_positive' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      plan: {
        root: { thought: root['thought'] },
        branches: p['branches'] as Array<{ thought: string; score: number }>,
        depth: p['depth'],
      },
    },
  };
}

export async function handleTotRequest(
  adapter: LlmAgentAdapter,
  request: TotRequest,
): Promise<TotResponse> {
  try {
    const result = await adapter.expandToT({
      sessionId: request.sessionId,
      plan: request.plan,
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
