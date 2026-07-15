// Generic resilience module template — lib domain 別に import 元 type だけ変えて流用
// 各 lib の src/resilience.ts として copy して調整する

export interface RetryOptions {
  maxAttempts: number;
  backoffMs?: number;
  retryOn?: (err: unknown) => boolean;
}
export interface TimeoutOptions { ms: number; }
export interface RateLimitOptions { maxRequests: number; windowMs: number; }
export interface CircuitBreakerOptions { failureThreshold: number; resetMs: number; }
export interface ObservabilityHook {
  onStart?: (name: string, input?: unknown) => void;
  onSuccess?: (name: string, output: unknown, durationMs: number) => void;
  onError?: (name: string, err: unknown, durationMs: number) => void;
}
export interface BatchItem<TIn = unknown> { name: string; input: TIn; }
export interface BatchResult { ok: boolean; output?: unknown; error?: { code: string; message: string }; }

export function withRetry<T>(fn: () => Promise<T>, options: RetryOptions): () => Promise<T> {
  const backoff = options.backoffMs ?? 0;
  const retryOn = options.retryOn ?? (() => true);
  return async () => {
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      try { return await fn(); }
      catch (err) {
        lastErr = err;
        if (attempt >= options.maxAttempts || !retryOn(err)) throw err;
        if (backoff > 0) {
          const delay = backoff * 2 ** (attempt - 1);
          await new Promise((r) => setTimeout(r, delay));
        }
      }
    }
    throw lastErr;
  };
}

export function withTimeout<T>(fn: () => Promise<T>, options: TimeoutOptions): () => Promise<T> {
  return async () => Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      const timer = setTimeout(() => reject(new Error(`timeout ${options.ms}ms exceeded`)), options.ms);
      (timer as unknown as { unref?: () => void }).unref?.();
    }),
  ]);
}

export function withRateLimit<T>(fn: () => Promise<T>, options: RateLimitOptions): () => Promise<T> {
  const timestamps: number[] = [];
  return async () => {
    const now = Date.now();
    const cutoff = now - options.windowMs;
    while (timestamps.length > 0 && timestamps[0]! < cutoff) timestamps.shift();
    if (timestamps.length >= options.maxRequests) {
      throw new Error(`rate limit ${options.maxRequests}/${options.windowMs}ms exceeded`);
    }
    timestamps.push(now);
    return fn();
  };
}

export function withCircuitBreaker<T>(fn: () => Promise<T>, options: CircuitBreakerOptions): () => Promise<T> {
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let failures = 0;
  let openedAt = 0;
  return async () => {
    const now = Date.now();
    if (state === 'open') {
      if (now - openedAt >= options.resetMs) state = 'half-open';
      else throw new Error('circuit breaker open');
    }
    try {
      const result = await fn();
      if (state === 'half-open') { state = 'closed'; failures = 0; }
      return result;
    } catch (err) {
      failures += 1;
      if (failures >= options.failureThreshold) { state = 'open'; openedAt = now; }
      throw err;
    }
  };
}

export function withObservability<T>(name: string, fn: () => Promise<T>, hook: ObservabilityHook): () => Promise<T> {
  return async () => {
    const start = Date.now();
    hook.onStart?.(name);
    try {
      const output = await fn();
      hook.onSuccess?.(name, output, Date.now() - start);
      return output;
    } catch (err) {
      hook.onError?.(name, err, Date.now() - start);
      throw err;
    }
  };
}

export function withIdempotencyKey<T>(fn: (key: string) => Promise<T>): (key: string) => Promise<T> {
  const cache = new Map<string, T>();
  return async (key: string) => {
    if (cache.has(key)) return cache.get(key) as T;
    const result = await fn(key);
    cache.set(key, result);
    return result;
  };
}

export async function batchOperate<TIn, TOut>(
  items: readonly BatchItem<TIn>[],
  runner: (item: BatchItem<TIn>) => Promise<TOut>,
): Promise<BatchResult[]> {
  return Promise.all(items.map(async (item) => {
    try {
      const output = await runner(item);
      return { ok: true, output };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      return { ok: false, error: { code: e.code ?? 'UNKNOWN', message: e.message ?? String(err) } };
    }
  }));
}
