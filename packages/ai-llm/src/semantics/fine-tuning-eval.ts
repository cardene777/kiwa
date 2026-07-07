import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Fine-tuning eval axis — SFT/DPO + catastrophic forgetting + benchmark drift
 * state machine。 deterministic mock で 4 signal 系統。
 */

export type FtState =
  | 'idle'
  | 'sft-evaluated'
  | 'dpo-evaluated'
  | 'forgetting-detected'
  | 'drift-detected';

export interface FtSession {
  target: AiLlmTarget;
  sessionId: string;
  state: FtState;
  history: AxisStep<FtState>[];
  baselineBenchmarks: Map<string, number>;
}

export interface SftSample {
  prompt: string;
  gold: string;
  candidate: string;
}

export interface DpoSample {
  prompt: string;
  chosen: string;
  rejected: string;
  chosenLogp: number;
  rejectedLogp: number;
}

export interface BenchmarkResult {
  name: string;
  score: number;
}

export function startFtSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): FtSession {
  if (input.sessionId.length === 0) {
    throw new Error('startFtSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    baselineBenchmarks: new Map(),
  };
}

export function evaluateSft(
  session: FtSession,
  samples: SftSample[],
): { step: AxisStep<FtState>; averageF1: number; exactMatchRate: number } {
  if (samples.length === 0) throw new Error('evaluateSft: samples must not be empty');
  let f1Sum = 0;
  let exactHits = 0;
  for (const s of samples) {
    const goldTokens = new Set(tokenize(s.gold));
    const candTokens = new Set(tokenize(s.candidate));
    let inter = 0;
    for (const t of candTokens) if (goldTokens.has(t)) inter += 1;
    const precision = candTokens.size === 0 ? 0 : inter / candTokens.size;
    const recall = goldTokens.size === 0 ? 0 : inter / goldTokens.size;
    const f1 = precision + recall === 0 ? 0 : (2 * precision * recall) / (precision + recall);
    f1Sum += f1;
    if (s.gold.trim() === s.candidate.trim()) exactHits += 1;
  }
  const averageF1 = f1Sum / samples.length;
  const exactMatchRate = exactHits / samples.length;
  session.state = 'sft-evaluated';
  const step = emit(session, 'ft.sft_evaluated', {
    sampleCount: samples.length,
    averageF1,
    exactMatchRate,
  });
  return { step, averageF1, exactMatchRate };
}

export function evaluateDpo(
  session: FtSession,
  samples: DpoSample[],
): { step: AxisStep<FtState>; averageMargin: number; preferenceAccuracy: number } {
  if (samples.length === 0) throw new Error('evaluateDpo: samples must not be empty');
  if (session.state !== 'sft-evaluated' && session.state !== 'idle') {
    throw new Error(`evaluateDpo: session is ${session.state}`);
  }
  let marginSum = 0;
  let correct = 0;
  for (const s of samples) {
    const margin = s.chosenLogp - s.rejectedLogp;
    marginSum += margin;
    if (margin > 0) correct += 1;
  }
  const averageMargin = marginSum / samples.length;
  const preferenceAccuracy = correct / samples.length;
  session.state = 'dpo-evaluated';
  const step = emit(session, 'ft.dpo_evaluated', {
    sampleCount: samples.length,
    averageMargin,
    preferenceAccuracy,
  });
  return { step, averageMargin, preferenceAccuracy };
}

export function detectCatastrophicForgetting(
  session: FtSession,
  input: { baseline: BenchmarkResult[]; postFineTune: BenchmarkResult[]; threshold?: number },
): {
  step: AxisStep<FtState>;
  forgotten: Array<{ name: string; drop: number }>;
  averageDrop: number;
} {
  if (session.state === 'idle') {
    throw new Error('detectCatastrophicForgetting: run sft/dpo eval first');
  }
  if (input.baseline.length !== input.postFineTune.length) {
    throw new Error('detectCatastrophicForgetting: baseline / post length mismatch');
  }
  const threshold = input.threshold ?? 0.05;
  const forgotten: Array<{ name: string; drop: number }> = [];
  let dropSum = 0;
  for (let i = 0; i < input.baseline.length; i += 1) {
    const b = input.baseline[i];
    const p = input.postFineTune[i];
    if (!b || !p) continue;
    session.baselineBenchmarks.set(b.name, b.score);
    const drop = b.score - p.score;
    dropSum += drop;
    if (drop >= threshold) forgotten.push({ name: b.name, drop });
  }
  const averageDrop = dropSum / input.baseline.length;
  session.state = 'forgetting-detected';
  const step = emit(session, 'ft.catastrophic_forgetting_detected', {
    forgottenCount: forgotten.length,
    averageDrop,
    threshold,
  });
  return { step, forgotten, averageDrop };
}

export function detectBenchmarkDrift(
  session: FtSession,
  input: { current: BenchmarkResult[]; driftThreshold?: number },
): { step: AxisStep<FtState>; drifted: Array<{ name: string; delta: number }> } {
  if (session.state !== 'forgetting-detected' && session.state !== 'dpo-evaluated' && session.state !== 'sft-evaluated') {
    throw new Error(`detectBenchmarkDrift: session is ${session.state}`);
  }
  if (session.baselineBenchmarks.size === 0) {
    throw new Error(
      'detectBenchmarkDrift: baselineBenchmarks empty — run detectCatastrophicForgetting first to seed baseline',
    );
  }
  const threshold = input.driftThreshold ?? 0.03;
  const drifted: Array<{ name: string; delta: number }> = [];
  for (const c of input.current) {
    const baseline = session.baselineBenchmarks.get(c.name);
    if (baseline === undefined) continue;
    const delta = Math.abs(baseline - c.score);
    if (delta >= threshold) drifted.push({ name: c.name, delta });
  }
  session.state = 'drift-detected';
  const step = emit(session, 'ft.benchmark_drift_detected', {
    checkedCount: input.current.length,
    driftedCount: drifted.length,
    threshold,
  });
  return { step, drifted };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function emit(
  session: FtSession,
  neutralEvent: AxisStep<FtState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<FtState> {
  const step: AxisStep<FtState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
