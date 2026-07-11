import { describe, expect, it } from 'vitest';
import {
  backendEventName,
  createSqliteWalSession,
  crossWalSizeThreshold,
  mapSharedMemory,
  switchJournalMode,
  triggerWalCheckpoint,
  type OrmBackend,
  type OrmProvider,
} from '../../src/index.js';

const providers: OrmProvider[] = ['drizzle', 'prisma', 'kysely'];
const backends: OrmBackend[] = ['postgres', 'mysql', 'sqlite'];

describe('sqlite-wal axis — 3 provider × 3 backend', () => {
  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: journal mode → threshold → checkpoint → shm happy path',
    (provider, backend) => {
      const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider, backend });
      switchJournalMode(session, { mode: 'WAL' });
      crossWalSizeThreshold(session, { walSizeBytes: 8192, thresholdBytes: 4096 });
      triggerWalCheckpoint(session, { mode: 'TRUNCATE' });
      const mapped = mapSharedMemory(session, { regionBytes: 32768 });
      expect(mapped.neutralEvent).toBe('wal.shared-memory-mapped');
      expect(mapped.metadata.sharedMemoryMapped).toBe(true);
      expect(session.history.length).toBe(4);
    },
  );

  it.each(providers.flatMap((p) => backends.map((b) => [p, b] as const)))(
    '%s/%s: emits backend dialect for WAL checkpoint',
    (provider, backend) => {
      const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider, backend });
      switchJournalMode(session, { mode: 'WAL' });
      crossWalSizeThreshold(session, { walSizeBytes: 8192, thresholdBytes: 4096 });
      const step = triggerWalCheckpoint(session, { mode: 'FULL' });
      expect(step.backendEvent).toBe(backendEventName(backend, 'wal.checkpoint-triggered', provider));
    },
  );

  it('switchJournalMode rejects repeated switch', () => {
    const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider: 'drizzle', backend: 'sqlite' });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() => switchJournalMode(session, { mode: 'WAL' })).toThrow(/rollback-journal/);
  });

  it('crossWalSizeThreshold requires size above threshold', () => {
    const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider: 'drizzle', backend: 'sqlite' });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() =>
      crossWalSizeThreshold(session, { walSizeBytes: 4096, thresholdBytes: 4096 }),
    ).toThrow(/exceed/);
  });

  it('triggerWalCheckpoint requires threshold-crossed state', () => {
    const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider: 'drizzle', backend: 'sqlite' });
    switchJournalMode(session, { mode: 'WAL' });
    expect(() => triggerWalCheckpoint(session, { mode: 'FULL' })).toThrow(/threshold-crossed/);
  });

  it('mapSharedMemory rejects non-positive region size', () => {
    const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider: 'drizzle', backend: 'sqlite' });
    switchJournalMode(session, { mode: 'WAL' });
    crossWalSizeThreshold(session, { walSizeBytes: 8192, thresholdBytes: 4096 });
    triggerWalCheckpoint(session, { mode: 'FULL' });
    expect(() => mapSharedMemory(session, { regionBytes: 0 })).toThrow(/positive/);
  });

  it('crossWalSizeThreshold requires wal-enabled state (state guard)', () => {
    const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider: 'drizzle', backend: 'sqlite' });
    // state = 'rollback-journal' (initial), not 'wal-enabled'
    expect(() =>
      crossWalSizeThreshold(session, { walSizeBytes: 8192, thresholdBytes: 4096 }),
    ).toThrow(/requires wal-enabled state/);
  });

  it('mapSharedMemory requires checkpointed state (state guard)', () => {
    const session = createSqliteWalSession({ databasePath: '/tmp/app.db', provider: 'drizzle', backend: 'sqlite' });
    switchJournalMode(session, { mode: 'WAL' });
    // state = 'wal-enabled', not 'checkpointed'
    expect(() => mapSharedMemory(session, { regionBytes: 4096 })).toThrow(
      /requires checkpointed state/,
    );
  });
});
