/**
 * Group replication advanced flow driver — wraps orm v0.10
 * `createMysqlClusterSession` + 4 state-transition primitives
 * (`joinClusterMember`, `electClusterPrimary`, `detectClusterConflict`,
 * `leaveClusterMember`) into a single dogfood run that walks the MySQL 8
 * group replication membership + election + conflict + leave lifecycle.
 *
 * v1.32-3 scope: 1 group × 2 joined members × 1 single-primary election
 * × 1 write conflict × 1 leave. The mock semantics record every state
 * transition as a neutral event; the real driver defers to a MySQL 8
 * group_replication + performance_schema client wired via `MYSQL_KEY`
 * (v1.32-6 scope).
 */

import {
  createMysqlClusterSession,
  detectClusterConflict,
  electClusterPrimary,
  joinClusterMember,
  leaveClusterMember,
  type MysqlClusterSession,
} from '@kiwa-test/orm';
import type { GroupReplicationObservation } from '../adapters/interface.js';

export interface DriveGroupReplicationInput {
  readonly groupName?: string;
  readonly primaryMemberId?: string;
  readonly secondaryMemberId?: string;
  readonly primaryWeight?: number;
  readonly secondaryWeight?: number;
  readonly conflictTransactionId?: string;
  readonly leaveMemberId?: string;
}

const DEFAULTS = {
  groupName: 'kiwa_orgs_group_v2',
  primaryMemberId: 'mysql-node-1',
  secondaryMemberId: 'mysql-node-2',
  primaryWeight: 100,
  secondaryWeight: 50,
  conflictTransactionId: 'gtid:kiwa-orgs:conflict-1',
  leaveMemberId: 'mysql-node-2',
};

export interface DriveGroupReplicationResult {
  observation: GroupReplicationObservation;
  session: MysqlClusterSession;
}

/**
 * Walk the 4-state group replication flow. Every step MUST succeed for
 * the dogfood observation to record the terminal `member-left` state;
 * the mock semantics enforce state ordering + member existence so callers
 * can pin the expected transition sequence.
 */
export function driveGroupReplicationFlow(
  input: DriveGroupReplicationInput = {},
): DriveGroupReplicationResult {
  const cfg = { ...DEFAULTS, ...input };

  const session = createMysqlClusterSession({
    groupName: cfg.groupName,
    provider: 'prisma',
    backend: 'mysql',
  });

  joinClusterMember(session, {
    memberId: cfg.primaryMemberId,
    weight: cfg.primaryWeight,
  });

  joinClusterMember(session, {
    memberId: cfg.secondaryMemberId,
    weight: cfg.secondaryWeight,
  });

  const peakMemberCount = session.members.size;

  electClusterPrimary(session, {
    memberId: cfg.primaryMemberId,
    mode: 'single-primary',
  });

  detectClusterConflict(session, {
    transactionId: cfg.conflictTransactionId,
    winnerMemberId: cfg.primaryMemberId,
  });

  leaveClusterMember(session, { memberId: cfg.leaveMemberId });

  const observation: GroupReplicationObservation = {
    groupName: session.groupName,
    primaryId: session.primaryId ?? '',
    peakMemberCount,
    conflictCount: session.conflictCount,
    finalState: session.state,
  };

  return { observation, session };
}
