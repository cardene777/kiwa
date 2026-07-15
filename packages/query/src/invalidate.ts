import { normalizeKey, type QueryClient, type QueryKey } from './client.js';

export interface InvalidateResult {
  key: string;
  existed: boolean;
}

/**
 * cache から key を削除、 listener に invalidation を通知。 TanStack Query の
 * queryClient.invalidateQueries 相当。
 */
export function invalidateQuery(client: QueryClient, key: QueryKey): InvalidateResult {
  const cacheKey = normalizeKey(key);
  const existed = client.cache.has(cacheKey);
  client.cache.delete(cacheKey);
  const listeners = client.listeners.get(cacheKey);
  if (listeners) {
    for (const listener of listeners) {
      listener({ key: cacheKey, status: 'idle', updatedAt: client.now(), fetchCount: 0 });
    }
  }
  return { key: cacheKey, existed };
}
