import type { ProcedureHandler } from './procedure.js';
import { invokeProcedure, type Router } from './router.js';
import type { ProcedureContext } from './context.js';

export interface RetryOptions {
  maxAttempts: number;
  backoffMs?: number;
  retryOn?: (err: unknown) => boolean;
}

export interface TimeoutOptions {
  ms: number;
}

export interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

export interface CircuitBreakerOptions {
  failureThreshold: number;
  resetMs: number;
}

export interface ObservabilityHook {
  onStart?: (name: string, input: unknown) => void;
  onSuccess?: (name: string, output: unknown, durationMs: number) => void;
  onError?: (name: string, err: unknown, durationMs: number) => void;
}

export interface BatchInvokeItem<TInput = unknown> {
  procedureName: string;
  input: TInput;
}

export interface BatchInvokeResult {
  ok: boolean;
  output?: unknown;
  error?: { code: string; message: string };
}

/**
 * withRetry — procedure handler を retry policy でラップ。 exponential backoff (backoffMs *
 * 2^(attempt-1)) を default で適用、 retryOn callback で条件付き retry も可能。
 */
export function withRetry<T>(handler: ProcedureHandler<unknown, T>, options: RetryOptions): ProcedureHandler<unknown, T> {
  const backoff = options.backoffMs ?? 0;
  const retryOn = options.retryOn ?? (() => true);
  return async (params) => {
    let lastErr: unknown = null;
    for (let attempt = 1; attempt <= options.maxAttempts; attempt += 1) {
      try {
        return await handler(params);
      } catch (err) {
        lastErr = err;
        if (attempt >= options.maxAttempts || !retryOn(err)) throw err;
        if (backoff > 0) {
          const delay = backoff * 2 ** (attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
    throw lastErr;
  };
}

/**
 * withTimeout — handler を timeout でラップ。 ms 経過で Promise.race で timeout error throw。
 */
export function withTimeout<T>(handler: ProcedureHandler<unknown, T>, options: TimeoutOptions): ProcedureHandler<unknown, T> {
  return async (params) => {
    return Promise.race([
      handler(params),
      new Promise<T>((_, reject) => {
        const timer = setTimeout(() => reject(new Error(`timeout ${options.ms}ms exceeded`)), options.ms);
        (timer as unknown as { unref?: () => void }).unref?.();
      }),
    ]);
  };
}

/**
 * withRateLimit — sliding window rate limiter。 window 内 request 数が maxRequests 超で throw。
 */
export function withRateLimit<T>(handler: ProcedureHandler<unknown, T>, options: RateLimitOptions): ProcedureHandler<unknown, T> {
  const timestamps: number[] = [];
  return async (params) => {
    const now = Date.now();
    const cutoff = now - options.windowMs;
    while (timestamps.length > 0 && timestamps[0]! < cutoff) timestamps.shift();
    if (timestamps.length >= options.maxRequests) {
      throw new Error(`rate limit ${options.maxRequests}/${options.windowMs}ms exceeded`);
    }
    timestamps.push(now);
    return handler(params);
  };
}

/**
 * withCircuitBreaker — 連続失敗が failureThreshold 超で「open」 状態に切替、 resetMs 経過で
 * half-open で 1 attempt allow、 成功で closed 復帰。
 */
export function withCircuitBreaker<T>(handler: ProcedureHandler<unknown, T>, options: CircuitBreakerOptions): ProcedureHandler<unknown, T> {
  let state: 'closed' | 'open' | 'half-open' = 'closed';
  let failures = 0;
  let openedAt = 0;
  return async (params) => {
    const now = Date.now();
    if (state === 'open') {
      if (now - openedAt >= options.resetMs) state = 'half-open';
      else throw new Error('circuit breaker open');
    }
    try {
      const result = await handler(params);
      if (state === 'half-open') { state = 'closed'; failures = 0; }
      return result;
    } catch (err) {
      failures += 1;
      if (failures >= options.failureThreshold) {
        state = 'open';
        openedAt = now;
      }
      throw err;
    }
  };
}

/**
 * withObservability — handler の start / success / error / duration を hook 通知。 tracing /
 * metrics / logging の統合を統一 interface で実現。
 */
export function withObservability<T>(name: string, handler: ProcedureHandler<unknown, T>, hook: ObservabilityHook): ProcedureHandler<unknown, T> {
  return async (params) => {
    const start = Date.now();
    hook.onStart?.(name, params.input);
    try {
      const output = await handler(params);
      hook.onSuccess?.(name, output, Date.now() - start);
      return output;
    } catch (err) {
      hook.onError?.(name, err, Date.now() - start);
      throw err;
    }
  };
}

/**
 * batchInvoke — 複数 procedure を Promise.all で並列 invoke、 各結果を BatchInvokeResult
 * shape で正規化 (individual failure が全体 fail しない)。
 */
export async function batchInvoke(
  router: Router,
  items: BatchInvokeItem[],
  ctx?: ProcedureContext,
): Promise<BatchInvokeResult[]> {
  return Promise.all(items.map(async (item) => {
    try {
      const output = await invokeProcedure(router, item.procedureName, item.input, ctx);
      return { ok: true, output };
    } catch (err) {
      const e = err as { code?: string; message?: string };
      return { ok: false, error: { code: e.code ?? 'UNKNOWN', message: e.message ?? String(err) } };
    }
  }));
}

/**
 * withIdempotencyKey — 同一 key の重複 invoke で cached result を返す。 downstream への
 * 副作用を防ぐ (payment / charge / booking 系で重要)。
 */
export function withIdempotencyKey<T>(handler: ProcedureHandler<unknown, T>): ProcedureHandler<unknown, T> {
  const cache = new Map<string, T>();
  return async (params) => {
    const key = (params.input as { idempotencyKey?: string })?.idempotencyKey;
    if (key && cache.has(key)) return cache.get(key) as T;
    const result = await handler(params);
    if (key) cache.set(key, result);
    return result;
  };
}
