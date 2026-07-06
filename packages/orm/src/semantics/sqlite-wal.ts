import { backendEventName, type AxisStep, type OrmBackend, type OrmProvider } from './types.js';

/**
 * SQLite WAL — journal_mode=WAL switch, WAL checkpoint, size threshold, and
 * shared-memory wal-index mapping. SQLite maps to PRAGMA journal_mode /
 * wal_checkpoint and wal-index telemetry; Postgres / MySQL use write-ahead
 * log fallback names.
 *
 * State transitions:
 *   created               → 'rollback-journal'
 *   switchJournalMode     → 'wal-enabled'
 *   crossWalSizeThreshold → 'threshold-crossed'
 *   triggerWalCheckpoint  → 'checkpointed'
 *   mapSharedMemory       → 'shared-memory-mapped'
 */
export type SqliteWalState =
  | 'rollback-journal'
  | 'wal-enabled'
  | 'threshold-crossed'
  | 'checkpointed'
  | 'shared-memory-mapped';

export interface SqliteWalSession {
  databasePath: string;
  provider: OrmProvider;
  backend: OrmBackend;
  state: SqliteWalState;
  journalMode: 'DELETE' | 'WAL';
  walSizeBytes: number;
  checkpointCount: number;
  sharedMemoryMapped: boolean;
  history: AxisStep<SqliteWalState>[];
}

function record(
  session: SqliteWalSession,
  step: AxisStep<SqliteWalState>,
): AxisStep<SqliteWalState> {
  session.history.push(step);
  return step;
}

export function createSqliteWalSession(input: {
  databasePath: string;
  provider: OrmProvider;
  backend: OrmBackend;
}): SqliteWalSession {
  return {
    databasePath: input.databasePath,
    provider: input.provider,
    backend: input.backend,
    state: 'rollback-journal',
    journalMode: 'DELETE',
    walSizeBytes: 0,
    checkpointCount: 0,
    sharedMemoryMapped: false,
    history: [],
  };
}

export function switchJournalMode(
  session: SqliteWalSession,
  input: { mode: 'WAL' },
): AxisStep<SqliteWalState> {
  if (session.state !== 'rollback-journal') {
    throw new Error(`switchJournalMode: requires rollback-journal state (got ${session.state})`);
  }
  session.journalMode = input.mode;
  session.state = 'wal-enabled';
  return record(session, {
    neutralEvent: 'wal.journal-mode-switched',
    backendEvent: backendEventName(session.backend, 'wal.journal-mode-switched', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      mode: input.mode,
      databasePath: session.databasePath,
    },
  });
}

export function crossWalSizeThreshold(
  session: SqliteWalSession,
  input: { walSizeBytes: number; thresholdBytes: number },
): AxisStep<SqliteWalState> {
  if (session.state !== 'wal-enabled' && session.state !== 'threshold-crossed') {
    throw new Error(`crossWalSizeThreshold: requires wal-enabled state (got ${session.state})`);
  }
  if (input.walSizeBytes <= input.thresholdBytes) {
    throw new Error('crossWalSizeThreshold: walSizeBytes must exceed thresholdBytes');
  }
  session.walSizeBytes = input.walSizeBytes;
  session.state = 'threshold-crossed';
  return record(session, {
    neutralEvent: 'wal.size-threshold-crossed',
    backendEvent: backendEventName(session.backend, 'wal.size-threshold-crossed', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      walSizeBytes: input.walSizeBytes,
      thresholdBytes: input.thresholdBytes,
    },
  });
}

export function triggerWalCheckpoint(
  session: SqliteWalSession,
  input: { mode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE' },
): AxisStep<SqliteWalState> {
  if (session.state !== 'threshold-crossed' && session.state !== 'checkpointed') {
    throw new Error(`triggerWalCheckpoint: requires threshold-crossed state (got ${session.state})`);
  }
  session.checkpointCount += 1;
  session.walSizeBytes = input.mode === 'TRUNCATE' ? 0 : session.walSizeBytes;
  session.state = 'checkpointed';
  return record(session, {
    neutralEvent: 'wal.checkpoint-triggered',
    backendEvent: backendEventName(session.backend, 'wal.checkpoint-triggered', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      mode: input.mode,
      checkpointCount: session.checkpointCount,
      walSizeBytes: session.walSizeBytes,
    },
  });
}

export function mapSharedMemory(
  session: SqliteWalSession,
  input: { regionBytes: number },
): AxisStep<SqliteWalState> {
  if (session.state !== 'checkpointed' && session.state !== 'shared-memory-mapped') {
    throw new Error(`mapSharedMemory: requires checkpointed state (got ${session.state})`);
  }
  if (input.regionBytes <= 0) {
    throw new Error('mapSharedMemory: regionBytes must be positive');
  }
  session.sharedMemoryMapped = true;
  session.state = 'shared-memory-mapped';
  return record(session, {
    neutralEvent: 'wal.shared-memory-mapped',
    backendEvent: backendEventName(session.backend, 'wal.shared-memory-mapped', session.provider),
    state: session.state,
    provider: session.provider,
    backend: session.backend,
    metadata: {
      regionBytes: input.regionBytes,
      sharedMemoryMapped: session.sharedMemoryMapped,
    },
  });
}
