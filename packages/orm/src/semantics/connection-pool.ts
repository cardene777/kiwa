import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Connection pool — max_connections cap, idle_timeout eviction,
 * statement_timeout cancellation, and a bounded wait queue when the pool
 * is saturated. Postgres uses pgbouncer, MySQL uses ProxySQL, SQLite
 * emulates with a WAL writer serialization queue. Same 4 neutral events
 * across all backends, with backend / provider dialect via
 * {@link backendEventName}.
 *
 * State transitions:
 *   created                  → 'idle'
 *   acquire                  → 'in-use' (or 'saturated' if maxConnections reached)
 *   waitInQueue              → 'saturated'
 *   idleTimeout              → 'evicted'
 *   statementTimeout         → 'cancelled'
 */
export type PoolState = 'idle' | 'in-use' | 'saturated' | 'evicted' | 'cancelled';

export interface ConnectionHandle {
  id: string;
  acquiredAt: number;
  lastActivityAt: number;
}

export interface PoolSession {
  poolId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: PoolState;
  maxConnections: number;
  idleTimeoutMs: number;
  statementTimeoutMs: number;
  active: Map<string, ConnectionHandle>;
  waitQueue: string[];
  history: AxisStep<PoolState>[];
}

function record(session: PoolSession, step: AxisStep<PoolState>): AxisStep<PoolState> {
  session.history.push(step);
  return step;
}

/**
 * Create a pool session with a cap on connections and per-connection idle /
 * statement timeouts (both in milliseconds). State starts at 'idle'.
 */
export function createPoolSession(input: {
  poolId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  maxConnections: number;
  idleTimeoutMs: number;
  statementTimeoutMs: number;
}): PoolSession {
  if (input.maxConnections <= 0) {
    throw new Error('createPoolSession: maxConnections must be positive');
  }
  return {
    poolId: input.poolId,
    provider: input.provider,
    backend: input.backend,
    state: 'idle',
    maxConnections: input.maxConnections,
    idleTimeoutMs: input.idleTimeoutMs,
    statementTimeoutMs: input.statementTimeoutMs,
    active: new Map(),
    waitQueue: [],
    history: [],
  };
}

/**
 * Acquire a connection. If the pool is at capacity, throws — call
 * {@link waitInQueue} first when saturation is expected. Emits
 * `pool.acquired` and moves the session into 'in-use' (or 'saturated' when
 * the acquisition tips the pool over the cap).
 */
export function acquire(
  session: PoolSession,
  input: { clientId: string; at: number },
): AxisStep<PoolState> {
  if (session.active.size >= session.maxConnections) {
    throw new Error(
      `acquire: pool saturated (${session.active.size}/${session.maxConnections})`,
    );
  }
  const handle: ConnectionHandle = {
    id: input.clientId,
    acquiredAt: input.at,
    lastActivityAt: input.at,
  };
  session.active.set(input.clientId, handle);
  session.state = session.active.size === session.maxConnections ? 'saturated' : 'in-use';
  return record(session, {
    neutralEvent: 'pool.acquired',
    backendEvent: backendEventName(session.backend, 'pool.acquired', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      clientId: input.clientId,
      activeCount: session.active.size,
      maxConnections: session.maxConnections,
    },
  });
}

/**
 * Enqueue a client that could not acquire (because the pool was saturated).
 * Moves the session into 'saturated' and emits `pool.wait-queued`.
 */
export function waitInQueue(
  session: PoolSession,
  input: { clientId: string },
): AxisStep<PoolState> {
  if (session.active.size < session.maxConnections) {
    throw new Error(
      'waitInQueue: pool has spare capacity — call acquire instead',
    );
  }
  session.waitQueue.push(input.clientId);
  session.state = 'saturated';
  return record(session, {
    neutralEvent: 'pool.wait-queued',
    backendEvent: backendEventName(session.backend, 'pool.wait-queued', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      clientId: input.clientId,
      queueDepth: session.waitQueue.length,
    },
  });
}

/**
 * Evict a connection whose idle time exceeds `idleTimeoutMs`. Requires the
 * connection to be idle for at least that long — a premature eviction is
 * a bug. Emits `pool.idle-timeout` and returns the pool to 'idle' when it
 * was the last active handle.
 */
export function idleTimeout(
  session: PoolSession,
  input: { clientId: string; at: number },
): AxisStep<PoolState> {
  const handle = session.active.get(input.clientId);
  if (!handle) {
    throw new Error(`idleTimeout: unknown client id ${input.clientId}`);
  }
  const idle = input.at - handle.lastActivityAt;
  if (idle < session.idleTimeoutMs) {
    throw new Error(
      `idleTimeout: client not idle long enough (${idle}ms < ${session.idleTimeoutMs}ms)`,
    );
  }
  session.active.delete(input.clientId);
  session.state = session.active.size === 0 ? 'evicted' : 'in-use';
  return record(session, {
    neutralEvent: 'pool.idle-timeout',
    backendEvent: backendEventName(session.backend, 'pool.idle-timeout', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      clientId: input.clientId,
      idleMs: idle,
      activeCount: session.active.size,
    },
  });
}

/**
 * Cancel a client's statement because it exceeded `statementTimeoutMs`.
 * Requires the client to be currently active. Emits `pool.statement-timeout`
 * and moves the session into 'cancelled'.
 */
export function statementTimeout(
  session: PoolSession,
  input: { clientId: string; elapsedMs: number },
): AxisStep<PoolState> {
  const handle = session.active.get(input.clientId);
  if (!handle) {
    throw new Error(
      `statementTimeout: unknown or inactive client id ${input.clientId}`,
    );
  }
  if (input.elapsedMs < session.statementTimeoutMs) {
    throw new Error(
      `statementTimeout: elapsed ${input.elapsedMs}ms below limit ${session.statementTimeoutMs}ms`,
    );
  }
  session.state = 'cancelled';
  return record(session, {
    neutralEvent: 'pool.statement-timeout',
    backendEvent: backendEventName(session.backend, 'pool.statement-timeout', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      clientId: input.clientId,
      elapsedMs: input.elapsedMs,
      limitMs: session.statementTimeoutMs,
    },
  });
}
