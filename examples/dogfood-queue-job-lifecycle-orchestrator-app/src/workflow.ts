import {
  startJob,
  dispatchJobEvent,
  summarizeJob,
  type JobSession,
  type JobSummary,
  type JobEvent,
} from '@kiwa-lab/queue';

export function bootJob(input: { timestamp: string }): JobSession {
  return startJob({ timestamp: input.timestamp });
}

export function pipeJobEvents(input: {
  session: JobSession;
  events: { event: JobEvent; timestamp: string }[];
}): JobSession {
  return input.events.reduce<JobSession>(
    (acc, e) => dispatchJobEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderJobDashboard(session: JobSession): JobSummary {
  return summarizeJob(session);
}

export function extractFailureRate(session: JobSession): { rate: number } {
  const total = session.processSuccesses + session.processFailures;
  return { rate: total === 0 ? 0 : session.processFailures / total };
}

export function traceRetryDepth(session: JobSession): { retries: number } {
  return { retries: session.retries };
}
