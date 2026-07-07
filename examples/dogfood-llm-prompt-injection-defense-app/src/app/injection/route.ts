/**
 * `/injection` HTTP handler — prompt injection defense ops (analyze +
 * classify direct + block jailbreak + block role hijack). The route is
 * intentionally shape-neutral — the fidelity harness feeds plain objects
 * in and asserts on plain objects out, so the same test can exercise
 * mock and real without spinning up a real Anthropic client.
 *
 * The injection surface pairs the parent v1.38-1 `prompt-injection` axis
 * (direct + indirect + jailbreak + role-hijacking + XML) with
 * `@kiwa-test/ai-llm` v0.4 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  InjectionAnalyzeResult,
  JailbreakBlockResult,
  LlmSafetyAdapter,
  RoleHijackBlockResult,
  DirectClassifyResult,
} from '../../adapters/interface.js';

export type InjectionOpKind =
  | 'analyze'
  | 'classifyDirect'
  | 'blockJailbreak'
  | 'blockRoleHijack';

export interface InjectionRequest {
  kind: InjectionOpKind;
  sessionId: string;
  text: string;
}

export interface InjectionResponse {
  ok: boolean;
  kind: InjectionOpKind;
  sessionId: string;
  result?:
    | InjectionAnalyzeResult
    | DirectClassifyResult
    | JailbreakBlockResult
    | RoleHijackBlockResult;
  errorKind?: string;
}

export function validateInjectionRequest(
  body: unknown,
):
  | { ok: true; value: InjectionRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  if (typeof b['text'] !== 'string') {
    return { ok: false, errorKind: 'text_required' };
  }
  const kinds: InjectionOpKind[] = [
    'analyze',
    'classifyDirect',
    'blockJailbreak',
    'blockRoleHijack',
  ];
  if (!kinds.includes(b['kind'] as InjectionOpKind)) {
    return { ok: false, errorKind: 'kind_must_be_valid_op' };
  }
  return {
    ok: true,
    value: {
      kind: b['kind'] as InjectionOpKind,
      sessionId: b['sessionId'],
      text: b['text'],
    },
  };
}

export async function handleInjectionRequest(
  adapter: LlmSafetyAdapter,
  request: InjectionRequest,
): Promise<InjectionResponse> {
  try {
    if (request.kind === 'analyze') {
      const result = await adapter.analyzeInjection({
        sessionId: request.sessionId,
        text: request.text,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'classifyDirect') {
      const result = await adapter.classifyDirect({
        sessionId: request.sessionId,
        text: request.text,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'blockJailbreak') {
      const result = await adapter.blockJailbreak({
        sessionId: request.sessionId,
        text: request.text,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    const result = await adapter.blockRoleHijack({
      sessionId: request.sessionId,
      text: request.text,
    });
    return {
      ok: true,
      kind: request.kind,
      sessionId: request.sessionId,
      result,
    };
  } catch (err) {
    return {
      ok: false,
      kind: request.kind,
      sessionId: request.sessionId,
      errorKind: err instanceof Error ? err.message : 'unknown',
    };
  }
}
