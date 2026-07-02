import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { QueueAdapter } from '../src/adapters/interface.js';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { sampleOrder } from '../src/adapters/real.js';
import {
  bootstrap,
  drainOrders,
  federationFlow,
  quorumFlow,
  reconnectFlow,
  reminderFlow,
  retryFlow,
} from '../src/flows/worker-flows.js';

let adapter: QueueAdapter;

beforeEach(async () => {
  adapter = await makeMockAdapter();
  await bootstrap(adapter);
});

afterEach(async () => {
  await adapter.reset();
});

describe('dogfood-rabbitmq (mock mode) — order processing + DLX', () => {
  it('T-DFR-M-001 valid orders leave DLQ empty', async () => {
    const depths = await drainOrders(adapter, [sampleOrder({ id: 'o1' })]);
    expect(depths.triageDepth).toBe(0);
  });

  it('T-DFR-M-002 invalid orders land in the triage queue', async () => {
    const depths = await drainOrders(adapter, [sampleOrder({ id: 'o2', valid: false })]);
    expect(depths.triageDepth).toBeGreaterThanOrEqual(1);
  });
});

describe('dogfood-rabbitmq (mock mode) — delayed reminder', () => {
  it('T-DFR-M-003 SMS reminder is delivered after clock advance', async () => {
    const { delivered } = await reminderFlow(adapter, {
      phone: '+15551234',
      text: 'Hi',
      delayMs: 60_000,
    });
    expect(delivered).toBe(true);
  });
});

describe('dogfood-rabbitmq (mock mode) — retry with requeue', () => {
  it('T-DFR-M-004 retry succeeds after failure threshold', async () => {
    const count = await retryFlow(adapter, 2);
    expect(count).toBeGreaterThanOrEqual(2);
  });
});

describe('dogfood-rabbitmq (mock mode) — quorum survival', () => {
  it('T-DFR-M-005 quorum queue survives 1-node loss', async () => {
    const survived = await quorumFlow(adapter, 'rabbit@node-2');
    expect(survived).toBe(true);
  });
});

describe('dogfood-rabbitmq (mock mode) — federation', () => {
  it('T-DFR-M-006 upstream ingest lands on the triage downstream queue', async () => {
    const out = await federationFlow(adapter, {
      upstreamName: 'upstream-eu',
      body: { note: 'from-eu' },
    });
    expect(out.landedOnQueue).toBe('work.triage');
    expect(out.depthAfter).toBeGreaterThanOrEqual(1);
  });
});

describe('dogfood-rabbitmq (mock mode) — reconnect backoff', () => {
  it('T-DFR-M-007 exponential backoff reconnect succeeds within maxAttempts', async () => {
    const out = await reconnectFlow(adapter, 3);
    expect(out.succeeded).toBe(true);
    expect(out.totalDelayMs).toBeGreaterThan(0);
  });
});

describe('dogfood-rabbitmq (mock mode) — trace introspection', () => {
  it('T-DFR-M-008 declareTopology + processOrder emit distinct trace ops', async () => {
    await drainOrders(adapter, [sampleOrder({ id: 'o3' })]);
    const ops = new Set(adapter.traces().map((t) => t.op));
    expect(ops.has('declareTopology')).toBe(true);
    expect(ops.has('processOrder')).toBe(true);
  });
});
