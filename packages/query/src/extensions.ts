/**
 * v2.1 extensions — infinite query, optimistic update, prefetch,
 * plus retry/batch/observability/timeout generics.
 * TanStack Query v5.60+ / SWR v2.3 追随。
 */

export interface InfiniteQueryOptions<TData, TCursor> {
  initialCursor: TCursor;
  fetchPage: (cursor: TCursor) => Promise<{ data: TData[]; nextCursor?: TCursor }>;
  maxPages?: number;
}

export interface InfiniteQueryState<TData, TCursor> {
  pages: Array<{ cursor: TCursor; data: TData[] }>;
  hasNextPage: boolean;
  fetchNextPage: () => Promise<void>;
  reset: () => void;
}

/** infinite query — TanStack useInfiniteQuery 相当 */
export function createInfiniteQuery<TData, TCursor>(options: InfiniteQueryOptions<TData, TCursor>): InfiniteQueryState<TData, TCursor> {
  const pages: Array<{ cursor: TCursor; data: TData[] }> = [];
  let nextCursor: TCursor | undefined = options.initialCursor;
  const maxPages = options.maxPages ?? Infinity;
  return {
    pages,
    get hasNextPage() { return nextCursor !== undefined && pages.length < maxPages; },
    async fetchNextPage() {
      if (nextCursor === undefined || pages.length >= maxPages) return;
      const { data, nextCursor: nc } = await options.fetchPage(nextCursor);
      pages.push({ cursor: nextCursor, data });
      nextCursor = nc;
    },
    reset() {
      pages.length = 0;
      nextCursor = options.initialCursor;
    },
  };
}

export interface OptimisticUpdate<T> {
  applyOptimistic: (value: T) => void;
  commit: () => void;
  rollback: () => void;
  current: () => T;
  isPending: () => boolean;
}

/** optimistic update — server response 前に UI を更新、 失敗時 rollback */
export function createOptimisticUpdate<T>(initial: T): OptimisticUpdate<T> {
  let baseline = initial;
  let optimistic: T | undefined;
  return {
    applyOptimistic(value) { optimistic = value; },
    commit() { if (optimistic !== undefined) { baseline = optimistic; optimistic = undefined; } },
    rollback() { optimistic = undefined; },
    current() { return optimistic ?? baseline; },
    isPending() { return optimistic !== undefined; },
  };
}

export interface PrefetchOptions {
  concurrency?: number;
  timeoutMs?: number;
}

export interface PrefetchResult {
  successCount: number;
  failureCount: number;
  prefetched: string[];
  failed: Array<{ key: string; error: unknown }>;
}

/** prefetch — 複数 queryKey を並列 fetch して cache に格納 */
export async function prefetchQueries(
  keys: string[],
  fetcher: (key: string) => Promise<unknown>,
  options: PrefetchOptions = {},
): Promise<PrefetchResult> {
  const concurrency = options.concurrency ?? 4;
  const prefetched: string[] = [];
  const failed: Array<{ key: string; error: unknown }> = [];
  for (let i = 0; i < keys.length; i += concurrency) {
    const chunk = keys.slice(i, i + concurrency);
    const settled = await Promise.allSettled(chunk.map(async (k) => {
      await (options.timeoutMs ? withTimeout(() => fetcher(k), options.timeoutMs) : fetcher(k));
      return k;
    }));
    for (let j = 0; j < settled.length; j += 1) {
      const s = settled[j]!;
      const key = chunk[j]!;
      if (s.status === 'fulfilled') prefetched.push(key);
      else failed.push({ key, error: s.reason });
    }
  }
  return { successCount: prefetched.length, failureCount: failed.length, prefetched, failed };
}

export interface RetryOptions { maxAttempts?: number; initialDelayMs?: number; backoffFactor?: number; }
export interface RetryResult<T> { ok: boolean; attempts: number; value?: T; error?: unknown; }

export async function retryWithBackoff<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<RetryResult<T>> {
  const maxAttempts = options.maxAttempts ?? 3;
  const initialDelay = options.initialDelayMs ?? 10;
  const factor = options.backoffFactor ?? 2;
  let attempts = 0;
  let lastError: unknown;
  while (attempts < maxAttempts) {
    attempts += 1;
    try { return { ok: true, attempts, value: await fn() }; }
    catch (e) {
      lastError = e;
      if (attempts >= maxAttempts) break;
      await new Promise((r) => { const t = setTimeout(r, initialDelay * Math.pow(factor, attempts - 1)); (t as unknown as { unref?: () => void }).unref?.(); });
    }
  }
  return { ok: false, attempts, error: lastError };
}

export async function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(`timeout after ${timeoutMs}ms`)), timeoutMs);
    (t as unknown as { unref?: () => void }).unref?.();
    fn().then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

export interface ObservabilityHook {
  emit: (event: { kind: string; data: Record<string, unknown> }) => void;
  events: () => Array<{ kind: string; data: Record<string, unknown> }>;
  clear: () => void;
}

export function createObservabilityHook(): ObservabilityHook {
  const events: Array<{ kind: string; data: Record<string, unknown> }> = [];
  return { emit(e) { events.push(e); }, events() { return [...events]; }, clear() { events.length = 0; } };
}
