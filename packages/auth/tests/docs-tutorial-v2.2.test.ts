/**
 * v2.2-3 docs 補強 — tutorial 129 code snippet 検証。
 * 48 milestone 連続 snippet validation streak = v1.23 → v2.2。
 * systematic pattern 45 度目適用 (continuous state machine variant)。
 */
import { describe, expect, it } from 'vitest';
import {
  completeStepUp,
  evaluateRisk,
  freezeSession,
  startContinuousAuth,
  terminateContinuousAuth,
} from '../src/semantics/continuous-auth.js';

describe('tutorial 129 — Step 1 baseline 監視 開始 snippet', () => {
  it('startContinuousAuth で monitoring 初期化', () => {
    const s = startContinuousAuth({
      initialRiskScore: 0,
      monitoringIntervalMs: 60_000,
      timestamp: '2026-07-08T00:00:00Z',
    });
    expect(s.state).toBe('monitoring');
    expect(s.currentRiskLevel).toBe('low');
  });
});

describe('tutorial 129 — Step 2 risk 遷移 snippet', () => {
  it('evaluateRisk で high → elevated + interval 15_000ms', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const escalated = evaluateRisk({ session: s, newScore: 0.75, timestamp: 't1' });
    expect(escalated.state).toBe('elevated');
    expect(escalated.monitoringIntervalMs).toBe(15_000);
  });

  it('evaluateRisk で critical → step-up-required', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const critical = evaluateRisk({ session: s, newScore: 0.95, timestamp: 't1' });
    expect(critical.state).toBe('step-up-required');
  });
});

describe('tutorial 129 — Step 3 step-up 完了 + 降格 snippet', () => {
  it('completeStepUp + evaluateRisk (low) で monitoring 復帰', () => {
    let s = startContinuousAuth({ timestamp: 't0' });
    s = evaluateRisk({ session: s, newScore: 0.95, timestamp: 't1' });
    s = completeStepUp({ session: s, timestamp: 't2' });
    s = evaluateRisk({ session: s, newScore: 0.1, timestamp: 't3' });
    expect(s.state).toBe('monitoring');
    expect(s.stepUpTriggeredCount).toBe(1);
  });
});

describe('tutorial 129 — Step 4 hijack terminate snippet', () => {
  it('freezeSession + terminateContinuousAuth で events 2 個 record', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const frozen = freezeSession({ session: s, reason: 'geo-anomaly', timestamp: 't1' });
    const terminated = terminateContinuousAuth({
      session: frozen,
      reason: 'geo-anomaly',
      timestamp: 't2',
    });
    expect(terminated.state).toBe('terminated');
    expect(terminated.events).toContain('session-frozen:geo-anomaly');
    expect(terminated.events).toContain('terminated:geo-anomaly');
  });
});
