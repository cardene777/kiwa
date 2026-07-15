import { evaluateFlag, type EvaluateFlagResult } from './evaluator.js';
import type { FlagClient, FlagUser } from './client.js';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  errorThreshold?: number;
  resetTimeoutMs?: number;
  fallbackValue?: unknown;
  now?: () => number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  evaluate: (client: FlagClient, key: string, user: FlagUser) => EvaluateFlagResult & { circuitState: CircuitState };
  reset: () => void;
  errorCount: () => number;
}

export function createCircuitBreaker(options: CircuitBreakerOptions = {}): CircuitBreaker {
  const threshold = options.errorThreshold ?? 5;
  const resetTimeout = options.resetTimeoutMs ?? 30_000;
  const now = options.now ?? (() => Date.now());
  const fallback = options.fallbackValue ?? false;
  let state: CircuitState = 'closed';
  let errors = 0;
  let openedAt = 0;
  return {
    state: () => state,
    errorCount: () => errors,
    reset() { state = 'closed'; errors = 0; openedAt = 0; },
    evaluate(client, key, user) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          const fallbackResult = { key, value: fallback, reason: 'circuit-open', record: null } as unknown as EvaluateFlagResult;
          return { ...fallbackResult, circuitState: state };
        }
      }
      try {
        const result = evaluateFlag(client, key, user);
        if (result.reason === 'error') {
          errors += 1;
          if (errors >= threshold) { state = 'open'; openedAt = now(); }
        } else {
          errors = 0;
          if (state === 'half-open') state = 'closed';
        }
        return { ...result, circuitState: state };
      } catch (e) {
        errors += 1;
        if (errors >= threshold) { state = 'open'; openedAt = now(); }
        const errorResult = { key, value: fallback, reason: 'error', record: null } as unknown as EvaluateFlagResult;
        return { ...errorResult, circuitState: state };
      }
    },
  };
}
