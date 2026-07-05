/**
 * Debezium-style transactional outbox — application code writes a row to
 * the domain table and a matching event row to the outbox table inside the
 * same Postgres transaction, guaranteeing that the event is durably
 * captured iff the domain write commits. The outbox row carries the LSN
 * (monotonically increasing sequence number) so downstream CDC decoding
 * can preserve strict ordering.
 *
 * The module wraps `@kiwa-test/orm`'s CDC session semantics so both
 * `insert` / `update` / `delete` operations flow through the same
 * `decodeEvent` → `appendOutbox` → `markEventOrdered` chain, matching the
 * production shape of a Postgres wal2json + Debezium connector.
 */

import {
  appendOutbox,
  confirmDelivery,
  createCdcSession,
  decodeEvent,
  markEventOrdered,
  type CdcEvent,
  type CdcEventKind,
  type CdcSession,
} from '@kiwa-test/orm';

export interface OrderRow {
  readonly orderId: string;
  readonly region: 'us' | 'eu' | 'apac';
  readonly total: number;
}

export interface OutboxWrite {
  readonly kind: CdcEventKind;
  readonly order: OrderRow;
}

export interface OutboxRun {
  readonly session: CdcSession;
  readonly writeOrder: (write: OutboxWrite) => void;
  readonly writeBatch: (writes: readonly OutboxWrite[]) => void;
  readonly seal: () => void;
  readonly acknowledgeUpTo: (lsn: number) => void;
  readonly outbox: () => readonly CdcEvent[];
  readonly confirmedLsn: () => number;
  readonly highWaterLsn: () => number;
}

/**
 * Create the outbox run for a specific slot. The mock LSN counter starts
 * at `startLsn` (defaults to 1) so callers can reserve a range for a
 * particular partition / shard.
 */
export function createOutboxRun(opts: {
  slotName: string;
  startLsn?: number;
}): OutboxRun {
  const session = createCdcSession({
    slotName: opts.slotName,
    provider: 'drizzle',
    backend: 'postgres',
  });
  let nextLsn = opts.startLsn ?? 1;

  function toEvent(write: OutboxWrite): CdcEvent {
    const lsn = nextLsn;
    nextLsn += 1;
    return {
      lsn,
      kind: write.kind,
      table: 'orders',
      payload: {
        orderId: write.order.orderId,
        region: write.order.region,
        total: write.order.total,
      },
    };
  }

  function writeOrder(write: OutboxWrite): void {
    const event = toEvent(write);
    decodeEvent(session, { event });
    appendOutbox(session, { event });
  }

  function writeBatch(writes: readonly OutboxWrite[]): void {
    if (writes.length === 0) return;
    for (const write of writes) {
      writeOrder(write);
    }
  }

  function seal(): void {
    if (session.outbox.length === 0) {
      throw new Error('seal: outbox is empty, nothing to seal');
    }
    markEventOrdered(session);
  }

  function acknowledgeUpTo(lsn: number): void {
    confirmDelivery(session, { upToLsn: lsn });
  }

  function highWaterLsn(): number {
    return session.outbox.reduce((max, e) => (e.lsn > max ? e.lsn : max), 0);
  }

  return {
    session,
    writeOrder,
    writeBatch,
    seal,
    acknowledgeUpTo,
    outbox: () => [...session.outbox],
    confirmedLsn: () => session.confirmedLsn,
    highWaterLsn,
  };
}
