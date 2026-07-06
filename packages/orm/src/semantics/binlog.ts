import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * Binlog — MySQL binary log position tracking, GTID set maintenance,
 * binlog_format negotiation, and GTID gap detection. MySQL maps to real
 * binlog / GTID telemetry; Postgres approximates with WAL LSN concepts;
 * SQLite falls back to WAL / changeset names.
 *
 * State transitions:
 *   created                → 'idle'
 *   advanceBinlogPosition  → 'positioned'
 *   updateGtidSet          → 'gtid-updated'
 *   negotiateBinlogFormat  → 'format-negotiated'
 *   detectGtidGap          → 'gap-detected'
 */
export type BinlogState =
  | 'idle'
  | 'positioned'
  | 'gtid-updated'
  | 'format-negotiated'
  | 'gap-detected';

export type BinlogFormat = 'ROW' | 'STATEMENT' | 'MIXED';

export interface BinlogSession {
  serverId: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: BinlogState;
  file: string;
  position: number;
  format: BinlogFormat | null;
  gtidSet: Set<string>;
  history: AxisStep<BinlogState>[];
}

function record(session: BinlogSession, step: AxisStep<BinlogState>): AxisStep<BinlogState> {
  session.history.push(step);
  return step;
}

export function createBinlogSession(input: {
  serverId: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): BinlogSession {
  return {
    serverId: input.serverId,
    provider: input.provider,
    backend: input.backend,
    state: 'idle',
    file: '',
    position: 0,
    format: null,
    gtidSet: new Set(),
    history: [],
  };
}

export function advanceBinlogPosition(
  session: BinlogSession,
  input: { file: string; position: number },
): AxisStep<BinlogState> {
  if (!input.file) {
    throw new Error('advanceBinlogPosition: file is required');
  }
  if (input.position <= 0) {
    throw new Error('advanceBinlogPosition: position must be positive');
  }
  if (input.file === session.file && input.position <= session.position) {
    throw new Error('advanceBinlogPosition: position must advance');
  }
  session.file = input.file;
  session.position = input.position;
  session.state = 'positioned';
  return record(session, {
    neutralEvent: 'binlog.position-advanced',
    backendEvent: backendEventName(session.backend, 'binlog.position-advanced', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      file: input.file,
      position: input.position,
    },
  });
}

export function updateGtidSet(
  session: BinlogSession,
  input: { gtid: string },
): AxisStep<BinlogState> {
  if (session.state !== 'positioned' && session.state !== 'gtid-updated') {
    throw new Error(`updateGtidSet: requires positioned state (got ${session.state})`);
  }
  if (!input.gtid) {
    throw new Error('updateGtidSet: gtid is required');
  }
  if (session.gtidSet.has(input.gtid)) {
    throw new Error(`updateGtidSet: duplicate gtid ${input.gtid}`);
  }
  session.gtidSet.add(input.gtid);
  session.state = 'gtid-updated';
  return record(session, {
    neutralEvent: 'binlog.gtid-set-updated',
    backendEvent: backendEventName(session.backend, 'binlog.gtid-set-updated', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      gtid: input.gtid,
      gtidCount: session.gtidSet.size,
    },
  });
}

export function negotiateBinlogFormat(
  session: BinlogSession,
  input: { format: BinlogFormat },
): AxisStep<BinlogState> {
  if (session.state !== 'gtid-updated' && session.state !== 'format-negotiated') {
    throw new Error(`negotiateBinlogFormat: requires gtid-updated state (got ${session.state})`);
  }
  session.format = input.format;
  session.state = 'format-negotiated';
  return record(session, {
    neutralEvent: 'binlog.format-negotiated',
    backendEvent: backendEventName(session.backend, 'binlog.format-negotiated', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      format: input.format,
      gtidCount: session.gtidSet.size,
    },
  });
}

export function detectGtidGap(
  session: BinlogSession,
  input: { expectedGtid: string },
): AxisStep<BinlogState> {
  if (session.state !== 'format-negotiated' && session.state !== 'gap-detected') {
    throw new Error(`detectGtidGap: requires format-negotiated state (got ${session.state})`);
  }
  if (session.gtidSet.has(input.expectedGtid)) {
    throw new Error('detectGtidGap: expectedGtid is already present');
  }
  session.state = 'gap-detected';
  return record(session, {
    neutralEvent: 'binlog.gap-detected',
    backendEvent: backendEventName(session.backend, 'binlog.gap-detected', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      expectedGtid: input.expectedGtid,
      observedGtidCount: session.gtidSet.size,
    },
  });
}
