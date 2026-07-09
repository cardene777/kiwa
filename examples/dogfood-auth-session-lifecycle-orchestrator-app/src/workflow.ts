import { semantics } from '@kiwa-lab/auth';

type SessionOrchestratorSession = semantics.SessionOrchestratorSession;
type SessionOrchestratorSummary = semantics.SessionOrchestratorSummary;
type SessionEvent = semantics.SessionEvent;

const startSession = semantics.startSession;
const dispatchSessionEvent = semantics.dispatchSessionEvent;
const summarizeSession = semantics.summarizeSession;

export function bootSession(input: { timestamp: string }): SessionOrchestratorSession {
  return startSession({ timestamp: input.timestamp });
}

export function pipeSessionEvents(input: {
  session: SessionOrchestratorSession;
  events: { event: SessionEvent; timestamp: string }[];
}): SessionOrchestratorSession {
  return input.events.reduce<SessionOrchestratorSession>(
    (acc, e) => dispatchSessionEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderSessionDashboard(
  session: SessionOrchestratorSession,
): SessionOrchestratorSummary {
  return summarizeSession(session);
}

export function extractAuthFailureRate(session: SessionOrchestratorSession): { rate: number } {
  return {
    rate: session.authAttempts === 0 ? 0 : session.authFailures / session.authAttempts,
  };
}

export function traceRefreshLoop(session: SessionOrchestratorSession): {
  ratio: number;
} {
  const total = session.refreshesExecuted + session.refreshFailures;
  return { ratio: total === 0 ? 0 : session.refreshesExecuted / total };
}
