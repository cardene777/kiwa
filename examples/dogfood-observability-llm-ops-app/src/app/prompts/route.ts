/**
 * `/prompts` HTTP handler — prompt log + hallucination flag ops the
 * runtime exposes to the prompt surface. The route is intentionally
 * shape-neutral — the fidelity harness feeds plain objects in and asserts
 * on plain objects out, so the same test can exercise mock and real
 * without spinning up a real prompt-log store or evaluation framework.
 *
 * The prompt surface pairs the parent v1.42-1 `llm-observability` axis
 * (logPrompt + flagHallucination) with the runtime session lifecycle
 * (start / close) — every op has a neutral event counterpart the
 * fidelity harness can compare across mock vs real.
 */

import type {
  HallucinationSignal,
  LlmOpsAdapter,
  ObservabilityTarget,
  PromptRecord,
} from '../../adapters/interface.js';

export type PromptOpKind = 'start' | 'log' | 'flag' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

const VALID_METRICS: ReadonlyArray<HallucinationSignal['metric']> = [
  'faithfulness',
  'relevance',
  'toxicity',
];

export interface PromptRequest {
  kind: PromptOpKind;
  sessionId: string;
  // start
  serviceName?: string;
  target?: ObservabilityTarget;
  // log
  prompt?: PromptRecord;
  // flag
  signals?: HallucinationSignal[];
}

export interface PromptResponse {
  ok: boolean;
  kind: PromptOpKind;
  sessionId: string;
  serviceName?: string;
  target?: ObservabilityTarget;
  requestId?: string;
  systemLength?: number;
  userLength?: number;
  redacted?: boolean;
  signalCount?: number;
  flaggedCount?: number;
  anyFlagged?: boolean;
  errorKind?: string;
}

export function validatePromptRequest(
  body: unknown,
): { ok: true; value: PromptRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'start' && kind !== 'log' && kind !== 'flag' && kind !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_start_log_flag_or_close' };
  }
  const value: PromptRequest = { kind, sessionId: b['sessionId'] };
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
  if (kind === 'log') {
    const raw = b['prompt'];
    if (!raw || typeof raw !== 'object') {
      return { ok: false, errorKind: 'prompt_required_object' };
    }
    const p = raw as Record<string, unknown>;
    if (typeof p['requestId'] !== 'string' || !p['requestId']) {
      return { ok: false, errorKind: 'prompt_requestId_required' };
    }
    if (typeof p['system'] !== 'string') {
      return { ok: false, errorKind: 'prompt_system_required_string' };
    }
    if (typeof p['user'] !== 'string') {
      return { ok: false, errorKind: 'prompt_user_required_string' };
    }
    if (typeof p['redacted'] !== 'boolean') {
      return { ok: false, errorKind: 'prompt_redacted_required_boolean' };
    }
    value.prompt = {
      requestId: p['requestId'],
      system: p['system'],
      user: p['user'],
      redacted: p['redacted'],
    };
    return { ok: true, value };
  }
  if (kind === 'flag') {
    if (!Array.isArray(b['signals'])) {
      return { ok: false, errorKind: 'signals_required_array' };
    }
    const raw = b['signals'] as unknown[];
    const signals: HallucinationSignal[] = [];
    for (const item of raw) {
      if (!item || typeof item !== 'object') {
        return { ok: false, errorKind: 'signal_not_object' };
      }
      const s = item as Record<string, unknown>;
      if (!VALID_METRICS.includes(s['metric'] as HallucinationSignal['metric'])) {
        return { ok: false, errorKind: 'signal_metric_required_valid' };
      }
      if (typeof s['score'] !== 'number') {
        return { ok: false, errorKind: 'signal_score_required_number' };
      }
      if (typeof s['threshold'] !== 'number') {
        return { ok: false, errorKind: 'signal_threshold_required_number' };
      }
      signals.push({
        metric: s['metric'] as HallucinationSignal['metric'],
        score: s['score'],
        threshold: s['threshold'],
      });
    }
    value.signals = signals;
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handlePromptRequest(
  adapter: LlmOpsAdapter,
  req: PromptRequest,
): Promise<PromptResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startPrompt({
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
    if (req.kind === 'log') {
      const result = await adapter.logPrompt({
        sessionId: req.sessionId,
        prompt: req.prompt!,
      });
      return {
        ok: true,
        kind: 'log',
        sessionId: result.sessionId,
        serviceName: result.serviceName,
        requestId: result.requestId,
        systemLength: result.systemLength,
        userLength: result.userLength,
        redacted: result.redacted,
      };
    }
    if (req.kind === 'flag') {
      const result = await adapter.flagHallucination({
        sessionId: req.sessionId,
        signals: req.signals!,
      });
      return {
        ok: true,
        kind: 'flag',
        sessionId: result.sessionId,
        serviceName: result.serviceName,
        signalCount: result.signalCount,
        flaggedCount: result.flaggedCount,
        anyFlagged: result.anyFlagged,
      };
    }
    await adapter.closePrompt({ sessionId: req.sessionId });
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
