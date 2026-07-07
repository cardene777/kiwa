import type {
  AuthPasswordlessAdapter,
  AuthPlatform,
  UxStep,
} from '../adapters/interface.js';

export interface Scenario {
  platform: AuthPlatform;
  stage: 'device-bound' | 'conditional-ui' | 'cross-device';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: UxStep[];
  realTrace: UxStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

async function runScenario(
  adapter: AuthPasswordlessAdapter,
  scenario: Scenario,
): Promise<UxStep[]> {
  const trace: UxStep[] = [];
  if (scenario.stage === 'device-bound') {
    const s = await adapter.startDeviceBound({
      platform: scenario.platform,
      userId: 'u-1',
      credentialId: 'cred-1',
      deviceId: 'dev-1',
    });
    trace.push({ op: 'startDeviceBound', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.bindDevice(s, { deviceId: 'dev-1' }));
    trace.push(await adapter.verifyBinding(s));
    await adapter.closeDeviceBound(s);
    trace.push({ op: 'closeDeviceBound', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'conditional-ui') {
    const s = await adapter.startConditionalUiFlow({
      platform: scenario.platform,
      userId: 'u-1',
      formId: 'login',
    });
    trace.push({ op: 'startConditionalUiFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.showAutofillHint(s));
    trace.push(await adapter.completeAutofill(s, { credentialId: 'cred-1', elapsedMs: 500 }));
    await adapter.closeConditionalUi(s);
    trace.push({ op: 'closeConditionalUi', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startCrossDeviceFlow({
      platform: scenario.platform,
      userId: 'u-1',
      requestId: 'req-1',
    });
    trace.push({ op: 'startCrossDeviceFlow', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.emitQrForCrossDevice(s, { qrPayload: 'FIDO:/1234' }));
    trace.push(await adapter.completeCrossDevice(s, { assertionSignature: 'sig-abcd' }));
    await adapter.closeCrossDevice(s);
    trace.push({ op: 'closeCrossDevice', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(
  mock: AuthPasswordlessAdapter,
  real: AuthPasswordlessAdapter,
): Promise<FidelityReport> {
  const platforms: AuthPlatform[] = ['chromium', 'webkit', 'firefox'];
  const stages: Scenario['stage'][] = ['device-bound', 'conditional-ui', 'cross-device'];
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

function tracesEqual(a: UxStep[], b: UxStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
