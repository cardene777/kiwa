import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Transaction isolation — level switching across read-uncommitted,
 * read-committed, repeatable-read, and serializable plus blocking the
 * classic ANSI phenomena. Postgres / MySQL map to SET TRANSACTION
 * ISOLATION; SQLite maps to pragma locking / read-uncommitted controls.
 *
 * State transitions:
 *   created                 → 'idle'
 *   setTxnIsolationLevel    → 'level-set'
 *   blockDirtyRead          → 'dirty-read-blocked'
 *   blockNonRepeatableRead  → 'non-repeatable-read-blocked'
 *   blockPhantomRead        → 'phantom-read-blocked'
 */
export type TxnIsolationState =
  | 'idle'
  | 'level-set'
  | 'dirty-read-blocked'
  | 'non-repeatable-read-blocked'
  | 'phantom-read-blocked';

export type TxnIsolationLevel =
  | 'read-uncommitted'
  | 'read-committed'
  | 'repeatable-read'
  | 'serializable';

export interface TxnIsolationSession {
  txnId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: TxnIsolationState;
  level: TxnIsolationLevel | null;
  blockedPhenomena: Set<string>;
  history: AxisStep<TxnIsolationState>[];
}

function record(
  session: TxnIsolationSession,
  step: AxisStep<TxnIsolationState>,
): AxisStep<TxnIsolationState> {
  session.history.push(step);
  return step;
}

export function createTxnIsolationSession(input: {
  txnId: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): TxnIsolationSession {
  return {
    txnId: input.txnId,
    provider: input.provider,
    backend: input.backend,
    state: 'idle',
    level: null,
    blockedPhenomena: new Set(),
    history: [],
  };
}

export function setTxnIsolationLevel(
  session: TxnIsolationSession,
  input: { level: TxnIsolationLevel },
): AxisStep<TxnIsolationState> {
  session.level = input.level;
  session.state = 'level-set';
  return record(session, {
    neutralEvent: 'txn.level-set',
    backendEvent: backendEventName(session.backend, 'txn.level-set', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      txnId: session.txnId,
      level: input.level,
    },
  });
}

export function blockDirtyRead(
  session: TxnIsolationSession,
  input: { readerTxnId: string },
): AxisStep<TxnIsolationState> {
  if (session.level === null) {
    throw new Error('blockDirtyRead: isolation level has not been set');
  }
  if (session.level === 'read-uncommitted') {
    throw new Error('blockDirtyRead: read-uncommitted permits dirty reads');
  }
  session.blockedPhenomena.add('dirty-read');
  session.state = 'dirty-read-blocked';
  return record(session, {
    neutralEvent: 'txn.dirty-read-blocked',
    backendEvent: backendEventName(session.backend, 'txn.dirty-read-blocked', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      readerTxnId: input.readerTxnId,
      level: session.level,
    },
  });
}

export function blockNonRepeatableRead(
  session: TxnIsolationSession,
  input: { rowKey: string },
): AxisStep<TxnIsolationState> {
  if (session.level !== 'repeatable-read' && session.level !== 'serializable') {
    throw new Error(
      `blockNonRepeatableRead: requires repeatable-read or serializable (got ${session.level})`,
    );
  }
  if (!session.blockedPhenomena.has('dirty-read')) {
    throw new Error('blockNonRepeatableRead: dirty read guard must run first');
  }
  session.blockedPhenomena.add('non-repeatable-read');
  session.state = 'non-repeatable-read-blocked';
  return record(session, {
    neutralEvent: 'txn.non-repeatable-read-blocked',
    backendEvent: backendEventName(
      session.backend,
      'txn.non-repeatable-read-blocked',
      session.provider,
    ),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      rowKey: input.rowKey,
      level: session.level,
    },
  });
}

export function blockPhantomRead(
  session: TxnIsolationSession,
  input: { predicate: string },
): AxisStep<TxnIsolationState> {
  if (session.level !== 'serializable') {
    throw new Error(`blockPhantomRead: requires serializable isolation (got ${session.level})`);
  }
  if (!session.blockedPhenomena.has('non-repeatable-read')) {
    throw new Error('blockPhantomRead: non-repeatable read guard must run first');
  }
  session.blockedPhenomena.add('phantom-read');
  session.state = 'phantom-read-blocked';
  return record(session, {
    neutralEvent: 'txn.phantom-read-blocked',
    backendEvent: backendEventName(session.backend, 'txn.phantom-read-blocked', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      predicate: input.predicate,
      level: session.level,
    },
  });
}
