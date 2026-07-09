import {
  startCli,
  dispatchCliEvent,
  summarizeCli,
  type CliSession,
  type CliSummary,
  type CliEvent,
} from '@kiwa-lab/cli-test';

export function bootCli(input: { timestamp: string }): CliSession {
  return startCli({ timestamp: input.timestamp });
}

export function pipeCliEvents(input: {
  session: CliSession;
  events: { event: CliEvent; timestamp: string }[];
}): CliSession {
  return input.events.reduce<CliSession>(
    (acc, e) => dispatchCliEvent({ session: acc, event: e.event, timestamp: e.timestamp }),
    input.session,
  );
}

export function renderCliDashboard(session: CliSession): CliSummary {
  return summarizeCli(session);
}

export function extractStderrShare(session: CliSession): { share: number } {
  const total = session.stdoutChunks + session.stderrChunks;
  return { share: total === 0 ? 0 : session.stderrChunks / total };
}

export function traceZombieCount(session: CliSession): { count: number } {
  return { count: session.zombies };
}
