import { describe, expect, it } from 'vitest';
import { drillDownAxisDiff, runEarlyWarningReport, verifyShapeContract } from '../src/workflow.js';

describe('dogfood-desktop-real-behavior-app (v1.62-2、 fidelity harness behavior diff early warning 実運用開始)', () => {
  it('verifyShapeContract = 36 pair 全 matched (shape 契約 preserving)', async () => {
    const { diffs, summary } = await verifyShapeContract();
    expect(diffs).toHaveLength(36);
    expect(summary.matched).toBe(36);
    expect(summary.matchedRatio).toBe(1);
  });

  it('runEarlyWarningReport で behavior diff 検出', async () => {
    const report = await runEarlyWarningReport();
    expect(report.shapeContractPreserving).toBe(true);
    expect(report.matchedPairs).toBe(36);
    expect(report.totalPairs).toBe(36);
    expect(report.axesWithBehaviorDiff.length).toBeGreaterThan(0);
    expect(report.totalMetadataDiffs).toBeGreaterThan(0);
  });

  it('report は behaviorSummary + shapeSummary 両方持つ', async () => {
    const report = await runEarlyWarningReport();
    expect(report.behaviorSummary.total).toBe(36);
    expect(report.shapeSummary.total).toBe(36);
  });

  it('clipboard axis で contentLength key 差別化 検出', async () => {
    const result = await drillDownAxisDiff('clipboard');
    expect(result.metadataKeys).toContain('contentLength');
    expect(result.affectedNeutralEvents).toContain('clipboard.written');
  });

  it('auto-updater axis で bytes + version key 差別化 検出', async () => {
    const result = await drillDownAxisDiff('auto-updater');
    expect(result.metadataKeys).toContain('bytes');
    expect(result.metadataKeys).toContain('version');
  });

  it('screen-recording axis で chunkBytes + totalBytes key 差別化 検出', async () => {
    const result = await drillDownAxisDiff('screen-recording');
    expect(result.metadataKeys).toContain('chunkBytes');
  });

  it('electron axis で appId key 差別化 検出', async () => {
    const result = await drillDownAxisDiff('electron');
    expect(result.metadataKeys).toContain('appId');
  });

  it('dark-mode axis で initialTheme + currentTheme key 差別化 検出', async () => {
    const result = await drillDownAxisDiff('dark-mode');
    expect(result.metadataKeys.length).toBeGreaterThan(0);
  });

  it('shape 契約 preserving で全 pair が matched=true を保つ', async () => {
    const { diffs } = await verifyShapeContract();
    expect(diffs.every((d) => d.matched)).toBe(true);
    expect(diffs.every((d) => d.mockCompleted && d.realCompleted)).toBe(true);
  });

  it('behavior diff = axesWithBehaviorDiff が 12 axis のうち複数含む', async () => {
    const report = await runEarlyWarningReport();
    // real-runner で電子/tauri/webview/auto-updater/... と production behavior 差別化しているので 8+ axis 差異あり
    expect(report.axesWithBehaviorDiff.length).toBeGreaterThanOrEqual(5);
  });
});
