import { providerEventName, type AxisStep, type AiLlmTarget } from './types.js';

/**
 * Prompt engineering advanced axis — chain-of-thought + few-shot + caching +
 * versioning state machine。
 *
 * Deterministic mock で 4 signal 系統。 CoT expands stepwise reasoning、
 * few-shot picks k best by score、 caching uses deterministic key hash、
 * versioning pins semver + hash pair。
 */

export type PeaState =
  | 'idle'
  | 'chain-of-thought-expanded'
  | 'few-shot-selected'
  | 'cached'
  | 'version-pinned';

export interface CotStep {
  index: number;
  thought: string;
}

export interface FewShotExample {
  id: string;
  input: string;
  output: string;
  score: number;
}

export interface PeaCacheEntry {
  key: string;
  value: string;
  hits: number;
}

export interface PeaSession {
  target: AiLlmTarget;
  sessionId: string;
  state: PeaState;
  history: AxisStep<PeaState>[];
  cot: CotStep[];
  fewShot: FewShotExample[];
  cache: Map<string, PeaCacheEntry>;
  currentVersion: string | null;
}

export function startPeaSession(input: {
  target: AiLlmTarget;
  sessionId: string;
}): PeaSession {
  if (input.sessionId.length === 0) {
    throw new Error('startPeaSession: sessionId must not be empty');
  }
  return {
    target: input.target,
    sessionId: input.sessionId,
    state: 'idle',
    history: [],
    cot: [],
    fewShot: [],
    cache: new Map(),
    currentVersion: null,
  };
}

export function expandChainOfThought(
  session: PeaSession,
  input: { thoughts: string[] },
): { step: AxisStep<PeaState>; steps: CotStep[] } {
  if (input.thoughts.length === 0)
    throw new Error('expandChainOfThought: thoughts must not be empty');
  const startIdx = session.cot.length;
  for (let i = 0; i < input.thoughts.length; i += 1) {
    const t = input.thoughts[i] ?? '';
    if (t.length === 0)
      throw new Error('expandChainOfThought: individual thought must not be empty');
    session.cot.push({ index: startIdx + i, thought: t });
  }
  session.state = 'chain-of-thought-expanded';
  const step = emit(session, 'pea.chain_of_thought_expanded', {
    added: input.thoughts.length,
    totalSteps: session.cot.length,
    averageLength: avg(session.cot.map((c) => c.thought.length)),
  });
  return { step, steps: [...session.cot] };
}

export function selectFewShot(
  session: PeaSession,
  input: { pool: FewShotExample[]; k: number },
): { step: AxisStep<PeaState>; selected: FewShotExample[] } {
  if (session.state === 'idle') throw new Error('selectFewShot: expand CoT first');
  if (input.pool.length === 0) throw new Error('selectFewShot: pool must not be empty');
  if (input.k <= 0) throw new Error('selectFewShot: k must be positive');
  const sorted = [...input.pool].sort((a, b) => b.score - a.score);
  const selected = sorted.slice(0, Math.min(input.k, sorted.length));
  session.fewShot = selected;
  session.state = 'few-shot-selected';
  const step = emit(session, 'pea.few_shot_selected', {
    poolSize: input.pool.length,
    k: input.k,
    selectedCount: selected.length,
    topScore: selected[0]?.score ?? 0,
  });
  return { step, selected };
}

export function cachePrompt(
  session: PeaSession,
  input: { key: string; value: string },
): { step: AxisStep<PeaState>; entry: PeaCacheEntry; wasHit: boolean } {
  if (session.state === 'idle') throw new Error('cachePrompt: expand CoT first');
  if (input.key.length === 0) throw new Error('cachePrompt: key must not be empty');
  const existing = session.cache.get(input.key);
  let wasHit = false;
  let entry: PeaCacheEntry;
  if (existing) {
    existing.hits += 1;
    entry = existing;
    wasHit = true;
  } else {
    entry = { key: input.key, value: input.value, hits: 0 };
    session.cache.set(input.key, entry);
  }
  session.state = 'cached';
  const step = emit(session, 'pea.cached', {
    key: input.key,
    wasHit,
    hits: entry.hits,
    cacheSize: session.cache.size,
  });
  return { step, entry, wasHit };
}

export function pinVersion(
  session: PeaSession,
  input: { semver: string; hash: string },
): { step: AxisStep<PeaState>; version: string } {
  if (session.state === 'idle') throw new Error('pinVersion: expand CoT first');
  if (!/^\d+\.\d+\.\d+$/.test(input.semver))
    throw new Error('pinVersion: semver must match N.N.N');
  if (input.hash.length < 4) throw new Error('pinVersion: hash must be at least 4 chars');
  const version = `${input.semver}+${input.hash}`;
  session.currentVersion = version;
  session.state = 'version-pinned';
  const step = emit(session, 'pea.version_pinned', {
    semver: input.semver,
    hash: input.hash,
    version,
    hashLength: input.hash.length,
  });
  return { step, version };
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((sum, n) => sum + n, 0) / nums.length;
}

function emit(
  session: PeaSession,
  neutralEvent: AxisStep<PeaState>['neutralEvent'],
  metadata: Record<string, string | number | boolean>,
): AxisStep<PeaState> {
  const step: AxisStep<PeaState> = {
    neutralEvent,
    providerEvent: providerEventName(session.target, neutralEvent),
    state: session.state,
    timestampMs: Date.now(),
    metadata: { target: session.target, sessionId: session.sessionId, ...metadata },
  };
  session.history.push(step);
  return step;
}
