/**
 * Vitest — SQLite WAL full-journey flow (v1.32-4 AC1).
 *
 * Drives the 5-state WAL walk and asserts the mock adapter reports
 * every state transition + the final journal state = WAL.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveWalJourney } from '../src/wal/index.js';

describe('SQLite WAL full journey — mock adapter drives the 5-state walk', () => {
  it('T-DSW-WAL-001 mock adapter returns finalJournalMode=WAL after full journey', async () => {
    const adapter = makeMockAdapter();
    const observation = await adapter.driveWalFullJourney();
    expect(observation.finalJournalMode).toBe('WAL');
    expect(observation.finalState).toBe('shared-memory-mapped');
    expect(observation.checkpointCount).toBeGreaterThan(0);
    expect(observation.sharedMemoryBytes).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DSW-WAL-002 TRUNCATE checkpoint zeroes the WAL size on wrap', async () => {
    const adapter = makeMockAdapter();
    const observation = await adapter.driveWalFullJourney({
      thresholdBytes: 1024,
      walSizeBytes: 8 * 1024,
      checkpointMode: 'TRUNCATE',
      regionBytes: 16 * 1024,
    });
    expect(observation.walSizeBytes).toBe(0);
    await adapter.reset();
  });

  it('T-DSW-WAL-003 metrics report the recorded WAL journey step count', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveWalFullJourney();
    const metrics = adapter.metrics();
    // 4 axis steps (switchJournalMode + crossWalSizeThreshold +
    // triggerWalCheckpoint + mapSharedMemory).
    expect(metrics.walJourneySteps).toBe(4);
    expect(metrics.latencySamplesMs.length).toBe(1);
    await adapter.reset();
  });

  it('T-DSW-WAL-004 direct driveWalJourney flow rejects wal-enabled-only journey', async () => {
    // walSizeBytes must exceed thresholdBytes for the semantic to accept
    // the cross — the flow surfaces the underlying orm error.
    expect(() =>
      driveWalJourney({
        databasePath: 'file:x.db',
        thresholdBytes: 4096,
        walSizeBytes: 1024,
        checkpointMode: 'PASSIVE',
        regionBytes: 8192,
      }),
    ).toThrow(/walSizeBytes must exceed thresholdBytes/);
  });

  it('T-DSW-WAL-005 trace records the driveWalFullJourney op with ok=true', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveWalFullJourney();
    const traces = adapter.traces();
    const wal = traces.find((t) => t.op === 'driveWalFullJourney');
    expect(wal?.ok).toBe(true);
    expect(wal?.detail?.['finalState']).toBe('shared-memory-mapped');
    await adapter.reset();
  });
});
