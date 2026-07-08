import { describe, expect, it } from 'vitest';
import {
  handleEvent,
  startLifecycle,
  summarizeLifecycle,
  type LifecycleSession,
} from '../../src/semantics/lifecycle-orchestrator.js';

describe('v2.1 startLifecycle — 初期化 SSOT', () => {
  it('T-P-LO-001 default で active-billing state + カウンタ 0', () => {
    const s = startLifecycle({ timestamp: '2026-07-08T00:00:00Z' });
    expect(s.state).toBe('active-billing');
    expect(s.billingCyclesCompleted).toBe(0);
    expect(s.failedAttemptCount).toBe(0);
    expect(s.dunningRoundsExecuted).toBe(0);
    expect(s.chargebacksDisputed).toBe(0);
    expect(s.events).toEqual(['lifecycle-started']);
  });
});

describe('v2.1 handleEvent — active-billing 状態', () => {
  it('T-P-LO-002 payment-succeeded で billingCyclesCompleted +1', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't1' });
    expect(next.state).toBe('active-billing');
    expect(next.billingCyclesCompleted).toBe(1);
  });

  it('T-P-LO-003 payment-failed で grace-period 遷移 + failedAttemptCount +1', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    expect(next.state).toBe('grace-period');
    expect(next.failedAttemptCount).toBe(1);
  });

  it('T-P-LO-004 chargeback-filed で chargeback-dispute 遷移', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    expect(next.state).toBe('chargeback-dispute');
    expect(next.chargebacksDisputed).toBe(1);
  });

  it('T-P-LO-005 user-canceled で canceled 遷移 (voluntary cancel)', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'user-canceled', timestamp: 't1' });
    expect(next.state).toBe('canceled');
  });

  it('T-P-LO-006 無効 event (dunning-succeeded) は soft-reject + invalid log', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'dunning-succeeded', timestamp: 't1' });
    expect(next.state).toBe('active-billing'); // 変わらず
    expect(next.events).toContain('invalid:dunning-succeeded-in-active-billing');
  });
});

describe('v2.1 handleEvent — grace-period 状態', () => {
  it('T-P-LO-007 payment-succeeded で active-billing 復帰 + cycles +1', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't2' });
    expect(next.state).toBe('active-billing');
    expect(next.billingCyclesCompleted).toBe(1);
  });

  it('T-P-LO-008 payment-failed で dunning-active 遷移 + dunningRounds +1', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    expect(next.state).toBe('dunning-active');
    expect(next.dunningRoundsExecuted).toBe(1);
  });
});

describe('v2.1 handleEvent — dunning-active 状態', () => {
  it('T-P-LO-009 dunning-succeeded で active-billing 復帰', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    expect(s.state).toBe('dunning-active');
    const next = handleEvent({ session: s, event: 'dunning-succeeded', timestamp: 't3' });
    expect(next.state).toBe('active-billing');
  });

  it('T-P-LO-010 dunning-exhausted で canceled 遷移 (involuntary cancel)', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    const next = handleEvent({ session: s, event: 'dunning-exhausted', timestamp: 't3' });
    expect(next.state).toBe('canceled');
  });

  it('T-P-LO-011 chargeback-filed で chargeback-dispute 遷移', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    const next = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't3' });
    expect(next.state).toBe('chargeback-dispute');
    expect(next.chargebacksDisputed).toBe(1);
  });
});

describe('v2.1 handleEvent — chargeback-dispute 状態', () => {
  it('T-P-LO-012 chargeback-won で active-billing 復帰', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'chargeback-won', timestamp: 't2' });
    expect(next.state).toBe('active-billing');
  });

  it('T-P-LO-013 chargeback-lost で canceled 遷移', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'chargeback-lost', timestamp: 't2' });
    expect(next.state).toBe('canceled');
  });
});

describe('v2.1 handleEvent — canceled terminal state', () => {
  it('T-P-LO-014 canceled 状態 で 全 event soft-reject + terminal log', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'user-canceled', timestamp: 't1' });
    const next = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't2' });
    expect(next.state).toBe('canceled');
    expect(next.events).toContain('terminal:payment-succeeded-in-canceled');
  });
});

describe('v2.1 summarizeLifecycle — 統計サマリー SSOT', () => {
  it('T-P-LO-015 valid + invalid + terminal event count', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't1' }); // valid
    s = handleEvent({ session: s, event: 'dunning-succeeded', timestamp: 't2' }); // invalid
    s = handleEvent({ session: s, event: 'user-canceled', timestamp: 't3' }); // valid transition to canceled
    s = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't4' }); // terminal
    const sum = summarizeLifecycle(s);
    expect(sum.currentState).toBe('canceled');
    expect(sum.cyclesCompleted).toBe(1);
    expect(sum.invalidEvents).toBe(1);
    expect(sum.terminalEvents).toBe(1);
    expect(sum.validEvents).toBe(2);
  });
});

describe('v2.1 統合 workflow — 5 state chain', () => {
  it('T-P-LO-016 active → grace → dunning → chargeback → canceled の 完全遷移', () => {
    let s: LifecycleSession = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't1' });
    expect(s.state).toBe('active-billing');
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    expect(s.state).toBe('grace-period');
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't3' });
    expect(s.state).toBe('dunning-active');
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't4' });
    expect(s.state).toBe('chargeback-dispute');
    s = handleEvent({ session: s, event: 'chargeback-lost', timestamp: 't5' });
    expect(s.state).toBe('canceled');
    expect(s.chargebacksDisputed).toBe(1);
  });

  it('T-P-LO-017 dunning recovery success で active-billing 復帰 chain', () => {
    let s: LifecycleSession = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' }); // grace
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' }); // dunning-active
    s = handleEvent({ session: s, event: 'dunning-succeeded', timestamp: 't3' });
    expect(s.state).toBe('active-billing');
    expect(s.dunningRoundsExecuted).toBe(1);
  });
});

describe('v2.1 shape 契約 preserving 絶対維持', () => {
  it('T-P-LO-018 既存 semantics 触っていない (v0.1-v0.4 API 変更 0)', async () => {
    const mod = await import('../../src/semantics/index.js');
    expect(typeof mod.startDunning).toBe('function');
    expect(typeof mod.startRetry).toBe('function');
    expect(typeof mod.startThreeDs).toBe('function');
    // v2.1 で 追加した export
    expect(typeof mod.startLifecycle).toBe('function');
    expect(typeof mod.handleEvent).toBe('function');
    expect(typeof mod.summarizeLifecycle).toBe('function');
  });
});
