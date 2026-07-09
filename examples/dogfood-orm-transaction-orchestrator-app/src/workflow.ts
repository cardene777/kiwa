import {
  startTransaction,
  dispatchTransactionEvent,
  summarizeTransaction,
  type TransactionSession,
  type TransactionSummary,
  type TransactionEvent,
} from '@kiwa-lab/orm';

export function bootTransaction(input: { timestamp: string }): TransactionSession {
  return startTransaction({ timestamp: input.timestamp });
}

export function pipeTransactionEvents(input: {
  session: TransactionSession;
  events: { event: TransactionEvent; timestamp: string }[];
}): TransactionSession {
  return input.events.reduce<TransactionSession>(
    (acc, e) => dispatchTransactionEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderTransactionDashboard(session: TransactionSession): TransactionSummary {
  return summarizeTransaction(session);
}

export function extractRollbackRate(session: TransactionSession): { rate: number } {
  const total = session.events.filter((e: string) => e.startsWith('event:')).length;
  return { rate: total === 0 ? 0 : session.rollbacksExecuted / total };
}

export function traceSavepointDepth(session: TransactionSession): { depth: number } {
  return { depth: session.savepointsCreated - session.savepointsReleased };
}
