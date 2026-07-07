import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Cost optimization axis — batch API + prompt compression + model cascade +
 * semantic cache state machine。
 *
 * Deterministic mock で 4 signal 系統。 batch submit is size + estimate、
 * prompt compression is char delta、 model cascade is threshold + tier、
 * semantic cache is hash lookup。
 */

export type CoState =
  | 'idle'
  | 'batch-submitted'
  | 'prompt-compressed'
  | 'cascade-stepped'
  | 'semantic-cached';

export interface CoSession {
  target: AiLlmTarget;
  sessionId: string;
  state: CoState;
  history: AxisStep<CoState>[];
  cache: Map<string, string>;
}

export function startCoSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): CoSession {
  if (input.sessionId.length === 0) {
    throw new Error('startCoSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    cache: new Map(),
  };
}

export function submitBatch(
  session: CoSession,
  input: { requests: Array<{ id: string; tokens: number }>; batchSizeLimit?: number },
): { step: AxisStep<CoState>; batchCount: number; estimatedSavings: number } {
  if (session.state !== 'idle' && session.state !== 'semantic-cached') {
    throw new Error(`submitBatch: session is ${session.state}`);
  }
  if (input.requests.length === 0) {
    throw new Error('submitBatch: requests must not be empty');
  }
  const limit = input.batchSizeLimit ?? 100;
  const batchCount = Math.ceil(input.requests.length / limit);
  const totalTokens = input.requests.reduce((s, r) => s + r.tokens, 0);
  const estimatedSavings = Math.round(totalTokens * 0.5);
  session.state = 'batch-submitted';
  const step = emit(session, 'co.batch_submitted', {
    requestCount: input.requests.length,
    batchCount,
    totalTokens,
    estimatedSavings,
  });
  return { step, batchCount, estimatedSavings };
}

export function compressPrompt(
  session: CoSession,
  input: { prompt: string; maxChars?: number },
): { step: AxisStep<CoState>; compressed: string; ratio: number } {
  if (session.state === 'idle') {
    throw new Error('compressPrompt: run submitBatch or startCoSession first');
  }
  const maxChars = input.maxChars ?? Math.floor(input.prompt.length * 0.7);
  const compressed =
    input.prompt.length <= maxChars
      ? input.prompt
      : input.prompt.slice(0, maxChars);
  const ratio = compressed.length / Math.max(1, input.prompt.length);
  session.state = 'prompt-compressed';
  const step = emit(session, 'co.prompt_compressed', {
    originalChars: input.prompt.length,
    compressedChars: compressed.length,
    ratio,
  });
  return { step, compressed, ratio };
}

export function stepCascade(
  session: CoSession,
  input: {
    confidence: number;
    tiers: Array<{ name: string; costPerToken: number; confidenceThreshold: number }>;
  },
): { step: AxisStep<CoState>; selectedTier: string; escalated: boolean } {
  if (session.state === 'idle') {
    throw new Error('stepCascade: run submitBatch or compressPrompt first');
  }
  if (input.tiers.length === 0) {
    throw new Error('stepCascade: tiers must not be empty');
  }
  const sorted = [...input.tiers].sort((a, b) => a.costPerToken - b.costPerToken);
  let selectedTier = sorted[0]!.name;
  let escalated = false;
  for (const tier of sorted) {
    if (input.confidence >= tier.confidenceThreshold) {
      selectedTier = tier.name;
      break;
    }
    escalated = true;
    selectedTier = tier.name;
  }
  session.state = 'cascade-stepped';
  const step = emit(session, 'co.cascade_stepped', {
    tierCount: input.tiers.length,
    selectedTier,
    escalated,
    confidence: input.confidence,
  });
  return { step, selectedTier, escalated };
}

export function lookupSemanticCache(
  session: CoSession,
  input: { queryHash: string; value?: string },
): { step: AxisStep<CoState>; hit: boolean; cached: string | null } {
  if (input.queryHash.length === 0) {
    throw new Error('lookupSemanticCache: queryHash must not be empty');
  }
  const existing = session.cache.get(input.queryHash);
  let hit = existing !== undefined;
  let cached: string | null = existing ?? null;
  if (!hit && input.value !== undefined) {
    session.cache.set(input.queryHash, input.value);
    cached = input.value;
  }
  session.state = 'semantic-cached';
  const step = emit(session, 'co.semantic_cached', {
    queryHashLength: input.queryHash.length,
    hit,
    cacheSize: session.cache.size,
  });
  return { step, hit, cached };
}

function emit(
  session: CoSession,
  neutralEvent: 'co.batch_submitted' | 'co.prompt_compressed' | 'co.cascade_stepped' | 'co.semantic_cached',
  metadata: Record<string, string | number | boolean>,
): AxisStep<CoState> {
  const step: AxisStep<CoState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: session.history.length + 1,
    metadata,
  };
  session.history.push(step);
  return step;
}
