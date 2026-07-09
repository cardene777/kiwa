/**
 * `/tool-select` HTTP handler — intent-driven tool ranking with a
 * fallback ladder. Shape-neutral so the fidelity harness can drive mock
 * and real symmetrically.
 *
 * The tool-select surface pairs the parent v1.38-1 `agent-orchestration`
 * axis (tool selection) with `@kiwa-lab/ai-llm` v0.4 — every op has a
 * neutral event counterpart the fidelity harness can compare across
 * mock vs real.
 */

import type {
  LlmAgentAdapter,
  ToolCandidateInput,
  ToolSelectResult,
} from '../../adapters/interface.js';

export interface ToolSelectRequest {
  sessionId: string;
  intent: string;
  candidates: ToolCandidateInput[];
}

export interface ToolSelectResponse {
  ok: boolean;
  sessionId: string;
  result?: ToolSelectResult;
  errorKind?: string;
}

export function validateToolSelectRequest(
  body: unknown,
):
  | { ok: true; value: ToolSelectRequest }
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
  for (const c of b['candidates']) {
    if (!c || typeof c !== 'object') {
      return { ok: false, errorKind: 'candidates[]_must_be_object' };
    }
    const c2 = c as Record<string, unknown>;
    if (typeof c2['name'] !== 'string' || !c2['name']) {
      return { ok: false, errorKind: 'candidates[].name_required' };
    }
    if (typeof c2['description'] !== 'string') {
      return { ok: false, errorKind: 'candidates[].description_required' };
    }
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      intent: b['intent'],
      candidates: b['candidates'] as ToolCandidateInput[],
    },
  };
}

export async function handleToolSelectRequest(
  adapter: LlmAgentAdapter,
  request: ToolSelectRequest,
): Promise<ToolSelectResponse> {
  try {
    const result = await adapter.selectTool({
      sessionId: request.sessionId,
      intent: request.intent,
      candidates: request.candidates,
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
