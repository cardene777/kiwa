/**
 * SQLite WAL flow — drives the orm v0.10 `sqlite-wal` axis end-to-end for
 * the dogfood-sqlite-wal-fts-app. Wraps `createSqliteWalSession` +
 * `switchJournalMode` + `crossWalSizeThreshold` + `triggerWalCheckpoint` +
 * `mapSharedMemory` into a single deterministic op that the mock adapter
 * (and later the real libsql-backed adapter) can reuse.
 */

import {
  createSqliteWalSession,
  switchJournalMode,
  crossWalSizeThreshold,
  triggerWalCheckpoint,
  mapSharedMemory,
  type SqliteWalSession,
} from '@kiwa-lab/orm';

export interface WalJourneyInput {
  readonly databasePath: string;
  readonly thresholdBytes: number;
  readonly walSizeBytes: number;
  readonly checkpointMode: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE';
  readonly regionBytes: number;
}

export interface WalJourneyResult {
  readonly session: SqliteWalSession;
  readonly finalJournalMode: 'WAL';
  readonly checkpointCount: number;
  readonly walSizeBytes: number;
  readonly sharedMemoryBytes: number;
  readonly finalState: 'shared-memory-mapped';
}

/**
 * Drive the WAL 5-state journey. The state machine transitions
 * rollback-journal → wal-enabled → threshold-crossed → checkpointed →
 * shared-memory-mapped. Non-terminal states are rejected by the orm
 * semantic and surface as thrown errors — the flow lets them propagate so
 * the caller can attach the correct trace entry.
 */
export function driveWalJourney(input: WalJourneyInput): WalJourneyResult {
  const session = createSqliteWalSession({
    databasePath: input.databasePath,
    provider: 'drizzle',
    backend: 'sqlite',
  });
  switchJournalMode(session, { mode: 'WAL' });
  crossWalSizeThreshold(session, {
    walSizeBytes: input.walSizeBytes,
    thresholdBytes: input.thresholdBytes,
  });
  triggerWalCheckpoint(session, { mode: input.checkpointMode });
  mapSharedMemory(session, { regionBytes: input.regionBytes });
  return {
    session,
    finalJournalMode: 'WAL',
    checkpointCount: session.checkpointCount,
    walSizeBytes: session.walSizeBytes,
    sharedMemoryBytes: input.regionBytes,
    finalState: 'shared-memory-mapped',
  };
}
