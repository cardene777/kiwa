import { describe, expect, it } from 'vitest';
import { createFidelityHarness, requiredKeyFor, isRealDriverMode } from '../../src/index.js';

// Follow-up file — exercises fidelity-harness surface cells that aren't
// touched by the primary fidelity-harness.test.ts: cellFor with a mismatched
// pair, cellsFor / axesFor filters, and the isRealDriverMode / requiredKeyFor
// env helpers.
//
// The `return { status: 'planned' }` fallthrough on line 85 is defensive —
// AXES is a closed const list and every value is handled explicitly. It stays
// documented here rather than exercised.

describe('createFidelityHarness accessor surface', () => {
  it('T-FH-B-001 cellFor returns null when the (provider, axis) pair is unknown', () => {
    const h = createFidelityHarness();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(h.cellFor('kafka' as any, 'planet-scale-mystery' as any)).toBeNull();
  });

  it('T-FH-B-002 cellsFor returns exactly the 8 axes for a provider', () => {
    const h = createFidelityHarness();
    const kafka = h.cellsFor('kafka');
    expect(kafka).toHaveLength(8);
    expect(new Set(kafka.map((c) => c.provider))).toEqual(new Set(['kafka']));
  });

  it('T-FH-B-003 axesFor filters by status', () => {
    const h = createFidelityHarness();
    const notApplicable = h.axesFor('nats', 'not-applicable');
    // NATS has no Kafka wire, no consumer-group, no schema-evolution, no txns.
    expect(notApplicable).toEqual(
      expect.arrayContaining([
        'kafka-raw-protocol',
        'kafka-consumer-group',
        'redpanda-schema-evolution',
        'redpanda-transactions',
      ]),
    );
  });

  it('T-FH-B-004 totalCells equals providers x axes', () => {
    const h = createFidelityHarness();
    expect(h.totalCells()).toBe(24);
  });

  it('T-FH-B-005 requiredKeyFor returns the provider key or null', () => {
    expect(requiredKeyFor('kafka-raw-protocol')).toBe('KAFKA_KEY');
    expect(requiredKeyFor('kafka-consumer-group')).toBe('KAFKA_KEY');
    expect(requiredKeyFor('redpanda-schema-evolution')).toBe('REDPANDA_KEY');
    expect(requiredKeyFor('redpanda-transactions')).toBe('REDPANDA_KEY');
    expect(requiredKeyFor('nats-jetstream-durable')).toBe('NATS_KEY');
    expect(requiredKeyFor('nats-kv-object')).toBe('NATS_KEY');
    // Cross-provider axes have no provider-specific key.
    expect(requiredKeyFor('exactly-once')).toBeNull();
    expect(requiredKeyFor('consumer-lag-telemetry')).toBeNull();
  });

  it('T-FH-B-006 isRealDriverMode honors the KIWA_MODE env flag', () => {
    expect(isRealDriverMode({ KIWA_MODE: 'real' })).toBe(true);
    expect(isRealDriverMode({ KIWA_MODE: 'mock' })).toBe(false);
    expect(isRealDriverMode({})).toBe(false);
  });
});
