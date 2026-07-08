/**
 * v0.6 job-lifecycle-orchestrator = 5 provider (BullMQ + Inngest + Cloudflare Queues
 * + AWS SQS + RabbitMQ) の 継続合成 layer。 depth-5 pattern 12 例目 candidate、
 * backend systems layer 第 4 例、 systematic pattern 54 度目。
 */

export type JobState =
  | 'queued'
  | 'processing'
  | 'retrying'
  | 'dlq'
  | 'completed';

export type JobEvent =
  | 'enqueue-succeeded'
  | 'process-started'
  | 'process-succeeded'
  | 'process-failed'
  | 'retry-scheduled'
  | 'retry-exhausted'
  | 'dlq-inspected'
  | 'timeout';

export interface JobSession {
  state: JobState;
  enqueues: number;
  processStarts: number;
  processSuccesses: number;
  processFailures: number;
  retries: number;
  dlqInspections: number;
  lastEventAt: string;
  events: string[];
}

export function startJob(input: { timestamp: string }): JobSession {
  return {
    state: 'queued',
    enqueues: 0,
    processStarts: 0,
    processSuccesses: 0,
    processFailures: 0,
    retries: 0,
    dlqInspections: 0,
    lastEventAt: input.timestamp,
    events: ['job-started'],
  };
}

export function dispatchEvent(input: {
  session: JobSession;
  event: JobEvent;
  timestamp: string;
}): JobSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'queued': {
      if (event === 'enqueue-succeeded') {
        return { ...base, enqueues: session.enqueues + 1 };
      }
      if (event === 'process-started') {
        return {
          ...base,
          state: 'processing',
          processStarts: session.processStarts + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'dlq' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'processing': {
      if (event === 'process-succeeded') {
        return {
          ...base,
          state: 'completed',
          processSuccesses: session.processSuccesses + 1,
        };
      }
      if (event === 'process-failed') {
        return {
          ...base,
          state: 'retrying',
          processFailures: session.processFailures + 1,
        };
      }
      if (event === 'timeout') {
        return { ...base, state: 'dlq' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'retrying': {
      if (event === 'retry-scheduled') {
        return {
          ...base,
          state: 'queued',
          retries: session.retries + 1,
        };
      }
      if (event === 'retry-exhausted') {
        return { ...base, state: 'dlq' };
      }
      if (event === 'timeout') {
        return { ...base, state: 'dlq' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'dlq': {
      if (event === 'dlq-inspected') {
        return { ...base, dlqInspections: session.dlqInspections + 1 };
      }
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
    case 'completed': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface JobSummary {
  currentState: JobState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  enqueues: number;
  processStarts: number;
  processSuccesses: number;
  processFailures: number;
  retries: number;
  dlqInspections: number;
}

export function summarizeJob(session: JobSession): JobSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    enqueues: session.enqueues,
    processStarts: session.processStarts,
    processSuccesses: session.processSuccesses,
    processFailures: session.processFailures,
    retries: session.retries,
    dlqInspections: session.dlqInspections,
  };
}
