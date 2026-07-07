import { providerEventName, type AxisStep, type SearchTarget } from './types.js';

export type VectorAlgo = 'hnsw' | 'ivf' | 'flat';

export type VectorState =
  | 'idle'
  | 'index-built'
  | 'knn-queried'
  | 'hybrid-fused'
  | 'ann-recalled';

export interface VectorSession {
  target: SearchTarget;
  indexId: string;
  dimensions: number;
  algo: VectorAlgo;
  vectors: Map<string, number[]>;
  state: VectorState;
  history: AxisStep<VectorState>[];
}

export interface KnnHit {
  id: string;
  score: number;
}

export function startVectorSession(input: {
  target: SearchTarget;
  indexId: string;
  dimensions: number;
  algo?: VectorAlgo;
}): VectorSession {
  if (input.indexId.length === 0) {
    throw new Error('startVectorSession: indexId must not be empty');
  }
  if (input.dimensions <= 0) {
    throw new Error('startVectorSession: dimensions must be positive');
  }
  return {
    target: input.target,
    indexId: input.indexId,
    dimensions: input.dimensions,
    algo: input.algo ?? 'hnsw',
    vectors: new Map(),
    state: 'idle',
    history: [],
  };
}

export function buildVectorIndex(
  session: VectorSession,
  vectors: Array<{ id: string; vector: number[] }>,
): AxisStep<VectorState> {
  if (session.state !== 'idle' && session.state !== 'ann-recalled') {
    throw new Error(`buildVectorIndex: session is ${session.state}, cannot rebuild`);
  }
  for (const entry of vectors) {
    if (entry.vector.length !== session.dimensions) {
      throw new Error(
        `buildVectorIndex: vector dim ${entry.vector.length} != index dim ${session.dimensions}`,
      );
    }
    session.vectors.set(entry.id, [...entry.vector]);
  }
  session.state = 'index-built';
  return emit(session, 'vector.index_built', {
    algo: session.algo,
    dim: session.dimensions,
    count: session.vectors.size,
  });
}

export function queryKnn(
  session: VectorSession,
  query: number[],
  k: number,
): { step: AxisStep<VectorState>; hits: KnnHit[] } {
  if (session.state === 'idle') {
    throw new Error('queryKnn: index must be built first');
  }
  if (query.length !== session.dimensions) {
    throw new Error(`queryKnn: query dim ${query.length} != index dim ${session.dimensions}`);
  }
  if (k <= 0) {
    throw new Error('queryKnn: k must be positive');
  }
  const scored: KnnHit[] = [];
  for (const [id, vec] of session.vectors) {
    scored.push({ id, score: cosineSimilarity(query, vec) });
  }
  scored.sort((a, b) => b.score - a.score);
  const hits = scored.slice(0, k);
  session.state = 'knn-queried';
  const step = emit(session, 'vector.knn_queried', {
    k,
    hitCount: hits.length,
    topScore: hits[0]?.score ?? 0,
  });
  return { step, hits };
}

export function fuseHybrid(
  session: VectorSession,
  input: {
    vectorHits: KnnHit[];
    keywordHits: KnnHit[];
    vectorWeight: number;
    keywordWeight: number;
  },
): { step: AxisStep<VectorState>; fused: KnnHit[] } {
  if (session.state !== 'knn-queried') {
    throw new Error(`fuseHybrid: session is ${session.state}, not knn-queried`);
  }
  if (input.vectorWeight < 0 || input.keywordWeight < 0) {
    throw new Error('fuseHybrid: weights must be non-negative');
  }
  const combined = new Map<string, number>();
  for (const hit of input.vectorHits) {
    combined.set(hit.id, (combined.get(hit.id) ?? 0) + hit.score * input.vectorWeight);
  }
  for (const hit of input.keywordHits) {
    combined.set(hit.id, (combined.get(hit.id) ?? 0) + hit.score * input.keywordWeight);
  }
  const fused = [...combined.entries()]
    .map(([id, score]) => ({ id, score }))
    .sort((a, b) => b.score - a.score);
  session.state = 'hybrid-fused';
  const step = emit(session, 'vector.hybrid_fused', {
    vectorWeight: input.vectorWeight,
    keywordWeight: input.keywordWeight,
    fusedCount: fused.length,
  });
  return { step, fused };
}

export function recallAnn(
  session: VectorSession,
  input: { groundTruth: string[]; retrieved: string[] },
): { step: AxisStep<VectorState>; recall: number } {
  if (session.state !== 'hybrid-fused' && session.state !== 'knn-queried') {
    throw new Error(`recallAnn: session is ${session.state}, expected knn-queried or hybrid-fused`);
  }
  if (input.groundTruth.length === 0) {
    throw new Error('recallAnn: groundTruth must not be empty');
  }
  const truthSet = new Set(input.groundTruth);
  const matched = input.retrieved.filter((id) => truthSet.has(id)).length;
  const recall = matched / input.groundTruth.length;
  session.state = 'ann-recalled';
  const step = emit(session, 'vector.ann_recalled', {
    recall,
    groundTruthSize: input.groundTruth.length,
    retrievedSize: input.retrieved.length,
  });
  return { step, recall };
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let magA = 0;
  let magB = 0;
  for (let i = 0; i < a.length; i += 1) {
    const av = a[i] ?? 0;
    const bv = b[i] ?? 0;
    dot += av * bv;
    magA += av * av;
    magB += bv * bv;
  }
  if (magA === 0 || magB === 0) return 0;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

function emit(
  session: VectorSession,
  neutralEvent: AxisStep<VectorState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<VectorState> {
  const step: AxisStep<VectorState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, indexId: session.indexId, ...metadata },
  };
  session.history.push(step);
  return step;
}
