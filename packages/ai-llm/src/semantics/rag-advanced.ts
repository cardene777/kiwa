import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * RAG advanced axis — chunking + hybrid retrieval + reranking + citation +
 * context compression state machine。 deterministic mock で 5 signal 系統。
 */

export type RagState =
  | 'idle'
  | 'chunked'
  | 'hybrid-retrieved'
  | 'reranked'
  | 'compressed';

export interface RagSession {
  target: AiLlmTarget;
  sessionId: string;
  state: RagState;
  history: AxisStep<RagState>[];
  chunks: Array<{ id: string; text: string }>;
}

export interface RetrievalHit {
  id: string;
  text: string;
  score: number;
  source: 'dense' | 'sparse';
}

export interface RerankedHit extends RetrievalHit {
  rerankScore: number;
}

export function startRagSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): RagSession {
  if (input.sessionId.length === 0) {
    throw new Error('startRagSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    chunks: [],
  };
}

export function chunkDocument(
  session: RagSession,
  input: { doc: string; chunkSize: number; overlap: number },
): { step: AxisStep<RagState>; chunks: Array<{ id: string; text: string }> } {
  if (session.state !== 'idle' && session.state !== 'compressed') {
    throw new Error(`chunkDocument: session is ${session.state}`);
  }
  if (input.chunkSize <= 0) throw new Error('chunkDocument: chunkSize must be positive');
  if (input.overlap < 0 || input.overlap >= input.chunkSize) {
    throw new Error('chunkDocument: overlap must be in [0, chunkSize)');
  }
  const chunks: Array<{ id: string; text: string }> = [];
  let idx = 0;
  const stride = input.chunkSize - input.overlap;
  for (let i = 0; i < input.doc.length; i += stride) {
    const text = input.doc.slice(i, i + input.chunkSize);
    if (text.length === 0) break;
    chunks.push({ id: `chunk-${idx}`, text });
    idx += 1;
  }
  session.chunks = chunks;
  session.state = 'chunked';
  const step = emit(session, 'rag.chunked', {
    chunkCount: chunks.length,
    chunkSize: input.chunkSize,
    overlap: input.overlap,
  });
  return { step, chunks };
}

export function hybridRetrieve(
  session: RagSession,
  input: { query: string; denseWeight: number; sparseWeight: number; topK: number },
): { step: AxisStep<RagState>; hits: RetrievalHit[] } {
  if (session.state !== 'chunked') {
    throw new Error(`hybridRetrieve: session is ${session.state}, expected chunked`);
  }
  if (input.topK <= 0) throw new Error('hybridRetrieve: topK must be positive');
  const queryTokens = tokenize(input.query);
  const scored: RetrievalHit[] = [];
  for (const c of session.chunks) {
    const cTokens = tokenize(c.text);
    const sparse = jaccard(new Set(queryTokens), new Set(cTokens));
    const dense = pseudoDense(queryTokens, cTokens);
    const combined = sparse * input.sparseWeight + dense * input.denseWeight;
    scored.push({
      id: c.id,
      text: c.text,
      score: combined,
      source: dense > sparse ? 'dense' : 'sparse',
    });
  }
  const hits = scored.sort((a, b) => b.score - a.score).slice(0, input.topK);
  session.state = 'hybrid-retrieved';
  const step = emit(session, 'rag.hybrid_retrieved', {
    hitCount: hits.length,
    denseWeight: input.denseWeight,
    sparseWeight: input.sparseWeight,
    topScore: hits[0]?.score ?? 0,
  });
  return { step, hits };
}

export function rerank(
  session: RagSession,
  input: { query: string; hits: RetrievalHit[] },
): { step: AxisStep<RagState>; reranked: RerankedHit[] } {
  if (session.state !== 'hybrid-retrieved') {
    throw new Error(`rerank: session is ${session.state}, expected hybrid-retrieved`);
  }
  if (input.hits.length === 0) throw new Error('rerank: hits must not be empty');
  const qLen = tokenize(input.query).length;
  const reranked: RerankedHit[] = input.hits.map((h, i) => {
    const proximity = 1 / (1 + i);
    const lengthMatch = 1 - Math.abs(tokenize(h.text).length - qLen) / Math.max(qLen, 1);
    const rerankScore = h.score * 0.5 + proximity * 0.3 + Math.max(0, lengthMatch) * 0.2;
    return { ...h, rerankScore };
  });
  reranked.sort((a, b) => b.rerankScore - a.rerankScore);
  session.state = 'reranked';
  const step = emit(session, 'rag.reranked', {
    hitCount: reranked.length,
    topRerankScore: reranked[0]?.rerankScore ?? 0,
  });
  return { step, reranked };
}

export function compressContext(
  session: RagSession,
  input: { hits: RerankedHit[]; maxTokens: number },
): { step: AxisStep<RagState>; compressed: string; keptCount: number; totalTokens: number } {
  if (session.state !== 'reranked') {
    throw new Error(`compressContext: session is ${session.state}, expected reranked`);
  }
  if (input.maxTokens <= 0) throw new Error('compressContext: maxTokens must be positive');
  let running = 0;
  const kept: string[] = [];
  for (const h of input.hits) {
    const cost = tokenize(h.text).length;
    if (running + cost > input.maxTokens) break;
    kept.push(h.text);
    running += cost;
  }
  const compressed = kept.join('\n\n');
  session.state = 'compressed';
  const step = emit(session, 'rag.compressed', {
    keptCount: kept.length,
    totalTokens: running,
    maxTokens: input.maxTokens,
  });
  return { step, compressed, keptCount: kept.length, totalTokens: running };
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

function pseudoDense(query: string[], doc: string[]): number {
  // Deterministic "embedding" — average char code overlap % across shared tokens.
  const qSet = new Set(query);
  const dSet = new Set(doc);
  let shared = 0;
  let overlap = 0;
  for (const t of qSet) {
    if (dSet.has(t)) {
      shared += 1;
      overlap += Math.min(1, t.length / 8);
    }
  }
  return qSet.size === 0 ? 0 : (shared / qSet.size) * (overlap / Math.max(shared, 1));
}

function emit(
  session: RagSession,
  neutralEvent: AxisStep<RagState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<RagState> {
  const step: AxisStep<RagState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
