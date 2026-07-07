import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Cost / latency SLA axis — budget + p50/p99 + model routing + fallback ladder
 * state machine。 deterministic mock で 4 signal 系統。
 *
 * Budget guard は real driver 経路 (KIWA_MODE=real) で $ 上限を強制する
 * SSOT。 mock 経路でも 4 SDK 全部に同じ SLA API を提供する。
 */

export type SlaState =
  | 'idle'
  | 'budget-checked'
  | 'latency-measured'
  | 'model-routed'
  | 'fallback-engaged';

export interface SlaSession {
  target: AiLlmTarget;
  sessionId: string;
  state: SlaState;
  history: AxisStep<SlaState>[];
  spent: number;
  budgetUsd: number;
}

export interface LatencySample {
  requestId: string;
  latencyMs: number;
}

export interface RoutingCandidate {
  model: string;
  costPerCall: number;
  latencyMs: number;
  qualityScore: number;
}

export function startSlaSession(input: {
  target: AiLlmTarget;
  sessionId: string;
  budgetUsd: number;
}): SlaSession {
  if (input.sessionId.length === 0) {
    throw new Error('startSlaSession: sessionId must not be empty');
  }
  if (input.budgetUsd < 0) throw new Error('startSlaSession: budgetUsd must be non-negative');
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    spent: 0,
    budgetUsd: input.budgetUsd,
  };
}

export function checkBudget(
  session: SlaSession,
  input: { cost: number },
): { step: AxisStep<SlaState>; allowed: boolean; remaining: number } {
  if (input.cost < 0) throw new Error('checkBudget: cost must be non-negative');
  const projected = session.spent + input.cost;
  const allowed = projected <= session.budgetUsd;
  if (allowed) {
    session.spent = projected;
  }
  const remaining = Math.max(0, session.budgetUsd - session.spent);
  session.state = 'budget-checked';
  const step = emit(session, 'sla.budget_checked', {
    cost: input.cost,
    spent: session.spent,
    remaining,
    allowed,
    budgetUsd: session.budgetUsd,
  });
  return { step, allowed, remaining };
}

export function measureLatency(
  session: SlaSession,
  samples: LatencySample[],
): {
  step: AxisStep<SlaState>;
  p50: number;
  p95: number;
  p99: number;
  count: number;
} {
  if (samples.length === 0) throw new Error('measureLatency: samples must not be empty');
  if (session.state !== 'budget-checked' && session.state !== 'idle' && session.state !== 'fallback-engaged') {
    throw new Error(`measureLatency: session is ${session.state}`);
  }
  const sorted = [...samples.map((s) => s.latencyMs)].sort((a, b) => a - b);
  const pick = (p: number): number => {
    const idx = Math.max(0, Math.min(sorted.length - 1, Math.ceil(p * sorted.length) - 1));
    return sorted[idx] ?? 0;
  };
  const p50 = pick(0.5);
  const p95 = pick(0.95);
  const p99 = pick(0.99);
  session.state = 'latency-measured';
  const step = emit(session, 'sla.latency_measured', {
    count: sorted.length,
    p50,
    p95,
    p99,
  });
  return { step, p50, p95, p99, count: sorted.length };
}

export function routeModel(
  session: SlaSession,
  input: {
    candidates: RoutingCandidate[];
    slaLatencyMs: number;
    minQuality: number;
  },
): { step: AxisStep<SlaState>; chosen: RoutingCandidate | null; considered: RoutingCandidate[] } {
  if (session.state === 'idle') {
    throw new Error('routeModel: check budget or measure latency first');
  }
  if (input.candidates.length === 0) throw new Error('routeModel: candidates must not be empty');
  const considered = input.candidates.filter(
    (c) => c.latencyMs <= input.slaLatencyMs && c.qualityScore >= input.minQuality,
  );
  const chosen =
    considered.sort((a, b) => a.costPerCall - b.costPerCall)[0] ?? null;
  session.state = 'model-routed';
  const step = emit(session, 'sla.model_routed', {
    candidateCount: input.candidates.length,
    consideredCount: considered.length,
    chosen: chosen?.model ?? '',
    slaLatencyMs: input.slaLatencyMs,
    minQuality: input.minQuality,
  });
  return { step, chosen, considered };
}

export function engageFallback(
  session: SlaSession,
  input: { ladder: string[]; failed: string[] },
): { step: AxisStep<SlaState>; nextModel: string | null; attemptedCount: number } {
  if (session.state !== 'model-routed' && session.state !== 'latency-measured') {
    throw new Error(`engageFallback: session is ${session.state}`);
  }
  if (input.ladder.length === 0) throw new Error('engageFallback: ladder must not be empty');
  const failedSet = new Set(input.failed);
  const nextModel = input.ladder.find((m) => !failedSet.has(m)) ?? null;
  session.state = 'fallback-engaged';
  const step = emit(session, 'sla.fallback_engaged', {
    ladderLength: input.ladder.length,
    failedCount: input.failed.length,
    nextModel: nextModel ?? '',
    exhausted: nextModel === null,
  });
  return { step, nextModel, attemptedCount: input.failed.length };
}

function emit(
  session: SlaSession,
  neutralEvent: AxisStep<SlaState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<SlaState> {
  const step: AxisStep<SlaState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
