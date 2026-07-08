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

  it('drift 9', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    expect(report.driftCount).toBe(9);
  });

  it('voice stage op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'voice');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startVoiceFlow',
      'sendVoiceAudio',
      'completeVoiceTurn',
      'closeVoiceFlow',
    ]);
  });

  it('whisper stage op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'whisper');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startWhisperFlow',
      'streamAudioToWhisper',
      'triggerVadEvent',
      'closeWhisperFlow',
    ]);
  });

  it('inference stage op sequence', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const row = report.rows.find((r) => r.scenario.stage === 'inference');
    expect(row?.mockTrace.map((s) => s.op)).toEqual([
      'startInferenceFlow',
      'submitInferenceRequest',
      'reportInferenceBudget',
      'closeInferenceFlow',
    ]);
  });

  it('every scenario covers 3 platforms', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const platforms = new Set(report.rows.map((r) => r.scenario.platform));
    expect(platforms).toEqual(new Set(['chromium', 'webkit', 'firefox']));
  });

  it('roll-up counts sum trace lengths', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    const mockSum = report.rows.reduce((acc, r) => acc + r.mockTrace.length, 0);
    expect(report.totalMockOps).toBe(mockSum);
  });

  it('mock trace 4 ops per row', async () => {
    const report = await runFidelity(makeMockAdapter(), makeRealAdapter());
    for (const row of report.rows) {
      expect(row.mockTrace).toHaveLength(4);
    }
  });
});
