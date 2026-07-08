import { describe, expect, it } from 'vitest';
import {
  completeStepUp,
  evaluateRisk,
  freezeSession,
  scoreToLevel,
  startContinuousAuth,
  terminateContinuousAuth,
} from '../../src/semantics/continuous-auth.js';
import * as semanticsModule from '../../src/semantics/index.js';

describe('v0.7 scoreToLevel — 4 段 category SSOT', () => {
  it('T-A-CA-001 boundary [0, 0.3) = low', () => {
    expect(scoreToLevel(0)).toBe('low');
    expect(scoreToLevel(0.15)).toBe('low');
    expect(scoreToLevel(0.29)).toBe('low');
  });

  it('T-A-CA-002 boundary [0.3, 0.6) = medium', () => {
    expect(scoreToLevel(0.3)).toBe('medium');
    expect(scoreToLevel(0.45)).toBe('medium');
    expect(scoreToLevel(0.59)).toBe('medium');
  });

  it('T-A-CA-003 boundary [0.6, 0.85) = high', () => {
    expect(scoreToLevel(0.6)).toBe('high');
    expect(scoreToLevel(0.75)).toBe('high');
    expect(scoreToLevel(0.84)).toBe('high');
  });

  it('T-A-CA-004 boundary [0.85, 1.0] = critical', () => {
    expect(scoreToLevel(0.85)).toBe('critical');
    expect(scoreToLevel(0.95)).toBe('critical');
    expect(scoreToLevel(1.0)).toBe('critical');
  });
});

describe('v0.7 startContinuousAuth — 初期化 SSOT', () => {
  it('T-A-CA-005 default で monitoring 状態 + low + 60_000ms interval', () => {
    const s = startContinuousAuth({ timestamp: '2026-07-08T00:00:00Z' });
    expect(s.state).toBe('monitoring');
    expect(s.currentRiskLevel).toBe('low');
    expect(s.currentRiskScore).toBe(0);
    expect(s.monitoringIntervalMs).toBe(60_000);
    expect(s.stepUpTriggeredCount).toBe(0);
    expect(s.events).toEqual(['continuous-auth-started']);
  });

  it('T-A-CA-006 initialRiskScore + monitoringIntervalMs 上書き', () => {
    const s = startContinuousAuth({
      initialRiskScore: 0.5,
      monitoringIntervalMs: 30_000,
      timestamp: 't0',
    });
    expect(s.currentRiskScore).toBe(0.5);
    expect(s.currentRiskLevel).toBe('medium');
    expect(s.monitoringIntervalMs).toBe(30_000);
  });
});

describe('v0.7 evaluateRisk — 状態遷移 SSOT', () => {
  it('T-A-CA-007 low → medium で monitoring 継続', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const next = evaluateRisk({ session: s, newScore: 0.4, timestamp: 't1' });
    expect(next.state).toBe('monitoring');
    expect(next.currentRiskLevel).toBe('medium');
    expect(next.monitoringIntervalMs).toBe(60_000); // 通常 interval 維持
  });

  it('T-A-CA-008 low → high で elevated 遷移 + interval 15_000ms', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const next = evaluateRisk({ session: s, newScore: 0.7, timestamp: 't1' });
    expect(next.state).toBe('elevated');
    expect(next.currentRiskLevel).toBe('high');
    expect(next.monitoringIntervalMs).toBe(15_000);
  });

  it('T-A-CA-009 low → critical で step-up-required 遷移', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const next = evaluateRisk({ session: s, newScore: 0.9, timestamp: 't1' });
    expect(next.state).toBe('step-up-required');
    expect(next.currentRiskLevel).toBe('critical');
  });

  it('T-A-CA-010 events log に 遷移 record', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const next = evaluateRisk({ session: s, newScore: 0.7, timestamp: 't1' });
    expect(next.events).toContain('continuous-auth-started');
    expect(next.events).toContain('risk-evaluated:high:0.70');
  });

  it('T-A-CA-011 elevated → low で monitoring 復帰 + interval 復元', () => {
    let s = startContinuousAuth({ timestamp: 't0' });
    s = evaluateRisk({ session: s, newScore: 0.7, timestamp: 't1' });
    expect(s.state).toBe('elevated');
    s = evaluateRisk({ session: s, newScore: 0.1, timestamp: 't2' });
    expect(s.state).toBe('monitoring');
    expect(s.currentRiskLevel).toBe('low');
    expect(s.monitoringIntervalMs).toBe(60_000);
  });
});

describe('v0.7 completeStepUp — step-up MFA 完了経路', () => {
  it('T-A-CA-012 step-up-required → elevated + stepUpTriggeredCount 加算', () => {
    let s = startContinuousAuth({ timestamp: 't0' });
    s = evaluateRisk({ session: s, newScore: 0.9, timestamp: 't1' });
    expect(s.state).toBe('step-up-required');
    s = completeStepUp({ session: s, timestamp: 't2' });
    expect(s.state).toBe('elevated');
    expect(s.stepUpTriggeredCount).toBe(1);
    expect(s.events).toContain('step-up-completed');
  });

  it('T-A-CA-013 monitoring 状態 で step-up 呼出 → throw (guard)', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    expect(() => completeStepUp({ session: s, timestamp: 't1' })).toThrow(
      /cannot complete step-up from state "monitoring"/,
    );
  });

  it('T-A-CA-014 複数回 step-up 発火で count 増加', () => {
    let s = startContinuousAuth({ timestamp: 't0' });
    // 1 回目
    s = evaluateRisk({ session: s, newScore: 0.9, timestamp: 't1' });
    s = completeStepUp({ session: s, timestamp: 't2' });
    // risk 再上昇で 2 回目
    s = evaluateRisk({ session: s, newScore: 0.95, timestamp: 't3' });
    s = completeStepUp({ session: s, timestamp: 't4' });
    expect(s.stepUpTriggeredCount).toBe(2);
  });
});

describe('v0.7 freezeSession + terminateContinuousAuth — 例外経路', () => {
  it('T-A-CA-015 freezeSession で session-frozen + reason record', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const frozen = freezeSession({ session: s, reason: 'step-up-rejected', timestamp: 't1' });
    expect(frozen.state).toBe('session-frozen');
    expect(frozen.events).toContain('session-frozen:step-up-rejected');
  });

  it('T-A-CA-016 terminateContinuousAuth で terminated + reason record', () => {
    const s = startContinuousAuth({ timestamp: 't0' });
    const term = terminateContinuousAuth({ session: s, reason: 'hijack-detected', timestamp: 't1' });
    expect(term.state).toBe('terminated');
    expect(term.events).toContain('terminated:hijack-detected');
  });
});

describe('v0.7 integrated workflow — 状態遷移 chain', () => {
  it('T-A-CA-017 monitoring → elevated → step-up-required → elevated → monitoring chain', () => {
    let s = startContinuousAuth({ timestamp: 't0' });
    expect(s.state).toBe('monitoring');
    s = evaluateRisk({ session: s, newScore: 0.7, timestamp: 't1' });
    expect(s.state).toBe('elevated');
    s = evaluateRisk({ session: s, newScore: 0.9, timestamp: 't2' });
    expect(s.state).toBe('step-up-required');
    s = completeStepUp({ session: s, timestamp: 't3' });
    expect(s.state).toBe('elevated');
    s = evaluateRisk({ session: s, newScore: 0.1, timestamp: 't4' });
    expect(s.state).toBe('monitoring');
    expect(s.stepUpTriggeredCount).toBe(1);
  });
});

describe('v0.7 shape 契約 preserving 絶対維持', () => {
  it('T-A-CA-018 既存 8 axis semantics 触っていない (v0.6 API 変更 0)', () => {
    // 既存 export の signature verify (v0.6 の 8 axis semantics で export された関数)
    expect(typeof semanticsModule.startDevicePasskey).toBe('function');
    expect(typeof semanticsModule.startConditionalUi).toBe('function');
    expect(typeof semanticsModule.startStepUp).toBe('function');
    expect(typeof semanticsModule.startRiskEval).toBe('function');
    expect(typeof semanticsModule.startContinuity).toBe('function');
    expect(typeof semanticsModule.startCrossDevice).toBe('function');
    expect(typeof semanticsModule.startHijackWatch).toBe('function');
    expect(typeof semanticsModule.startAuthTelemetry).toBe('function');
    // v0.7 で 追加した 6 export
    expect(typeof semanticsModule.startContinuousAuth).toBe('function');
    expect(typeof semanticsModule.evaluateRisk).toBe('function');
    expect(typeof semanticsModule.completeStepUp).toBe('function');
  });
});
