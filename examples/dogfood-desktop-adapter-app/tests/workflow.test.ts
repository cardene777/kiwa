import { describe, expect, it } from 'vitest';
import {
  ALL_AXES,
  ALL_TARGETS,
  runAllMockAdapters,
  runAllRealAdapters,
  runFullFidelityCheck,
} from '../src/workflow.js';

describe('dogfood-desktop-adapter-app (v1.59-2、 depth-4 record 5 例目、 Mobile v1.53 rhythm 再現)', () => {
  it('12 axes registered (v0.1 3 + v0.2 5 + v0.3 4)', () => {
    expect(ALL_AXES).toHaveLength(12);
  });

  it('3 targets registered (macos + windows + linux)', () => {
    expect(ALL_TARGETS).toEqual(['macos', 'windows', 'linux']);
  });

  it('runAllMockAdapters emits 36 results (3 target × 12 axis)', async () => {
    const results = await runAllMockAdapters();
    expect(results).toHaveLength(36);
    for (const r of results) {
      expect(r.mode).toBe('mock');
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
      expect(r.neutralEvents.length).toBeGreaterThan(0);
    }
  });

  it('runAllRealAdapters emits 36 results (3 target × 12 axis)', async () => {
    const results = await runAllRealAdapters();
    expect(results).toHaveLength(36);
    for (const r of results) {
      expect(r.mode).toBe('real');
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('all 12 axes appear in mock results', async () => {
    const results = await runAllMockAdapters();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(12);
  });

  it('all 12 axes appear in real results', async () => {
    const results = await runAllRealAdapters();
    const axes = new Set(results.map((r) => r.axis));
    expect(axes.size).toBe(12);
  });

  it('runFullFidelityCheck emits 36 pairs, all matched (shape 契約 preserving)', async () => {
    const { diffs, summary } = await runFullFidelityCheck();
    expect(diffs).toHaveLength(36);
    expect(summary.total).toBe(36);
    expect(summary.matched).toBe(36);
    expect(summary.unmatched).toBe(0);
    expect(summary.matchedRatio).toBe(1);
  });

  it('per-axis fidelity summary = 3 matched / 3 total', async () => {
    const { summary } = await runFullFidelityCheck();
    for (const axis of ALL_AXES) {
      const bucket = summary.perAxis[axis];
      expect(bucket).toBeDefined();
      expect(bucket?.matched).toBe(3);
      expect(bucket?.total).toBe(3);
    }
  });

  it('mock/real produce identical neutralEvents per (axis, target)', async () => {
    const mock = await runAllMockAdapters();
    const real = await runAllRealAdapters();
    expect(mock).toHaveLength(real.length);
    for (let i = 0; i < mock.length; i += 1) {
      const m = mock[i];
      const r = real[i];
      expect(m?.axis).toBe(r?.axis);
      expect(m?.target).toBe(r?.target);
      expect(m?.neutralEvents).toEqual(r?.neutralEvents);
    }
  });

  it('72 combination total (mock 36 + real 36)', async () => {
    const mock = await runAllMockAdapters();
    const real = await runAllRealAdapters();
    expect(mock.length + real.length).toBe(72);
  });
});
