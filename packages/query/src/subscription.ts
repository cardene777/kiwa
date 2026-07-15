import { normalizeKey, type QueryClient, type QueryKey, type QueryState } from './client.js';

export type QueryListener = (state: QueryState) => void;

export interface Subscription {
  unsubscribe: () => void;
  key: string;
}

/**
 * key に state 変更を subscribe。 fetchQuery / invalidateQuery が触ると listener に通知。
 * SWR の subscribe / TanStack Query の queryClient.getQueryCache().subscribe 相当。
 */
export function subscribeToQuery(
  client: QueryClient,
  key: QueryKey,
  listener: QueryListener,
): Subscription {
  const cacheKey = normalizeKey(key);
  let set = client.listeners.get(cacheKey);
  if (!set) {
    set = new Set();
    client.listeners.set(cacheKey, set);
  }
  set.add(listener);
  return {
    key: cacheKey,
    unsubscribe: () => {
      const s = client.listeners.get(cacheKey);
      if (s) {
        s.delete(listener);
        if (s.size === 0) client.listeners.delete(cacheKey);
      }
    },
  };
}
