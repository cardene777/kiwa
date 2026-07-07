import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Fine-tuning pipeline axis — dataset prep + RLHF/DPO + eval loop + drift
 * detection state machine。
 *
 * Deterministic mock で 4 signal 系統。 dataset prep is dedup + shuffle by
 * hash、 RLHF stepping is reward gradient sign + policy update、 eval loop
 * accumulates score history、 drift detection compares latest eval vs
 * baseline via absolute threshold。
 */

export type FtpState =
  | 'idle'
  | 'dataset-prepared'
  | 'rlhf-stepped'
  | 'eval-loop-ran'
  | 'drift-detected';

export interface FtpSample {
  prompt: string;
  chosen: string;
  rejected: string;
}

export interface FtpRlhfStep {
  step: number;
  reward: number;
  policyDelta: number;
}

export interface FtpEvalRecord {
  epoch: number;
  score: number;
}

export interface FtpSession {
  target: AiLlmTarget;
  sessionId: string;
  state: FtpState;
  history: AxisStep<FtpState>[];
  dataset: FtpSample[];
  rlhfSteps: FtpRlhfStep[];
  evalHistory: FtpEvalRecord[];
  baselineScore: number | null;
}

export function startFtpSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): FtpSession {
  if (input.sessionId.length === 0) {
    throw new Error('startFtpSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    dataset: [],
    rlhfSteps: [],
    evalHistory: [],
    baselineScore: null,
  };
}

export function prepareDataset(
  session: FtpSession,
  input: { samples: FtpSample[]; dedupe: boolean },
): { step: AxisStep<FtpState>; sampleCount: number; deduped: number } {
  if (input.samples.length === 0) throw new Error('prepareDataset: samples must not be empty');
  let deduped = 0;
  let final: FtpSample[] = input.samples;
  if (input.dedupe) {
    const seen = new Set<string>();
    final = [];
    for (const s of input.samples) {
      const key = `${s.prompt}|${s.chosen}|${s.rejected}`;
      if (seen.has(key)) {
        deduped += 1;
      } else {
        seen.add(key);
        final.push(s);
      }
    }
  }
  session.dataset = final;
  session.state = 'dataset-prepared';
  const step = emit(session, 'ftp.dataset_prepared', {
    inputCount: input.samples.length,
    sampleCount: final.length,
    deduped,
    dedupeMode: input.dedupe,
  });
  return { step, sampleCount: final.length, deduped };
}

export function stepRlhf(
  session: FtpSession,
  input: { rewards: number[]; learningRate: number },
): { step: AxisStep<FtpState>; totalStep: FtpRlhfStep } {
  if (session.state === 'idle') throw new Error('stepRlhf: prepare dataset first');
  if (input.rewards.length === 0) throw new Error('stepRlhf: rewards must not be empty');
  if (input.learningRate <= 0)
    throw new Error('stepRlhf: learningRate must be positive');
  const avgReward =
    input.rewards.reduce((sum, r) => sum + r, 0) / input.rewards.length;
  const policyDelta = input.learningRate * avgReward;
  const stepIdx = session.rlhfSteps.length + 1;
  const rlhfStep: FtpRlhfStep = { step: stepIdx, reward: avgReward, policyDelta };
  session.rlhfSteps.push(rlhfStep);
  session.state = 'rlhf-stepped';
  const step = emit(session, 'ftp.rlhf_stepped', {
    step: stepIdx,
    reward: avgReward,
    policyDelta,
    batchSize: input.rewards.length,
  });
  return { step, totalStep: rlhfStep };
}

export function runEvalLoop(
  session: FtpSession,
  input: { epochScores: number[] },
): { step: AxisStep<FtpState>; bestScore: number; averageScore: number } {
  if (session.state === 'idle') throw new Error('runEvalLoop: prepare dataset first');
  if (input.epochScores.length === 0)
    throw new Error('runEvalLoop: epochScores must not be empty');
  const startEpoch = session.evalHistory.length;
  for (let i = 0; i < input.epochScores.length; i += 1) {
    const score = input.epochScores[i] ?? 0;
    session.evalHistory.push({ epoch: startEpoch + i + 1, score });
  }
  if (session.baselineScore === null) {
    session.baselineScore = input.epochScores[0] ?? 0;
  }
  const bestScore = Math.max(...session.evalHistory.map((e) => e.score));
  const averageScore =
    session.evalHistory.reduce((sum, e) => sum + e.score, 0) / session.evalHistory.length;
  session.state = 'eval-loop-ran';
  const step = emit(session, 'ftp.eval_loop_ran', {
    addedEpochs: input.epochScores.length,
    totalEpochs: session.evalHistory.length,
    bestScore,
    averageScore,
  });
  return { step, bestScore, averageScore };
}

export function detectDrift(
  session: FtpSession,
  input: { threshold: number },
): { step: AxisStep<FtpState>; drifted: boolean; delta: number } {
  if (session.state === 'idle') throw new Error('detectDrift: prepare dataset first');
  if (session.baselineScore === null || session.evalHistory.length === 0)
    throw new Error('detectDrift: run eval loop first');
  if (input.threshold < 0) throw new Error('detectDrift: threshold must be non-negative');
  const latest = session.evalHistory[session.evalHistory.length - 1]?.score ?? 0;
  const delta = latest - session.baselineScore;
  const drifted = Math.abs(delta) >= input.threshold;
  session.state = 'drift-detected';
  const step = emit(session, 'ftp.drift_detected', {
    baseline: session.baselineScore,
    latest,
    delta,
    threshold: input.threshold,
    drifted,
  });
  return { step, drifted, delta };
}

function emit(
  session: FtpSession,
  neutralEvent: AxisStep<FtpState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<FtpState> {
  const step: AxisStep<FtpState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
