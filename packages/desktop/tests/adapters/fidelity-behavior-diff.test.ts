import { describe, expect, it } from 'vitest';
import { runFidelityCheck, summarizeFidelity, summarizeFidelityBehaviorDiff } from '../../src/index.js';

describe('v0.7 fidelity behavior diff (mock/real behavior 差別化 early warning)', () => {
  it('shape 契約 preserving = 全 36 pair matched (v0.4 baseline 保持)', async () => {
    const diffs = await runFidelityCheck({});
    expect(diffs).toHaveLength(36);
    for (const d of diffs) {
      expect(d.matched).toBe(true);
      expect(d.mockCompleted).toBe(true);
      expect(d.realCompleted).toBe(true);
      expect(d.mockEvents).toEqual(d.realEvents);
    }
    const summary = summarizeFidelity(diffs);
    expect(summary.matchedRatio).toBe(1);
  });

  it('behavior diff = metadata 差異が per-pair 検出される (real 実装 signal)', async () => {
    const diffs = await runFidelityCheck({});
    // v0.7 で real 経路が mock と異なる metadata を出すので metadataDiffs が非空
    const hasAnyDiff = diffs.some((d) => d.metadataDiffs.length > 0);
    expect(hasAnyDiff).toBe(true);
  });

  it('summarizeFidelityBehaviorDiff で per-axis diff 集計', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelityBehaviorDiff(diffs);
    expect(summary.total).toBe(36);
    expect(summary.axesWithBehaviorDiff.length).toBeGreaterThan(0);
    expect(summary.totalMetadataDiffs).toBeGreaterThan(0);
    for (const axis of summary.axesWithBehaviorDiff) {
      expect(summary.perAxis[axis]?.hasBehaviorDiff).toBe(true);
      expect(summary.perAxis[axis]?.metadataDiffCount).toBeGreaterThan(0);
    }
  });

  it('clipboard axis = mock/real content length diff 検出', async () => {
    const diffs = await runFidelityCheck({ axes: ['clipboard'], targets: ['macos'] });
    expect(diffs).toHaveLength(1);
    const cbDiff = diffs[0];
    expect(cbDiff?.metadataDiffs.length).toBeGreaterThan(0);
    // clipboard.written step で contentLength 差異
    const writtenDiff = cbDiff?.metadataDiffs.find(
      (m) => m.neutralEvent === 'clipboard.written' && m.key === 'contentLength',
    );
    expect(writtenDiff).toBeDefined();
    expect(writtenDiff?.mockValue).not.toBe(writtenDiff?.realValue);
  });

  it('auto-updater axis = mock/real bytes diff 検出 (42MB vs 128MB)', async () => {
    const diffs = await runFidelityCheck({ axes: ['auto-updater'], targets: ['macos'] });
    const bytesDiff = diffs[0]?.metadataDiffs.find(
      (m) => m.neutralEvent === 'auto-updater.update_downloaded' && m.key === 'bytes',
    );
    expect(bytesDiff).toBeDefined();
    expect(bytesDiff?.mockValue).toBe(42_000_000);
    expect(bytesDiff?.realValue).toBe(128_000_000);
  });

  it('screen-recording axis = mock/real chunkBytes diff (1MB vs 8MB)', async () => {
    const diffs = await runFidelityCheck({ axes: ['screen-recording'], targets: ['macos'] });
    const chunkDiff = diffs[0]?.metadataDiffs.find(
      (m) => m.neutralEvent === 'screen-recording.chunk_captured' && m.key === 'chunkBytes',
    );
    expect(chunkDiff).toBeDefined();
    expect(chunkDiff?.realValue).toBe(8_388_608);
  });

  it('durationDiffMs field は数値、 shape 契約 preserving で非負', async () => {
    const diffs = await runFidelityCheck({ axes: ['electron'], targets: ['macos'] });
    expect(typeof diffs[0]?.durationDiffMs).toBe('number');
    expect(diffs[0]?.durationDiffMs).toBeGreaterThanOrEqual(0);
  });

  it('per-axis behavior diff summary の maxDurationDiffMs 記録', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelityBehaviorDiff(diffs);
    for (const axis of Object.keys(summary.perAxis)) {
      const key = axis as keyof typeof summary.perAxis;
      expect(typeof summary.perAxis[key]?.maxDurationDiffMs).toBe('number');
    }
  });

  it('empty input で summary 全 0', () => {
    const summary = summarizeFidelityBehaviorDiff([]);
    expect(summary.total).toBe(0);
    expect(summary.axesWithBehaviorDiff).toEqual([]);
    expect(summary.totalMetadataDiffs).toBe(0);
  });
});
