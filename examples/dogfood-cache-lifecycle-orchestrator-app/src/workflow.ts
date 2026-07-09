import {
  startCache,
  dispatchCacheEvent,
  summarizeCache,
  type CacheSession,
  type CacheSummary,
  type CacheEvent,
} from '@kiwa-lab/cache';

export function bootCache(input: { timestamp: string }): CacheSession {
  return startCache({ timestamp: input.timestamp });
}

export function pipeCacheEvents(input: {
  session: CacheSession;
  events: { event: CacheEvent; timestamp: string }[];
}): CacheSession {
  return input.events.reduce<CacheSession>(
    (acc, e) => dispatchCacheEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderCacheDashboard(session: CacheSession): CacheSummary {
  return summarizeCache(session);
}

export function extractHitRatio(session: CacheSession): { ratio: number } {
  const total = session.readHits + session.readMisses;
  return { ratio: total === 0 ? 0 : session.readHits / total };
}

export function traceEvictionPressure(session: CacheSession): { count: number } {
  return { count: session.evictions + session.ttlWarnings };
}
