/**
 * v2.4-3 docs 補強 — tutorial 131 code snippet 検証。
 * 50 milestone 連続 snippet validation streak = v1.23 → v2.4。
 * depth-5 pattern 5 例目発生 = systematic law 昇格 candidate 到達。
 */
import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startSession,
} from '../src/semantics/session-orchestrator.js';

describe('tutorial 131 — Step 1 session 開始', () => {
  it('startSession で connecting 初期化', () => {
    const s = startSession({ timestamp: '2026-07-08T00:00:00Z' });
    expect(s.state).toBe('connecting');
  });
});

describe('tutorial 131 — Step 2 connect + subscribe', () => {
  it('connect-succeeded → subscribe-succeeded で broadcastsReceived +1', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'subscribe-succeeded', timestamp: 't2' });
    expect(s.state).toBe('subscribed');
    expect(s.broadcastsReceived).toBe(1);
  });
});

describe('tutorial 131 — Step 3 heartbeat 動的 QoS', () => {
  it('heartbeat-lost 3 回で degraded 降格', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't4' });
    expect(s.state).toBe('degraded');
    s = dispatchEvent({ session: s, event: 'heartbeat-recovered', timestamp: 't5' });
    expect(s.state).toBe('subscribed');
    expect(s.heartbeatFailures).toBe(0);
  });
});

describe('tutorial 131 — Step 4 reconnect', () => {
  it('connect-failed → reconnect-succeeded で subscribed 復帰', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'reconnect-succeeded', timestamp: 't3' });
    expect(s.state).toBe('subscribed');
    expect(s.heartbeatFailures).toBe(0);
  });
});
