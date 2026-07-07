/**
 * Fidelity harness — 3 platform × 3 migration stage (schema-bump /
 * data-migrate / rollout) grid.
 */
import type {
  EdgeDoMigrationAdapter,
  EdgePlatform,
  MigrationStep,
} from '../adapters/interface.js';

export interface Scenario {
  platform: EdgePlatform;
  stage: 'schema-bump' | 'data-migrate' | 'rollout';
}

export interface FidelityRow {
  scenario: Scenario;
  mockTrace: MigrationStep[];
  realTrace: MigrationStep[];
  drift: boolean;
}

export interface FidelityReport {
  rows: FidelityRow[];
  totalMockOps: number;
  totalRealOps: number;
  driftCount: number;
}

const INSTANCE_IDS = ['do-a', 'do-b', 'do-c'];

async function runScenario(
  adapter: EdgeDoMigrationAdapter,
  scenario: Scenario,
): Promise<MigrationStep[]> {
  const trace: MigrationStep[] = [];
  const baseInput = {
    platform: scenario.platform,
    fromVersion: 1,
    toVersion: 2,
    instanceIds: INSTANCE_IDS,
  };
  if (scenario.stage === 'schema-bump') {
    const s = await adapter.startSchemaBump(baseInput);
    trace.push({ op: 'startSchemaBump', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.bumpSchemaVersion(s));
    trace.push(await adapter.verifySchemaBump(s));
    await adapter.closeSchemaBump(s);
    trace.push({ op: 'closeSchemaBump', outcome: 'success', metadata: {} });
  } else if (scenario.stage === 'data-migrate') {
    const s = await adapter.startDataMigrate({ ...baseInput, sessionId: '', });
    trace.push({ op: 'startDataMigrate', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.migrateOneInstance(s, { instanceId: 'do-a' }));
    trace.push(await adapter.migrateBatch(s, { instanceIds: ['do-b', 'do-c'] }));
    await adapter.closeDataMigrate(s);
    trace.push({ op: 'closeDataMigrate', outcome: 'success', metadata: {} });
  } else {
    const s = await adapter.startRollout({ ...baseInput, sessionId: '' });
    trace.push({ op: 'startRollout', outcome: 'success', metadata: { sessionId: s.sessionId } });
    trace.push(await adapter.completeRolloutOp(s));
    trace.push(await adapter.rollbackRollout(s));
    await adapter.closeRollout(s);
    trace.push({ op: 'closeRollout', outcome: 'success', metadata: {} });
  }
  return trace;
}

export async function runFidelity(
  mock: EdgeDoMigrationAdapter,
  real: EdgeDoMigrationAdapter,
): Promise<FidelityReport> {
  const platforms: EdgePlatform[] = ['cloudflare', 'vercel', 'deno'];
  const stages: Scenario['stage'][] = ['schema-bump', 'data-migrate', 'rollout'];
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

function tracesEqual(a: MigrationStep[], b: MigrationStep[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i]!.op !== b[i]!.op) return false;
    if (a[i]!.outcome !== b[i]!.outcome) return false;
  }
  return true;
}
