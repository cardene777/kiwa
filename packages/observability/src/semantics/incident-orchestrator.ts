/**
 * v2.1 incident-orchestrator = alert routing + escalation + AIOps + FinOps +
 * chaos の 継続合成 layer。 depth-5 pattern 8 例目発生 = systematic law 継続強化 第 2 例、
 * systematic pattern 50 度目 (systematic law 継承 第 2 例、 50 度到達 milestone)。
 */

export type IncidentState =
  | 'detecting'
  | 'triaging'
  | 'escalating'
  | 'mitigating'
  | 'resolved';

export type IncidentEvent =
  | 'anomaly-detected'
  | 'triage-completed'
  | 'escalation-triggered'
  | 'escalation-succeeded'
  | 'mitigation-applied'
  | 'incident-resolved'
  | 'false-positive'
  | 'timeout';

export interface IncidentSession {
  state: IncidentState;
  anomaliesDetected: number;
  triageAttempts: number;
  escalationsExecuted: number;
  mitigationsApplied: number;
  falsePositives: number;
  lastEventAt: string;
  events: string[];
}

export function startIncident(input: { timestamp: string }): IncidentSession {
  return {
    state: 'detecting',
    anomaliesDetected: 0,
    triageAttempts: 0,
    escalationsExecuted: 0,
    mitigationsApplied: 0,
    falsePositives: 0,
    lastEventAt: input.timestamp,
    events: ['incident-started'],
  };
}

export function dispatchEvent(input: {
  session: IncidentSession;
  event: IncidentEvent;
  timestamp: string;
}): IncidentSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'detecting': {
      if (event === 'anomaly-detected') {
        return {
          ...base,
          state: 'triaging',
          anomaliesDetected: session.anomaliesDetected + 1,
        };
      }
      if (event === 'false-positive') {
        return {
          ...base,
          state: 'resolved',
          falsePositives: session.falsePositives + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'resolved' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'triaging': {
      if (event === 'triage-completed') {
        return {
          ...base,
          state: 'escalating',
          triageAttempts: session.triageAttempts + 1,
        };
      }
      if (event === 'false-positive') {
        return { ...base, state: 'resolved', falsePositives: session.falsePositives + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'resolved' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'escalating': {
      if (event === 'escalation-succeeded') {
        return {
          ...base,
          state: 'mitigating',
          escalationsExecuted: session.escalationsExecuted + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'resolved' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'mitigating': {
      if (event === 'mitigation-applied') {
        return { ...base, mitigationsApplied: session.mitigationsApplied + 1 };
      }
      if (event === 'incident-resolved') {
        return { ...base, state: 'resolved' };
      }
      if (event === 'timeout') {
        return { ...base, state: 'resolved' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'resolved': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface IncidentSummary {
  currentState: IncidentState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  anomaliesDetected: number;
  escalationsExecuted: number;
  mitigationsApplied: number;
  falsePositives: number;
}

export function summarizeIncident(session: IncidentSession): IncidentSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    anomaliesDetected: session.anomaliesDetected,
    escalationsExecuted: session.escalationsExecuted,
    mitigationsApplied: session.mitigationsApplied,
    falsePositives: session.falsePositives,
  };
}
