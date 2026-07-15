import { normalizeKey, type QueryClient, type QueryKey, type QueryState } from './client.js';

export type QueryFn<T> = () => Promise<T>;

export interface FetchQueryOptions {
  staleMs?: number;
  force?: boolean;
}

export interface FetchQueryResult<T> {
  data: T;
  fromCache: boolean;
  fetchCount: number;
  staleAgeMs: number;
}

/**
 * cache-first fetch。 staleMs 内なら cache hit で queryFn を呼ばず、
 * force=true or stale なら queryFn 実行 + cache 更新。
 */
export async function fetchQuery<T>(
  client: QueryClient,
  key: QueryKey,
  queryFn: QueryFn<T>,
  options: FetchQueryOptions = {},
): Promise<FetchQueryResult<T>> {
  const cacheKey = normalizeKey(key);
  const staleMs = options.staleMs ?? client.defaultStaleMs;
  const nowMs = client.now();
  const cached = client.cache.get(cacheKey) as QueryState<T> | undefined;

  if (!options.force && cached && cached.status === 'success') {
    const age = nowMs - cached.updatedAt;
    if (age < staleMs && cached.data !== undefined) {
      return { data: cached.data, fromCache: true, fetchCount: cached.fetchCount, staleAgeMs: age };
    }
  }

  const prevFetchCount = cached?.fetchCount ?? 0;
  const loadingState: QueryState<T> = {
    key: cacheKey,
    status: 'loading',
    updatedAt: nowMs,
    fetchCount: prevFetchCount,
  };
  client.cache.set(cacheKey, loadingState);
  notifyListeners(client, cacheKey, loadingState);

  try {
    const data = await queryFn();
    const successState: QueryState<T> = {
      key: cacheKey,
      status: 'success',
      data,
      updatedAt: client.now(),
      fetchCount: prevFetchCount + 1,
    };
    client.cache.set(cacheKey, successState);
    notifyListeners(client, cacheKey, successState);
    return { data, fromCache: false, fetchCount: prevFetchCount + 1, staleAgeMs: 0 };
  } catch (e) {
    const errorState: QueryState<T> = {
      key: cacheKey,
      status: 'error',
      error: e as Error,
      updatedAt: client.now(),
      fetchCount: prevFetchCount + 1,
    };
    client.cache.set(cacheKey, errorState);
    notifyListeners(client, cacheKey, errorState);
    throw e;
  }
}

function notifyListeners(client: QueryClient, key: string, state: QueryState): void {
  const set = client.listeners.get(key);
  if (!set) return;
  for (const listener of set) listener(state);
}
