import { describe, expect, it } from 'vitest';
import { makeMockAdapter } from '../src/adapters/mock.js';
import { makeRealAdapter } from '../src/adapters/real.js';
import { runFidelity } from '../src/lib/fidelity.js';

describe('fidelity harness — 3 platform × 3 stage grid', () => {
  it('produces 9 rows for full matrix', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.rows).toHaveLength(9);
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
    const envMissing = report.rows.flatMap((r) => r.realTrace).filter((s) => s.outcome === 'env-missing');
    expect(envMissing.length).toBeGreaterThan(0);
  });

  it('drift detected for every scenario', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.driftCount).toBe(9);
  });

  it('device-bound stage op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'device-bound');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startDeviceBound',
      'bindDevice',
      'verifyBinding',
      'closeDeviceBound',
    ]);
  });

  it('conditional-ui stage op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'conditional-ui');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startConditionalUiFlow',
      'showAutofillHint',
      'completeAutofill',
      'closeConditionalUi',
    ]);
  });

  it('cross-device stage op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'cross-device');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startCrossDeviceFlow',
      'emitQrForCrossDevice',
      'completeCrossDevice',
      'closeCrossDevice',
    ]);
  });

  it('every scenario covers all 3 platforms', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const platforms = new Set(report.rows.map((r) => r.scenario.platform));
    expect(platforms).toEqual(new Set(['chromium', 'webkit', 'firefox']));
  });

  it('mock trace lengths are consistent per stage', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    for (const row of report.rows) {
      expect(row.mockTrace).toHaveLength(4);
    }
  });

  it('drift is consistent (always true) since real is env-missing', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    for (const row of report.rows) {
      expect(row.drift).toBe(true);
    }
  });

  it('mock trace has neutral event metadata in every op step', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    for (const row of report.rows) {
      for (const step of row.mockTrace) {
        if (step.op.startsWith('start') || step.op.startsWith('close')) continue;
        expect(step.metadata.neutralEvent).toBeDefined();
      }
    }
  });

  it('platforms in report rows equal 3 unique values', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const platforms = new Set(report.rows.map((r) => r.scenario.platform));
    expect(platforms.size).toBe(3);
  });

  it('roll-up counts sum trace lengths', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const mockSum = report.rows.reduce((acc, r) => acc + r.mockTrace.length, 0);
    const realSum = report.rows.reduce((acc, r) => acc + r.realTrace.length, 0);
    expect(report.totalMockOps).toBe(mockSum);
    expect(report.totalRealOps).toBe(realSum);
  });
});
