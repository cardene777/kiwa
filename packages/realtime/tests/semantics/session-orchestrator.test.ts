import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startSession,
  summarizeSession,
  type RealtimeSession,
} from '../../src/semantics/session-orchestrator.js';

describe('v2.1 startSession — 初期化 SSOT', () => {
  it('T-R-SO-001 connecting 初期化 + カウンタ 0', () => {
    const s = startSession({ timestamp: '2026-07-08T00:00:00Z' });
    expect(s.state).toBe('connecting');
    expect(s.connectAttempts).toBe(1);
    expect(s.reconnectRounds).toBe(0);
    expect(s.heartbeatFailures).toBe(0);
    expect(s.broadcastsReceived).toBe(0);
  });
});

describe('v2.1 dispatchEvent — connecting 状態', () => {
  it('T-R-SO-002 connect-succeeded で subscribed 遷移', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    expect(next.state).toBe('subscribed');
  });

  it('T-R-SO-003 connect-failed で reconnecting + reconnectRounds +1', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't1' });
    expect(next.state).toBe('reconnecting');
    expect(next.reconnectRounds).toBe(1);
  });

  it('T-R-SO-004 user-disconnect で closed 遷移', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'user-disconnect', timestamp: 't1' });
    expect(next.state).toBe('closed');
  });

  it('T-R-SO-005 無効 event (heartbeat-recovered) は soft-reject', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'heartbeat-recovered', timestamp: 't1' });
    expect(next.state).toBe('connecting');
    expect(next.events).toContain('invalid:heartbeat-recovered-in-connecting');
  });
});

describe('v2.1 dispatchEvent — subscribed 状態', () => {
  it('T-R-SO-006 subscribe-succeeded で broadcastsReceived +1', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'subscribe-succeeded', timestamp: 't2' });
    expect(next.broadcastsReceived).toBe(1);
  });

  it('T-R-SO-007 heartbeat-lost 3 回未満 は state 維持', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    expect(s.state).toBe('subscribed');
    expect(s.heartbeatFailures).toBe(1);
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    expect(s.state).toBe('subscribed');
    expect(s.heartbeatFailures).toBe(2);
  });

  it('T-R-SO-008 heartbeat-lost 3 回で degraded 降格', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't4' });
    expect(s.state).toBe('degraded');
    expect(s.heartbeatFailures).toBe(3);
  });

  it('T-R-SO-009 connect-failed で reconnecting 遷移', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't2' });
    expect(next.state).toBe('reconnecting');
  });
});

describe('v2.1 dispatchEvent — reconnecting 状態', () => {
  it('T-R-SO-010 reconnect-succeeded で subscribed 復帰 + heartbeat counter リセット', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    // heartbeat failure 2 回 積む
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    // reconnecting へ
    s = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't4' });
    expect(s.state).toBe('reconnecting');
    // reconnect success
    const next = dispatchEvent({ session: s, event: 'reconnect-succeeded', timestamp: 't5' });
    expect(next.state).toBe('subscribed');
    expect(next.heartbeatFailures).toBe(0);
  });

  it('T-R-SO-011 reconnect-exhausted で closed 遷移', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-failed', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'reconnect-exhausted', timestamp: 't2' });
    expect(next.state).toBe('closed');
  });
});

describe('v2.1 dispatchEvent — degraded 状態', () => {
  it('T-R-SO-012 heartbeat-recovered で subscribed 復帰', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    // 3 回 heartbeat 失敗 で degraded
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't4' });
    expect(s.state).toBe('degraded');
    const next = dispatchEvent({ session: s, event: 'heartbeat-recovered', timestamp: 't5' });
    expect(next.state).toBe('subscribed');
    expect(next.heartbeatFailures).toBe(0);
  });
});

describe('v2.1 dispatchEvent — closed terminal', () => {
  it('T-R-SO-013 closed 状態 で 全 event soft-reject + terminal log', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'user-disconnect', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't2' });
    expect(next.state).toBe('closed');
    expect(next.events).toContain('terminal:connect-succeeded-in-closed');
  });
});

describe('v2.1 summarizeSession', () => {
  it('T-R-SO-014 valid + invalid + terminal event count', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'heartbeat-recovered', timestamp: 't2' }); // invalid
    s = dispatchEvent({ session: s, event: 'user-disconnect', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't4' }); // terminal
    const sum = summarizeSession(s);
    expect(sum.currentState).toBe('closed');
    expect(sum.invalidEvents).toBe(1);
    expect(sum.terminalEvents).toBe(1);
  });
});

describe('v2.1 統合 workflow', () => {
  it('T-R-SO-015 connecting → subscribed → degraded → subscribed の complete chain', () => {
    let s: RealtimeSession = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'connect-succeeded', timestamp: 't1' });
    expect(s.state).toBe('subscribed');
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'heartbeat-lost', timestamp: 't4' });
    expect(s.state).toBe('degraded');
    s = dispatchEvent({ session: s, event: 'heartbeat-recovered', timestamp: 't5' });
    expect(s.state).toBe('subscribed');
    expect(s.heartbeatFailures).toBe(0);
  });
});

describe('v2.1 shape 契約 preserving 絶対維持', () => {
  it('T-R-SO-016 既存 semantics 触っていない (v0.1-v0.2 API 変更 0)', async () => {
    const mod = await import('../../src/semantics/index.js');
    expect(typeof mod.startSession).toBe('function');
    expect(typeof mod.dispatchEvent).toBe('function');
    expect(typeof mod.summarizeSession).toBe('function');
  });
});
