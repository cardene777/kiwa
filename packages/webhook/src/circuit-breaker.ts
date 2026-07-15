import type { WebhookVerifier, IncomingWebhook, WebhookVerifyOutcome } from './client.js';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  rejectionThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  verify: (incoming: IncomingWebhook) => WebhookVerifyOutcome & { circuitState: CircuitState };
  reset: () => void;
  rejectionCount: () => number;
}

/** circuit breaker: rejectionThreshold 連続 rejection で open、 resetTimeoutMs 後 half-open。 */
export function createCircuitBreaker(
  verifier: WebhookVerifier,
  options: CircuitBreakerOptions = {},
): CircuitBreaker {
  const threshold = options.rejectionThreshold ?? 5;
  const resetTimeout = options.resetTimeoutMs ?? 30_000;
  const now = options.now ?? (() => Date.now());
  let state: CircuitState = 'closed';
  let rejections = 0;
  let openedAt = 0;
  return {
    state: () => state,
    rejectionCount: () => rejections,
    reset() {
      state = 'closed';
      rejections = 0;
      openedAt = 0;
    },
    verify(incoming) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          return {
            id: 'circuit-open',
            provider: verifier.provider,
            status: 'rejected',
            reason: 'circuit breaker open',
            receivedAt: now(),
            circuitState: state,
          };
        }
      }
      const outcome = verifier.verify(incoming);
      if (outcome.status === 'rejected') {
        rejections += 1;
        if (rejections >= threshold) {
          state = 'open';
          openedAt = now();
        }
      } else {
        rejections = 0;
        if (state === 'half-open') state = 'closed';
      }
      return { ...outcome, circuitState: state };
    },
  };
}
