import type {
  AuthPlatform,
  AuthStepUpAdapter,
  MfaStep,
} from '../adapters/interface.js';

export interface Scenario {
  platform: AuthPlatform;
  stage: 'step-up' | 'continuity' | 'hijack';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: MfaStep[];
  realTrace: MfaStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

async function runScenario(
  adapter: AuthStepUpAdapter,
  scenario: Scenario,
): Promise<MfaStep[]> {
  const trace: MfaStep[] = [];
  if (scenario.stage === 'step-up') {
    const s = await adapter.startStepUpFlow({
      platform: scenario.platform,
      userId: 'u-1',
      currentAal: 'AAL1',
    });
    trace.push({ op: 'startStepUpFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.escalateTo(s, { requiredAal: 'AAL2' }));
    trace.push(await adapter.satisfyFactor(s, { level: 'AAL2', factor: 'sms', nowMs: 1000 }));
    await adapter.closeStepUp(s);
    trace.push({ op: 'closeStepUp', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'continuity') {
    const s = await adapter.startContinuityFlow({
      platform: scenario.platform,
      userId: 'u-1',
      refreshToken: 'r-1',
      expiresAtMs: 100_000,
    });
    trace.push({ op: 'startContinuityFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.reauthSeamlessly(s, { nowMs: 1000 }));
    trace.push(await adapter.rotateRefreshToken(s, { newToken: 'r-2', nowMs: 2000 }));
    await adapter.closeContinuity(s);
    trace.push({ op: 'closeContinuity', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startHijackWatchFlow({
      platform: scenario.platform,
      userId: 'u-1',
      baselineFingerprint: 'fp-A',
      baselineRegion: 'JP',
    });
    trace.push({ op: 'startHijackWatchFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.reportDrift(s, { observedFingerprint: 'fp-B', distance: 0.9 }));
    trace.push(await adapter.cascadeLogout(s, { revokedSessionIds: ['s-a', 's-b'] }));
    await adapter.closeHijackWatch(s);
    trace.push({ op: 'closeHijackWatch', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(
  mock: AuthStepUpAdapter,
  real: AuthStepUpAdapter,
): Promise<FidelityReport> {
  const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];
  const stages: Scenario['stage'][] = ['step-up', 'continuity', 'hijack'];
  const rows: FidelityRow[] = [];
  let totalMockOps = 0;
  let totalRealOps = 0;
  let driftCount = 0;
  for (const platform of platforms) {
    for (const stage of stages) {
      const scenario: Scenario = { platform, stage };
      const mockTrace = await runScenario(mock, scenario);
      const realTrace = await runScenario(real, scenario);
      const drift = !tracesEqual(mockTrace, realTrace);
      rows.push({ scenario, mockTrace, realTrace, drift });
      totalMockOps += mockTrace.length;
      totalRealOps += realTrace.length;
      if (drift) driftCount++;
    }
  }
  return { rows, totalMockOps, totalRealOps, driftCount };
}

function tracesEqual(a: MfaStep[], b: MfaStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
