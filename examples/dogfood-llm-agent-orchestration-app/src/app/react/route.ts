/**
 * `/react` HTTP handler — ReAct step ceremony (thought → action →
 * observation). The route is intentionally shape-neutral — the fidelity
 * harness feeds plain objects in and asserts on plain objects out, so
 * the same test can exercise mock and real without spinning up a real
 * Vercel AI SDK client.
 *
 * The ReAct surface pairs the parent v1.38-1 `agent-orchestration` axis
 * (ReAct trace) with `@kiwa-test/ai-llm` v0.4 — every op has a neutral
 * event counterpart the fidelity harness can compare across mock vs
 * real.
 */

import type {
  LlmAgentAdapter,
  ReactInput,
  ReactStepResult,
} from '../../adapters/interface.js';

export interface ReactRequest {
  sessionId: string;
  step: ReactInput;
}

export interface ReactResponse {
  ok: boolean;
  sessionId: string;
  result?: ReactStepResult;
  errorKind?: string;
}

export function validateReactRequest(
  body: unknown,
):
  | { ok: true; value: ReactRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (!b['step'] || typeof b['step'] !== 'object') {
    return { ok: false, errorKind: 'step_required' };
  }
  const s = b['step'] as Record<string, unknown>;
  if (typeof s['thought'] !== 'string') {
    return { ok: false, errorKind: 'step.thought_required' };
  }
  if (typeof s['observation'] !== 'string') {
    return { ok: false, errorKind: 'step.observation_required' };
  }
  if (!s['action'] || typeof s['action'] !== 'object') {
    return { ok: false, errorKind: 'step.action_required' };
  }
  const a = s['action'] as Record<string, unknown>;
  if (typeof a['tool'] !== 'string' || !a['tool']) {
    return { ok: false, errorKind: 'step.action.tool_required' };
  }
  if (typeof a['input'] !== 'string') {
    return { ok: false, errorKind: 'step.action.input_required' };
  }
  return {
    ok: true,
    value: {
      sessionId: b['sessionId'],
      step: {
        thought: s['thought'],
        observation: s['observation'],
        action: { tool: a['tool'], input: a['input'] },
      },
    },
  };
}

export async function handleReactRequest(
  adapter: LlmAgentAdapter,
  request: ReactRequest,
): Promise<ReactResponse> {
  try {
    const result = await adapter.reactStep({
      sessionId: request.sessionId,
      step: request.step,
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
