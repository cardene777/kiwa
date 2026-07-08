import { semantics } from '@kiwa/observability';

type IncidentSession = semantics.IncidentSession;
type IncidentSummary = semantics.IncidentSummary;
type IncidentEvent = semantics.IncidentEvent;

const startIncident = semantics.startIncident;
const dispatchIncidentEvent = semantics.dispatchIncidentEvent;
const summarizeIncident = semantics.summarizeIncident;

export function bootIncident(input: { timestamp: string }): IncidentSession {
  return startIncident({ timestamp: input.timestamp });
}

export function pipeIncidentEvents(input: {
  session: IncidentSession;
  events: { event: IncidentEvent; timestamp: string }[];
}): IncidentSession {
  return input.events.reduce<IncidentSession>(
    (acc, e) => dispatchIncidentEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderIncidentDashboard(session: IncidentSession): IncidentSummary {
  return summarizeIncident(session);
}

export function extractFalsePositiveRate(session: IncidentSession): { rate: number } {
  const total = session.events.filter((e: string) => e.startsWith('event:')).length;
  return { rate: total === 0 ? 0 : session.falsePositives / total };
}
