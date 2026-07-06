/**
 * Vitest — end-to-end mock-mode run of the 5-op surface (v1.32-4).
 *
 * The 5 ops (driveWalFullJourney / driveFts5FullJourney / driveEdgeRoundtrip
 * / driveTestcontainersProbe / emitFidelity) are driven back-to-back and
 * asserted for ordering + terminal state + trace completeness.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { OPS_UNDER_TEST } from '../src/adapters/interface.js';
import { runFullSurface } from '../src/flows/fidelity.js';

describe('dogfood-sqlite-wal-fts-app — mock mode e2e', () => {
  it('T-DSW-E2E-001 all 5 ops execute in the expected order', async () => {
    const adapter = makeMockAdapter();
    await runFullSurface(adapter);
    const traces = adapter.traces();
    const opsSeen = traces.map((t) => t.op);
    expect(opsSeen).toEqual([...OPS_UNDER_TEST]);
    await adapter.reset();
  });

  it('T-DSW-E2E-002 every op is recorded with ok=true', async () => {
    const adapter = makeMockAdapter();
    await runFullSurface(adapter);
    for (const t of adapter.traces()) {
      expect(t.ok).toBe(true);
    }
    await adapter.reset();
  });

  it('T-DSW-E2E-003 mock adapter reports 5 latency samples after full surface run', async () => {
    const adapter = makeMockAdapter();
    await runFullSurface(adapter);
    const metrics = adapter.metrics();
    expect(metrics.latencySamplesMs.length).toBe(5);
    await adapter.reset();
  });

  it('T-DSW-E2E-004 reset() empties the trace + zeroes the metrics', async () => {
    const adapter = makeMockAdapter();
    await runFullSurface(adapter);
    await adapter.reset();
    expect(adapter.traces().length).toBe(0);
    const metrics = adapter.metrics();
    expect(metrics.latencySamplesMs.length).toBe(0);
    expect(metrics.walJourneySteps).toBe(0);
    expect(metrics.fts5JourneySteps).toBe(0);
    expect(metrics.edgeInvocations).toBe(0);
    expect(metrics.testcontainersProbes).toBe(0);
  });
});
