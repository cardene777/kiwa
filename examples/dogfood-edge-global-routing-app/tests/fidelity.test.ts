import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runFidelity } from '../src/lib/fidelity.js';

describe('fidelity harness — 3 platform × 3 stage grid', () => {
  it('produces 9 rows for full matrix', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.rows).toHaveLength(9);
  });

  it('every row has non-empty mock + real trace', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    for (const row of report.rows) {
      expect(row.mockTrace.length).toBeGreaterThan(0);
      expect(row.realTrace.length).toBeGreaterThan(0);
    }
  });

  it('mock trace all outcomes success', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    for (const row of report.rows) {
      for (const step of row.mockTrace) {
        expect(step.outcome).toBe('success');
      }
    }
  });

  it('real trace has env-missing outcomes', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const envMissingCount = report.rows
      .flatMap((r) => r.realTrace)
      .filter((s) => s.outcome === 'env-missing').length;
    expect(envMissingCount).toBeGreaterThan(0);
  });

  it('drift detected for every scenario', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.driftCount).toBe(9);
  });

  it('anycast-routing stage row has correct op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'anycast-routing');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startAnycast',
      'receiveAnycastReq',
      'markPopUnhealthy',
      'closeAnycast',
    ]);
  });

  it('geo-matching stage row has correct op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'geo-matching');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startGeoMatching',
      'matchGeoRegion',
      'selectLowestLatency',
      'closeGeoMatching',
    ]);
  });

  it('replica-affinity stage row has correct op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'replica-affinity');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startReplicaAffinity',
      'readFromClosestReplica',
      'reportReplicaLag',
      'closeReplicaAffinity',
    ]);
  });

  it('every scenario covers all 3 platforms', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const platforms = new Set(report.rows.map((r) => r.scenario.platform));
    expect(platforms).toEqual(new Set(['cloudflare', 'vercel', 'deno']));
  });

  it('roll-up counts sum trace lengths', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const mockSum = report.rows.reduce((acc, r) => acc + r.mockTrace.length, 0);
    const realSum = report.rows.reduce((acc, r) => acc + r.realTrace.length, 0);
    expect(report.totalMockOps).toBe(mockSum);
    expect(report.totalRealOps).toBe(realSum);
  });
});
