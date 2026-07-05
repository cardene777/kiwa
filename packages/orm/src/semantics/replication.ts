import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Streaming replication — primary write flows into an ordered replica stream
 * (WAL for Postgres, binlog for MySQL, session for SQLite). The mock tracks
 * the primary LSN, per-replica applied LSN, and lag, plus a two-step
 * failover flow (`replication.failover-started` → `replication.promoted`).
 * SQLite has no server-side replication, but the mock still permits the
 * neutral events so downstream tests can drive a "simulated" replica for
 * SQLite in-memory fanout — the backend dialect falls back to the neutral
 * name via {@link backendEventName}.
 *
 * State transitions:
 *   created                 → 'streaming'
 *   primaryWrite            → 'streaming'  (bumps primary LSN)
 *   markReplicaLagged       → 'lagged'     (replica applied LSN falls behind)
 *   startFailover           → 'failover-in-progress'
 *   promoteReplica          → 'promoted'
 */
export type ReplicationState =
  | 'streaming'
  | 'lagged'
  | 'failover-in-progress'
  | 'promoted';

export interface ReplicaHandle {
  id: string;
  appliedLsn: number;
  lag: number;
}

export interface ReplicationSession {
  primaryId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: ReplicationState;
  primaryLsn: number;
  replicas: Map<string, ReplicaHandle>;
  history: AxisStep<ReplicationState>[];
}

function record(
  session: ReplicationSession,
  step: AxisStep<ReplicationState>,
): AxisStep<ReplicationState> {
  session.history.push(step);
  return step;
}

/**
 * Create a replication session with a primary and initial set of replicas.
 * State starts at 'streaming' and primary LSN starts at 0. Emits
 * `replication.primary-write` for the initial "snapshot" so history is
 * non-empty on inspection.
 */
export function createReplicationSession(input: {
  primaryId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  replicaIds: string[];
}): ReplicationSession {
  const replicas = new Map<string, ReplicaHandle>();
  for (const id of input.replicaIds) {
    replicas.set(id, { id, appliedLsn: 0, lag: 0 });
  }
  const session: ReplicationSession = {
    primaryId: input.primaryId,
    provider: input.provider,
    backend: input.backend,
    state: 'streaming',
    primaryLsn: 0,
    replicas,
    history: [],
  };
  return session;
}

/**
 * Record a primary write. Bumps primary LSN by `bytes` and marks the session
 * 'streaming' unless it is currently in a failover flow. Emits
 * `replication.primary-write`.
 *
 * Rejects when the session has been promoted — the old primary is terminal
 * after `promoteReplica` and cannot resume writes. Regressing a terminal
 * `promoted` state to `streaming` corrupts the failover invariant.
 */
export function primaryWrite(
  session: ReplicationSession,
  input: { bytes: number },
): AxisStep<ReplicationState> {
  if (session.state === 'failover-in-progress') {
    throw new Error('primaryWrite: failover in progress, primary is unavailable');
  }
  if (session.state === 'promoted') {
    throw new Error('primaryWrite: session is promoted (terminal), primary was demoted');
  }
  if (input.bytes <= 0) {
    throw new Error('primaryWrite: bytes must be positive');
  }
  session.primaryLsn += input.bytes;
  session.state = 'streaming';
  return record(session, {
    neutralEvent: 'replication.primary-write',
    backendEvent: backendEventName(session.backend, 'replication.primary-write', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { primaryLsn: session.primaryLsn, bytes: input.bytes },
  });
}

/**
 * Mark a specific replica as lagged. Sets the session state to 'lagged' if
 * any replica has non-zero lag. Emits `replication.replica-lagged`. Throws
 * if the replica id is unknown so silent typos are impossible.
 */
export function markReplicaLagged(
  session: ReplicationSession,
  input: { replicaId: string; appliedLsn: number },
): AxisStep<ReplicationState> {
  const replica = session.replicas.get(input.replicaId);
  if (!replica) {
    throw new Error(`markReplicaLagged: unknown replica id ${input.replicaId}`);
  }
  if (input.appliedLsn > session.primaryLsn) {
    throw new Error(
      `markReplicaLagged: appliedLsn ${input.appliedLsn} exceeds primaryLsn ${session.primaryLsn}`,
    );
  }
  replica.appliedLsn = input.appliedLsn;
  replica.lag = session.primaryLsn - input.appliedLsn;
  session.state = 'lagged';
  return record(session, {
    neutralEvent: 'replication.replica-lagged',
    backendEvent: backendEventName(session.backend, 'replication.replica-lagged', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      replicaId: replica.id,
      appliedLsn: replica.appliedLsn,
      lag: replica.lag,
    },
  });
}

/**
 * Start a failover flow. Requires the session to be either 'streaming' or
 * 'lagged'; a failover that is already 'failover-in-progress' or 'promoted'
 * is rejected so re-entry does not silently corrupt state. Emits
 * `replication.failover-started`.
 */
export function startFailover(
  session: ReplicationSession,
  input: { reason: string },
): AxisStep<ReplicationState> {
  if (session.state === 'failover-in-progress' || session.state === 'promoted') {
    throw new Error(`startFailover: cannot restart failover in state ${session.state}`);
  }
  session.state = 'failover-in-progress';
  return record(session, {
    neutralEvent: 'replication.failover-started',
    backendEvent: backendEventName(session.backend, 'replication.failover-started', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { reason: input.reason, primaryLsn: session.primaryLsn },
  });
}

/**
 * Promote a specific replica to primary. Requires the session to be
 * 'failover-in-progress' (a promotion outside a failover flow is a bug).
 * Overwrites the session `primaryId` with the promoted replica id and drops
 * that replica from the `replicas` map. Emits `replication.promoted`.
 */
export function promoteReplica(
  session: ReplicationSession,
  input: { replicaId: string },
): AxisStep<ReplicationState> {
  if (session.state !== 'failover-in-progress') {
    throw new Error(
      `promoteReplica: requires failover-in-progress state (got ${session.state})`,
    );
  }
  const replica = session.replicas.get(input.replicaId);
  if (!replica) {
    throw new Error(`promoteReplica: unknown replica id ${input.replicaId}`);
  }
  const previousPrimary = session.primaryId;
  session.primaryId = replica.id;
  session.primaryLsn = replica.appliedLsn;
  session.replicas.delete(replica.id);
  session.state = 'promoted';
  return record(session, {
    neutralEvent: 'replication.promoted',
    backendEvent: backendEventName(session.backend, 'replication.promoted', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      previousPrimary,
      newPrimary: replica.id,
      primaryLsn: session.primaryLsn,
    },
  });
}
