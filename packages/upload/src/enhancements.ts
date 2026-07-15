/**
 * v2.1 enhancements = retry / batch / idempotency / observability / circuit-breaker を単一 file に集約。
 * 各 module は @kiwa-lab/email v2.1 pattern を upload domain に適用。
 */
import type { UploadClient, UploadRequest, UploadResult } from './client.js';

// === retry ===
export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  onRetry?: (attempt: number, reason: string) => void;
}

export async function uploadWithRetry(
  client: UploadClient,
  req: UploadRequest,
  options: RetryOptions = {},
): Promise<UploadResult & { attempts: number }> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 100;
  let last: UploadResult | null = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    last = await client.upload(req);
    if (last.status !== 'failed') return { ...last, attempts: attempt };
    if (attempt < maxAttempts) {
      options.onRetry?.(attempt, last.status);
      await new Promise((r) => setTimeout(r, initialDelay * 2 ** (attempt - 1)));
    }
  }
  return { ...(last as UploadResult), attempts: maxAttempts };
}

// === batch ===
export interface BatchUploadResult {
  total: number;
  succeeded: number;
  failed: number;
  results: UploadResult[];
}

export async function uploadBatch(
  client: UploadClient,
  requests: readonly UploadRequest[],
  concurrency = 5,
): Promise<BatchUploadResult> {
  const results: UploadResult[] = [];
  for (let i = 0; i < requests.length; i += concurrency) {
    const chunk = requests.slice(i, i + concurrency);
    const chunkResults = await Promise.all(chunk.map((r) => client.upload(r)));
    results.push(...chunkResults);
  }
  const failed = results.filter((r) => r.status === 'failed').length;
  return { total: requests.length, succeeded: results.length - failed, failed, results };
}

// === idempotency ===
export interface IdempotencyCache {
  get: (key: string) => UploadResult | undefined;
  set: (key: string, value: UploadResult) => void;
  size: () => number;
  clear: () => void;
}

export function createIdempotencyCache(): IdempotencyCache {
  const store = new Map<string, UploadResult>();
  return {
    get: (k) => store.get(k),
    set: (k, v) => { store.set(k, v); },
    size: () => store.size,
    clear: () => store.clear(),
  };
}

export async function uploadIdempotent(
  client: UploadClient,
  req: UploadRequest,
  idempotencyKey: string,
  cache: IdempotencyCache,
): Promise<UploadResult & { cached: boolean }> {
  const cached = cache.get(idempotencyKey);
  if (cached) return { ...cached, cached: true };
  const result = await client.upload(req);
  cache.set(idempotencyKey, result);
  return { ...result, cached: false };
}

// === observability ===
export type UploadHookEvent = 'before-upload' | 'after-upload' | 'error';

export interface HookContext {
  event: UploadHookEvent;
  request: UploadRequest;
  result?: UploadResult;
  error?: string;
  durationMs?: number;
}

export type HookCallback = (ctx: HookContext) => void;

export interface HookRegistry {
  register: (event: UploadHookEvent, cb: HookCallback) => () => void;
  emit: (event: UploadHookEvent, ctx: HookContext) => void;
  count: (event: UploadHookEvent) => number;
}

export function createHookRegistry(): HookRegistry {
  const hooks = new Map<UploadHookEvent, HookCallback[]>();
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

export async function uploadObservable(
  client: UploadClient,
  req: UploadRequest,
  hooks: HookRegistry,
): Promise<UploadResult> {
  const start = Date.now();
  hooks.emit('before-upload', { event: 'before-upload', request: req });
  try {
    const result = await client.upload(req);
    hooks.emit('after-upload', { event: 'after-upload', request: req, result, durationMs: Date.now() - start });
    return result;
  } catch (e) {
    hooks.emit('error', { event: 'error', request: req, error: (e as Error).message, durationMs: Date.now() - start });
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
  upload: (req: UploadRequest) => Promise<UploadResult & { circuitState: CircuitState }>;
  reset: () => void;
  failureCount: () => number;
}

export function createCircuitBreaker(
  client: UploadClient,
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
    async upload(req) {
      if (state === 'open') {
        if (now() - openedAt >= resetTimeout) {
          state = 'half-open';
        } else {
          const blocked: UploadResult = {
            id: 'circuit-open',
            provider: client.provider,
            status: 'failed',
            bucket: req.bucket,
            key: req.key,
            size: 0,
            etag: '',
            uploadedAt: now(),
          };
          return { ...blocked, circuitState: state };
        }
      }
      const result = await client.upload(req);
      if (result.status === 'failed') {
        failures += 1;
        if (failures >= threshold) { state = 'open'; openedAt = now(); }
      } else {
        failures = 0;
        if (state === 'half-open') state = 'closed';
      }
      return { ...result, circuitState: state };
    },
  };
}
