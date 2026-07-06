import { describe, expect, it } from 'vitest';
import { makeMockAdapter, sampleUserPayload } from '../src/adapters/mock.js';
import {
  driveCompatibilityModesFlow,
  driveConsoleAdminFlow,
  driveEvolutionFlow,
  driveEvolutionTransitiveFlow,
  driveFidelityFlow,
  drivePublishFlow,
  driveRegisterFlow,
  driveSubjectStrategiesFlow,
  driveTestcontainersProbeFlow,
} from '../src/flows/redpanda-flows.js';

describe('end-to-end mock-mode integration — v1 + v2 (9 ops)', () => {
  it('T-DRE-M-001 9-op surface produces 9 ok trace entries', async () => {
    const adapter = makeMockAdapter();
    await driveRegisterFlow(adapter);
    await driveEvolutionFlow(adapter);
    await driveCompatibilityModesFlow(adapter);
    await drivePublishFlow(adapter, [
      sampleUserPayload({ id: 'u-1' }),
      sampleUserPayload({ id: 'u-2', region: 'eu' }),
    ]);
    await driveFidelityFlow(adapter);
    await driveEvolutionTransitiveFlow(adapter);
    await driveSubjectStrategiesFlow(adapter);
    await driveConsoleAdminFlow(adapter);
    await driveTestcontainersProbeFlow(adapter);
    const okOps = adapter.traces().filter((t) => t.ok).map((t) => t.op);
    for (const op of [
      'driveRegister',
      'driveEvolution',
      'driveCompatibilityModes',
      'drivePublish',
      'emitFidelity',
      'driveEvolutionTransitive',
      'driveSubjectStrategies',
      'driveConsoleAdmin',
      'driveTestcontainersProbe',
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

  it('T-DRE-M-006 metrics counters accumulate across v1 + v2 ops', async () => {
    const adapter = makeMockAdapter();
    await driveRegisterFlow(adapter);
    await driveEvolutionFlow(adapter);
    await drivePublishFlow(adapter, [sampleUserPayload({ id: 'u-1' })]);
    await driveEvolutionTransitiveFlow(adapter);
    await driveSubjectStrategiesFlow(adapter);
    await driveConsoleAdminFlow(adapter);
    await driveTestcontainersProbeFlow(adapter);
    const m = adapter.metrics();
    expect(m.subjectsRegistered).toBe(2);
    expect(m.evolutionSteps).toBe(2);
    expect(m.recordsPublished).toBe(1);
    expect(m.compatibilityRejections).toBe(1);
    // v2 counters advanced.
    expect(m.transitiveChainSteps).toBeGreaterThan(0);
    expect(m.subjectStrategyProbes).toBe(3);
    expect(m.consoleAdminCalls).toBeGreaterThanOrEqual(3);
    expect(m.testcontainersProbes).toBe(1);
    expect(m.latencySamplesMs.length).toBe(7);
    await adapter.reset();
  });

  it('T-DRE-M-007 reset() clears trace + metrics + redpanda state (incl. v2 counters)', async () => {
    const adapter = makeMockAdapter();
    await driveRegisterFlow(adapter);
    await driveEvolutionTransitiveFlow(adapter);
    await driveSubjectStrategiesFlow(adapter);
    await driveConsoleAdminFlow(adapter);
    await driveTestcontainersProbeFlow(adapter);
    await adapter.reset();
    expect(adapter.traces()).toHaveLength(0);
    expect(adapter.metrics().subjectsRegistered).toBe(0);
    expect(adapter.metrics().latencySamplesMs).toHaveLength(0);
    expect(adapter.metrics().transitiveChainSteps).toBe(0);
    expect(adapter.metrics().subjectStrategyProbes).toBe(0);
    expect(adapter.metrics().consoleAdminCalls).toBe(0);
    expect(adapter.metrics().testcontainersProbes).toBe(0);
  });

  it('T-DRE-M-008 v2 transitive evolution surfaces a rejectedTransitiveOnly=true observation', async () => {
    const adapter = makeMockAdapter();
    const out = await driveEvolutionTransitiveFlow(adapter);
    expect(out.rejectedTransitiveOnly).toBe(true);
    expect(out.chainLength).toBe(3);
    await adapter.reset();
  });

  it('T-DRE-M-009 v2 subject-strategy flow lists 3 distinct derived subjects', async () => {
    const adapter = makeMockAdapter();
    const out = await driveSubjectStrategiesFlow(adapter);
    expect(out.strategyCount).toBe(3);
    expect(new Set(out.subjects).size).toBe(3);
    expect(out.allRegistered).toBe(true);
    await adapter.reset();
  });

  it('T-DRE-M-010 v2 console-admin flow reports healthOk + subjects > 0', async () => {
    const adapter = makeMockAdapter();
    const out = await driveConsoleAdminFlow(adapter);
    expect(out.healthOk).toBe(true);
    expect(out.subjectsSeen).toBeGreaterThan(0);
    // 4 endpoints hit: /api/subjects + /api/config/... + /api/schemas/ids/1 + /api/health
    expect(out.endpointCount).toBe(4);
    await adapter.reset();
  });

  it('T-DRE-M-011 v2 testcontainers probe reports mock endpoints + reachable=true', async () => {
    const adapter = makeMockAdapter();
    const out = await driveTestcontainersProbeFlow(adapter);
    expect(out.reachable).toBe(true);
    expect(out.bootstrap).toContain('redpanda-mock');
    expect(out.consoleUrl).toContain('redpanda-console-mock');
    expect(out.redpandaImage).toContain('redpandadata/redpanda');
    await adapter.reset();
  });
});
