import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type Intent = 'informational' | 'navigational' | 'transactional' | 'commercial';

export type SemanticState =
  | 'idle'
  | 'query-understood'
  | 'intent-classified'
  | 'reranked'
  | 'embedding-cached';

export interface SemanticSession {
  target: SearchTarget;
  sessionId: string;
  rawQuery: string;
  normalizedQuery: string;
  intent: Intent | null;
  rerankModel: string;
  embeddingCache: Map<string, number[]>;
  state: SemanticState;
  history: AxisStep<SemanticState>[];
}

export interface RerankCandidate {
  id: string;
  content: string;
  baseScore: number;
}

export interface RerankedHit {
  id: string;
  crossEncoderScore: number;
  fusedScore: number;
}

export function startSemanticSession(input: {
  target: SearchTarget;
  sessionId: string;
  rerankModel?: string;
}): SemanticSession {
  if (input.sessionId.length === 0) {
    throw new Error('startSemanticSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    rawQuery: '',
    normalizedQuery: '',
    intent: null,
    rerankModel: input.rerankModel ?? 'ms-marco-MiniLM-L-6-v2',
    embeddingCache: new Map(),
    state: 'idle',
    history: [],
  };
}

export function understandQuery(
  session: SemanticSession,
  rawQuery: string,
): AxisStep<SemanticState> {
  if (rawQuery.length === 0) {
    throw new Error('understandQuery: rawQuery must not be empty');
  }
  if (session.state !== 'idle' && session.state !== 'embedding-cached' && session.state !== 'reranked') {
    throw new Error(`understandQuery: unexpected state ${session.state}`);
  }
  session.rawQuery = rawQuery;
  session.normalizedQuery = rawQuery.trim().toLowerCase();
  session.state = 'query-understood';
  return emit(session, 'semantic.query_understood', {
    length: rawQuery.length,
    normalizedLength: session.normalizedQuery.length,
  });
}

export function classifyIntent(session: SemanticSession): AxisStep<SemanticState> {
  if (session.state !== 'query-understood') {
    throw new Error(`classifyIntent: session is ${session.state}, not query-understood`);
  }
  session.intent = detectIntent(session.normalizedQuery);
  session.state = 'intent-classified';
  return emit(session, 'semantic.intent_classified', {
    intent: session.intent,
    query: session.normalizedQuery,
  });
}

export function crossEncoderRerank(
  session: SemanticSession,
  candidates: RerankCandidate[],
): { step: AxisStep<SemanticState>; reranked: RerankedHit[] } {
  if (session.state !== 'intent-classified' && session.state !== 'query-understood') {
    throw new Error(`crossEncoderRerank: session is ${session.state}, need intent-classified or query-understood`);
  }
  if (candidates.length === 0) {
    throw new Error('crossEncoderRerank: candidates must not be empty');
  }
  const reranked: RerankedHit[] = candidates.map((c) => {
    const cross = pseudoCrossEncoderScore(session.normalizedQuery, c.content);
    return {
      id: c.id,
      crossEncoderScore: cross,
      fusedScore: 0.5 * cross + 0.5 * c.baseScore,
    };
  });
  reranked.sort((a, b) => b.fusedScore - a.fusedScore);
  session.state = 'reranked';
  const step = emit(session, 'semantic.cross_encoder_reranked', {
    candidateCount: candidates.length,
    model: session.rerankModel,
    topFused: reranked[0]?.fusedScore ?? 0,
  });
  return { step, reranked };
}

export function cacheEmbedding(
  session: SemanticSession,
  key: string,
  embedding: number[],
): AxisStep<SemanticState> {
  if (key.length === 0) {
    throw new Error('cacheEmbedding: key must not be empty');
  }
  if (embedding.length === 0) {
    throw new Error('cacheEmbedding: embedding must not be empty');
  }
  session.embeddingCache.set(key, [...embedding]);
  session.state = 'embedding-cached';
  return emit(session, 'semantic.embedding_cached', {
    key,
    dim: embedding.length,
    cacheSize: session.embeddingCache.size,
  });
}

function detectIntent(query: string): Intent {
  if (/(buy|price|discount|cheap|order)/.test(query)) return 'transactional';
  if (/(vs|review|compare|best)/.test(query)) return 'commercial';
  if (/(login|homepage|official)/.test(query)) return 'navigational';
  return 'informational';
}

function pseudoCrossEncoderScore(query: string, content: string): number {
  const qTokens = new Set(query.split(/\s+/).filter((t) => t.length > 0));
  const cTokens = new Set(content.toLowerCase().split(/\s+/).filter((t) => t.length > 0));
  if (qTokens.size === 0 || cTokens.size === 0) return 0;
  let overlap = 0;
  for (const t of qTokens) {
    if (cTokens.has(t)) overlap += 1;
  }
  return overlap / Math.max(qTokens.size, cTokens.size);
}

function emit(
  session: SemanticSession,
  neutralEvent: AxisStep<SemanticState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<SemanticState> {
  const step: AxisStep<SemanticState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
