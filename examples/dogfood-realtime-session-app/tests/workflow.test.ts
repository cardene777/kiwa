import { describe, expect, it } from 'vitest';
import {
  extractReconnectStats,
  openWebSocketSession,
  pumpEventStream,
  renderSessionDashboard,
} from '../src/workflow.js';

describe('dogfood-realtime-session-app (v2.4-2、 depth-5 pattern 5 例目発生 dogfood)', () => {
  it('Pattern 1: openWebSocketSession で connecting 開始', () => {
    const s = openWebSocketSession({ timestamp: 't0' });
    expect(s.state).toBe('connecting');
  });

  it('Pattern 2: pumpEventStream — connect → subscribe chain', () => {
    const s = openWebSocketSession({ timestamp: 't0' });
    const next = pumpEventStream({
      session: s,
      events: [
        { event: 'connect-succeeded', timestamp: 't1' },
        { event: 'subscribe-succeeded', timestamp: 't2' },
        { event: 'subscribe-succeeded', timestamp: 't3' },
      ],
    });
    expect(next.state).toBe('subscribed');
    expect(next.broadcastsReceived).toBe(2);
  });

  it('Pattern 2: pumpEventStream — degraded 降格 + recovery chain', () => {
    const s = openWebSocketSession({ timestamp: 't0' });
    const next = pumpEventStream({
      session: s,
      events: [
        { event: 'connect-succeeded', timestamp: 't1' },
        { event: 'heartbeat-lost', timestamp: 't2' },
        { event: 'heartbeat-lost', timestamp: 't3' },
        { event: 'heartbeat-lost', timestamp: 't4' },
        { event: 'heartbeat-recovered', timestamp: 't5' },
      ],
    });
    expect(next.state).toBe('subscribed');
    expect(next.heartbeatFailures).toBe(0);
  });

  it('Pattern 3: renderSessionDashboard で summary 出力', () => {
    const s = openWebSocketSession({ timestamp: 't0' });
    const next = pumpEventStream({
      session: s,
      events: [
        { event: 'connect-succeeded', timestamp: 't1' },
        { event: 'subscribe-succeeded', timestamp: 't2' },
      ],
    });
    const dash = renderSessionDashboard(next);
    expect(dash.currentState).toBe('subscribed');
    expect(dash.broadcastsReceived).toBe(1);
  });

  it('Pattern 4: extractReconnectStats で 統計抽出', () => {
    const s = openWebSocketSession({ timestamp: 't0' });
    const next = pumpEventStream({
      session: s,
      events: [
        { event: 'connect-failed', timestamp: 't1' },
        { event: 'reconnect-succeeded', timestamp: 't2' },
      ],
    });
    const stats = extractReconnectStats(next);
    expect(stats.reconnectAttempts).toBe(1);
    expect(stats.reconnectSucceeded).toBe(1);
    expect(stats.reconnectExhausted).toBe(0);
  });

  it('4 pattern 統合 workflow — open → pump → dashboard → stats chain', () => {
    let s = openWebSocketSession({ timestamp: 't0' });
    s = pumpEventStream({
      session: s,
      events: [
        { event: 'connect-succeeded', timestamp: 't1' },
        { event: 'heartbeat-lost', timestamp: 't2' },
        { event: 'heartbeat-lost', timestamp: 't3' },
        { event: 'heartbeat-lost', timestamp: 't4' },
        { event: 'connect-failed', timestamp: 't5' },
        { event: 'reconnect-exhausted', timestamp: 't6' },
      ],
    });
    expect(s.state).toBe('closed');
    const dash = renderSessionDashboard(s);
    expect(dash.reconnectRounds).toBe(1);
    const stats = extractReconnectStats(s);
    expect(stats.reconnectExhausted).toBe(1);
  });
});
