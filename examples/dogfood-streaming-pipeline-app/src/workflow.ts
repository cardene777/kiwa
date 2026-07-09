import {
  dispatchPipelineEvent,
  startPipeline,
  summarizePipeline,
  type PipelineEvent,
  type PipelineSession,
  type PipelineSummary,
} from '@kiwa-lab/streaming';

export function bootPipeline(input: { timestamp: string }): PipelineSession {
  return startPipeline({ timestamp: input.timestamp });
}

export function runEventStream(input: {
  session: PipelineSession;
  events: { event: PipelineEvent; timestamp: string }[];
}): PipelineSession {
  return input.events.reduce<PipelineSession>(
    (acc, e) => dispatchPipelineEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderPipelineDashboard(session: PipelineSession): PipelineSummary {
  return summarizePipeline(session);
}

export function extractDlqStats(session: PipelineSession): {
  totalDlqEvents: number;
  currentDlqCount: number;
} {
  const dlq = session.events.filter((e: string) => e.includes('dlq')).length;
  return {
    totalDlqEvents: dlq,
    currentDlqCount: session.dlqMessagesCount,
  };
}
