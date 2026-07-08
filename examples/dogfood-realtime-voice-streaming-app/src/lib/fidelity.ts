import type { AiStep, Platform, RealtimeAiAdapter } from '../adapters/interface.js';

export interface Scenario {
  platform: Platform;
  stage: 'voice' | 'whisper' | 'inference';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: AiStep[];
  realTrace: AiStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

async function runScenario(adapter: RealtimeAiAdapter, scenario: Scenario): Promise<AiStep[]> {
  const trace: AiStep[] = [];
  if (scenario.stage === 'voice') {
    const s = await adapter.startVoiceFlow({ platform: scenario.platform, userId: 'u-1', model: 'gpt-4o-realtime' });
    trace.push({ op: 'startVoiceFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.sendVoiceAudio(s, { seq: 1, bytes: 8000, durationMs: 200 }));
    trace.push(await adapter.completeVoiceTurn(s, { totalDurationMs: 200 }));
    await adapter.closeVoiceFlow(s);
    trace.push({ op: 'closeVoiceFlow', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'whisper') {
    const s = await adapter.startWhisperFlow({ platform: scenario.platform, userId: 'u-1' });
    trace.push({ op: 'startWhisperFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.streamAudioToWhisper(s, { bytes: 3200, durationMs: 200 }));
    trace.push(await adapter.triggerVadEvent(s, { type: 'end', timestampMs: 500 }));
    await adapter.closeWhisperFlow(s);
    trace.push({ op: 'closeWhisperFlow', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startInferenceFlow({ platform: scenario.platform, userId: 'u-1', modelName: 'yolo-v8' });
    trace.push({ op: 'startInferenceFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.submitInferenceRequest(s, { requestId: 'r-1', frameNumber: 1, budgetMs: 33 }));
    trace.push(await adapter.reportInferenceBudget(s, { requestId: 'r-1', consumedMs: 25, budgetMs: 33 }));
    await adapter.closeInferenceFlow(s);
    trace.push({ op: 'closeInferenceFlow', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(mock: RealtimeAiAdapter, real: RealtimeAiAdapter): Promise<FidelityReport> {
  const platforms: Platform[] = ['chromium', 'webkit', 'firefox'];
  const stages: Scenario['stage'][] = ['voice', 'whisper', 'inference'];
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

function tracesEqual(a: AiStep[], b: AiStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
