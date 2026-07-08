/**
 * v2.3-3 docs 補強 — tutorial 130 code snippet 検証。
 * 49 milestone 連続 snippet validation streak = v1.23 → v2.3。
 * depth-5 pattern 4 例目確定 = dominant pattern 昇格 confirmed。
 */
import { describe, expect, it } from 'vitest';
import { handleEvent, startLifecycle } from '../src/semantics/lifecycle-orchestrator.js';

describe('tutorial 130 — Step 1 初期化 snippet', () => {
  it('startLifecycle で active-billing 初期化', () => {
    const s = startLifecycle({ timestamp: '2026-07-08T00:00:00Z' });
    expect(s.state).toBe('active-billing');
  });
});

describe('tutorial 130 — Step 2 event 遷移 snippet', () => {
  it('payment-succeeded で cycles +1', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'payment-succeeded', timestamp: 't1' });
    expect(next.billingCyclesCompleted).toBe(1);
  });

  it('payment-failed で grace-period 遷移', () => {
    const s = startLifecycle({ timestamp: 't0' });
    const next = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    expect(next.state).toBe('grace-period');
  });
});

describe('tutorial 130 — Step 3 dunning cascade snippet', () => {
  it('grace → dunning → recovery chain', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'payment-failed', timestamp: 't2' });
    expect(s.state).toBe('dunning-active');
    s = handleEvent({ session: s, event: 'dunning-succeeded', timestamp: 't3' });
    expect(s.state).toBe('active-billing');
  });
});

describe('tutorial 130 — Step 4 chargeback dispute snippet', () => {
  it('chargeback-filed → chargeback-won で active-billing 復帰', () => {
    let s = startLifecycle({ timestamp: 't0' });
    s = handleEvent({ session: s, event: 'chargeback-filed', timestamp: 't1' });
    s = handleEvent({ session: s, event: 'chargeback-won', timestamp: 't2' });
    expect(s.state).toBe('active-billing');
    expect(s.chargebacksDisputed).toBe(1);
  });
});
