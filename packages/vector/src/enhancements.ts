/**
 * v2.1 enhancements = retry / batch / idempotency / observability / circuit-breaker (upsert 対象)。
 */
import type { VectorClient, VectorRecord, UpsertResult } from './client.js';

// === retry ===
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  onRetry?: (attempt: number) => void;
}

export async function upsertWithRetry(
  client: VectorClient,
  records: VectorRecord[],
  options: RetryOptions = {},
): Promise<UpsertResult & { attempts: number }> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const result = await client.upsert(records);
      return { ...result, attempts: attempt };
    } catch (e) {
      lastError = e as Error;
      if (attempt < maxAttempts) {
        options.onRetry?.(attempt);
        await new Promise((r) => setTimeout(r, initialDelay * 2 ** (attempt - 1)));
      }
    }
  }
  throw lastError ?? new Error('upsert failed');
}

// === batch ===
export interface BatchUpsertResult {
  totalRecords: number;
  batchCount: number;
  totalUpserted: number;
  results: UpsertResult[];
}

export async function upsertBatch(
  client: VectorClient,
  records: VectorRecord[],
  batchSize = 100,
): Promise<BatchUpsertResult> {
  const results: UpsertResult[] = [];
  for (let i = 0; i < records.length; i += batchSize) {
    results.push(await client.upsert(records.slice(i, i + batchSize)));
  }
  return {
    totalRecords: records.length,
    batchCount: results.length,
    totalUpserted: results.reduce((sum, r) => sum + r.upsertedCount, 0),
    results,
  };
}

// === idempotency ===
export interface IdempotencyCache {
  get: (key: string) => UpsertResult | undefined;
  set: (key: string, value: UpsertResult) => void;
  size: () => number;
  clear: () => void;
}

export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, UpsertResult>();
  return {
    get: (k) => store.get(k),
    set: (k, v) => { store.set(k, v); },
    size: () => store.size,
    clear: () => store.clear(),
  };
}

export async function upsertIdempotent(
  client: VectorClient,
  records: VectorRecord[],
  idempotencyKey: string,
  cache: IdempotencyCache,
): Promise<UpsertResult & { cached: boolean }> {
  const cached = cache.get(idempotencyKey);
  if (cached) return { ...cached, cached: true };
  const result = await client.upsert(records);
  cache.set(idempotencyKey, result);
  return { ...result, cached: false };
}

// === observability ===
export type UpsertHookEvent = 'before-upsert' | 'after-upsert' | 'error';

export interface HookContext {
  event: UpsertHookEvent;
  records: VectorRecord[];
  result?: UpsertResult;
  error?: string;
}

export type HookCallback = (ctx: HookContext) => void;

export interface HookRegistry {
  register: (event: UpsertHookEvent, cb: HookCallback) => () => void;
  emit: (event: UpsertHookEvent, ctx: HookContext) => void;
  count: (event: UpsertHookEvent) => number;
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<UpsertHookEvent, HookCallback[]>();
  return {
    register(event, cb) {
      const list = hooks.get(event) ?? [];
      list.push(cb);
      hooks.set(event, list);
      return () => { hooks.set(event, (hooks.get(event) ?? []).filter((c) => c !== cb)); };
    },
    emit(event, ctx) { for (const cb of hooks.get(event) ?? []) cb(ctx); },
    count: (event) => (hooks.get(event) ?? []).length,
  };
}

export async function upsertObservable(
  client: VectorClient,
  records: VectorRecord[],
  hooks: HookRegistry,
): Promise<UpsertResult> {
  hooks.emit('before-upsert', { event: 'before-upsert', records });
  try {
    const result = await client.upsert(records);
    hooks.emit('after-upsert', { event: 'after-upsert', records, result });
    return result;
  } catch (e) {
    hooks.emit('error', { event: 'error', records, error: (e as Error).message });
    throw e;
  }
}

// === circuit-breaker ===
export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}

export interface CircuitBreaker {
  state: () => CircuitState;
  upsert: (records: VectorRecord[]) => Promise<UpsertResult & { circuitState: CircuitState }>;
  reset: () => void;
  failureCount: () => number;
}

export function createCircuitBreaker(
  client: VectorClient,
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
    reset() { state = 'closed'; failures = 0; openedAt = 0; },
    async upsert(records) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          const blocked: UpsertResult = { upsertedCount: 0, provider: client.provider, namespace: client.namespace };
          return { ...blocked, circuitState: state };
        }
      }
      try {
        const result = await client.upsert(records);
        failures = 0;
        if (state === 'half-open') state = 'closed';
        return { ...result, circuitState: state };
      } catch (e) {
        failures += 1;
        if (failures >= threshold) { state = 'open'; openedAt = now(); }
        throw e;
      }
    },
  };
}
