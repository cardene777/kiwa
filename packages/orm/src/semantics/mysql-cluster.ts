import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * MySQL cluster — group replication membership, single-primary election,
 * write conflict detection, and member leave. MySQL maps to
 * group_replication / performance_schema; Postgres approximates via
 * Patroni-style leader telemetry; SQLite falls back to neutral cluster
 * events.
 *
 * State transitions:
 *   created              → 'empty'
 *   joinClusterMember    → 'joined'
 *   electClusterPrimary  → 'primary-elected'
 *   detectClusterConflict→ 'conflict-detected'
 *   leaveClusterMember   → 'member-left'
 */
export type MysqlClusterState =
  | 'empty'
  | 'joined'
  | 'primary-elected'
  | 'conflict-detected'
  | 'member-left';

export interface MysqlClusterSession {
  groupName: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: MysqlClusterState;
  members: Set<string>;
  primaryId: string | null;
  conflictCount: number;
  history: AxisStep<MysqlClusterState>[];
}

function record(
  session: MysqlClusterSession,
  step: AxisStep<MysqlClusterState>,
): AxisStep<MysqlClusterState> {
  session.history.push(step);
  return step;
}

export function createMysqlClusterSession(input: {
  groupName: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): MysqlClusterSession {
  return {
    groupName: input.groupName,
    provider: input.provider,
    backend: input.backend,
    state: 'empty',
    members: new Set(),
    primaryId: null,
    conflictCount: 0,
    history: [],
  };
}

export function joinClusterMember(
  session: MysqlClusterSession,
  input: { memberId: string; weight: number },
): AxisStep<MysqlClusterState> {
  if (!input.memberId) {
    throw new Error('joinClusterMember: memberId is required');
  }
  if (session.members.has(input.memberId)) {
    throw new Error(`joinClusterMember: member ${input.memberId} already joined`);
  }
  if (input.weight < 0) {
    throw new Error('joinClusterMember: weight must be non-negative');
  }
  session.members.add(input.memberId);
  session.state = 'joined';
  return record(session, {
    neutralEvent: 'cluster.member-joined',
    backendEvent: backendEventName(session.backend, 'cluster.member-joined', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      memberId: input.memberId,
      weight: input.weight,
      memberCount: session.members.size,
    },
  });
}

export function electClusterPrimary(
  session: MysqlClusterSession,
  input: { memberId: string; mode: 'single-primary' | 'multi-primary' },
): AxisStep<MysqlClusterState> {
  if (!session.members.has(input.memberId)) {
    throw new Error(`electClusterPrimary: unknown member ${input.memberId}`);
  }
  if (input.mode !== 'single-primary') {
    throw new Error('electClusterPrimary: primary election requires single-primary mode');
  }
  session.primaryId = input.memberId;
  session.state = 'primary-elected';
  return record(session, {
    neutralEvent: 'cluster.primary-elected',
    backendEvent: backendEventName(session.backend, 'cluster.primary-elected', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      memberId: input.memberId,
      mode: input.mode,
      memberCount: session.members.size,
    },
  });
}

export function detectClusterConflict(
  session: MysqlClusterSession,
  input: { transactionId: string; winnerMemberId: string },
): AxisStep<MysqlClusterState> {
  if (session.state !== 'primary-elected' && session.state !== 'conflict-detected') {
    throw new Error(`detectClusterConflict: requires primary-elected state (got ${session.state})`);
  }
  if (!session.members.has(input.winnerMemberId)) {
    throw new Error(`detectClusterConflict: unknown winner ${input.winnerMemberId}`);
  }
  if (!input.transactionId) {
    throw new Error('detectClusterConflict: transactionId is required');
  }
  session.conflictCount += 1;
  session.state = 'conflict-detected';
  return record(session, {
    neutralEvent: 'cluster.conflict-detected',
    backendEvent: backendEventName(session.backend, 'cluster.conflict-detected', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      transactionId: input.transactionId,
      winnerMemberId: input.winnerMemberId,
      conflictCount: session.conflictCount,
    },
  });
}

export function leaveClusterMember(
  session: MysqlClusterSession,
  input: { memberId: string },
): AxisStep<MysqlClusterState> {
  if (!session.members.has(input.memberId)) {
    throw new Error(`leaveClusterMember: unknown member ${input.memberId}`);
  }
  session.members.delete(input.memberId);
  if (session.primaryId === input.memberId) session.primaryId = null;
  session.state = 'member-left';
  return record(session, {
    neutralEvent: 'cluster.member-left',
    backendEvent: backendEventName(session.backend, 'cluster.member-left', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      memberId: input.memberId,
      memberCount: session.members.size,
      primaryPresent: session.primaryId !== null,
    },
  });
}
