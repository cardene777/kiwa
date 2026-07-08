/**
 * v0.6 cache-lifecycle-orchestrator = 3 provider (Redis + Memcached + KeyDB) の
 * 継続合成 layer。 depth-5 pattern 11 例目 candidate、 backend systems layer 第 3 例、
 * systematic pattern 53 度目。
 */

export type CacheState =
  | 'filling'
  | 'hot'
  | 'expiring'
  | 'stale'
  | 'evicted';

export type CacheEvent =
  | 'write-committed'
  | 'read-hit'
  | 'read-miss'
  | 'ttl-warning'
  | 'ttl-expired'
  | 'invalidate-requested'
  | 'evict-requested'
  | 'timeout';

export interface CacheSession {
  state: CacheState;
  writesCommitted: number;
  readHits: number;
  readMisses: number;
  ttlWarnings: number;
  evictions: number;
  lastEventAt: string;
  events: string[];
}

export function startCache(input: { timestamp: string }): CacheSession {
  return {
    state: 'filling',
    writesCommitted: 0,
    readHits: 0,
    readMisses: 0,
    ttlWarnings: 0,
    evictions: 0,
    lastEventAt: input.timestamp,
    events: ['cache-started'],
  };
}

export function dispatchEvent(input: {
  session: CacheSession;
  event: CacheEvent;
  timestamp: string;
}): CacheSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'filling': {
      if (event === 'write-committed') {
        return {
          ...base,
          state: 'hot',
          writesCommitted: session.writesCommitted + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'evicted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'hot': {
      if (event === 'read-hit') {
        return { ...base, readHits: session.readHits + 1 };
      }
      if (event === 'write-committed') {
        return { ...base, writesCommitted: session.writesCommitted + 1 };
      }
      if (event === 'ttl-warning') {
        return {
          ...base,
          state: 'expiring',
          ttlWarnings: session.ttlWarnings + 1,
        };
      }
      if (event === 'invalidate-requested') {
        return { ...base, state: 'evicted', evictions: session.evictions + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'evicted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'expiring': {
      if (event === 'read-hit') {
        return { ...base, readHits: session.readHits + 1 };
      }
      if (event === 'ttl-expired') {
        return { ...base, state: 'stale' };
      }
      if (event === 'evict-requested') {
        return { ...base, state: 'evicted', evictions: session.evictions + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'evicted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'stale': {
      if (event === 'read-miss') {
        return { ...base, readMisses: session.readMisses + 1 };
      }
      if (event === 'evict-requested') {
        return { ...base, state: 'evicted', evictions: session.evictions + 1 };
      }
      if (event === 'write-committed') {
        return {
          ...base,
          state: 'filling',
          writesCommitted: session.writesCommitted + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'evicted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'evicted': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface CacheSummary {
  currentState: CacheState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  writesCommitted: number;
  readHits: number;
  readMisses: number;
  ttlWarnings: number;
  evictions: number;
}

export function summarizeCache(session: CacheSession): CacheSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    writesCommitted: session.writesCommitted,
    readHits: session.readHits,
    readMisses: session.readMisses,
    ttlWarnings: session.ttlWarnings,
    evictions: session.evictions,
  };
}
