import type {
  EdgePlatform,
  EdgeRoutingAdapter,
  Pop,
  Replica,
  RoutingStep,
} from '../adapters/interface.js';

export interface Scenario {
  platform: EdgePlatform;
  stage: 'anycast-routing' | 'geo-matching' | 'replica-affinity';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: RoutingStep[];
  realTrace: RoutingStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

const POPS: Pop[] = [
  { popId: 'us-1', region: 'us', latencyMs: 30, healthy: true },
  { popId: 'eu-1', region: 'eu', latencyMs: 50, healthy: true },
  { popId: 'ap-1', region: 'ap', latencyMs: 100, healthy: true },
];

const REPLICAS: Replica[] = [
  { replicaId: 'r-us', region: 'us', lagMs: 100 },
  { replicaId: 'r-eu', region: 'eu', lagMs: 200 },
];

async function runScenario(
  adapter: EdgeRoutingAdapter,
  scenario: Scenario,
): Promise<RoutingStep[]> {
  const trace: RoutingStep[] = [];
  if (scenario.stage === 'anycast-routing') {
    const s = await adapter.startAnycast({ platform: scenario.platform, pops: POPS });
    trace.push({ op: 'startAnycast', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.receiveAnycastReq(s, { requestId: 'req-1' }));
    trace.push(await adapter.markPopUnhealthy(s, { popId: 'us-1' }));
    await adapter.closeAnycast(s);
    trace.push({ op: 'closeAnycast', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'geo-matching') {
    const s = await adapter.startGeoMatching({ platform: scenario.platform, pops: POPS });
    trace.push({ op: 'startGeoMatching', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.matchGeoRegion(s, { requestId: 'req-1', region: 'us' }));
    trace.push(await adapter.selectLowestLatency(s, { requestId: 'req-1', preferredRegion: 'us' }));
    await adapter.closeGeoMatching(s);
    trace.push({ op: 'closeGeoMatching', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startReplicaAffinity({
      platform: scenario.platform,
      primaryId: 'pg-primary',
      replicas: REPLICAS,
    });
    trace.push({ op: 'startReplicaAffinity', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.readFromClosestReplica(s, { query: 'SELECT 1', preferredRegion: 'us' }));
    trace.push(await adapter.reportReplicaLag(s, { replicaId: 'r-us', lagMs: 300 }));
    await adapter.closeReplicaAffinity(s);
    trace.push({ op: 'closeReplicaAffinity', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(
  mock: EdgeRoutingAdapter,
  real: EdgeRoutingAdapter,
): Promise<FidelityReport> {
  const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
  const stages: Scenario['stage'][] = ['anycast-routing', 'geo-matching', 'replica-affinity'];
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

function tracesEqual(a: RoutingStep[], b: RoutingStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
