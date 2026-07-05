import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * MVCC — multi-version concurrency control. Snapshot isolation vs
 * serializable isolation, phantom reads, lost updates, and deadlock
 * detection. Postgres has real MVCC with snapshot / serializable
 * isolation, MySQL InnoDB has snapshot + gap locks, SQLite has a single
 * writer + WAL that behaves like coarse-grained snapshot isolation. All 3
 * backends map to the same 4 neutral events with backend dialect via
 * {@link backendEventName}.
 *
 * State transitions:
 *   created                  → 'active'
 *   takeSnapshot             → 'snapshot-held'
 *   abortSerializable        → 'aborted'
 *   blockPhantom             → 'phantom-blocked'
 *   detectDeadlock           → 'deadlocked'
 */
export type MvccState =
  | 'active'
  | 'snapshot-held'
  | 'aborted'
  | 'phantom-blocked'
  | 'deadlocked';

export type IsolationLevel = 'read-committed' | 'repeatable-read' | 'serializable';

export interface MvccSession {
  txnId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  isolation: IsolationLevel;
  state: MvccState;
  snapshotId: number | null;
  history: AxisStep<MvccState>[];
}

function record(session: MvccSession, step: AxisStep<MvccState>): AxisStep<MvccState> {
  session.history.push(step);
  return step;
}

/**
 * Create an MVCC transaction session. State starts at 'active' with the
 * requested isolation level and no snapshot taken.
 */
export function createMvccSession(input: {
  txnId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  isolation: IsolationLevel;
}): MvccSession {
  return {
    txnId: input.txnId,
    provider: input.provider,
    backend: input.backend,
    isolation: input.isolation,
    state: 'active',
    snapshotId: null,
    history: [],
  };
}

/**
 * Take a snapshot. Requires the txn to be 'active' or already
 * 'snapshot-held' (re-taking a snapshot at a new LSN is legal). Emits
 * `mvcc.snapshot-taken`.
 */
export function takeSnapshot(
  session: MvccSession,
  input: { snapshotId: number },
): AxisStep<MvccState> {
  if (session.state === 'aborted' || session.state === 'deadlocked') {
    throw new Error(`takeSnapshot: txn is ${session.state}`);
  }
  session.snapshotId = input.snapshotId;
  session.state = 'snapshot-held';
  return record(session, {
    neutralEvent: 'mvcc.snapshot-taken',
    backendEvent: backendEventName(session.backend, 'mvcc.snapshot-taken', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      snapshotId: input.snapshotId,
      isolation: session.isolation,
    },
  });
}

/**
 * Abort a serializable transaction due to serialization failure. Requires
 * isolation === 'serializable'; a serialization abort at a lower isolation
 * level is a bug. Emits `mvcc.serializable-aborted`.
 */
export function abortSerializable(
  session: MvccSession,
  input: { reason: string },
): AxisStep<MvccState> {
  if (session.isolation !== 'serializable') {
    throw new Error(
      `abortSerializable: requires serializable isolation (got ${session.isolation})`,
    );
  }
  if (session.state === 'aborted' || session.state === 'deadlocked') {
    throw new Error(`abortSerializable: txn already ${session.state}`);
  }
  session.state = 'aborted';
  return record(session, {
    neutralEvent: 'mvcc.serializable-aborted',
    backendEvent: backendEventName(
      session.backend,
      'mvcc.serializable-aborted',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: { reason: input.reason, isolation: session.isolation },
  });
}

/**
 * Signal that a phantom read was blocked by predicate / gap locks. Requires
 * isolation at least 'repeatable-read'; read-committed does not prevent
 * phantoms so blocking one at that level is a bug. Emits
 * `mvcc.phantom-blocked`.
 */
export function blockPhantom(
  session: MvccSession,
  input: { predicate: string; blockingTxn: string },
): AxisStep<MvccState> {
  if (session.isolation === 'read-committed') {
    throw new Error(
      "blockPhantom: read-committed does not prevent phantom reads",
    );
  }
  if (session.state === 'aborted' || session.state === 'deadlocked') {
    throw new Error(`blockPhantom: txn is ${session.state}`);
  }
  session.state = 'phantom-blocked';
  return record(session, {
    neutralEvent: 'mvcc.phantom-blocked',
    backendEvent: backendEventName(
      session.backend,
      'mvcc.phantom-blocked',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      predicate: input.predicate,
      blockingTxn: input.blockingTxn,
      isolation: session.isolation,
    },
  });
}

/**
 * Detect a deadlock involving this txn. Emits `mvcc.deadlock-detected` and
 * moves the txn into 'deadlocked'. The caller supplies the deadlock cycle
 * (an array of participating txn ids) so telemetry can identify the ring.
 */
export function detectDeadlock(
  session: MvccSession,
  input: { cycle: string[] },
): AxisStep<MvccState> {
  if (input.cycle.length < 2) {
    throw new Error('detectDeadlock: cycle must include at least 2 txns');
  }
  if (!input.cycle.includes(session.txnId)) {
    throw new Error(
      `detectDeadlock: session txn ${session.txnId} not in cycle`,
    );
  }
  session.state = 'deadlocked';
  return record(session, {
    neutralEvent: 'mvcc.deadlock-detected',
    backendEvent: backendEventName(
      session.backend,
      'mvcc.deadlock-detected',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      cycleLength: input.cycle.length,
      victim: session.txnId,
    },
  });
}
