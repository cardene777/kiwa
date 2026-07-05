import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Change data capture (CDC) — decode a backend-specific change log into
 * neutral events, append to a Debezium-style outbox table, keep events in
 * strict LSN order, and confirm at-least-once delivery. Postgres uses
 * logical decoding (wal2json), MySQL uses Debezium against the binlog,
 * SQLite has no server-side CDC so the mock falls back to neutral names.
 *
 * State transitions:
 *   created                  → 'idle'
 *   decodeEvent              → 'decoding'
 *   appendOutbox             → 'buffered'
 *   markEventOrdered         → 'ordered'
 *   confirmDelivery          → 'delivered'
 */
export type CdcState = 'idle' | 'decoding' | 'buffered' | 'ordered' | 'delivered';

export type CdcEventKind = 'insert' | 'update' | 'delete';

export interface CdcEvent {
  lsn: number;
  kind: CdcEventKind;
  table: string;
  payload: Record<string, string | number | boolean>;
}

export interface CdcSession {
  slotName: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: CdcState;
  decoded: CdcEvent[];
  outbox: CdcEvent[];
  confirmedLsn: number;
  history: AxisStep<CdcState>[];
}

function record(session: CdcSession, step: AxisStep<CdcState>): AxisStep<CdcState> {
  session.history.push(step);
  return step;
}

/**
 * Create a CDC session bound to a logical slot / consumer id. State starts
 * at 'idle' with an empty decoded / outbox buffer.
 */
export function createCdcSession(input: {
  slotName: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): CdcSession {
  return {
    slotName: input.slotName,
    provider: input.provider,
    backend: input.backend,
    state: 'idle',
    decoded: [],
    outbox: [],
    confirmedLsn: 0,
    history: [],
  };
}

/**
 * Decode a single change log entry into a neutral CDC event. Appends to the
 * decoded buffer and moves the session into 'decoding'. Emits
 * `cdc.decoded`.
 */
export function decodeEvent(
  session: CdcSession,
  input: { event: CdcEvent },
): AxisStep<CdcState> {
  if (input.event.lsn <= 0) {
    throw new Error('decodeEvent: lsn must be positive');
  }
  session.decoded.push(input.event);
  session.state = 'decoding';
  return record(session, {
    neutralEvent: 'cdc.decoded',
    backendEvent: backendEventName(session.backend, 'cdc.decoded', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      lsn: input.event.lsn,
      kind: input.event.kind,
      table: input.event.table,
    },
  });
}

/**
 * Append the last decoded event (or an explicitly supplied one) to the
 * Debezium-style outbox table. Emits `cdc.outbox-appended`. Requires the
 * session to be 'decoding' or 'ordered' — an idle session with no decoded
 * events cannot append silently.
 */
export function appendOutbox(
  session: CdcSession,
  input: { event?: CdcEvent },
): AxisStep<CdcState> {
  const event = input.event ?? session.decoded[session.decoded.length - 1];
  if (!event) {
    throw new Error('appendOutbox: no event to append (decoded buffer is empty)');
  }
  session.outbox.push(event);
  session.state = 'buffered';
  return record(session, {
    neutralEvent: 'cdc.outbox-appended',
    backendEvent: backendEventName(session.backend, 'cdc.outbox-appended', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      lsn: event.lsn,
      table: event.table,
      outboxSize: session.outbox.length,
    },
  });
}

/**
 * Assert strict LSN ordering on the outbox. Walks the outbox and rejects if
 * an event has a smaller LSN than a predecessor. Emits `cdc.event-ordered`.
 * The check is deterministic and idempotent — repeated calls after further
 * appends stay valid as long as ordering holds.
 */
export function markEventOrdered(session: CdcSession): AxisStep<CdcState> {
  if (session.outbox.length === 0) {
    throw new Error('markEventOrdered: outbox is empty');
  }
  let prev = 0;
  for (const event of session.outbox) {
    if (event.lsn <= prev) {
      throw new Error(
        `markEventOrdered: LSN out of order (${event.lsn} <= ${prev})`,
      );
    }
    prev = event.lsn;
  }
  session.state = 'ordered';
  return record(session, {
    neutralEvent: 'cdc.event-ordered',
    backendEvent: backendEventName(session.backend, 'cdc.event-ordered', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { highWaterLsn: prev, outboxSize: session.outbox.length },
  });
}

/**
 * Confirm at-least-once delivery up to a given LSN. Requires prior
 * `markEventOrdered` so that ordering is asserted before ack. Emits
 * `cdc.at-least-once-delivered` and advances `confirmedLsn`.
 */
export function confirmDelivery(
  session: CdcSession,
  input: { upToLsn: number },
): AxisStep<CdcState> {
  if (session.state !== 'ordered' && session.state !== 'delivered') {
    throw new Error(
      `confirmDelivery: requires ordered / delivered state (got ${session.state})`,
    );
  }
  if (input.upToLsn < session.confirmedLsn) {
    throw new Error(
      `confirmDelivery: upToLsn ${input.upToLsn} regresses confirmedLsn ${session.confirmedLsn}`,
    );
  }
  session.confirmedLsn = input.upToLsn;
  session.state = 'delivered';
  return record(session, {
    neutralEvent: 'cdc.at-least-once-delivered',
    backendEvent: backendEventName(
      session.backend,
      'cdc.at-least-once-delivered',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { confirmedLsn: session.confirmedLsn },
  });
}
