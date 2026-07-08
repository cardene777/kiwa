import { describe, expect, it } from 'vitest';
import { runFidelityCheckWithProbe, summarizeFidelity } from '../../src/index.js';

describe('v0.8 runFidelityCheckWithProbe (probe integration)', () => {
  it('diffs + skippedPairs 両方返却', async () => {
    const { diffs, skippedPairs } = await runFidelityCheckWithProbe({});
    expect(Array.isArray(diffs)).toBe(true);
    expect(Array.isArray(skippedPairs)).toBe(true);
    // diffs + skippedPairs = 36 pair 全ての振り分け
    expect(diffs.length + skippedPairs.length).toBe(36);
  });

  it('skip した pair は diffs に含まれない (shape 契約 preserving)', async () => {
    const { diffs, skippedPairs } = await runFidelityCheckWithProbe({});
    const skippedSet = new Set(skippedPairs.map((s) => `${s.axis}-${s.target}`));
    for (const d of diffs) {
      expect(skippedSet.has(`${d.axis}-${d.target}`)).toBe(false);
    }
  });

  it('semantics-only axis (electron/tauri/webview/dark-mode) は 全 target で diffs に含まれる', async () => {
    const { diffs } = await runFidelityCheckWithProbe({});
    const semanticsAxes = ['electron', 'tauri', 'webview', 'dark-mode'];
    for (const axis of semanticsAxes) {
      const axisDiffs = diffs.filter((d) => d.axis === axis);
      expect(axisDiffs.length).toBe(3); // 3 target 全て
    }
  });

  it('subset axes + targets 制限も動作', async () => {
    const { diffs, skippedPairs } = await runFidelityCheckWithProbe({
      axes: ['electron', 'tauri'],
      targets: ['macos'],
    });
    expect(diffs.length + skippedPairs.length).toBe(2);
  });

  it('semantics-only axis 制限で skip なし', async () => {
    const { diffs, skippedPairs } = await runFidelityCheckWithProbe({
      axes: ['electron', 'webview', 'dark-mode'],
    });
    expect(skippedPairs).toHaveLength(0);
    expect(diffs).toHaveLength(9); // 3 axis × 3 target
  });

  it('skippedPair は axis + target + reason field 持つ', async () => {
    const { skippedPairs } = await runFidelityCheckWithProbe({});
    for (const s of skippedPairs) {
      expect(s.axis).toBeDefined();
      expect(s.target).toBeDefined();
      expect(typeof s.reason).toBe('string');
      expect(s.reason.length).toBeGreaterThan(0);
    }
  });

  it('diffs 内 pair は 従来通り shape 契約 preserving (matched=true)', async () => {
    const { diffs } = await runFidelityCheckWithProbe({});
    // shape 契約 preserving 絶対維持 = matched pair は全 matched
    const summary = summarizeFidelity(diffs);
    expect(summary.matched).toBe(diffs.length);
    expect(summary.matchedRatio).toBe(1);
  });

  it('custom scanIdPrefix 経路も動作', async () => {
    const { diffs } = await runFidelityCheckWithProbe({
      scanIdPrefix: 'custom-probe',
      axes: ['electron'],
      targets: ['macos'],
    });
    expect(diffs).toHaveLength(1);
  });
});
