/**
 * v0.8 session-lifecycle-orchestrator = continuous-auth + step-up-mfa + auth-continuity +
 * session-hijack-detect + auth-telemetry の 継続合成 layer。 depth-5 pattern 10 例目 candidate =
 * systematic law 継続強化 第 4 例、 systematic pattern 52 度目、 backend systems layer 第 2 例
 * (Auth = ORM に続く backend systems layer 2 例目)。
 */

export type SessionState =
  | 'init'
  | 'authed'
  | 'refreshing'
  | 'expired'
  | 'revoked';

export type SessionEvent =
  | 'auth-succeeded'
  | 'auth-failed'
  | 'refresh-triggered'
  | 'refresh-succeeded'
  | 'refresh-failed'
  | 'session-expired'
  | 'revoke-requested'
  | 'timeout';

export interface SessionOrchestratorSession {
  state: SessionState;
  authAttempts: number;
  authFailures: number;
  refreshesExecuted: number;
  refreshFailures: number;
  revokes: number;
  lastEventAt: string;
  events: string[];
}

export function startSession(input: { timestamp: string }): SessionOrchestratorSession {
  return {
    state: 'init',
    authAttempts: 0,
    authFailures: 0,
    refreshesExecuted: 0,
    refreshFailures: 0,
    revokes: 0,
    lastEventAt: input.timestamp,
    events: ['session-started'],
  };
}

export function dispatchEvent(input: {
  session: SessionOrchestratorSession;
  event: SessionEvent;
  timestamp: string;
}): SessionOrchestratorSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'init': {
      if (event === 'auth-succeeded') {
        return { ...base, state: 'authed', authAttempts: session.authAttempts + 1 };
      }
      if (event === 'auth-failed') {
        return {
          ...base,
          authAttempts: session.authAttempts + 1,
          authFailures: session.authFailures + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'expired' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'authed': {
      if (event === 'refresh-triggered') {
        return { ...base, state: 'refreshing' };
      }
      if (event === 'session-expired') {
        return { ...base, state: 'expired' };
      }
      if (event === 'revoke-requested') {
        return { ...base, state: 'revoked', revokes: session.revokes + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'expired' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'refreshing': {
      if (event === 'refresh-succeeded') {
        return { ...base, state: 'authed', refreshesExecuted: session.refreshesExecuted + 1 };
      }
      if (event === 'refresh-failed') {
        return {
          ...base,
          state: 'expired',
          refreshFailures: session.refreshFailures + 1,
        };
      }
      if (event === 'revoke-requested') {
        return { ...base, state: 'revoked', revokes: session.revokes + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'expired' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'expired': {
      if (event === 'revoke-requested') {
        return { ...base, state: 'revoked', revokes: session.revokes + 1 };
      }
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
    case 'revoked': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface SessionOrchestratorSummary {
  currentState: SessionState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  authAttempts: number;
  authFailures: number;
  refreshesExecuted: number;
  refreshFailures: number;
  revokes: number;
}

export function summarizeSession(
  session: SessionOrchestratorSession,
): SessionOrchestratorSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    authAttempts: session.authAttempts,
    authFailures: session.authFailures,
    refreshesExecuted: session.refreshesExecuted,
    refreshFailures: session.refreshFailures,
    revokes: session.revokes,
  };
}
