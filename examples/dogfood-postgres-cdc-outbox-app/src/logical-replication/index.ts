/**
 * Logical replication advanced flow driver — wraps orm v0.10
 * `createLogicalReplicationAdvancedSession` + 4 state-transition primitives
 * (`startLogicalStreaming`, `trackReplicationOrigin`, `confirmTwoSafeCommit`,
 * `syncCascadedSubscription`) into a single dogfood run that walks the
 * Postgres 16 pgoutput protocol end-to-end.
 *
 * v1.32-2 scope: 1 slot × 1 publication × 1 subscription × 1 cascaded
 * downstream. The mock semantics record every state transition as a
 * neutral event ('logical-advanced.streaming-started' etc); the real
 * driver defers to a Postgres 16 wal2json / pgoutput client wired via
 * `POSTGRES_BOOTSTRAP` (v1.32-6 scope).
 */

import {
  confirmTwoSafeCommit,
  createLogicalReplicationAdvancedSession,
  startLogicalStreaming,
  syncCascadedSubscription,
  trackReplicationOrigin,
  type LogicalReplicationAdvancedSession,
} from '@kiwa-test/orm';
import type { LogicalReplicationAdvancedObservation } from '../adapters/interface.js';

export interface DriveLogicalReplicationInput {
  readonly streamId?: string;
  readonly startLsn?: number;
  readonly protocolVersion?: number;
  readonly originId?: string;
  readonly remoteLsn?: number;
  readonly confirmedFlushLsn?: number;
  readonly synchronousStandbys?: number;
  readonly upstreamId?: string;
  readonly subscriberId?: string;
}

const DEFAULTS = {
  streamId: 'pub_orders_v2',
  startLsn: 10_000,
  protocolVersion: 4, // Postgres 16 pgoutput default
  originId: 'origin_orders_subscriber',
  remoteLsn: 10_500,
  confirmedFlushLsn: 11_200,
  synchronousStandbys: 2,
  upstreamId: 'upstream_orders_publisher',
  subscriberId: 'cascade_orders_downstream',
};

export interface DriveLogicalReplicationResult {
  observation: LogicalReplicationAdvancedObservation;
  session: LogicalReplicationAdvancedSession;
}

/**
 * Walk the 4-state logical replication advanced flow. Every step MUST
 * succeed for the dogfood observation to record the terminal
 * `cascade-synced` state; the mock semantics enforce state ordering + LSN
 * monotonicity so callers can pin the expected transition sequence.
 */
export function driveLogicalReplicationFlow(
  input: DriveLogicalReplicationInput = {},
): DriveLogicalReplicationResult {
  const cfg = { ...DEFAULTS, ...input };

  const session = createLogicalReplicationAdvancedSession({
    streamId: cfg.streamId,
    provider: 'drizzle',
    backend: 'postgres',
  });

  startLogicalStreaming(session, {
    startLsn: cfg.startLsn,
    protocolVersion: cfg.protocolVersion,
  });

  trackReplicationOrigin(session, {
    originId: cfg.originId,
    remoteLsn: cfg.remoteLsn,
  });

  confirmTwoSafeCommit(session, {
    confirmedFlushLsn: cfg.confirmedFlushLsn,
    synchronousStandbys: cfg.synchronousStandbys,
  });

  syncCascadedSubscription(session, {
    upstreamId: cfg.upstreamId,
    subscriberId: cfg.subscriberId,
  });

  const observation: LogicalReplicationAdvancedObservation = {
    startLsn: session.startLsn,
    originId: session.originId ?? '',
    confirmedFlushLsn: session.confirmedLsn,
    synchronousStandbys: cfg.synchronousStandbys,
    cascadedSubscribers: session.cascadedSubscribers.size,
    finalState: session.state,
  };

  return { observation, session };
}
