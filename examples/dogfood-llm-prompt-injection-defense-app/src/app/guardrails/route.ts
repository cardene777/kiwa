/**
 * `/guardrails` HTTP handler — output guardrail ops (schema validation +
 * toxicity block + PII redact + Constitutional check). Shape-neutral so
 * the fidelity harness can drive mock and real symmetrically.
 *
 * The guardrails surface pairs the parent v1.38-1 `guardrails` axis
 * (schema + regex + toxicity + PII + Constitutional AI) with
 * `@kiwa-test/ai-llm` v0.4 — every op has a neutral event counterpart
 * the fidelity harness can compare across mock vs real.
 */

import type {
  ConstitutionalCheckResult,
  ConstitutionalPrincipleInput,
  JsonSchemaInput,
  LlmSafetyAdapter,
  PiiRedactResult,
  SchemaValidateResult,
  ToxicityBlockResult,
} from '../../adapters/interface.js';

export type GuardrailOpKind =
  | 'validateSchema'
  | 'blockToxicity'
  | 'redactPii'
  | 'checkConstitutional';

export interface GuardrailRequest {
  kind: GuardrailOpKind;
  sessionId: string;
  text?: string;
  value?: unknown;
  schema?: JsonSchemaInput;
  threshold?: number;
  principles?: ConstitutionalPrincipleInput[];
}

export interface GuardrailResponse {
  ok: boolean;
  kind: GuardrailOpKind;
  sessionId: string;
  result?:
    | SchemaValidateResult
    | ToxicityBlockResult
    | PiiRedactResult
    | ConstitutionalCheckResult;
  errorKind?: string;
}

export function validateGuardrailRequest(
  body: unknown,
):
  | { ok: true; value: GuardrailRequest }
  | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kinds: GuardrailOpKind[] = [
    'validateSchema',
    'blockToxicity',
    'redactPii',
    'checkConstitutional',
  ];
  if (!kinds.includes(b['kind'] as GuardrailOpKind)) {
    return { ok: false, errorKind: 'kind_must_be_valid_op' };
  }
  const req: GuardrailRequest = {
    kind: b['kind'] as GuardrailOpKind,
    sessionId: b['sessionId'],
  };
  if (req.kind === 'validateSchema') {
    if (!b['schema'] || typeof b['schema'] !== 'object') {
      return { ok: false, errorKind: 'schema_required' };
    }
    if (b['value'] === undefined) {
      return { ok: false, errorKind: 'value_required' };
    }
    req.schema = b['schema'] as JsonSchemaInput;
    req.value = b['value'];
  }
  if (
    req.kind === 'blockToxicity' ||
    req.kind === 'redactPii' ||
    req.kind === 'checkConstitutional'
  ) {
    if (typeof b['text'] !== 'string') {
      return { ok: false, errorKind: 'text_required' };
    }
    req.text = b['text'];
  }
  if (req.kind === 'blockToxicity' && typeof b['threshold'] === 'number') {
    req.threshold = b['threshold'];
  }
  if (req.kind === 'checkConstitutional') {
    if (!Array.isArray(b['principles'])) {
      return { ok: false, errorKind: 'principles_required' };
    }
    req.principles = b['principles'] as ConstitutionalPrincipleInput[];
  }
  return { ok: true, value: req };
}

export async function handleGuardrailRequest(
  adapter: LlmSafetyAdapter,
  request: GuardrailRequest,
): Promise<GuardrailResponse> {
  try {
    if (request.kind === 'validateSchema') {
      const result = await adapter.validateSchema({
        sessionId: request.sessionId,
        value: request.value,
        schema: request.schema!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'blockToxicity') {
      const toxInput: {
        sessionId: string;
        text: string;
        threshold?: number;
      } = {
        sessionId: request.sessionId,
        text: request.text!,
      };
      if (request.threshold !== undefined) toxInput.threshold = request.threshold;
      const result = await adapter.blockToxicity(toxInput);
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    if (request.kind === 'redactPii') {
      const result = await adapter.redactPii({
        sessionId: request.sessionId,
        text: request.text!,
      });
      return {
        ok: true,
        kind: request.kind,
        sessionId: request.sessionId,
        result,
      };
    }
    const result = await adapter.checkConstitutional({
      sessionId: request.sessionId,
      text: request.text!,
      principles: request.principles!,
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
