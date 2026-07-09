import { semantics } from '@kiwa-lab/search';

type QuerySession = semantics.QuerySession;
type QuerySummary = semantics.QuerySummary;
type QueryEvent = semantics.QueryEvent;

const startQuery = semantics.startQuery;
const dispatchQueryEvent = semantics.dispatchQueryEvent;
const summarizeQuery = semantics.summarizeQuery;

export function bootQuery(input: { timestamp: string }): QuerySession {
  return startQuery({ timestamp: input.timestamp });
}

export function pipeQueryEvents(input: {
  session: QuerySession;
  events: { event: QueryEvent; timestamp: string }[];
}): QuerySession {
  return input.events.reduce<QuerySession>(
    (acc, e) => dispatchQueryEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderQueryDashboard(session: QuerySession): QuerySummary {
  return summarizeQuery(session);
}

export function extractTimeoutStats(session: QuerySession): { timeouts: number } {
  return { timeouts: session.timeoutCount };
}
