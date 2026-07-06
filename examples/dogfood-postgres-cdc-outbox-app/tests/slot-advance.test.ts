/**
 * Vitest — Postgres 16 replication slot advance flow (v1.32-2 axis 2).
 *
 * Asserts the create → advance → drop walk records the retained → advanced
 * LSN pair + recycled byte count. Enforces the invariant that a slot cannot
 * be advanced backwards + cannot be dropped without an advance.
 */

import { describe, expect, it } from 'vitest';
import { driveSlotAdvanceFlow as driveSlotAdvanceUnit } from '../src/slot-advance/index.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveSlotAdvanceFlow } from '../src/flows/postgres-flows.js';

describe('replication slot advance — create → advance → drop', () => {
  it('T-DPE-SA-001 walks create → advance → drop with recycled bytes', () => {
    const { observation, state } = driveSlotAdvanceUnit();
    expect(observation.slotName).toBe('outbox_slot_v2');
    expect(observation.retainedLsn).toBe(20_000);
    expect(observation.advancedLsn).toBe(24_096);
    expect(observation.recycledBytes).toBe(4_096);
    expect(observation.dropped).toBe(true);
    expect(state.confirmedFlushLsn).toBe(24_096);
    expect(state.dropped).toBe(true);
  });

  it('T-DPE-SA-002 mock adapter records driveSlotAdvance ok trace', async () => {
    const adapter = makeMockAdapter();
    const observation = await driveSlotAdvanceFlow(adapter);
    expect(observation.dropped).toBe(true);
    const trace = adapter.traces().find((t) => t.op === 'driveSlotAdvance');
    expect(trace?.ok).toBe(true);
    expect(adapter.metrics().slotAdvanceOps).toBe(1);
    await adapter.reset();
  });

  it('T-DPE-SA-003 rejects advancedLsn <= retainedLsn', () => {
    expect(() =>
      driveSlotAdvanceUnit({ retainedLsn: 100, advancedLsn: 100 }),
    ).toThrow(/advancedLsn.*must exceed retainedLsn/);
  });
});
