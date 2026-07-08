import { describe, expect, it } from 'vitest';
import {
  bootstrapSubscription,
  extractDunningPath,
  processEventBatch,
  reportDashboard,
} from '../src/workflow.js';

describe('dogfood-payment-lifecycle-app (v2.3-2、 depth-5 pattern 4 例目確定 dogfood)', () => {
  it('Pattern 1: bootstrapSubscription で 初期化', () => {
    const s = bootstrapSubscription({ timestamp: 't0' });
    expect(s.state).toBe('active-billing');
    expect(s.billingCyclesCompleted).toBe(0);
  });

  it('Pattern 2: processEventBatch — 3 event batch で active → grace → dunning', () => {
    const s = bootstrapSubscription({ timestamp: 't0' });
    const next = processEventBatch({
      session: s,
      events: [
        { event: 'payment-succeeded', timestamp: 't1' },
        { event: 'payment-failed', timestamp: 't2' },
        { event: 'payment-failed', timestamp: 't3' },
      ],
    });
    expect(next.state).toBe('dunning-active');
    expect(next.billingCyclesCompleted).toBe(1);
  });

  it('Pattern 2: processEventBatch — dunning recovery 経路', () => {
    const s = bootstrapSubscription({ timestamp: 't0' });
    const next = processEventBatch({
      session: s,
      events: [
        { event: 'payment-failed', timestamp: 't1' },
        { event: 'payment-failed', timestamp: 't2' },
        { event: 'dunning-succeeded', timestamp: 't3' },
      ],
    });
    expect(next.state).toBe('active-billing');
    expect(next.dunningRoundsExecuted).toBe(1);
  });

  it('Pattern 3: reportDashboard で summary 出力', () => {
    const s = bootstrapSubscription({ timestamp: 't0' });
    const withEvents = processEventBatch({
      session: s,
      events: [
        { event: 'payment-succeeded', timestamp: 't1' },
        { event: 'payment-succeeded', timestamp: 't2' },
      ],
    });
    const summary = reportDashboard(withEvents);
    expect(summary.currentState).toBe('active-billing');
    expect(summary.cyclesCompleted).toBe(2);
    expect(summary.validEvents).toBe(2);
  });

  it('Pattern 4: extractDunningPath で dunning 統計抽出', () => {
    const s = bootstrapSubscription({ timestamp: 't0' });
    const withDunning = processEventBatch({
      session: s,
      events: [
        { event: 'payment-failed', timestamp: 't1' },
        { event: 'payment-failed', timestamp: 't2' },
        { event: 'dunning-succeeded', timestamp: 't3' },
      ],
    });
    const dunningStats = extractDunningPath(withDunning);
    expect(dunningStats.succeededRecoveries).toBe(1);
    expect(dunningStats.exhaustedCancellations).toBe(0);
  });

  it('4 pattern 統合 workflow — bootstrap → batch → dashboard → dunning-stats chain', () => {
    let s = bootstrapSubscription({ timestamp: 't0' });
    s = processEventBatch({
      session: s,
      events: [
        { event: 'payment-succeeded', timestamp: 't1' },
        { event: 'payment-failed', timestamp: 't2' },
        { event: 'payment-failed', timestamp: 't3' },
        { event: 'dunning-exhausted', timestamp: 't4' },
      ],
    });
    expect(s.state).toBe('canceled');
    const dash = reportDashboard(s);
    expect(dash.cyclesCompleted).toBe(1);
    const dun = extractDunningPath(s);
    expect(dun.exhaustedCancellations).toBe(1);
  });
});
