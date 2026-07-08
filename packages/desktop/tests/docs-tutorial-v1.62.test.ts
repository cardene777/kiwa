/**
 * v1.62-3 docs 補強 — tutorial 122 code snippet 検証。
 * 40 milestone 連続 snippet validation streak = v1.23 → v1.62。 kiwa 史上最長記録更新継続。
 * systematic pattern 37 度目適用、 depth-7 pattern 新設 candidate 到達。
 */
import { describe, expect, it } from 'vitest';
import {
  runFidelityCheck,
  summarizeFidelity,
  summarizeFidelityBehaviorDiff,
} from '../src/index.js';

describe('tutorial 122 — shape 契約 preserving snippet', () => {
  it('36 pair 全 matched (neutralEvents + eventCount 一致)', async () => {
    const diffs = await runFidelityCheck({});
    expect(diffs).toHaveLength(36);
    const summary = summarizeFidelity(diffs);
    expect(summary.matchedRatio).toBe(1);
  });
});

describe('tutorial 122 — behavior diff early warning snippet', () => {
  it('mock/real の metadata 差異が per-axis 検出される', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelityBehaviorDiff(diffs);
    expect(summary.axesWithBehaviorDiff.length).toBeGreaterThan(0);
    expect(summary.totalMetadataDiffs).toBeGreaterThan(0);
  });
});

describe('tutorial 122 — per-step drill-down snippet', () => {
  it('auto-updater = mock 42MB vs real 128MB を検出', async () => {
    const diffs = await runFidelityCheck({ axes: ['auto-updater'], targets: ['macos'] });
    const bytesDiff = diffs[0]?.metadataDiffs.find(
      (m) => m.neutralEvent === 'auto-updater.update_downloaded' && m.key === 'bytes',
    );
    expect(bytesDiff?.mockValue).toBe(42_000_000);
    expect(bytesDiff?.realValue).toBe(128_000_000);
  });
});
