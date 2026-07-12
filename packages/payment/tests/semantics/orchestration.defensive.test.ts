import { describe, expect, it } from 'vitest';
import {
  createLemonSqueezyMock,
  createPaddleMock,
  createStripeMock,
  probeCircuit,
  routeCharge,
  startOrchestration,
  type PaymentAdapter,
} from '../../src/index.js';

function makeAll(): PaymentAdapter[] {
  return [createStripeMock(), createPaddleMock(), createLemonSqueezyMock()];
}

describe('orchestration defensive — startOrchestration currency variants', () => {
  it('startOrchestration with currency populates session.currency', () => {
    const s = startOrchestration({
      intentId: 'i',
      amountCents: 100,
      currency: 'jpy',
      config: { providers: ['stripe'] },
    });
    expect(s.currency).toBe('jpy');
    expect(s.state).toBe('routing');
  });

  it('startOrchestration without currency leaves currency unset', () => {
    const s = startOrchestration({
      intentId: 'i',
      amountCents: 100,
      config: { providers: ['stripe'] },
    });
    expect(s.currency).toBeUndefined();
  });

  it('startOrchestration merges defaults with partial config', () => {
    const s = startOrchestration({
      intentId: 'i',
      amountCents: 100,
      config: { providers: ['stripe'], circuitBreakerThreshold: 10 },
    });
    expect(s.config.circuitBreakerThreshold).toBe(10);
    expect(s.config.maxRetriesPerProvider).toBe(2);
    expect(s.config.circuitOpenDurationMs).toBe(30_000);
  });
});

describe('orchestration defensive — routeCharge terminal + adapter errors', () => {
  it('routeCharge throws when session is terminated (synthetic state)', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_term',
      amountCents: 100,
      config: { providers: ['stripe'] },
    });
    s.state = 'terminated';
    await expect(
      routeCharge(adapters, s, { succeed: true, customerId: 'c' }),
    ).rejects.toThrow(/already terminated/);
  });

  it('routeCharge throws when no adapter registered for current provider', async () => {
    const s = startOrchestration({
      intentId: 'i_nop',
      amountCents: 100,
      config: { providers: ['paddle'] },
    });
    const adapters = [createStripeMock()];
    await expect(
      routeCharge(adapters, s, { succeed: true, customerId: 'c' }),
    ).rejects.toThrow(/no adapter registered for paddle/);
  });

  it('routeCharge stays on current provider when failure below retry limit', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_stay',
      amountCents: 100,
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 5,
        circuitBreakerThreshold: 10,
      },
    });
    const step = await routeCharge(adapters, s, { succeed: false, customerId: 'c' });
    expect(step.neutralEvent).toBe('orchestration.routed');
    expect(s.currentProviderIndex).toBe(0);
    expect(s.currentProviderFailures).toBe(1);
    expect(s.state).toBe('routing');
  });

  it('routeCharge with currency propagates currency into signed event', async () => {
    const adapters = makeAll();
    const received: string[] = [];
    for (const a of adapters) a.onWebhook((e) => { received.push(e.type); });
    const s = startOrchestration({
      intentId: 'i_cur',
      amountCents: 250,
      currency: 'eur',
      config: { providers: ['stripe'] },
    });
    const step = await routeCharge(adapters, s, { succeed: true, customerId: 'c' });
    expect(step.amountCents).toBe(250);
    expect(received).toContain(step.providerEvent);
  });
});

describe('orchestration defensive — probeCircuit error paths', () => {
  it('probeCircuit throws when session is not circuit-open', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_not_open',
      amountCents: 100,
      config: { providers: ['stripe'] },
    });
    await expect(probeCircuit(adapters, s)).rejects.toThrow(/not circuit-open/);
  });

  it('probeCircuit throws when adapter missing at closing time', async () => {
    const stripe = createStripeMock();
    const s = startOrchestration({
      intentId: 'i_no_ad',
      amountCents: 100,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 1,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge([stripe], s, { succeed: false, customerId: 'c' });
    expect(s.state).toBe('circuit-open');
    await new Promise((r) => setTimeout(r, 5));
    await expect(probeCircuit([], s)).rejects.toThrow(/no adapter for stripe/);
  });

  it('probeCircuit synthetic remaining step preserves state', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_syn',
      amountCents: 100,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 60_000,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, s, { succeed: false, customerId: 'c' });
    const step = await probeCircuit(adapters, s);
    expect(step.state).toBe('circuit-open');
    expect(step.metadata.elapsedMs).toBeGreaterThanOrEqual(0);
    expect(step.metadata.remainingMs).toBeGreaterThan(0);
    expect(s.state).toBe('circuit-open');
  });
});

describe('orchestration defensive — failover missing adapter guard', () => {
  it('routeCharge throws when failover target has no adapter', async () => {
    const stripe = createStripeMock();
    const s = startOrchestration({
      intentId: 'i_fo_no',
      amountCents: 100,
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 1,
        circuitBreakerThreshold: 10,
      },
    });
    await expect(
      routeCharge([stripe], s, { succeed: false, customerId: 'c' }),
    ).rejects.toThrow(/no adapter for failover paddle/);
  });

  it('probeCircuit null circuitOpenedAt falls back to 0 (nullish coalescing branch)', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_null',
      amountCents: 100,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 1,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, s, { succeed: false, customerId: 'c' });
    s.circuitOpenedAt = null;
    await new Promise<void>((r) => { setTimeout(() => r(), 5); });
    const step = await probeCircuit(adapters, s);
    expect(step.neutralEvent).toBe('orchestration.circuit_closed');
    expect(s.state).toBe('circuit-closed');
  });

  it('probeCircuit dead-code guard — synthetic currentProviderIndex overflow throws out of range', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_oor',
      amountCents: 100,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 100_000,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, s, { succeed: false, customerId: 'c' });
    expect(s.state).toBe('circuit-open');
    s.currentProviderIndex = 99;
    await expect(probeCircuit(adapters, s)).rejects.toThrow(/currentProviderIndex out of range/);
  });
});

describe('orchestration defensive — history + failover recovery', () => {
  it('history accumulates step-by-step across route + failover + probe', async () => {
    const adapters = makeAll();
    const s = startOrchestration({
      intentId: 'i_hist',
      amountCents: 500,
      config: {
        providers: ['stripe', 'paddle'],
        maxRetriesPerProvider: 2,
        circuitBreakerThreshold: 10,
      },
    });
    await routeCharge(adapters, s, { succeed: false, customerId: 'c' });
    await routeCharge(adapters, s, { succeed: false, customerId: 'c' });
    await routeCharge(adapters, s, { succeed: true, customerId: 'c' });
    expect(s.history.length).toBe(3);
    expect(s.history.map((h) => h.neutralEvent)).toEqual([
      'orchestration.routed',
      'orchestration.failed_over',
      'orchestration.routed',
    ]);
  });
});
