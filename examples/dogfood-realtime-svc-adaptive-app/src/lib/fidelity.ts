import type { AdaptiveStep, Platform, RealtimeAdaptiveAdapter } from '../adapters/interface.js';

export interface Scenario {
  platform: Platform;
  stage: 'svc' | 'decoder' | 'datagram';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: AdaptiveStep[];
  realTrace: AdaptiveStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

async function runScenario(adapter: RealtimeAdaptiveAdapter, scenario: Scenario): Promise<AdaptiveStep[]> {
  const trace: AdaptiveStep[] = [];
  if (scenario.stage === 'svc') {
    const s = await adapter.startSvcFlow({ platform: scenario.platform, trackName: 'v-1' });
    trace.push({ op: 'startSvcFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.selectSvcLayer(s, { layerId: 'high', temporalId: 2, spatialId: 1 }));
    trace.push(await adapter.dropSvcLayer(s, { layerId: 'high', reason: 'complete' }));
    await adapter.closeSvcFlow(s);
    trace.push({ op: 'closeSvcFlow', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'decoder') {
    const s = await adapter.startDecoderFlow({ platform: scenario.platform, trackName: 'v-1', codec: 'H264' });
    trace.push({ op: 'startDecoderFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.decodeMediaFrame(s, { frameNumber: 1, type: 'key' }));
    trace.push(await adapter.dropDecoderFrame(s, { frameNumber: 2, reason: 'late' }));
    await adapter.closeDecoderFlow(s);
    trace.push({ op: 'closeDecoderFlow', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startDatagramFlow({ platform: scenario.platform, trackName: 'v-1' });
    trace.push({ op: 'startDatagramFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.sendMediaDatagram(s, { sequenceNumber: 1, bytes: 300, priority: 5 }));
    trace.push(await adapter.recoverDatagramFec(s, { recoveredCount: 3 }));
    await adapter.closeDatagramFlow(s);
    trace.push({ op: 'closeDatagramFlow', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(mock: RealtimeAdaptiveAdapter, real: RealtimeAdaptiveAdapter): Promise<FidelityReport> {
  const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];
  const stages: Scenario['stage'][] = ['svc', 'decoder', 'datagram'];
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

function tracesEqual(a: AdaptiveStep[], b: AdaptiveStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
