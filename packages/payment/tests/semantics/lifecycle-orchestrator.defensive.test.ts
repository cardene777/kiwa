import { describe, expect, it } from 'vitest';
import {
  handleEvent,
  startLifecycle,
  summarizeLifecycle,
  type LifecycleSession,
} from '../../src/semantics/lifecycle-orchestrator.js';

describe('lifecycle-orchestrator defensive — grace-period edge branches', () => {
  it('grace-period + user-canceled -> canceled', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    expect(s.state).toBe('grace-period');
    const next = handleEvent({ session: s, event: 'user-canceled', timestamp: 't2' });
    expect(next.state).toBe('canceled');
  });

  it('grace-period + invalid event soft-reject preserves state', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'chargeback-won', timestamp: 't2' });
    expect(next.state).toBe('grace-period');
    expect(next.events).toContain('invalid:chargeback-won-in-grace-period');
  });

  it('grace-period + chargeback-filed is invalid (grace does not route to chargeback)', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't2' });
    expect(next.state).toBe('grace-period');
    expect(next.events).toContain('invalid:chargeback-filed-in-grace-period');
    expect(next.chargebacksDisputed).toBe(0);
  });
});

describe('lifecycle-orchestrator defensive — dunning-active edge branches', () => {
  it('dunning-active + user-canceled -> canceled', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    expect(s.state).toBe('dunning-active');
    const next = handleEvent({ session: s, event: 'user-canceled', timestamp: 't3' });
    expect(next.state).toBe('canceled');
  });

  it('dunning-active + payment-succeeded is invalid (dunning does not accept direct success)', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    const next = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't3' });
    expect(next.state).toBe('dunning-active');
    expect(next.events).toContain('invalid:payment-succeeded-in-dunning-active');
  });

  it('dunning-active + chargeback-won soft-reject (no active chargeback yet)', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    const next = handleEvent({ session: s, event: 'chargeback-won', timestamp: 't3' });
    expect(next.state).toBe('dunning-active');
    expect(next.events).toContain('invalid:chargeback-won-in-dunning-active');
  });
});

describe('lifecycle-orchestrator defensive — chargeback-dispute edge branches', () => {
  it('chargeback-dispute + user-canceled -> canceled', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    expect(s.state).toBe('chargeback-dispute');
    const next = handleEvent({ session: s, event: 'user-canceled', timestamp: 't2' });
    expect(next.state).toBe('canceled');
  });

  it('chargeback-dispute + payment-failed is invalid (dispute already in progress)', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    expect(next.state).toBe('chargeback-dispute');
    expect(next.events).toContain('invalid:payment-failed-in-chargeback-dispute');
  });

  it('chargeback-dispute + dunning-succeeded is invalid', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'dunning-succeeded', timestamp: 't2' });
    expect(next.state).toBe('chargeback-dispute');
    expect(next.events).toContain('invalid:dunning-succeeded-in-chargeback-dispute');
  });
});

describe('lifecycle-orchestrator defensive — canceled terminal state coverage', () => {
  it.each([
    'payment-succeeded',
    'payment-failed',
    'dunning-succeeded',
    'dunning-exhausted',
    'chargeback-filed',
    'chargeback-won',
    'chargeback-lost',
    'user-canceled',
  ] as const)('canceled + %s -> terminal log preserves canceled state', (event) => {
    let s: LifecycleSession = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'user-canceled', timestamp: 't1' });
    const next = handleEvent({ session: s, event, timestamp: 't2' });
    expect(next.state).toBe('canceled');
    expect(next.events).toContain(`terminal:${event}-in-canceled`);
  });
});

describe('lifecycle-orchestrator defensive — summarizeLifecycle edge cases', () => {
  it('empty session (no events) returns 0 counts', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const sum = summarizeLifecycle(s);
    expect(sum.currentState).toBe('active-billing');
    expect(sum.validEvents).toBe(0);
    expect(sum.invalidEvents).toBe(0);
    expect(sum.terminalEvents).toBe(0);
    expect(sum.cyclesCompleted).toBe(0);
    expect(sum.chargebacksDisputed).toBe(0);
  });

  it('mixed transitions with invalid + terminal counted separately', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' }); // valid -> dispute
    s = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't2' }); // invalid in dispute
    s = handleEvent({ session: s, event: 'chargeback-lost', timestamp: 't3' }); // valid -> canceled
    s = handleEvent({ session: s, event: 'user-canceled', timestamp: 't4' }); // terminal
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't5' }); // terminal
    const sum = summarizeLifecycle(s);
    expect(sum.currentState).toBe('canceled');
    expect(sum.chargebacksDisputed).toBe(1);
    expect(sum.invalidEvents).toBe(1);
    expect(sum.terminalEvents).toBe(2);
    expect(sum.validEvents).toBe(2);
  });
});
