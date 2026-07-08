import type { MediaStep, Platform, RealtimeMediaAdapter } from '../adapters/interface.js';

export interface Scenario {
  platform: Platform;
  stage: 'moq' | 'encoder' | 'simulcast';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: MediaStep[];
  realTrace: MediaStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

async function runScenario(adapter: RealtimeMediaAdapter, scenario: Scenario): Promise<MediaStep[]> {
  const trace: MediaStep[] = [];
  if (scenario.stage === 'moq') {
    const s = await adapter.startMoqFlow({ platform: scenario.platform, trackName: 'v-1' });
    trace.push({ op: 'startMoqFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.announceMoqTrack(s, { namespace: 'live' }));
    trace.push(await adapter.sendMoqObject(s, { groupId: 1, objectId: 1, bytes: 1000 }));
    await adapter.closeMoqFlow(s);
    trace.push({ op: 'closeMoqFlow', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'encoder') {
    const s = await adapter.startEncoderFlow({ platform: scenario.platform, trackName: 'v-1', codec: 'H264' });
    trace.push({ op: 'startEncoderFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.encodeMediaFrame(s, { frameNumber: 1, byteLength: 5000 }));
    trace.push(await adapter.reportEncoderHardware(s, { hardware: true }));
    await adapter.closeEncoderFlow(s);
    trace.push({ op: 'closeEncoderFlow', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startSimulcastFlow({ platform: scenario.platform, trackName: 'v-1' });
    trace.push({ op: 'startSimulcastFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.addSimulcastQualityLayer(s, { layerId: 'high', bitrateKbps: 2500 }));
    trace.push(await adapter.adaptSimulcastBitrate(s, { layerId: 'high', targetKbps: 1500, reason: 'network' }));
    await adapter.closeSimulcastFlow(s);
    trace.push({ op: 'closeSimulcastFlow', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(mock: RealtimeMediaAdapter, real: RealtimeMediaAdapter): Promise<FidelityReport> {
  const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];
  const stages: Scenario['stage'][] = ['moq', 'encoder', 'simulcast'];
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

function tracesEqual(a: MediaStep[], b: MediaStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
