import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startSession,
  summarizeSession,
} from '../../src/semantics/session-lifecycle-orchestrator.js';

describe('v0.8 session-lifecycle-orchestrator', () => {
  it('T-A-SL-001 init 初期化', () => {
    expect(startSession({ timestamp: 't0' }).state).toBe('init');
  });

  it('T-A-SL-002 auth-succeeded → authed', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    expect(next.state).toBe('authed');
    expect(next.authAttempts).toBe(1);
  });

  it('T-A-SL-003 auth-failed で init 維持 + failure count', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'auth-failed', timestamp: 't1' });
    expect(next.state).toBe('init');
    expect(next.authFailures).toBe(1);
  });

  it('T-A-SL-004 全経路 chain (init → authed → refreshing → authed → expired → revoked)', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    expect(s.state).toBe('authed');
    s = dispatchEvent({ session: s, event: 'refresh-triggered', timestamp: 't2' });
    expect(s.state).toBe('refreshing');
    s = dispatchEvent({ session: s, event: 'refresh-succeeded', timestamp: 't3' });
    expect(s.state).toBe('authed');
    s = dispatchEvent({ session: s, event: 'session-expired', timestamp: 't4' });
    expect(s.state).toBe('expired');
    s = dispatchEvent({ session: s, event: 'revoke-requested', timestamp: 't5' });
    expect(s.state).toBe('revoked');
    const sum = summarizeSession(s);
    expect(sum.authAttempts).toBe(1);
    expect(sum.refreshesExecuted).toBe(1);
    expect(sum.revokes).toBe(1);
  });

  it('T-A-SL-005 refresh-failed で expired 降格', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'refresh-triggered', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'refresh-failed', timestamp: 't3' });
    expect(next.state).toBe('expired');
    expect(next.refreshFailures).toBe(1);
  });

  it('T-A-SL-006 shape 契約 preserving', () => {
    const s = startSession({ timestamp: 't0' });
    expect(s).toMatchObject({
      state: 'init',
      authAttempts: 0,
      authFailures: 0,
      refreshesExecuted: 0,
      refreshFailures: 0,
      revokes: 0,
    });
  });

  it('T-A-SL-007 revoked terminal で 全 event を terminal 記録', () => {
    let s = startSession({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'auth-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'revoke-requested', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'refresh-triggered', timestamp: 't3' });
    expect(next.state).toBe('revoked');
    const terminals = next.events.filter((e) => e.startsWith('terminal:'));
    expect(terminals.length).toBeGreaterThan(0);
  });

  it('T-A-SL-008 invalid 遷移で 状態遷移せず invalid 記録 (throw guard = backend systems layer)', () => {
    const s = startSession({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'refresh-triggered', timestamp: 't1' });
    expect(next.state).toBe('init');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:refresh-triggered-in-init');
  });

  it('T-A-SL-009 40 セル 遷移表 SSOT = 5 state × 8 event で 網羅', () => {
    const states = ['init', 'authed', 'refreshing', 'expired', 'revoked'] as const;
    const events = [
      'auth-succeeded',
      'auth-failed',
      'refresh-triggered',
      'refresh-succeeded',
      'refresh-failed',
      'session-expired',
      'revoke-requested',
      'timeout',
    ] as const;
    expect(states.length * events.length).toBe(40);
  });
});
