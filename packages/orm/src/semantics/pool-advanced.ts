import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Pool advanced — health checks, connection warmup, graceful drain, and
 * pool metrics export. Postgres maps to PgBouncer, MySQL to ProxySQL, and
 * SQLite to sqlite3_status / close-v2 style primitives.
 *
 * State transitions:
 *   created              → 'cold'
 *   runPoolHealthCheck   → 'healthy'
 *   warmPoolConnections  → 'warmed-up'
 *   drainPoolGracefully  → 'draining'
 *   exportPoolMetrics    → 'metrics-exported'
 */
export type PoolAdvancedState =
  | 'cold'
  | 'healthy'
  | 'warmed-up'
  | 'draining'
  | 'metrics-exported';

export interface PoolAdvancedSession {
  poolId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: PoolAdvancedState;
  minWarmConnections: number;
  activeConnections: number;
  lastHealthLatencyMs: number;
  metrics: Record<string, number>;
  history: AxisStep<PoolAdvancedState>[];
}

function record(
  session: PoolAdvancedSession,
  step: AxisStep<PoolAdvancedState>,
): AxisStep<PoolAdvancedState> {
  session.history.push(step);
  return step;
}

export function createPoolAdvancedSession(input: {
  poolId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  minWarmConnections: number;
}): PoolAdvancedSession {
  if (input.minWarmConnections <= 0) {
    throw new Error('createPoolAdvancedSession: minWarmConnections must be positive');
  }
  return {
    poolId: input.poolId,
    provider: input.provider,
    backend: input.backend,
    state: 'cold',
    minWarmConnections: input.minWarmConnections,
    activeConnections: 0,
    lastHealthLatencyMs: 0,
    metrics: {},
    history: [],
  };
}

export function runPoolHealthCheck(
  session: PoolAdvancedSession,
  input: { latencyMs: number; ok: boolean },
): AxisStep<PoolAdvancedState> {
  if (session.state !== 'cold' && session.state !== 'healthy') {
    throw new Error(`runPoolHealthCheck: requires cold / healthy state (got ${session.state})`);
  }
  if (!input.ok) {
    throw new Error('runPoolHealthCheck: health check failed');
  }
  if (input.latencyMs < 0) {
    throw new Error('runPoolHealthCheck: latencyMs must be non-negative');
  }
  session.lastHealthLatencyMs = input.latencyMs;
  session.state = 'healthy';
  return record(session, {
    neutralEvent: 'pool-advanced.health-checked',
    backendEvent: backendEventName(
      session.backend,
      'pool-advanced.health-checked',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      latencyMs: input.latencyMs,
      ok: input.ok,
    },
  });
}

export function warmPoolConnections(
  session: PoolAdvancedSession,
  input: { connectionCount: number },
): AxisStep<PoolAdvancedState> {
  if (session.state !== 'healthy' && session.state !== 'warmed-up') {
    throw new Error(`warmPoolConnections: requires healthy state (got ${session.state})`);
  }
  if (input.connectionCount < session.minWarmConnections) {
    throw new Error('warmPoolConnections: connectionCount below minWarmConnections');
  }
  session.activeConnections = input.connectionCount;
  session.state = 'warmed-up';
  return record(session, {
    neutralEvent: 'pool-advanced.warmed-up',
    backendEvent: backendEventName(session.backend, 'pool-advanced.warmed-up', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      connectionCount: input.connectionCount,
      minWarmConnections: session.minWarmConnections,
    },
  });
}

export function drainPoolGracefully(
  session: PoolAdvancedSession,
  input: { deadlineMs: number },
): AxisStep<PoolAdvancedState> {
  if (session.state !== 'warmed-up' && session.state !== 'draining') {
    throw new Error(`drainPoolGracefully: requires warmed-up state (got ${session.state})`);
  }
  if (input.deadlineMs <= 0) {
    throw new Error('drainPoolGracefully: deadlineMs must be positive');
  }
  const drainedConnections = session.activeConnections;
  session.activeConnections = 0;
  session.state = 'draining';
  return record(session, {
    neutralEvent: 'pool-advanced.drained',
    backendEvent: backendEventName(session.backend, 'pool-advanced.drained', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      deadlineMs: input.deadlineMs,
      drainedConnections,
    },
  });
}

export function exportPoolMetrics(
  session: PoolAdvancedSession,
  input: { active: number; idle: number; waiting: number },
): AxisStep<PoolAdvancedState> {
  if (session.state !== 'draining' && session.state !== 'metrics-exported') {
    throw new Error(`exportPoolMetrics: requires draining state (got ${session.state})`);
  }
  if (input.active < 0 || input.idle < 0 || input.waiting < 0) {
    throw new Error('exportPoolMetrics: metrics must be non-negative');
  }
  session.metrics = { ...input };
  session.state = 'metrics-exported';
  return record(session, {
    neutralEvent: 'pool-advanced.metrics-exported',
    backendEvent: backendEventName(
      session.backend,
      'pool-advanced.metrics-exported',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      active: input.active,
      idle: input.idle,
      waiting: input.waiting,
    },
  });
}
