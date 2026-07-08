/**
 * Schema Registry mock (v1.31-2) behavior — subject registration + evolution
 * compatibility check (BACKWARD / FORWARD / FULL) via
 * `@kiwa/streaming`'s `createRedpandaSchemaEvolution` axis.
 */

import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';

describe('schema registry — subject register + evolution check', () => {
  it('T-DKS-001 registering an initial schema returns a positive id', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveSchemaRegistry({
      subject: 'orders-value',
      compatibility: 'BACKWARD',
    });
    expect(out.registeredSchemaId).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DKS-002 optional-add follow-up is compatible under BACKWARD', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveSchemaRegistry({
      subject: 'orders-value',
      compatibility: 'BACKWARD',
    });
    expect(out.compatible).toBe(true);
    await adapter.reset();
  });

  it('T-DKS-003 optional-add follow-up is compatible under FORWARD', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveSchemaRegistry({
      subject: 'events-value',
      compatibility: 'FORWARD',
    });
    expect(out.compatible).toBe(true);
    await adapter.reset();
  });

  it('T-DKS-004 optional-add follow-up is compatible under FULL', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveSchemaRegistry({
      subject: 'audit-value',
      compatibility: 'FULL',
    });
    expect(out.compatible).toBe(true);
    await adapter.reset();
  });

  it('T-DKS-005 metrics.schemaRegistryChecks increments once per drive', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveSchemaRegistry({ subject: 'a', compatibility: 'BACKWARD' });
    await adapter.driveSchemaRegistry({ subject: 'b', compatibility: 'FORWARD' });
    expect(adapter.metrics().schemaRegistryChecks).toBe(2);
    await adapter.reset();
  });

  it('T-DKS-006 traces include the resolved subject + compatibility mode', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveSchemaRegistry({ subject: 'orders-value', compatibility: 'FULL' });
    const trace = adapter.traces().find((t) => t.op === 'driveSchemaRegistry');
    expect(trace?.ok).toBe(true);
    expect(trace?.detail).toMatchObject({
      subject: 'orders-value',
      compatibility: 'FULL',
    });
    await adapter.reset();
  });
});
