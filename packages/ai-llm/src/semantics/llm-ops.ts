import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * LLM ops axis — model registry + rollout + A/B + canary + shadow state
 * machine。
 *
 * Deterministic mock で 5 signal 系統。 registry updates append versioned
 * entries、 rollout tracks percentage advancement、 A/B computes winner by
 * mean score、 canary promotion is threshold check、 shadow comparison
 * computes delta。
 */

export type OpsState =
  | 'idle'
  | 'registry-updated'
  | 'rollout-advanced'
  | 'ab-evaluated'
  | 'canary-promoted'
  | 'shadow-compared';

export interface OpsModelEntry {
  version: string;
  createdAtMs: number;
  active: boolean;
}

export interface OpsAbResult {
  variant: string;
  score: number;
  samples: number;
}

export interface OpsSession {
  target: AiLlmTarget;
  sessionId: string;
  state: OpsState;
  history: AxisStep<OpsState>[];
  registry: OpsModelEntry[];
  rolloutPercent: number;
  abWinner: string | null;
}

export function startOpsSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): OpsSession {
  if (input.sessionId.length === 0) {
    throw new Error('startOpsSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    registry: [],
    rolloutPercent: 0,
    abWinner: null,
  };
}

export function updateRegistry(
  session: OpsSession,
  input: { version: string; activate: boolean },
): { step: AxisStep<OpsState>; registrySize: number } {
  if (input.version.length === 0)
    throw new Error('updateRegistry: version must not be empty');
  if (session.registry.some((e) => e.version === input.version))
    throw new Error(`updateRegistry: version ${input.version} already registered`);
  if (input.activate) {
    session.registry = session.registry.map((e) => ({ ...e, active: false }));
  }
  session.registry.push({
    version: input.version,
    createdAtMs: Date.now(),
    active: input.activate,
  });
  session.state = 'registry-updated';
  const step = emit(session, 'ops.registry_updated', {
    version: input.version,
    activate: input.activate,
    registrySize: session.registry.length,
  });
  return { step, registrySize: session.registry.length };
}

export function advanceRollout(
  session: OpsSession,
  input: { targetPercent: number; incrementPercent: number },
): { step: AxisStep<OpsState>; currentPercent: number; reachedTarget: boolean } {
  if (session.state === 'idle') throw new Error('advanceRollout: update registry first');
  if (input.targetPercent < 0 || input.targetPercent > 100)
    throw new Error('advanceRollout: targetPercent must be in [0, 100]');
  if (input.incrementPercent <= 0)
    throw new Error('advanceRollout: incrementPercent must be positive');
  session.rolloutPercent = Math.min(
    input.targetPercent,
    session.rolloutPercent + input.incrementPercent,
  );
  const reachedTarget = session.rolloutPercent >= input.targetPercent;
  session.state = 'rollout-advanced';
  const step = emit(session, 'ops.rollout_advanced', {
    currentPercent: session.rolloutPercent,
    targetPercent: input.targetPercent,
    increment: input.incrementPercent,
    reachedTarget,
  });
  return { step, currentPercent: session.rolloutPercent, reachedTarget };
}

export function evaluateAb(
  session: OpsSession,
  input: { results: OpsAbResult[]; minSamples: number },
): { step: AxisStep<OpsState>; winner: string | null; delta: number } {
  if (session.state === 'idle') throw new Error('evaluateAb: update registry first');
  if (input.results.length < 2) throw new Error('evaluateAb: need at least 2 variants');
  const filtered = input.results.filter((r) => r.samples >= input.minSamples);
  if (filtered.length < 2) {
    session.state = 'ab-evaluated';
    const step = emit(session, 'ops.ab_evaluated', {
      variantCount: input.results.length,
      qualifiedCount: filtered.length,
      winner: '',
      delta: 0,
    });
    return { step, winner: null, delta: 0 };
  }
  const sorted = [...filtered].sort((a, b) => b.score - a.score);
  const top = sorted[0]!;
  const runner = sorted[1]!;
  const delta = top.score - runner.score;
  session.abWinner = top.variant;
  session.state = 'ab-evaluated';
  const step = emit(session, 'ops.ab_evaluated', {
    variantCount: input.results.length,
    qualifiedCount: filtered.length,
    winner: top.variant,
    delta,
  });
  return { step, winner: top.variant, delta };
}

export function promoteCanary(
  session: OpsSession,
  input: { canaryVersion: string; errorRate: number; threshold: number },
): { step: AxisStep<OpsState>; promoted: boolean } {
  if (session.state === 'idle') throw new Error('promoteCanary: update registry first');
  if (input.errorRate < 0 || input.errorRate > 1)
    throw new Error('promoteCanary: errorRate must be in [0, 1]');
  if (input.threshold < 0 || input.threshold > 1)
    throw new Error('promoteCanary: threshold must be in [0, 1]');
  const promoted = input.errorRate <= input.threshold;
  if (promoted) {
    session.registry = session.registry.map((e) => ({
      ...e,
      active: e.version === input.canaryVersion,
    }));
  }
  session.state = 'canary-promoted';
  const step = emit(session, 'ops.canary_promoted', {
    canaryVersion: input.canaryVersion,
    errorRate: input.errorRate,
    threshold: input.threshold,
    promoted,
  });
  return { step, promoted };
}

export function compareShadow(
  session: OpsSession,
  input: { productionScores: number[]; shadowScores: number[] },
): { step: AxisStep<OpsState>; delta: number; better: boolean } {
  if (session.state === 'idle') throw new Error('compareShadow: update registry first');
  if (input.productionScores.length === 0 || input.shadowScores.length === 0)
    throw new Error('compareShadow: scores must not be empty');
  const prodAvg =
    input.productionScores.reduce((sum, s) => sum + s, 0) /
    input.productionScores.length;
  const shadowAvg =
    input.shadowScores.reduce((sum, s) => sum + s, 0) / input.shadowScores.length;
  const delta = shadowAvg - prodAvg;
  const better = delta > 0;
  session.state = 'shadow-compared';
  const step = emit(session, 'ops.shadow_compared', {
    productionCount: input.productionScores.length,
    shadowCount: input.shadowScores.length,
    prodAvg,
    shadowAvg,
    delta,
    better,
  });
  return { step, delta, better };
}

function emit(
  session: OpsSession,
  neutralEvent: AxisStep<OpsState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<OpsState> {
  const step: AxisStep<OpsState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
