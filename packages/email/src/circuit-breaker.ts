import type { EmailClient, EmailMessage, EmailSendResult } from './client.js';

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  send: (msg: EmailMessage) => Promise<EmailSendResult & { circuitState: CircuitState }>;
  reset: () => void;
  failureCount: () => number;
}

/**
 * circuit breaker: failureThreshold 連続 failure で state=open、
 * resetTimeoutMs 経過後 half-open で 1 回試行、 success で closed 復帰。
 */
export function createCircuitBreaker(
  client: EmailClient,
  options: CircuitBreakerOptions = {},
): CircuitBreaker {
  const threshold = options.failureThreshold ?? 5;
  const resetTimeout = options.resetTimeoutMs ?? 30_000;
  const now = options.now ?? (() => Date.now());
  let state: CircuitState = 'closed';
  let failures = 0;
  let openedAt = 0;
  return {
    state: () => state,
    failureCount: () => failures,
    reset() {
      state = 'closed';
      failures = 0;
      openedAt = 0;
    },
    async send(msg) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          const result: EmailSendResult = {
            id: 'circuit-open',
            provider: client.provider,
            status: 'failed',
            acceptedAt: now(),
            reason: 'circuit breaker open',
          };
          return { ...result, circuitState: state };
        }
      }
      const result = await client.send(msg);
      if (result.status === 'failed') {
        failures += 1;
        if (failures >= threshold) {
          state = 'open';
          openedAt = now();
        }
      } else {
        failures = 0;
        if (state === 'half-open') state = 'closed';
      }
      return { ...result, circuitState: state };
    },
  };
}
