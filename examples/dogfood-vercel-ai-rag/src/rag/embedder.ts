/**
 * Embedding interface + deterministic mock + real OpenAI embeddings HTTP
 * client. The embedder is provider-neutral so real and mock adapters share
 * the same downstream code path — a bag-of-words hashing embedder is used in
 * mock mode because it is deterministic, fast, and preserves the property
 * that similar text produces similar vectors (which is all the retrieval
 * fidelity harness needs to verify).
 */

export interface Embedder {
  readonly dimension: number;
  embed(texts: string[]): Promise<number[][]>;
}

/**
 * Deterministic hashing embedder — buckets tokens into `dimension` slots via
 * a stable string hash, then normalises to unit length so cosine similarity
 * matches Jaccard-ish semantics. Two texts sharing tokens end up with high
 * cosine similarity, disjoint texts end up near zero — enough for retrieval
 * ordering to be stable and easy to reason about in tests.
 */
export function createHashingEmbedder(dimension = 128): Embedder {
  return {
    dimension,
    async embed(texts) {
      return texts.map((text) => embedOne(text, dimension));
    },
  };
}

function embedOne(text: string, dimension: number): number[] {
  const vec = new Array<number>(dimension).fill(0);
  for (const token of tokenize(text)) {
    const idx = stableHash(token) % dimension;
    vec[idx] = (vec[idx] ?? 0) + 1;
  }
  // L2 normalise so cosine similarity == dot product downstream.
  let norm = 0;
  for (const v of vec) norm += v * v;
  norm = Math.sqrt(norm);
  if (norm === 0) return vec;
  return vec.map((v) => v / norm);
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 0);
}

// Stable string hash — 32-bit FNV-1a. Deterministic across Node versions so
// real vs mock reproduce identical bucket assignments.
function stableHash(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h >>> 0;
}

/** Cosine similarity for two unit-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) throw new Error(`vector dim mismatch: ${a.length} vs ${b.length}`);
  let dot = 0;
  for (let i = 0; i < a.length; i += 1) dot += (a[i] ?? 0) * (b[i] ?? 0);
  // Guard against slight drift from L2 normalisation floating-point errors.
  return Math.max(-1, Math.min(1, dot));
}

/**
 * Real OpenAI embeddings HTTP client. Uses fetch directly against
 * `/v1/embeddings` so the SDK is not pulled into the workspace root. Returns
 * the raw embedding vectors plus token usage so the fidelity harness can
 * roll cost / latency samples.
 */
export interface RealEmbedderEnv {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export function createRealOpenAIEmbedder(env: RealEmbedderEnv): Embedder & {
  lastUsage: () => { promptTokens: number; totalTokens: number };
  lastLatencyMs: () => number;
} {
  // OpenAI text-embedding-3-small returns 1536-dim vectors.
  const DIM = 1536;
  let lastPrompt = 0;
  let lastTotal = 0;
  let lastLatency = 0;
  return {
    dimension: DIM,
    async embed(texts) {
      const start = performance.now();
      const res = await fetch(`${env.baseUrl}/v1/embeddings`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.apiKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ input: texts, model: env.model }),
      });
      lastLatency = performance.now() - start;
      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`OpenAI embeddings failed ${res.status}: ${errText}`);
      }
      const body = (await res.json()) as {
        data: Array<{ embedding: number[]; index: number }>;
        usage: { prompt_tokens: number; total_tokens: number };
      };
      lastPrompt = body.usage.prompt_tokens;
      lastTotal = body.usage.total_tokens;
      const sorted = body.data.slice().sort((a, b) => a.index - b.index);
      return sorted.map((d) => d.embedding);
    },
    lastUsage: () => ({ promptTokens: lastPrompt, totalTokens: lastTotal }),
    lastLatencyMs: () => lastLatency,
  };
}
