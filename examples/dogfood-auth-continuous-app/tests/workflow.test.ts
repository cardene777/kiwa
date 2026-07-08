import { describe, expect, it } from 'vitest';
import {
  completeStepUpAndDeescalate,
  escalateOnRiskSignal,
  startWithBaselineRisk,
  terminateOnHijack,
} from '../src/workflow.js';

describe('dogfood-auth-continuous-app (v2.2-2、 Auth pair pioneer record 更新 dogfood)', () => {
  it('Pattern 1: startWithBaselineRisk — 通常 login で monitoring + low + 60_000ms', () => {
    const s = startWithBaselineRisk({ timestamp: '2026-07-08T00:00:00Z' });
    expect(s.state).toBe('monitoring');
    expect(s.currentRiskLevel).toBe('low');
    expect(s.monitoringIntervalMs).toBe(60_000);
    expect(s.stepUpTriggeredCount).toBe(0);
  });

  it('Pattern 2: escalateOnRiskSignal — telemetry から high 昇格', () => {
    const initial = startWithBaselineRisk({ timestamp: 't0' });
    const escalated = escalateOnRiskSignal({ session: initial, newScore: 0.75, timestamp: 't1' });
    expect(escalated.state).toBe('elevated');
    expect(escalated.currentRiskLevel).toBe('high');
    expect(escalated.monitoringIntervalMs).toBe(15_000);
  });

  it('Pattern 2: escalateOnRiskSignal — critical で step-up-required 遷移', () => {
    const initial = startWithBaselineRisk({ timestamp: 't0' });
    const critical = escalateOnRiskSignal({ session: initial, newScore: 0.95, timestamp: 't1' });
    expect(critical.state).toBe('step-up-required');
    expect(critical.currentRiskLevel).toBe('critical');
  });

  it('Pattern 3: completeStepUpAndDeescalate — step-up 完了 + risk 再評価 で monitoring 復帰', () => {
    let s = startWithBaselineRisk({ timestamp: 't0' });
    s = escalateOnRiskSignal({ session: s, newScore: 0.95, timestamp: 't1' });
    expect(s.state).toBe('step-up-required');
    const deescalated = completeStepUpAndDeescalate({
      session: s,
      postStepUpScore: 0.1,
      stepUpTimestamp: 't2',
      reEvalTimestamp: 't3',
    });
    expect(deescalated.state).toBe('monitoring');
    expect(deescalated.currentRiskLevel).toBe('low');
    expect(deescalated.stepUpTriggeredCount).toBe(1);
  });

  it('Pattern 3: completeStepUpAndDeescalate — step-up 後 も high なら elevated 継続', () => {
    let s = startWithBaselineRisk({ timestamp: 't0' });
    s = escalateOnRiskSignal({ session: s, newScore: 0.95, timestamp: 't1' });
    const stillElevated = completeStepUpAndDeescalate({
      session: s,
      postStepUpScore: 0.7,
      stepUpTimestamp: 't2',
      reEvalTimestamp: 't3',
    });
    expect(stillElevated.state).toBe('elevated');
    expect(stillElevated.currentRiskLevel).toBe('high');
  });

  it('Pattern 4: terminateOnHijack — freeze + terminate cascade で 2 event record', () => {
    const s = startWithBaselineRisk({ timestamp: 't0' });
    const terminated = terminateOnHijack({
      session: s,
      hijackReason: 'geo-anomaly',
      freezeTimestamp: 't1',
      terminateTimestamp: 't2',
    });
    expect(terminated.state).toBe('terminated');
    expect(terminated.events).toContain('session-frozen:geo-anomaly');
    expect(terminated.events).toContain('terminated:geo-anomaly');
  });

  it('4 pattern 統合 workflow — start → escalate → step-up → deescalate → terminate', () => {
    // Step 1: 通常 login
    let s = startWithBaselineRisk({ timestamp: 't0' });
    // Step 2: risk 上昇 で step-up-required
    s = escalateOnRiskSignal({ session: s, newScore: 0.9, timestamp: 't1' });
    expect(s.state).toBe('step-up-required');
    // Step 3: step-up 完了 で elevated 継続 (risk まだ 中程度)
    s = completeStepUpAndDeescalate({
      session: s,
      postStepUpScore: 0.7,
      stepUpTimestamp: 't2',
      reEvalTimestamp: 't3',
    });
    expect(s.state).toBe('elevated');
    expect(s.stepUpTriggeredCount).toBe(1);
    // Step 4: hijack detect で 完全終了
    const finalState = terminateOnHijack({
      session: s,
      hijackReason: 'concurrent-session-detected',
      freezeTimestamp: 't4',
      terminateTimestamp: 't5',
    });
    expect(finalState.state).toBe('terminated');
  });
});
