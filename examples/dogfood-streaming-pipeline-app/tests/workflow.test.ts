import { describe, expect, it } from 'vitest';
import {
  bootPipeline,
  extractDlqStats,
  renderPipelineDashboard,
  runEventStream,
} from '../src/workflow.js';

describe('dogfood-streaming-pipeline-app (v2.5-2、 depth-5 pattern 6 例目発生 = systematic law CONFIRMED dogfood)', () => {
  it('Pattern 1: bootPipeline で producing 初期化', () => {
    const s = bootPipeline({ timestamp: 't0' });
    expect(s.state).toBe('producing');
  });

  it('Pattern 2: runEventStream — 3 event batch で producing → consuming chain', () => {
    const s = bootPipeline({ timestamp: 't0' });
    const next = runEventStream({
      session: s,
      events: [
        { event: 'produce-succeeded', timestamp: 't1' },
        { event: 'consume-succeeded', timestamp: 't2' },
        { event: 'consume-succeeded', timestamp: 't3' },
      ],
    });
    expect(next.state).toBe('consuming');
    expect(next.messagesConsumed).toBe(2);
  });

  it('Pattern 2: runEventStream — rebalance chain', () => {
    const s = bootPipeline({ timestamp: 't0' });
    const next = runEventStream({
      session: s,
      events: [
        { event: 'rebalance-triggered', timestamp: 't1' },
        { event: 'rebalance-completed', timestamp: 't2' },
      ],
    });
    expect(next.state).toBe('consuming');
    expect(next.rebalancesExecuted).toBe(1);
  });

  it('Pattern 3: renderPipelineDashboard', () => {
    const s = bootPipeline({ timestamp: 't0' });
    const next = runEventStream({
      session: s,
      events: [
        { event: 'produce-succeeded', timestamp: 't1' },
        { event: 'consume-succeeded', timestamp: 't2' },
      ],
    });
    const dash = renderPipelineDashboard(next);
    expect(dash.currentState).toBe('consuming');
    expect(dash.messagesProduced).toBe(1);
    expect(dash.messagesConsumed).toBe(1);
  });

  it('Pattern 4: extractDlqStats', () => {
    const s = bootPipeline({ timestamp: 't0' });
    const next = runEventStream({
      session: s,
      events: [
        { event: 'consume-succeeded', timestamp: 't1' },
        { event: 'consume-failed', timestamp: 't2' },
        { event: 'consume-succeeded', timestamp: 't3' },
      ],
    });
    const dlq = extractDlqStats(next);
    expect(dlq.currentDlqCount).toBe(1);
  });

  it('4 pattern 統合 workflow', () => {
    let s = bootPipeline({ timestamp: 't0' });
    s = runEventStream({
      session: s,
      events: [
        { event: 'produce-succeeded', timestamp: 't1' },
        { event: 'consume-succeeded', timestamp: 't2' },
        { event: 'rebalance-triggered', timestamp: 't3' },
        { event: 'rebalance-completed', timestamp: 't4' },
        { event: 'consume-failed', timestamp: 't5' },
        { event: 'stop-requested', timestamp: 't6' },
      ],
    });
    expect(s.state).toBe('stopped');
    const dash = renderPipelineDashboard(s);
    expect(dash.messagesProduced).toBe(1);
  });
});
