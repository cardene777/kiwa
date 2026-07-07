import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * LLM eval axis — LLM-as-judge + rubric + preference + Elo + human-in-the-loop
 * state machine。 deterministic mock で 4 signal 系統を提供。
 */

export type EvalState =
  | 'idle'
  | 'judged'
  | 'rubric-applied'
  | 'preference-ranked'
  | 'elo-updated';

export interface EvalSession {
  target: AiLlmTarget;
  sessionId: string;
  state: EvalState;
  history: AxisStep<EvalState>[];
  eloRatings: Map<string, number>;
}

export interface JudgeVerdict {
  candidateId: string;
  score: number;
  reasoning: string;
}

export interface RubricCriterion {
  key: string;
  weight: number;
  score: number;
}

export function startEvalSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): EvalSession {
  if (input.sessionId.length === 0) {
    throw new Error('startEvalSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    eloRatings: new Map(),
  };
}

export function judgeCandidates(
  session: EvalSession,
  input: { prompt: string; candidates: Array<{ id: string; text: string; groundTruth?: string }> },
): { step: AxisStep<EvalState>; verdicts: JudgeVerdict[] } {
  if (session.state !== 'idle' && session.state !== 'elo-updated') {
    throw new Error(`judgeCandidates: session is ${session.state}`);
  }
  if (input.candidates.length === 0) {
    throw new Error('judgeCandidates: candidates must not be empty');
  }
  const verdicts: JudgeVerdict[] = input.candidates.map((c) => {
    const promptTokens = tokenize(input.prompt);
    const candTokens = tokenize(c.text);
    const overlap = intersectionScore(promptTokens, candTokens);
    const groundBonus = c.groundTruth ? intersectionScore(tokenize(c.groundTruth), candTokens) : 0;
    const score = Math.min(1, overlap * 0.5 + groundBonus * 0.5);
    return {
      candidateId: c.id,
      score,
      reasoning: `overlap ${overlap.toFixed(2)} + ground ${groundBonus.toFixed(2)}`,
    };
  });
  session.state = 'judged';
  const step = emit(session, 'eval.judge_scored', {
    candidateCount: input.candidates.length,
    topScore: Math.max(...verdicts.map((v) => v.score)),
  });
  return { step, verdicts };
}

export function applyRubric(
  session: EvalSession,
  input: { candidateId: string; criteria: RubricCriterion[] },
): { step: AxisStep<EvalState>; weightedScore: number } {
  if (session.state !== 'judged') {
    throw new Error(`applyRubric: session is ${session.state}, expected judged`);
  }
  if (input.criteria.length === 0) {
    throw new Error('applyRubric: criteria must not be empty');
  }
  const totalWeight = input.criteria.reduce((s, c) => s + c.weight, 0);
  if (totalWeight <= 0) throw new Error('applyRubric: totalWeight must be positive');
  const weighted =
    input.criteria.reduce((s, c) => s + c.weight * c.score, 0) / totalWeight;
  session.state = 'rubric-applied';
  const step = emit(session, 'eval.rubric_applied', {
    candidateId: input.candidateId,
    criteriaCount: input.criteria.length,
    weightedScore: weighted,
  });
  return { step, weightedScore: weighted };
}

export function rankPreference(
  session: EvalSession,
  input: { pairs: Array<{ a: string; b: string; preferred: 'a' | 'b' | 'tie' }> },
): { step: AxisStep<EvalState>; ranking: Array<{ id: string; wins: number; losses: number; ties: number }> } {
  if (session.state !== 'rubric-applied' && session.state !== 'judged') {
    throw new Error(`rankPreference: session is ${session.state}`);
  }
  if (input.pairs.length === 0) {
    throw new Error('rankPreference: pairs must not be empty');
  }
  const stats = new Map<string, { wins: number; losses: number; ties: number }>();
  const bump = (id: string): { wins: number; losses: number; ties: number } => {
    let s = stats.get(id);
    if (!s) {
      s = { wins: 0, losses: 0, ties: 0 };
      stats.set(id, s);
    }
    return s;
  };
  for (const p of input.pairs) {
    const sa = bump(p.a);
    const sb = bump(p.b);
    if (p.preferred === 'a') {
      sa.wins += 1;
      sb.losses += 1;
    } else if (p.preferred === 'b') {
      sb.wins += 1;
      sa.losses += 1;
    } else {
      sa.ties += 1;
      sb.ties += 1;
    }
  }
  const ranking = [...stats.entries()]
    .map(([id, s]) => ({ id, ...s }))
    .sort((x, y) => y.wins - x.wins);
  session.state = 'preference-ranked';
  const step = emit(session, 'eval.preference_ranked', {
    pairCount: input.pairs.length,
    uniqueCandidates: ranking.length,
  });
  return { step, ranking };
}

export function updateElo(
  session: EvalSession,
  input: { winner: string; loser: string; k?: number },
): { step: AxisStep<EvalState>; winnerRating: number; loserRating: number } {
  if (session.state !== 'preference-ranked' && session.state !== 'rubric-applied' && session.state !== 'judged') {
    throw new Error(`updateElo: session is ${session.state}`);
  }
  if (input.winner === input.loser) {
    throw new Error('updateElo: winner and loser must differ');
  }
  const k = input.k ?? 32;
  const rw = session.eloRatings.get(input.winner) ?? 1200;
  const rl = session.eloRatings.get(input.loser) ?? 1200;
  const ew = 1 / (1 + Math.pow(10, (rl - rw) / 400));
  const el = 1 - ew;
  const newW = rw + k * (1 - ew);
  const newL = rl + k * (0 - el);
  session.eloRatings.set(input.winner, newW);
  session.eloRatings.set(input.loser, newL);
  session.state = 'elo-updated';
  const step = emit(session, 'eval.elo_updated', {
    winner: input.winner,
    loser: input.loser,
    k,
    winnerRating: newW,
    loserRating: newL,
  });
  return { step, winnerRating: newW, loserRating: newL };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function intersectionScore(a: string[], b: string[]): number {
  const sa = new Set(a);
  const sb = new Set(b);
  let inter = 0;
  for (const t of sa) if (sb.has(t)) inter += 1;
  const denom = Math.max(sa.size, 1);
  return inter / denom;
}

function emit(
  session: EvalSession,
  neutralEvent: AxisStep<EvalState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<EvalState> {
  const step: AxisStep<EvalState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
