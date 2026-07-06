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

describe('orchestration axis — multi-provider routing', () => {
  it('routes charge on the primary provider on success', async () => {
    const adapters = makeAll();
    const session = startOrchestration({
      intentId: 'intent_1',
      amountCents: 5000,
      config: { providers: ['stripe', 'paddle', 'lemonsqueezy'] },
    });
    const step = await routeCharge(adapters, session, {
      succeed: true,
      customerId: 'cus_1',
    });
    expect(step.neutralEvent).toBe('orchestration.routed');
    expect(step.metadata.provider).toBe('stripe');
    expect(session.state).toBe('routing');
  });

  it('fails over to next provider after retry limit', async () => {
    const adapters = makeAll();
    const session = startOrchestration({
      intentId: 'intent_2',
      amountCents: 3000,
      config: {
        providers: ['stripe', 'paddle', 'lemonsqueezy'],
        maxRetriesPerProvider: 2,
      },
    });
    // 2 failures on stripe → failover to paddle
    await routeCharge(adapters, session, { succeed: false, customerId: 'cus_2' });
    const step = await routeCharge(adapters, session, { succeed: false, customerId: 'cus_2' });
    expect(step.neutralEvent).toBe('orchestration.failed_over');
    expect(step.metadata.provider).toBe('paddle');
    expect(session.state).toBe('failed-over');
  });

  it('opens circuit after threshold failures across providers', async () => {
    const adapters = makeAll();
    const session = startOrchestration({
      intentId: 'intent_3',
      amountCents: 1000,
      config: {
        providers: ['stripe', 'paddle'],
        circuitBreakerThreshold: 3,
        maxRetriesPerProvider: 2,
      },
    });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    const opened = await routeCharge(adapters, session, {
      succeed: false,
      customerId: 'c',
    });
    expect(opened.neutralEvent).toBe('orchestration.circuit_opened');
    expect(session.state).toBe('circuit-open');
    expect(session.circuitOpenedAt).not.toBeNull();
  });

  it('rejects routeCharge while circuit is open', async () => {
    const adapters = makeAll();
    const session = startOrchestration({
      intentId: 'intent_4',
      amountCents: 200,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    await expect(
      routeCharge(adapters, session, { succeed: true, customerId: 'c' }),
    ).rejects.toThrow(/circuit is open/);
  });

  it('probeCircuit reports remaining time while open', async () => {
    const adapters = makeAll();
    const session = startOrchestration({
      intentId: 'intent_5',
      amountCents: 800,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 60_000,
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    const step = await probeCircuit(adapters, session);
    expect(step.state).toBe('circuit-open');
    expect(step.metadata.remainingMs).toBeGreaterThan(0);
  });

  it('probeCircuit closes breaker after outage window elapses', async () => {
    const adapters = makeAll();
    const session = startOrchestration({
      intentId: 'intent_6',
      amountCents: 900,
      config: {
        providers: ['stripe'],
        circuitBreakerThreshold: 1,
        circuitOpenDurationMs: 1, // 1ms so we can wait it out
        maxRetriesPerProvider: 5,
      },
    });
    await routeCharge(adapters, session, { succeed: false, customerId: 'c' });
    await new Promise((r) => setTimeout(r, 5));
    const closed = await probeCircuit(adapters, session);
    expect(closed.neutralEvent).toBe('orchestration.circuit_closed');
    expect(session.state).toBe('circuit-closed');
  });

  it('throws when startOrchestration receives empty providers', () => {
    expect(() =>
      startOrchestration({
        intentId: 'intent_bad',
        amountCents: 100,
        config: { providers: [] },
      }),
    ).toThrow(/providers must not be empty/);
  });
});
