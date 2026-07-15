/**
 * v2.1 extensions — retry/backoff, batch dispatch, observability hook, timeout,
 * rate limit, circuit breaker, plus Go-specific context.WithCancel simulation
 * and middleware compose helper.
 *
 * gin v2 / echo v5 / fiber v3 provider の追随として、 route group + subrouter
 * helper も追加。
 */
import type { GoFramework, GoRequest, GoResponse } from './env.js';

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

/** exponential backoff retry — echo/gin middleware に組み込む想定 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<RetryResult<T>> {
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
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, delay);
        (timer as unknown as { unref?: () => void }).unref?.();
      });
    }
  }
  return { ok: false, attempts, error: lastError };
}

export interface BatchDispatchOptions {
  concurrency?: number;
  stopOnError?: boolean;
}

export interface BatchDispatchResult<T> {
  results: Array<{ index: number; ok: boolean; value?: T; error?: unknown }>;
  successCount: number;
  failureCount: number;
}

/** batch handler dispatch — 並列/直列両対応 */
export async function batchDispatch<T>(
  handlers: Array<() => Promise<T>>,
  options: BatchDispatchOptions = {},
): Promise<BatchDispatchResult<T>> {
  const concurrency = options.concurrency ?? 4;
  const stopOnError = options.stopOnError ?? false;
  const results: BatchDispatchResult<T>['results'] = [];
  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < handlers.length; i += concurrency) {
    const chunk = handlers.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map((h) => h()));
    for (let j = 0; j < settled.length; j += 1) {
      const s = settled[j]!;
      const index = i + j;
      if (s.status === 'fulfilled') {
        results.push({ index, ok: true, value: s.value });
        successCount += 1;
      } else {
        results.push({ index, ok: false, error: s.reason });
        failureCount += 1;
      }
    }
    if (stopOnError && failureCount > 0) break;
  }
  return { results, successCount, failureCount };
}

export interface ObservabilityEvent {
  framework: GoFramework;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  timestamp: number;
}

export interface ObservabilityHook {
  onRequest: (event: ObservabilityEvent) => void;
  events: () => ObservabilityEvent[];
  clear: () => void;
}

/** observability hook — request 一覧を蓄積 */
export function createObservabilityHook(): ObservabilityHook {
  const events: ObservabilityEvent[] = [];
  return {
    onRequest(event) {
      events.push(event);
    },
    events() {
      return [...events];
    },
    clear() {
      events.length = 0;
    },
  };
}

export interface TimeoutOptions {
  timeoutMs: number;
  onTimeout?: () => void;
}

/** handler timeout — timeoutMs 経過で reject */
export async function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      options.onTimeout?.();
      reject(new Error(`timeout after ${options.timeoutMs}ms`));
    }, options.timeoutMs);
    (timer as unknown as { unref?: () => void }).unref?.();
    fn().then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      },
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

/** token bucket rate limiter */
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
      if (tokens >= 1) {
        tokens -= 1;
        return true;
      }
      return false;
    },
    reset() {
      tokens = capacity;
      lastRefill = 0;
    },
    remaining() {
      return Math.floor(tokens);
    },
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

/** circuit breaker — 失敗閾値超えで open、 resetTimeout 経過で half-open */
export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  let state: CircuitState = 'closed';
  let failureCount = 0;
  let lastFailureAt = 0;
  return {
    state() {
      if (state === 'open' && performance.now() - lastFailureAt >= options.resetTimeoutMs) {
        state = 'half-open';
      }
      return state;
    },
    async execute<T>(fn: () => Promise<T>): Promise<T> {
      if (state === 'open' && performance.now() - lastFailureAt < options.resetTimeoutMs) {
        throw new Error('circuit-open');
      }
      try {
        const value = await fn();
        if (state === 'half-open') {
          state = 'closed';
          failureCount = 0;
        }
        return value;
      } catch (e) {
        failureCount += 1;
        lastFailureAt = performance.now();
        if (failureCount >= options.failureThreshold) state = 'open';
        throw e;
      }
    },
    reset() {
      state = 'closed';
      failureCount = 0;
      lastFailureAt = 0;
    },
  };
}

export interface CancelToken {
  cancelled: () => boolean;
  cancel: () => void;
  onCancel: (fn: () => void) => void;
}

/** context.WithCancel simulation — Go の context 相当 */
export function createCancelToken(): CancelToken {
  let cancelled = false;
  const listeners: Array<() => void> = [];
  return {
    cancelled() {
      return cancelled;
    },
    cancel() {
      if (cancelled) return;
      cancelled = true;
      for (const l of listeners) l();
    },
    onCancel(fn) {
      if (cancelled) fn();
      else listeners.push(fn);
    },
  };
}

export type MiddlewareFn = (req: GoRequest, next: () => Promise<GoResponse>) => Promise<GoResponse>;

/** middleware compose helper — 複数 middleware を 1 chain に連結 */
export function composeMiddleware(...middlewares: MiddlewareFn[]): MiddlewareFn {
  return async (req, finalNext) => {
    let idx = -1;
    const dispatch = async (i: number): Promise<GoResponse> => {
      if (i <= idx) throw new Error('next() called multiple times');
      idx = i;
      const fn = i === middlewares.length ? finalNext : middlewares[i]!.bind(null, req, () => dispatch(i + 1));
      return fn as unknown as Promise<GoResponse>;
    };
    return dispatch(0);
  };
}

export interface RouteGroupOptions {
  prefix: string;
  framework: GoFramework;
}

export interface RouteGroup {
  prefix: string;
  framework: GoFramework;
  routes: Array<{ method: string; fullPath: string; handlerName: string }>;
  addRoute: (method: string, subpath: string, handlerName: string) => void;
  subgroup: (childPrefix: string) => RouteGroup;
}

/** route group + subrouter helper — gin.Group / echo.Group / fiber.Group / chi.Route を統一 */
export function createRouteGroup(options: RouteGroupOptions): RouteGroup {
  const routes: RouteGroup['routes'] = [];
  const group: RouteGroup = {
    prefix: options.prefix,
    framework: options.framework,
    routes,
    addRoute(method, subpath, handlerName) {
      const fullPath = `${options.prefix}${subpath}`.replace(/\/+/g, '/');
      routes.push({ method, fullPath, handlerName });
    },
    subgroup(childPrefix) {
      const child = createRouteGroup({
        prefix: `${options.prefix}${childPrefix}`.replace(/\/+/g, '/'),
        framework: options.framework,
      });
      // 親側の routes に子 routes を merge 反映するため onAdd hook する
      const origAdd = child.addRoute;
      child.addRoute = (method, subpath, handlerName) => {
        origAdd(method, subpath, handlerName);
        const last = child.routes[child.routes.length - 1];
        if (last) routes.push(last);
      };
      return child;
    },
  };
  return group;
}
