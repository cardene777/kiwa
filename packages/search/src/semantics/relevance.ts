import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type RelevanceState =
  | 'idle'
  | 'bm25-scored'
  | 'tfidf-scored'
  | 'custom-ranked'
  | 'ab-variant-selected';

export interface RelevanceDocument {
  id: string;
  content: string;
  boostSignal?: number;
}

export interface RelevanceSession {
  target: SearchTarget;
  indexId: string;
  documents: RelevanceDocument[];
  bm25K1: number;
  bm25B: number;
  state: RelevanceState;
  history: AxisStep<RelevanceState>[];
}

export interface ScoredHit {
  id: string;
  score: number;
}

export function startRelevanceSession(input: {
  target: SearchTarget;
  indexId: string;
  bm25K1?: number;
  bm25B?: number;
}): RelevanceSession {
  if (input.indexId.length === 0) {
    throw new Error('startRelevanceSession: indexId must not be empty');
  }
  if (input.bm25K1 !== undefined && input.bm25K1 <= 0) {
    throw new Error('startRelevanceSession: bm25K1 must be positive');
  }
  if (input.bm25B !== undefined && (input.bm25B < 0 || input.bm25B > 1)) {
    throw new Error('startRelevanceSession: bm25B must be within 0..1');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    documents: [],
    bm25K1: input.bm25K1 ?? 1.2,
    bm25B: input.bm25B ?? 0.75,
    state: 'idle',
    history: [],
  };
}

export function seedRelevanceDocuments(
  session: RelevanceSession,
  docs: RelevanceDocument[],
): void {
  for (const d of docs) session.documents.push({ ...d });
}

export function scoreBm25(
  session: RelevanceSession,
  query: string,
): { step: AxisStep<RelevanceState>; hits: ScoredHit[] } {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    throw new Error('scoreBm25: query must contain at least one token');
  }
  const totalDocs = session.documents.length;
  if (totalDocs === 0) {
    throw new Error('scoreBm25: no documents seeded');
  }
  const df = new Map<string, number>();
  for (const doc of session.documents) {
    const docTokens = new Set(tokenize(doc.content));
    for (const t of docTokens) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const totalLen = session.documents.reduce((s, d) => s + tokenize(d.content).length, 0);
  const avgDocLen = totalLen / totalDocs;
  const hits: ScoredHit[] = session.documents.map((doc) => {
    const docTokens = tokenize(doc.content);
    const docLen = docTokens.length;
    let score = 0;
    for (const q of tokens) {
      const tf = docTokens.filter((t) => t === q).length;
      const dfq = df.get(q) ?? 0;
      if (tf === 0 || dfq === 0) continue;
      const idf = Math.log(1 + (totalDocs - dfq + 0.5) / (dfq + 0.5));
      const norm = 1 - session.bm25B + (session.bm25B * docLen) / (avgDocLen === 0 ? 1 : avgDocLen);
      score += idf * ((tf * (session.bm25K1 + 1)) / (tf + session.bm25K1 * norm));
    }
    return { id: doc.id, score };
  });
  hits.sort((a, b) => b.score - a.score);
  session.state = 'bm25-scored';
  const step = emit(session, 'relevance.bm25_scored', {
    query,
    tokenCount: tokens.length,
    k1: session.bm25K1,
    b: session.bm25B,
    hitCount: hits.length,
  });
  return { step, hits };
}

export function scoreTfIdf(
  session: RelevanceSession,
  query: string,
): { step: AxisStep<RelevanceState>; hits: ScoredHit[] } {
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    throw new Error('scoreTfIdf: query must contain at least one token');
  }
  const totalDocs = session.documents.length;
  if (totalDocs === 0) {
    throw new Error('scoreTfIdf: no documents seeded');
  }
  const df = new Map<string, number>();
  for (const doc of session.documents) {
    const docTokens = new Set(tokenize(doc.content));
    for (const t of docTokens) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const hits: ScoredHit[] = session.documents.map((doc) => {
    const docTokens = tokenize(doc.content);
    const docLen = docTokens.length || 1;
    let score = 0;
    for (const q of tokens) {
      const tf = docTokens.filter((t) => t === q).length / docLen;
      const dfq = df.get(q) ?? 0;
      if (tf === 0 || dfq === 0) continue;
      const idf = Math.log(totalDocs / dfq);
      score += tf * idf;
    }
    return { id: doc.id, score };
  });
  hits.sort((a, b) => b.score - a.score);
  session.state = 'tfidf-scored';
  const step = emit(session, 'relevance.tfidf_scored', {
    query,
    hitCount: hits.length,
  });
  return { step, hits };
}

export function applyCustomRanking(
  session: RelevanceSession,
  hits: ScoredHit[],
  input: { boostFn: (doc: RelevanceDocument) => number },
): { step: AxisStep<RelevanceState>; ranked: ScoredHit[] } {
  const docsById = new Map(session.documents.map((d) => [d.id, d]));
  const ranked = hits
    .map((h) => {
      const doc = docsById.get(h.id);
      const boost = doc ? input.boostFn(doc) : 1;
      return { id: h.id, score: h.score * boost };
    })
    .sort((a, b) => b.score - a.score);
  session.state = 'custom-ranked';
  const step = emit(session, 'relevance.custom_ranking_applied', {
    hitCount: ranked.length,
    topScore: ranked[0]?.score ?? 0,
  });
  return { step, ranked };
}

export function selectAbVariant(
  session: RelevanceSession,
  input: { variants: string[]; userId: string; salt?: string },
): { step: AxisStep<RelevanceState>; variant: string } {
  if (input.variants.length === 0) {
    throw new Error('selectAbVariant: variants must not be empty');
  }
  if (input.userId.length === 0) {
    throw new Error('selectAbVariant: userId must not be empty');
  }
  const key = `${input.salt ?? session.indexId}:${input.userId}`;
  const hash = simpleHash(key);
  const index = hash % input.variants.length;
  const variant = input.variants[index] ?? input.variants[0] ?? '';
  session.state = 'ab-variant-selected';
  const step = emit(session, 'relevance.ab_variant_selected', {
    variant,
    variantCount: input.variants.length,
    userId: input.userId,
  });
  return { step, variant };
}

function tokenize(input: string): string[] {
  return input
    .toLowerCase()
    .split(/[\s\-_.,;:!?()"']+/)
    .filter((t) => t.length > 0);
}

function simpleHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function emit(
  session: RelevanceSession,
  neutralEvent: AxisStep<RelevanceState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<RelevanceState> {
  const step: AxisStep<RelevanceState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
