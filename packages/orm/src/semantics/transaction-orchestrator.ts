/**
 * v0.6 transaction-orchestrator = txn-isolation + mvcc + connection-pool +
 * logical-replication + partitioning の 継続合成 layer。 depth-5 pattern 9 例目
 * = systematic law 継続強化 第 3 例、 systematic pattern 51 度目 (継続深化 pattern
 * 9 例目 candidate、 backend systems layer への 初適用)。
 */

export type TransactionState =
  | 'beginning'
  | 'active'
  | 'savepoint-nested'
  | 'committing'
  | 'aborted';

export type TransactionEvent =
  | 'begin-completed'
  | 'query-executed'
  | 'savepoint-created'
  | 'savepoint-released'
  | 'commit-requested'
  | 'commit-succeeded'
  | 'rollback-requested'
  | 'timeout';

export interface TransactionSession {
  state: TransactionState;
  queriesExecuted: number;
  savepointsCreated: number;
  savepointsReleased: number;
  commitsSucceeded: number;
  rollbacksExecuted: number;
  lastEventAt: string;
  events: string[];
}

export function startTransaction(input: { timestamp: string }): TransactionSession {
  return {
    state: 'beginning',
    queriesExecuted: 0,
    savepointsCreated: 0,
    savepointsReleased: 0,
    commitsSucceeded: 0,
    rollbacksExecuted: 0,
    lastEventAt: input.timestamp,
    events: ['transaction-started'],
  };
}

export function dispatchEvent(input: {
  session: TransactionSession;
  event: TransactionEvent;
  timestamp: string;
}): TransactionSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'beginning': {
      if (event === 'begin-completed') {
        return { ...base, state: 'active' };
      }
      if (event === 'rollback-requested') {
        return {
          ...base,
          state: 'aborted',
          rollbacksExecuted: session.rollbacksExecuted + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'aborted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'active': {
      if (event === 'query-executed') {
        return { ...base, queriesExecuted: session.queriesExecuted + 1 };
      }
      if (event === 'savepoint-created') {
        return {
          ...base,
          state: 'savepoint-nested',
          savepointsCreated: session.savepointsCreated + 1,
        };
      }
      if (event === 'commit-requested') {
        return { ...base, state: 'committing' };
      }
      if (event === 'rollback-requested') {
        return {
          ...base,
          state: 'aborted',
          rollbacksExecuted: session.rollbacksExecuted + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'aborted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'savepoint-nested': {
      if (event === 'query-executed') {
        return { ...base, queriesExecuted: session.queriesExecuted + 1 };
      }
      if (event === 'savepoint-released') {
        return {
          ...base,
          state: 'active',
          savepointsReleased: session.savepointsReleased + 1,
        };
      }
      if (event === 'rollback-requested') {
        return {
          ...base,
          state: 'aborted',
          rollbacksExecuted: session.rollbacksExecuted + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'aborted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'committing': {
      if (event === 'commit-succeeded') {
        return { ...base, commitsSucceeded: session.commitsSucceeded + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'aborted' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'aborted': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface TransactionSummary {
  currentState: TransactionState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  queriesExecuted: number;
  savepointsCreated: number;
  savepointsReleased: number;
  commitsSucceeded: number;
  rollbacksExecuted: number;
}

export function summarizeTransaction(session: TransactionSession): TransactionSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    queriesExecuted: session.queriesExecuted,
    savepointsCreated: session.savepointsCreated,
    savepointsReleased: session.savepointsReleased,
    commitsSucceeded: session.commitsSucceeded,
    rollbacksExecuted: session.rollbacksExecuted,
  };
}
