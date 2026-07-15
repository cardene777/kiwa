/**
 * v2.1 extensions — deep link handling, notification permission, retry, batch,
 * observability, timeout, rate limit, circuit breaker for React Native app tests.
 * RN 0.75+ new architecture 追随。
 */

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  backoffFactor?: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export interface RetryResult<T> {
  ok: boolean;
  attempts: number;
  value?: T;
  error?: unknown;
}

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 10;
  const factor = options.backoffFactor ?? 2;
  let attempts = 0;
  let lastError: unknown;
  while (attempts < maxAttempts) {
    attempts += 1;
    try {
      const value = await fn();
      return { ok: true, attempts, value };
    } catch (e) {
      lastError = e;
      options.onRetry?.(attempts, e);
      if (attempts >= maxAttempts) break;
      const delay = initialDelay * Math.pow(factor, attempts - 1);
      await new Promise((r) => { const t = setTimeout(r, delay); (t as unknown as { unref?: () => void }).unref?.(); });
    }
  }
  return { ok: false, attempts, error: lastError };
}

export interface DeepLinkPattern {
  scheme: string;
  host?: string;
  pathPattern?: RegExp;
}

export interface DeepLinkMatch {
  matched: boolean;
  scheme: string;
  host?: string;
  path?: string;
  params?: Record<string, string>;
}

/** deep link URL を pattern に対して match、 param 抽出 */
export function matchDeepLink(url: string, patterns: DeepLinkPattern[]): DeepLinkMatch {
  try {
    const parsed = new URL(url);
    const scheme = parsed.protocol.replace(/:$/, '');
    for (const p of patterns) {
      if (p.scheme !== scheme) continue;
      if (p.host && p.host !== parsed.host) continue;
      const path = parsed.pathname;
      if (p.pathPattern) {
        const m = path.match(p.pathPattern);
        if (m) {
          const params: Record<string, string> = {};
          for (let i = 1; i < m.length; i += 1) params[`p${i}`] = m[i] ?? '';
          return { matched: true, scheme, host: parsed.host, path, params };
        }
      } else {
        return { matched: true, scheme, host: parsed.host, path };
      }
    }
    return { matched: false, scheme, host: parsed.host, path: parsed.pathname };
  } catch {
    return { matched: false, scheme: '' };
  }
}

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionMock {
  status: () => NotificationPermission;
  request: () => Promise<NotificationPermission>;
  set: (status: NotificationPermission) => void;
}

/** notification permission mock — iOS/Android 統一 */
export function createNotificationPermissionMock(initial: NotificationPermission = 'undetermined'): NotificationPermissionMock {
  let current = initial;
  return {
    status() {
      return current;
    },
    async request() {
      if (current === 'undetermined') current = 'granted';
      return current;
    },
    set(status) {
      current = status;
    },
  };
}

export interface ObservabilityEvent {
  kind: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface ObservabilityHook {
  emit: (event: ObservabilityEvent) => void;
  events: () => ObservabilityEvent[];
  clear: () => void;
}

export function createObservabilityHook(): ObservabilityHook {
  const events: ObservabilityEvent[] = [];
  return {
    emit(e) { events.push(e); },
    events() { return [...events]; },
    clear() { events.length = 0; },
  };
}

export interface TimeoutOptions {
  timeoutMs: number;
  onTimeout?: () => void;
}

export async function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      options.onTimeout?.();
      reject(new Error(`timeout after ${options.timeoutMs}ms`));
    }, options.timeoutMs);
    (timer as unknown as { unref?: () => void }).unref?.();
    fn().then(
      (v) => { clearTimeout(timer); resolve(v); },
      (e) => { clearTimeout(timer); reject(e); },
    );
  });
}

export interface RateLimitOptions {
  requestsPerSecond: number;
  burst?: number;
}

export interface RateLimiter {
  tryAcquire: () => boolean;
  reset: () => void;
  remaining: () => number;
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  const capacity = options.burst ?? options.requestsPerSecond;
  let tokens = capacity;
  let lastRefill = 0;
  const refillRate = options.requestsPerSecond / 1000;
  return {
    tryAcquire() {
      const now = performance.now();
      if (lastRefill === 0) lastRefill = now;
      const elapsed = now - lastRefill;
      tokens = Math.min(capacity, tokens + elapsed * refillRate);
      lastRefill = now;
      if (tokens >= 1) { tokens -= 1; return true; }
      return false;
    },
    reset() { tokens = capacity; lastRefill = 0; },
    remaining() { return Math.floor(tokens); },
  };
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetTimeoutMs: number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  execute: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
}

export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  let state: CircuitState = 'closed';
  let failureCount = 0;
  let lastFailureAt = 0;
  return {
    state() {
      if (state === 'open' && performance.now() - lastFailureAt >= options.resetTimeoutMs) state = 'half-open';
      return state;
    },
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (state === 'open' && performance.now() - lastFailureAt < options.resetTimeoutMs) throw new Error('circuit-open');
      try {
        const v = await fn();
        if (state === 'half-open') { state = 'closed'; failureCount = 0; }
        return v;
      } catch (e) {
        failureCount += 1;
        lastFailureAt = performance.now();
        if (failureCount >= options.failureThreshold) state = 'open';
        throw e;
      }
    },
    reset() { state = 'closed'; failureCount = 0; lastFailureAt = 0; },
  };
}

export interface BatchOptions {
  concurrency?: number;
}

export interface BatchResult<T> {
  successCount: number;
  failureCount: number;
  results: Array<{ ok: boolean; value?: T; error?: unknown }>;
}

export async function batchAsync<T>(fns: Array<() => Promise<T>>, options: BatchOptions = {}): Promise<BatchResult<T>> {
  const concurrency = options.concurrency ?? 4;
  const results: BatchResult<T>['results'] = [];
  let successCount = 0;
  let failureCount = 0;
  for (let i = 0; i < fns.length; i += concurrency) {
    const chunk = fns.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map((f) => f()));
    for (const s of settled) {
      if (s.status === 'fulfilled') { results.push({ ok: true, value: s.value }); successCount += 1; }
      else { results.push({ ok: false, error: s.reason }); failureCount += 1; }
    }
  }
  return { successCount, failureCount, results };
}
