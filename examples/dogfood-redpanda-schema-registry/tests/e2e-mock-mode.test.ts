import { describe, expect, it } from 'vitest';
import { makeMockAdapter, sampleUserPayload } from '../src/adapters/mock.js';
import {
  driveCompatibilityModesFlow,
  driveEvolutionFlow,
  driveFidelityFlow,
  drivePublishFlow,
  driveRegisterFlow,
} from '../src/flows/redpanda-flows.js';

describe('end-to-end mock-mode integration', () => {
  it('T-DRE-M-001 5-op surface produces 5 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await driveRegisterFlow(adapter);
    await driveEvolutionFlow(adapter);
    await driveCompatibilityModesFlow(adapter);
    await drivePublishFlow(adapter, [
      sampleUserPayload({ id: 'u-1' }),
      sampleUserPayload({ id: 'u-2', region: 'eu' }),
    ]);
    await driveFidelityFlow(adapter);
    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'driveRegister',
      'driveEvolution',
      'driveCompatibilityModes',
      'drivePublish',
      'emitFidelity',
    ]) {
      expect(okOps).toContain(op);
    }
    await adapter.reset();
  });

  it('T-DRE-M-002 register flow yields 2 subjects (users-value + orders-value)', async () => {
    const adapter = makeMockAdapter();
    const out = await driveRegisterFlow(adapter);
    expect(out.subjectCount).toBe(2);
    // 2 unique ids (userV1 dedup returns same id as first register).
    expect(out.distinctIds).toBe(2);
    await adapter.reset();
  });

  it('T-DRE-M-003 evolution flow accepts v2 and rejects v2 BREAK', async () => {
    const adapter = makeMockAdapter();
    const out = await driveEvolutionFlow(adapter);
    expect(out.compatibleV2).toBe(true);
    expect(out.rejectedIncompatible).toBe(true);
    expect(out.subject).toBe('users-evo-value');
    await adapter.reset();
  });

  it('T-DRE-M-004 compatibility flow probes 3 modes and all reject BREAK', async () => {
    const adapter = makeMockAdapter();
    const out = await driveCompatibilityModesFlow(adapter);
    expect(out.modes).toBe(3);
    expect(out.allReject).toBe(true);
    await adapter.reset();
  });

  it('T-DRE-M-005 publish flow records 1 compatibility rejection on BREAK attempt', async () => {
    const adapter = makeMockAdapter();
    const out = await drivePublishFlow(adapter, [
      sampleUserPayload({ id: 'u-1' }),
      sampleUserPayload({ id: 'u-2' }),
    ]);
    expect(out.recordsPublished).toBe(2);
    expect(out.rejectedByCompatibility).toBe(1);
    await adapter.reset();
  });

  it('T-DRE-M-006 metrics counters accumulate across ops', async () => {
    const adapter = makeMockAdapter();
    await driveRegisterFlow(adapter);
    await driveEvolutionFlow(adapter);
    await drivePublishFlow(adapter, [sampleUserPayload({ id: 'u-1' })]);
    const m = adapter.metrics();
    expect(m.subjectsRegistered).toBe(2);
    expect(m.evolutionSteps).toBe(2);
    expect(m.recordsPublished).toBe(1);
    expect(m.compatibilityRejections).toBe(1);
    expect(m.latencySamplesMs.length).toBe(3);
    await adapter.reset();
  });

  it('T-DRE-M-007 reset() clears trace + metrics + redpanda state', async () => {
    const adapter = makeMockAdapter();
    await driveRegisterFlow(adapter);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().subjectsRegistered).toBe(0);
    expect(adapter.metrics().latencySamplesMs).toHaveLength(0);
  });
});
