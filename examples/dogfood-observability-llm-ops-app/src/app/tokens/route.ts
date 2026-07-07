/**
 * `/tokens` HTTP handler — OTel GenAI stable token counting ops the
 * runtime exposes to the token surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and asserts
 * on plain objects out, so the same test can exercise mock and real
 * without spinning up a real completion API endpoint.
 *
 * The token surface pairs the parent v1.42-1 `llm-observability` axis
 * (countTokens) with the runtime session lifecycle (start / close) —
 * every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type {
  LlmOpsAdapter,
  ObservabilityTarget,
  TokenUsage,
} from '../../adapters/interface.js';

export type TokenOpKind = 'start' | 'count' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

export interface TokenRequest {
  kind: TokenOpKind;
  sessionId: string;
  // start
  serviceName?: string;
  target?: ObservabilityTarget;
  // count
  usage?: TokenUsage;
}

export interface TokenResponse {
  ok: boolean;
  kind: TokenOpKind;
  sessionId: string;
  serviceName?: string;
  target?: ObservabilityTarget;
  model?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  errorKind?: string;
}

export function validateTokenRequest(
  body: unknown,
): { ok: true; value: TokenRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'start' && kind !== 'count' && kind !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_start_count_or_close' };
  }
  const value: TokenRequest = { kind, sessionId: b['sessionId'] };
  if (kind === 'start') {
    if (typeof b['serviceName'] !== 'string' || !b['serviceName']) {
      return { ok: false, errorKind: 'serviceName_required' };
    }
    if (!VALID_TARGETS.includes(b['target'] as ObservabilityTarget)) {
      return { ok: false, errorKind: 'target_required_valid' };
    }
    value.serviceName = b['serviceName'];
    value.target = b['target'] as ObservabilityTarget;
    return { ok: true, value };
  }
  if (kind === 'count') {
    const raw = b['usage'];
    if (!raw || typeof raw !== 'object') {
      return { ok: false, errorKind: 'usage_required_object' };
    }
    const u = raw as Record<string, unknown>;
    if (typeof u['model'] !== 'string' || !u['model']) {
      return { ok: false, errorKind: 'usage_model_required' };
    }
    if (typeof u['promptTokens'] !== 'number') {
      return { ok: false, errorKind: 'usage_promptTokens_required_number' };
    }
    if (typeof u['completionTokens'] !== 'number') {
      return { ok: false, errorKind: 'usage_completionTokens_required_number' };
    }
    value.usage = {
      model: u['model'],
      promptTokens: u['promptTokens'],
      completionTokens: u['completionTokens'],
    };
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handleTokenRequest(
  adapter: LlmOpsAdapter,
  req: TokenRequest,
): Promise<TokenResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startToken({
        sessionId: req.sessionId,
        serviceName: req.serviceName!,
        target: req.target!,
      });
      return {
        ok: true,
        kind: 'start',
        sessionId: req.sessionId,
        serviceName: req.serviceName!,
        target: req.target!,
      };
    }
    if (req.kind === 'count') {
      const result = await adapter.countTokens({
        sessionId: req.sessionId,
        usage: req.usage!,
      });
      return {
        ok: true,
        kind: 'count',
        sessionId: result.sessionId,
        serviceName: result.serviceName,
        model: result.model,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
        totalTokens: result.totalTokens,
      };
    }
    await adapter.closeToken({ sessionId: req.sessionId });
    return { ok: true, kind: 'close', sessionId: req.sessionId };
  } catch (err) {
    return {
      ok: false,
      kind: req.kind,
      sessionId: req.sessionId,
      errorKind: coerceErrorKind(err),
    };
  }
}

function coerceErrorKind(err: unknown): string {
  if (err instanceof Error) return err.message;
  return 'unknown_error';
}
