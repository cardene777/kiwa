/**
 * Fidelity harness — diff both adapter traces side-by-side across 3
 * lifecycle stages (cold / warm / provisioned) × 3 platforms.
 */
import type {
  EdgeColdStartAdapter,
  EdgePlatform,
  LatencyMeasurement,
  TraceStep,
} from '../adapters/interface.js';

export interface FidelityScenario {
  platform: EdgePlatform;
  stage: 'cold' | 'warm' | 'provisioned';
}

export interface FidelityRow {
  scenario: FidelityScenario;
  mockTrace: TraceStep[];
  realTrace: TraceStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

function measurementToStep(op: string, m: LatencyMeasurement): TraceStep {
  return {
    op,
    outcome: m.latencyMs < 0 ? 'env-missing' : 'success',
    metadata: {
      cls: m.cls,
      latencyMs: m.latencyMs,
      instanceId: m.instanceId,
    },
  };
}

async function runScenario(
  adapter: EdgeColdStartAdapter,
  scenario: FidelityScenario,
): Promise<TraceStep[]> {
  const trace: TraceStep[] = [];
  if (scenario.stage === 'cold') {
    const s = await adapter.startCold({ platform: scenario.platform });
    trace.push({ op: 'startCold', outcome: 'success', metadata: { sessionId: s.sessionId } });
    const inv = await adapter.invokeCold({ ...s, instanceId: 'fn-a', nowMs: 0 });
    trace.push(measurementToStep('invokeCold', inv));
    const lat = await adapter.measureLatencyCold({ ...s, cls: 'cold' });
    trace.push({ op: 'measureLatencyCold', outcome: lat < 0 ? 'env-missing' : 'success', metadata: { latencyMs: lat } });
    await adapter.closeCold(s);
    trace.push({ op: 'closeCold', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'warm') {
    const s = await adapter.startWarm({ platform: scenario.platform });
    trace.push({ op: 'startWarm', outcome: 'success', metadata: { sessionId: s.sessionId } });
    const pre = await adapter.preWarm({ ...s, instanceId: 'fn-a', nowMs: 0 });
    trace.push(pre);
    const inv = await adapter.invokeWarm({ ...s, instanceId: 'fn-a', nowMs: 1000 });
    trace.push(measurementToStep('invokeWarm', inv));
    await adapter.closeWarm(s);
    trace.push({ op: 'closeWarm', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startProvisioned({ platform: scenario.platform });
    trace.push({ op: 'startProvisioned', outcome: 'success', metadata: { sessionId: s.sessionId } });
    const res = await adapter.reserveProvisioned({ ...s, instanceIds: ['always-on'] });
    trace.push(res);
    const inv = await adapter.invokeProvisioned({ ...s, instanceId: 'always-on', nowMs: 0 });
    trace.push(measurementToStep('invokeProvisioned', inv));
    await adapter.closeProvisioned(s);
    trace.push({ op: 'closeProvisioned', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(
  mock: EdgeColdStartAdapter,
  real: EdgeColdStartAdapter,
): Promise<FidelityReport> {
  const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
  const stages: FidelityScenario['stage'][] = ['cold', 'warm', 'provisioned'];
  const rows: FidelityRow[] = [];
  let totalMockOps = 0;
  let totalRealOps = 0;
  let driftCount = 0;
  for (const platform of platforms) {
    for (const stage of stages) {
      const scenario: FidelityScenario = { platform, stage };
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

function tracesEqual(a: TraceStep[], b: TraceStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
