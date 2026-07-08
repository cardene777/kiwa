/**
 * v0.6 cli-lifecycle-orchestrator = CLI process lifecycle (spawn + IO stream +
 * signal + exit code + cleanup) の 継続合成 layer。 depth-5 pattern 13 例目 candidate、
 * backend systems layer 第 5 例 (backend layer 完全普及)、 systematic pattern 55 度目。
 */

export type CliState =
  | 'spawning'
  | 'running'
  | 'signaled'
  | 'exited'
  | 'cleaned';

export type CliEvent =
  | 'spawn-succeeded'
  | 'stdout-received'
  | 'stderr-received'
  | 'signal-sent'
  | 'exit-detected'
  | 'cleanup-requested'
  | 'zombie-detected'
  | 'timeout';

export interface CliSession {
  state: CliState;
  spawns: number;
  stdoutChunks: number;
  stderrChunks: number;
  signals: number;
  cleanups: number;
  zombies: number;
  lastEventAt: string;
  events: string[];
}

export function startCli(input: { timestamp: string }): CliSession {
  return {
    state: 'spawning',
    spawns: 0,
    stdoutChunks: 0,
    stderrChunks: 0,
    signals: 0,
    cleanups: 0,
    zombies: 0,
    lastEventAt: input.timestamp,
    events: ['cli-started'],
  };
}

export function dispatchEvent(input: {
  session: CliSession;
  event: CliEvent;
  timestamp: string;
}): CliSession {
  const { session, event, timestamp } = input;
  const nextEvents = [...session.events, `event:${event}`];
  const base = { ...session, lastEventAt: timestamp, events: nextEvents };

  switch (session.state) {
    case 'spawning': {
      if (event === 'spawn-succeeded') {
        return { ...base, state: 'running', spawns: session.spawns + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'exited' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'running': {
      if (event === 'stdout-received') {
        return { ...base, stdoutChunks: session.stdoutChunks + 1 };
      }
      if (event === 'stderr-received') {
        return { ...base, stderrChunks: session.stderrChunks + 1 };
      }
      if (event === 'signal-sent') {
        return {
          ...base,
          state: 'signaled',
          signals: session.signals + 1,
        };
      }
      if (event === 'exit-detected') {
        return { ...base, state: 'exited' };
      }
      if (event === 'timeout') {
        return { ...base, state: 'exited' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'signaled': {
      if (event === 'exit-detected') {
        return { ...base, state: 'exited' };
      }
      if (event === 'zombie-detected') {
        return { ...base, zombies: session.zombies + 1 };
      }
      if (event === 'timeout') {
        return { ...base, state: 'exited' };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'exited': {
      if (event === 'cleanup-requested') {
        return { ...base, state: 'cleaned', cleanups: session.cleanups + 1 };
      }
      if (event === 'zombie-detected') {
        return { ...base, zombies: session.zombies + 1 };
      }
      return { ...base, events: [...nextEvents, `invalid:${event}-in-${session.state}`] };
    }
    case 'cleaned': {
      return { ...base, events: [...nextEvents, `terminal:${event}-in-${session.state}`] };
    }
  }
}

export interface CliSummary {
  currentState: CliState;
  totalEvents: number;
  validEvents: number;
  invalidEvents: number;
  terminalEvents: number;
  spawns: number;
  stdoutChunks: number;
  stderrChunks: number;
  signals: number;
  cleanups: number;
  zombies: number;
}

export function summarizeCli(session: CliSession): CliSummary {
  const invalid = session.events.filter((e) => e.startsWith('invalid:')).length;
  const terminal = session.events.filter((e) => e.startsWith('terminal:')).length;
  const eventOnly = session.events.filter((e) => e.startsWith('event:')).length;
  return {
    currentState: session.state,
    totalEvents: session.events.length,
    validEvents: eventOnly - invalid - terminal,
    invalidEvents: invalid,
    terminalEvents: terminal,
    spawns: session.spawns,
    stdoutChunks: session.stdoutChunks,
    stderrChunks: session.stderrChunks,
    signals: session.signals,
    cleanups: session.cleanups,
    zombies: session.zombies,
  };
}
