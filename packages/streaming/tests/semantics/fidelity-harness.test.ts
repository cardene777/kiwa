import { describe, expect, it } from 'vitest';
import {
  createFidelityHarness,
  isFidelityHarness,
  isRealDriverMode,
  requiredKeyFor,
} from '../../src/index.js';

describe('createFidelityHarness', () => {
  it('T-FH-001 3 providers × 8 axes = 24 cells', () => {
    const harness = createFidelityHarness();
    expect(isFidelityHarness(harness)).toBe(true);
    expect(harness.totalCells()).toBe(24);
  });

  it('T-FH-002 every cell has a non-planned status by default (v0.3.0 fully implemented)', () => {
    const harness = createFidelityHarness();
    const planned = harness.cells.filter((c) => c.status === 'planned');
    expect(planned).toEqual([]);
  });

  it('T-FH-003 kafka + redpanda cover the Kafka-shaped axes; nats marked not-applicable', () => {
    const harness = createFidelityHarness();
    expect(harness.cellFor('kafka', 'kafka-raw-protocol')?.status).toBe('implemented');
    expect(harness.cellFor('redpanda', 'kafka-raw-protocol')?.status).toBe('implemented');
    expect(harness.cellFor('nats', 'kafka-raw-protocol')?.status).toBe('not-applicable');
  });

  it('T-FH-004 nats-only axes marked not-applicable on kafka/redpanda', () => {
    const harness = createFidelityHarness();
    expect(harness.cellFor('kafka', 'nats-jetstream-durable')?.status).toBe('not-applicable');
    expect(harness.cellFor('redpanda', 'nats-kv-object')?.status).toBe('not-applicable');
    expect(harness.cellFor('nats', 'nats-jetstream-durable')?.status).toBe('implemented');
    expect(harness.cellFor('nats', 'nats-kv-object')?.status).toBe('implemented');
  });

  it('T-FH-005 exactly-once + consumer-lag-telemetry cover all 3 providers', () => {
    const harness = createFidelityHarness();
    for (const provider of ['kafka', 'redpanda', 'nats'] as const) {
      expect(harness.cellFor(provider, 'exactly-once')?.status).toBe('implemented');
      expect(harness.cellFor(provider, 'consumer-lag-telemetry')?.status).toBe('implemented');
    }
  });

  it('T-FH-006 cellsFor filters by provider', () => {
    const harness = createFidelityHarness();
    expect(harness.cellsFor('kafka')).toHaveLength(8);
    expect(harness.cellsFor('redpanda')).toHaveLength(8);
    expect(harness.cellsFor('nats')).toHaveLength(8);
  });

  it('T-FH-007 axesFor returns only cells matching status', () => {
    const harness = createFidelityHarness();
    const natsImpl = harness.axesFor('nats', 'implemented');
    expect(natsImpl).toContain('nats-jetstream-durable');
    expect(natsImpl).toContain('nats-kv-object');
    expect(natsImpl).not.toContain('kafka-raw-protocol');
  });

  it('T-FH-008 isRealDriverMode reads KIWA_MODE', () => {
    expect(isRealDriverMode({ KIWA_MODE: 'mock' } as NodeJS.ProcessEnv)).toBe(false);
    expect(isRealDriverMode({ KIWA_MODE: 'real' } as NodeJS.ProcessEnv)).toBe(true);
  });

  it('T-FH-009 requiredKeyFor maps axis → env key', () => {
    expect(requiredKeyFor('kafka-raw-protocol')).toBe('KAFKA_KEY');
    expect(requiredKeyFor('kafka-consumer-group')).toBe('KAFKA_KEY');
    expect(requiredKeyFor('redpanda-schema-evolution')).toBe('REDPANDA_KEY');
    expect(requiredKeyFor('redpanda-transactions')).toBe('REDPANDA_KEY');
    expect(requiredKeyFor('nats-jetstream-durable')).toBe('NATS_KEY');
    expect(requiredKeyFor('nats-kv-object')).toBe('NATS_KEY');
    expect(requiredKeyFor('exactly-once')).toBeNull();
    expect(requiredKeyFor('consumer-lag-telemetry')).toBeNull();
  });
});
