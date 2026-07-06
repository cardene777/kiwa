import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Logical replication advanced — streaming replication protocol start,
 * replication-origin progress, two-safe confirmation, and cascaded
 * subscription sync. Postgres maps to pgoutput / replication origin /
 * synchronous commit primitives; MySQL approximates with group
 * replication; SQLite falls back to session-style telemetry.
 *
 * State transitions:
 *   created                    → 'idle'
 *   startLogicalStreaming      → 'streaming'
 *   trackReplicationOrigin     → 'origin-tracked'
 *   confirmTwoSafeCommit       → 'two-safe-confirmed'
 *   syncCascadedSubscription   → 'cascade-synced'
 */
export type LogicalReplicationAdvancedState =
  | 'idle'
  | 'streaming'
  | 'origin-tracked'
  | 'two-safe-confirmed'
  | 'cascade-synced';

export interface LogicalReplicationAdvancedSession {
  streamId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: LogicalReplicationAdvancedState;
  startLsn: number;
  originId: string | null;
  confirmedLsn: number;
  cascadedSubscribers: Set<string>;
  history: AxisStep<LogicalReplicationAdvancedState>[];
}

function record(
  session: LogicalReplicationAdvancedSession,
  step: AxisStep<LogicalReplicationAdvancedState>,
): AxisStep<LogicalReplicationAdvancedState> {
  session.history.push(step);
  return step;
}

export function createLogicalReplicationAdvancedSession(input: {
  streamId: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): LogicalReplicationAdvancedSession {
  return {
    streamId: input.streamId,
    provider: input.provider,
    backend: input.backend,
    state: 'idle',
    startLsn: 0,
    originId: null,
    confirmedLsn: 0,
    cascadedSubscribers: new Set(),
    history: [],
  };
}

export function startLogicalStreaming(
  session: LogicalReplicationAdvancedSession,
  input: { startLsn: number; protocolVersion: number },
): AxisStep<LogicalReplicationAdvancedState> {
  if (session.state !== 'idle') {
    throw new Error(`startLogicalStreaming: requires idle state (got ${session.state})`);
  }
  if (input.startLsn <= 0) {
    throw new Error('startLogicalStreaming: startLsn must be positive');
  }
  if (input.protocolVersion < 1) {
    throw new Error('startLogicalStreaming: protocolVersion must be >= 1');
  }
  session.startLsn = input.startLsn;
  session.confirmedLsn = input.startLsn;
  session.state = 'streaming';
  return record(session, {
    neutralEvent: 'logical-advanced.streaming-started',
    backendEvent: backendEventName(
      session.backend,
      'logical-advanced.streaming-started',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      startLsn: input.startLsn,
      protocolVersion: input.protocolVersion,
    },
  });
}

export function trackReplicationOrigin(
  session: LogicalReplicationAdvancedSession,
  input: { originId: string; remoteLsn: number },
): AxisStep<LogicalReplicationAdvancedState> {
  if (session.state !== 'streaming' && session.state !== 'origin-tracked') {
    throw new Error(`trackReplicationOrigin: requires streaming state (got ${session.state})`);
  }
  if (!input.originId) {
    throw new Error('trackReplicationOrigin: originId is required');
  }
  if (input.remoteLsn < session.startLsn) {
    throw new Error('trackReplicationOrigin: remoteLsn cannot precede startLsn');
  }
  session.originId = input.originId;
  session.confirmedLsn = input.remoteLsn;
  session.state = 'origin-tracked';
  return record(session, {
    neutralEvent: 'logical-advanced.origin-tracked',
    backendEvent: backendEventName(
      session.backend,
      'logical-advanced.origin-tracked',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      originId: input.originId,
      remoteLsn: input.remoteLsn,
    },
  });
}

export function confirmTwoSafeCommit(
  session: LogicalReplicationAdvancedSession,
  input: { confirmedFlushLsn: number; synchronousStandbys: number },
): AxisStep<LogicalReplicationAdvancedState> {
  if (session.state !== 'origin-tracked') {
    throw new Error(`confirmTwoSafeCommit: requires origin-tracked state (got ${session.state})`);
  }
  if (input.synchronousStandbys < 1) {
    throw new Error('confirmTwoSafeCommit: at least one synchronous standby is required');
  }
  if (input.confirmedFlushLsn < session.confirmedLsn) {
    throw new Error('confirmTwoSafeCommit: confirmedFlushLsn cannot regress');
  }
  session.confirmedLsn = input.confirmedFlushLsn;
  session.state = 'two-safe-confirmed';
  return record(session, {
    neutralEvent: 'logical-advanced.two-safe-confirmed',
    backendEvent: backendEventName(
      session.backend,
      'logical-advanced.two-safe-confirmed',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      confirmedFlushLsn: input.confirmedFlushLsn,
      synchronousStandbys: input.synchronousStandbys,
    },
  });
}

export function syncCascadedSubscription(
  session: LogicalReplicationAdvancedSession,
  input: { upstreamId: string; subscriberId: string },
): AxisStep<LogicalReplicationAdvancedState> {
  if (session.state !== 'two-safe-confirmed' && session.state !== 'cascade-synced') {
    throw new Error(
      `syncCascadedSubscription: requires two-safe-confirmed state (got ${session.state})`,
    );
  }
  if (input.upstreamId === input.subscriberId) {
    throw new Error('syncCascadedSubscription: upstreamId and subscriberId must differ');
  }
  session.cascadedSubscribers.add(input.subscriberId);
  session.state = 'cascade-synced';
  return record(session, {
    neutralEvent: 'logical-advanced.cascade-synced',
    backendEvent: backendEventName(
      session.backend,
      'logical-advanced.cascade-synced',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      upstreamId: input.upstreamId,
      subscriberId: input.subscriberId,
      cascadedCount: session.cascadedSubscribers.size,
    },
  });
}
