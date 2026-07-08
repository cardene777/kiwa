/**
 * CDC pickup — the pipeline reads events from the outbox in LSN order and
 * ships them to a Redis Streams consumer group. In production Postgres a
 * separate CDC connector (Debezium, wal2json + logical decoding) tails the
 * WAL, but the outbox pattern lets us short-circuit that by reading rows
 * directly. The neutral semantics are the same either way — decode →
 * append → order → deliver — so the dogfood re-uses the outbox session for
 * both the write and pickup sides.
 *
 * The module also wraps `@kiwa/orm`'s logical-replication semantics
 * so tests can observe publisher / subscription lifecycle events that
 * mirror production Postgres publications.
 */

import {
  createLogicalRepSession,
  createPublication,
  heartbeat,
  resolveConflict,
  syncSubscription,
  type CdcEvent,
  type ConflictStrategy,
  type LogicalRepSession,
} from '@kiwa/orm';

export interface PickupResult {
  readonly events: readonly CdcEvent[];
  readonly highWaterLsn: number;
}

/**
 * Read events from an outbox in LSN order, optionally filtering below a
 * previously-committed LSN. `since` is exclusive — passing `0` returns the
 * full outbox, passing the last-confirmed LSN returns only the newer events.
 */
export function pickupSince(outbox: readonly CdcEvent[], since: number): PickupResult {
  const events = outbox.filter((e) => e.lsn > since);
  const highWaterLsn = events.reduce((max, e) => (e.lsn > max ? e.lsn : max), since);
  return { events, highWaterLsn };
}

export interface PublicationRun {
  readonly session: LogicalRepSession;
  readonly publish: (name: string, tables: readonly string[]) => void;
  readonly subscribe: (subscriberId: string) => void;
  readonly beat: (at: number) => void;
  readonly resolve: (input: {
    subscriberId: string;
    strategy: ConflictStrategy;
    winner: 'publisher' | 'subscriber';
  }) => void;
}

/**
 * Create a logical replication session bound to a publisher id. Every
 * lifecycle mutation flows through the neutral semantics so the fidelity
 * harness records the publisher / subscription state transitions.
 */
export function createPublicationRun(opts: { publisherId: string }): PublicationRun {
  const session = createLogicalRepSession({
    publisherId: opts.publisherId,
    provider: 'drizzle',
    backend: 'postgres',
  });

  return {
    session,
    publish(name, tables) {
      createPublication(session, { name, tables: [...tables] });
    },
    subscribe(subscriberId) {
      syncSubscription(session, { subscriberId });
    },
    beat(at) {
      heartbeat(session, { at });
    },
    resolve(input) {
      resolveConflict(session, input);
    },
  };
}
