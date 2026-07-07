import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Hallucination detection axis — self-consistency + factuality + citation +
 * confidence + hedging state machine。
 *
 * Deterministic mock で 5 signal 系統。 self-consistency は複数 sample 間の
 * token-overlap 比率、 factuality は claim vs evidence の string match、
 * citation は引用先の存在 check、 confidence / hedging は modal 語彙密度。
 */

export type HallucinationState =
  | 'idle'
  | 'self-consistency-scored'
  | 'factuality-checked'
  | 'citation-verified'
  | 'confidence-scored';

export interface HallucinationSession {
  target: AiLlmTarget;
  sessionId: string;
  state: HallucinationState;
  history: AxisStep<HallucinationState>[];
  scores: {
    selfConsistency?: number;
    factuality?: number;
    citation?: number;
    confidence?: number;
  };
}

export function startHallucinationSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): HallucinationSession {
  if (input.sessionId.length === 0) {
    throw new Error('startHallucinationSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    scores: {},
  };
}

export function scoreSelfConsistency(
  session: HallucinationSession,
  samples: string[],
): { step: AxisStep<HallucinationState>; score: number } {
  if (samples.length < 2) {
    throw new Error('scoreSelfConsistency: need at least 2 samples');
  }
  const tokenSets = samples.map((s) => new Set(tokenize(s)));
  let pairs = 0;
  let sumJaccard = 0;
  for (let i = 0; i < tokenSets.length; i += 1) {
    for (let j = i + 1; j < tokenSets.length; j += 1) {
      const a = tokenSets[i] ?? new Set();
      const b = tokenSets[j] ?? new Set();
      sumJaccard += jaccard(a, b);
      pairs += 1;
    }
  }
  const score = pairs === 0 ? 0 : sumJaccard / pairs;
  session.scores.selfConsistency = score;
  session.state = 'self-consistency-scored';
  const step = emit(session, 'hallucination.self_consistency_scored', {
    sampleCount: samples.length,
    score,
  });
  return { step, score };
}

export function checkFactuality(
  session: HallucinationSession,
  input: { claim: string; evidence: string[] },
): { step: AxisStep<HallucinationState>; score: number; matches: string[] } {
  if (session.state === 'idle') {
    throw new Error('checkFactuality: run self-consistency first');
  }
  if (input.evidence.length === 0) {
    throw new Error('checkFactuality: evidence must not be empty');
  }
  const claimTokens = new Set(tokenize(input.claim));
  const matches: string[] = [];
  let hits = 0;
  for (const ev of input.evidence) {
    const evTokens = new Set(tokenize(ev));
    const intersect = intersectSize(claimTokens, evTokens);
    if (intersect >= Math.max(2, Math.floor(claimTokens.size * 0.3))) {
      matches.push(ev);
      hits += 1;
    }
  }
  const score = hits / input.evidence.length;
  session.scores.factuality = score;
  session.state = 'factuality-checked';
  const step = emit(session, 'hallucination.factuality_checked', {
    evidenceCount: input.evidence.length,
    matchCount: hits,
    score,
  });
  return { step, score, matches };
}

export function verifyCitation(
  session: HallucinationSession,
  input: { citations: string[]; corpus: string[] },
): { step: AxisStep<HallucinationState>; score: number; missing: string[] } {
  if (session.state !== 'factuality-checked' && session.state !== 'self-consistency-scored') {
    throw new Error(`verifyCitation: session is ${session.state}`);
  }
  if (input.citations.length === 0) {
    throw new Error('verifyCitation: citations must not be empty');
  }
  const corpusSet = new Set(input.corpus);
  const missing: string[] = [];
  let verified = 0;
  for (const cit of input.citations) {
    if (corpusSet.has(cit)) verified += 1;
    else missing.push(cit);
  }
  const score = verified / input.citations.length;
  session.scores.citation = score;
  session.state = 'citation-verified';
  const step = emit(session, 'hallucination.citation_verified', {
    citationCount: input.citations.length,
    verifiedCount: verified,
    score,
  });
  return { step, score, missing };
}

export function scoreConfidence(
  session: HallucinationSession,
  text: string,
): { step: AxisStep<HallucinationState>; score: number; hedgingRatio: number } {
  if (session.state === 'idle') {
    throw new Error('scoreConfidence: run other checks first');
  }
  const tokens = tokenize(text);
  const hedgingWords = new Set(['maybe', 'might', 'perhaps', 'possibly', 'could', 'may', 'seems', 'appears', 'likely']);
  const hedgeCount = tokens.filter((t) => hedgingWords.has(t)).length;
  const hedgingRatio = tokens.length === 0 ? 0 : hedgeCount / tokens.length;
  const score = Math.max(0, 1 - hedgingRatio * 5);
  session.scores.confidence = score;
  session.state = 'confidence-scored';
  const step = emit(session, 'hallucination.confidence_scored', {
    tokenCount: tokens.length,
    hedgeCount,
    hedgingRatio,
    score,
  });
  return { step, score, hedgingRatio };
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const uni = a.size + b.size - inter;
  return uni === 0 ? 0 : inter / uni;
}

function intersectSize(a: Set<string>, b: Set<string>): number {
  let n = 0;
  for (const t of a) if (b.has(t)) n += 1;
  return n;
}

function emit(
  session: HallucinationSession,
  neutralEvent: AxisStep<HallucinationState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<HallucinationState> {
  const step: AxisStep<HallucinationState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
