import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runFidelity } from '../src/lib/fidelity.js';

describe('fidelity harness — 3 platform × 3 stage grid', () => {
  it('produces 9 rows for full matrix', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.rows).toHaveLength(9);
  });

  it('each row has non-empty mock + real trace', async () => {
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

  it('real trace has env-missing outcomes without env', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const envMissingCount = report.rows
      .flatMap((r) => r.realTrace)
      .filter((s) => s.outcome === 'env-missing').length;
    expect(envMissingCount).toBeGreaterThan(0);
  });

  it('reports drift when adapters diverge on outcome', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.driftCount).toBeGreaterThan(0);
  });

  it('roll-up counts sum trace lengths', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const mockSum = report.rows.reduce((acc, r) => acc + r.mockTrace.length, 0);
    const realSum = report.rows.reduce((acc, r) => acc + r.realTrace.length, 0);
    expect(report.totalMockOps).toBe(mockSum);
    expect(report.totalRealOps).toBe(realSum);
  });

  it('cold stage row has op sequence startCold → invokeCold → measure → close', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const cold = report.rows.find((r) => r.scenario.stage === 'cold');
    expect(cold?.mockTrace.map((s) => s.op)).toEqual([
      'startCold',
      'invokeCold',
      'measureLatencyCold',
      'closeCold',
    ]);
  });

  it('warm stage row has op sequence startWarm → preWarm → invokeWarm → close', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const warm = report.rows.find((r) => r.scenario.stage === 'warm');
    expect(warm?.mockTrace.map((s) => s.op)).toEqual([
      'startWarm',
      'preWarm',
      'invokeWarm',
      'closeWarm',
    ]);
  });

  it('provisioned stage row has op sequence startProv → reserve → invoke → close', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const prov = report.rows.find((r) => r.scenario.stage === 'provisioned');
    expect(prov?.mockTrace.map((s) => s.op)).toEqual([
      'startProvisioned',
      'reserveProvisioned',
      'invokeProvisioned',
      'closeProvisioned',
    ]);
  });

  it('every scenario covers all 3 platforms', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const platforms = new Set(report.rows.map((r) => r.scenario.platform));
    expect(platforms).toEqual(new Set(['cloudflare', 'vercel', 'deno']));
  });
});
