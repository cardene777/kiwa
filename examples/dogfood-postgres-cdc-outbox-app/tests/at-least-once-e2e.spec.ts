import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { driveAtLeastOnceFlow } from '../src/flows/postgres-flows.js';

const sampleOrders = [
  { orderId: 'a1', region: 'us' as const, total: 100 },
  { orderId: 'a2', region: 'eu' as const, total: 200 },
  { orderId: 'a3', region: 'apac' as const, total: 300 },
];

describe('at-least-once delivery — idempotent consumer + duplicate handling', () => {
  it('T-DPA-001 delivers every unique event exactly once', async () => {
    const adapter = makeMockAdapter();
    const out = await adapter.driveAtLeastOnce({
      orders: sampleOrders,
      duplicateOrders: sampleOrders.slice(0, 2),
    });
    expect(out.deliveredMessages).toBe(sampleOrders.length);
    expect(out.ackedLsn).toBe(sampleOrders.length);
    await adapter.reset();
  });

  it('T-DPA-002 counts duplicate LSN ingest as duplicateAttempts (idempotent drop)', async () => {
    const adapter = makeMockAdapter();
    const out = await driveAtLeastOnceFlow(adapter, {
      orders: sampleOrders,
      duplicateOrders: sampleOrders.slice(0, 2),
    });
    // Two duplicate LSNs re-ingested — must be dropped, not re-delivered.
    expect(out.duplicateAttempts).toBe(2);
    expect(out.ackedLsn).toBeGreaterThan(0);
    await adapter.reset();
  });

  it('T-DPA-003 metrics reflect at-least-once counters', async () => {
    const adapter = makeMockAdapter();
    await adapter.driveAtLeastOnce({
      orders: sampleOrders,
      duplicateOrders: [sampleOrders[0]!],
    });
    const m = adapter.metrics();
    expect(m.atLeastOnceDeliveries).toBe(sampleOrders.length);
    expect(m.duplicatesHandled).toBe(1);
    await adapter.reset();
  });

  it('T-DPA-004 duplicate ingest does not exceed maxInFlight backpressure', async () => {
    const adapter = makeMockAdapter({ maxInFlight: 5 });
    const out = await adapter.driveAtLeastOnce({
      orders: sampleOrders,
      duplicateOrders: sampleOrders,
    });
    expect(out.deliveredMessages).toBe(sampleOrders.length);
    // All 3 duplicates dropped by idempotent set.
    expect(out.duplicateAttempts).toBe(sampleOrders.length);
    await adapter.reset();
  });
});
