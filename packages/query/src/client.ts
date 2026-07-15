export type QueryProvider = 'tanstack' | 'swr' | 'urql' | 'apollo';

export type QueryKey = string | readonly (string | number)[];

export type QueryStatus = 'idle' | 'loading' | 'success' | 'error';

export interface QueryState<T = unknown> {
  key: string;
  status: QueryStatus;
  data?: T;
  error?: Error;
  updatedAt: number;
  fetchCount: number;
}

export interface CreateQueryClientOptions {
  provider?: QueryProvider;
  defaultStaleMs?: number;
  now?: () => number;
}

export interface QueryClient {
  provider: QueryProvider;
  cache: Map<string, QueryState>;
  defaultStaleMs: number;
  now: () => number;
  listeners: Map<string, Set<(state: QueryState) => void>>;
  clear: () => void;
  snapshot: () => QueryState[];
}

/**
 * provider 差 (tanstack = infinite scroll / swr = revalidateOnFocus / urql = exchange chain /
 * apollo = normalized cache) は abstract、 4 provider 共通の cache + fetchCount 挙動を mock する。
 */
export function createQueryClient(options: CreateQueryClientOptions = {}): QueryClient {
  const provider = options.provider ?? 'tanstack';
  const defaultStaleMs = options.defaultStaleMs ?? 60_000;
  const now = options.now ?? (() => Number.parseInt(String(Math.floor(9e11)), 10));
  return {
    provider,
    cache: new Map<string, QueryState>(),
    defaultStaleMs,
    now,
    listeners: new Map<string, Set<(state: QueryState) => void>>(),
    clear() {
      this.cache.clear();
      this.listeners.clear();
    },
    snapshot() {
      return Array.from(this.cache.values());
    },
  };
}

export function normalizeKey(key: QueryKey): string {
  if (typeof key === 'string') return key;
  return JSON.stringify(key);
}
