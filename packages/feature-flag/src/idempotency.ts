import { evaluateFlag, type EvaluateFlagResult } from './evaluator.js';
import type { FlagClient, FlagUser } from './client.js';

export interface IdempotencyCache {
  get: (key: string) => EvaluateFlagResult | undefined;
  set: (key: string, value: EvaluateFlagResult) => void;
  size: () => number;
  clear: () => void;
}

export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, EvaluateFlagResult>();
  return {
    get: (k) => store.get(k),
    set: (k, v) => { store.set(k, v); },
    size: () => store.size,
    clear: () => store.clear(),
  };
}

/** cached evaluate: 同 (flagKey, user.id) で cached result を返却。 */
export function evaluateIdempotent(
  client: FlagClient,
  key: string,
  user: FlagUser,
  cache: IdempotencyCache,
): EvaluateFlagResult & { cached: boolean } {
  const cacheKey = `${key}:${user.id}`;
  const cached = cache.get(cacheKey);
  if (cached) return { ...cached, cached: true };
  const result = evaluateFlag(client, key, user);
  cache.set(cacheKey, result);
  return { ...result, cached: false };
}
