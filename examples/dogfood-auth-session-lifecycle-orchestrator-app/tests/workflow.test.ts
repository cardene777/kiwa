import { describe, expect, it } from 'vitest';
import {
  bootSession,
  extractAuthFailureRate,
  pipeSessionEvents,
  renderSessionDashboard,
  traceRefreshLoop,
} from '../src/workflow.js';

describe('dogfood-auth-session-lifecycle-orchestrator-app (v2.9-2)', () => {
  it('Pattern 1: bootSession', () => {
    expect(bootSession({ timestamp: 't0' }).state).toBe('init');
  });

  it('Pattern 2: pipeSessionEvents 全経路', () => {
    let s = bootSession({ timestamp: 't0' });
    s = pipeSessionEvents({
      session: s,
      events: [
        { event: 'auth-succeeded', timestamp: 't1' },
        { event: 'refresh-triggered', timestamp: 't2' },
        { event: 'refresh-succeeded', timestamp: 't3' },
        { event: 'session-expired', timestamp: 't4' },
      ],
    });
    expect(s.state).toBe('expired');
    expect(s.refreshesExecuted).toBe(1);
  });

  it('Pattern 3: renderSessionDashboard', () => {
    const s = bootSession({ timestamp: 't0' });
    expect(renderSessionDashboard(s).currentState).toBe('init');
  });

  it('Pattern 4: extractAuthFailureRate', () => {
    let s = bootSession({ timestamp: 't0' });
    s = pipeSessionEvents({
      session: s,
      events: [{ event: 'auth-failed', timestamp: 't1' }],
    });
    expect(extractAuthFailureRate(s).rate).toBe(1);
  });

  it('Pattern 5: traceRefreshLoop (refresh success ratio trace)', () => {
    let s = bootSession({ timestamp: 't0' });
    s = pipeSessionEvents({
      session: s,
      events: [
        { event: 'auth-succeeded', timestamp: 't1' },
        { event: 'refresh-triggered', timestamp: 't2' },
        { event: 'refresh-succeeded', timestamp: 't3' },
      ],
    });
    expect(traceRefreshLoop(s).ratio).toBe(1);
  });

  it('5 pattern 統合 (backend systems layer 第 2 例)', () => {
    let s = bootSession({ timestamp: 't0' });
    s = pipeSessionEvents({
      session: s,
      events: [
        { event: 'auth-succeeded', timestamp: 't1' },
        { event: 'revoke-requested', timestamp: 't2' },
      ],
    });
    expect(s.state).toBe('revoked');
    expect(s.revokes).toBe(1);
  });
});
