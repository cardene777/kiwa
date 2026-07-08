import { describe, expect, it } from 'vitest';
import {
  bootQuery,
  extractTimeoutStats,
  pipeQueryEvents,
  renderQueryDashboard,
} from '../src/workflow.js';

describe('dogfood-search-query-app (v2.6-2)', () => {
  it('Pattern 1: bootQuery で parsing 初期化', () => {
    expect(bootQuery({ timestamp: 't0' }).state).toBe('parsing');
  });

  it('Pattern 2: pipeQueryEvents 全経路 chain', () => {
    const s = bootQuery({ timestamp: 't0' });
    const next = pipeQueryEvents({
      session: s,
      events: [
        { event: 'parse-succeeded', timestamp: 't1' },
        { event: 'search-completed', timestamp: 't2' },
        { event: 'rerank-completed', timestamp: 't3' },
        { event: 'facet-computed', timestamp: 't4' },
      ],
    });
    expect(next.state).toBe('completed');
  });

  it('Pattern 3: renderQueryDashboard で summary', () => {
    const s = bootQuery({ timestamp: 't0' });
    const dash = renderQueryDashboard(s);
    expect(dash.currentState).toBe('parsing');
  });

  it('Pattern 4: extractTimeoutStats', () => {
    let s = bootQuery({ timestamp: 't0' });
    s = pipeQueryEvents({ session: s, events: [{ event: 'query-timeout', timestamp: 't1' }] });
    expect(extractTimeoutStats(s).timeouts).toBe(1);
  });

  it('4 pattern 統合', () => {
    let s = bootQuery({ timestamp: 't0' });
    s = pipeQueryEvents({
      session: s,
      events: [
        { event: 'parse-succeeded', timestamp: 't1' },
        { event: 'query-timeout', timestamp: 't2' },
      ],
    });
    expect(s.state).toBe('completed');
    expect(extractTimeoutStats(s).timeouts).toBe(1);
  });
});
