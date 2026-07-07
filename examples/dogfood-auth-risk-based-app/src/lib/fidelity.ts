import type { AuthPlatform, RiskAdapter, RiskStep } from '../adapters/interface.js';

export interface Scenario {
  platform: AuthPlatform;
  stage: 'risk' | 'telemetry' | 'hijack';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: RiskStep[];
  realTrace: RiskStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

const LOW_SIGNALS = {
  deviceScore: 5,
  ipReputation: 5,
  geoAnomaly: 5,
  velocityScore: 5,
  behavioralScore: 5,
};

async function runScenario(adapter: RiskAdapter, scenario: Scenario): Promise<RiskStep[]> {
  const trace: RiskStep[] = [];
  if (scenario.stage === 'risk') {
    const s = await adapter.startRiskFlow({ platform: scenario.platform, userId: 'u-1' });
    trace.push({ op: 'startRiskFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.evaluateScoreOp(s, LOW_SIGNALS));
    trace.push(await adapter.applyPolicyOp(s));
    await adapter.closeRisk(s);
    trace.push({ op: 'closeRisk', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'telemetry') {
    const s = await adapter.startTelemetryFlow({
      platform: scenario.platform,
      userId: 'u-1',
      endpointId: '/login',
    });
    trace.push({ op: 'startTelemetryFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.recordAttemptOp(s, { success: true, latencyMs: 100 }));
    trace.push(await adapter.detectAbuseOp(s, { failureRateThreshold: 0.5, ipAddress: '1.2.3.4' }));
    await adapter.closeTelemetry(s);
    trace.push({ op: 'closeTelemetry', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startConcurrentWatch({
      platform: scenario.platform,
      userId: 'u-1',
      baselineRegion: 'JP',
    });
    trace.push({ op: 'startConcurrentWatch', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(
      await adapter.reportGeoAnomalyOp(s, { observedRegion: 'BR', km: 18_000, withinMinutes: 10 }),
    );
    trace.push(await adapter.reportConcurrentOp(s, { concurrentSessionCount: 3 }));
    await adapter.closeConcurrentWatch(s);
    trace.push({ op: 'closeConcurrentWatch', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(mock: RiskAdapter, real: RiskAdapter): Promise<FidelityReport> {
  const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];
  const stages: Scenario['stage'][] = ['risk', 'telemetry', 'hijack'];
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

function tracesEqual(a: RiskStep[], b: RiskStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
