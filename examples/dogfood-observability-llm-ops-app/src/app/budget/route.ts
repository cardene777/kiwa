/**
 * `/budget` HTTP handler — LLM budget check ops the runtime exposes to
 * the budget surface. The route is intentionally shape-neutral — the
 * fidelity harness feeds plain objects in and asserts on plain objects
 * out, so the same test can exercise mock and real without spinning up
 * a real cost-explorer or budget API endpoint.
 *
 * The budget surface pairs the parent v1.42-1 `llm-observability` axis
 * (checkBudget) with the runtime session lifecycle (start / close) —
 * every op has a neutral event counterpart the fidelity harness can
 * compare across mock vs real.
 */

import type {
  LlmOpsAdapter,
  ObservabilityTarget,
} from '../../adapters/interface.js';

export type BudgetOpKind = 'start' | 'check' | 'close';

const VALID_TARGETS: readonly ObservabilityTarget[] = [
  'grafana-oss',
  'prometheus',
  'loki',
  'otel-collector',
];

export interface BudgetRequest {
  kind: BudgetOpKind;
  sessionId: string;
  // start
  serviceName?: string;
  target?: ObservabilityTarget;
  // check
  spentUsd?: number;
  limitUsd?: number;
}

export interface BudgetResponse {
  ok: boolean;
  kind: BudgetOpKind;
  sessionId: string;
  serviceName?: string;
  target?: ObservabilityTarget;
  spentUsd?: number;
  limitUsd?: number;
  ratio?: number;
  exhausted?: boolean;
  errorKind?: string;
}

export function validateBudgetRequest(
  body: unknown,
): { ok: true; value: BudgetRequest } | { ok: false; errorKind: string } {
  if (!body || typeof body !== 'object') {
    return { ok: false, errorKind: 'body_not_object' };
  }
  const b = body as Record<string, unknown>;
  if (typeof b['sessionId'] !== 'string' || !b['sessionId']) {
    return { ok: false, errorKind: 'sessionId_required' };
  }
  const kind = b['kind'];
  if (kind !== 'start' && kind !== 'check' && kind !== 'close') {
    return { ok: false, errorKind: 'kind_must_be_start_check_or_close' };
  }
  const value: BudgetRequest = { kind, sessionId: b['sessionId'] };
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
  if (kind === 'check') {
    if (typeof b['spentUsd'] !== 'number') {
      return { ok: false, errorKind: 'spentUsd_required_number' };
    }
    if (typeof b['limitUsd'] !== 'number') {
      return { ok: false, errorKind: 'limitUsd_required_number' };
    }
    value.spentUsd = b['spentUsd'];
    value.limitUsd = b['limitUsd'];
    return { ok: true, value };
  }
  // kind === 'close'
  return { ok: true, value };
}

export async function handleBudgetRequest(
  adapter: LlmOpsAdapter,
  req: BudgetRequest,
): Promise<BudgetResponse> {
  try {
    if (req.kind === 'start') {
      await adapter.startBudget({
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
    if (req.kind === 'check') {
      const result = await adapter.checkBudget({
        sessionId: req.sessionId,
        spentUsd: req.spentUsd!,
        limitUsd: req.limitUsd!,
      });
      return {
        ok: true,
        kind: 'check',
        sessionId: result.sessionId,
        serviceName: result.serviceName,
        spentUsd: result.spentUsd,
        limitUsd: result.limitUsd,
        ratio: result.ratio,
        exhausted: result.exhausted,
      };
    }
    await adapter.closeBudget({ sessionId: req.sessionId });
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
