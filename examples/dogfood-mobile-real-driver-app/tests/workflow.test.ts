import { describe, expect, it } from 'vitest';
import {
  ALL_AXES,
  ALL_TARGETS,
  runAllMockAdapters,
  runAllRealAdapters,
  runFullFidelityCheck,
} from '../src/workflow.js';

describe('Mobile v0.4 real driver adapter workflow (v1.53-2、 pair 深度 4 段拡張達成 4 例目 depth-4 record)', () => {
  it('11 axes × 3 targets defined', () => {
    expect(ALL_AXES).toHaveLength(11);
    expect(ALL_TARGETS).toHaveLength(3);
  });

  it('runAllMockAdapters returns 33 results (11 axis × 3 target)', async () => {
    const results = await runAllMockAdapters();
    expect(results).toHaveLength(33);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.mode).toBe('mock');
    }
  });

  it('runAllRealAdapters returns 33 results (11 axis × 3 target)', async () => {
    const results = await runAllRealAdapters();
    expect(results).toHaveLength(33);
    for (const r of results) {
      expect(r.completed).toBe(true);
      expect(r.mode).toBe('real');
    }
  });

  it('mock and real produce same neutralEvents for same (axis, target)', async () => {
    const mockResults = await runAllMockAdapters();
    const realResults = await runAllRealAdapters();
    for (let i = 0; i < mockResults.length; i++) {
      const m = mockResults[i];
      const r = realResults[i];
      expect(m).toBeDefined();
      expect(r).toBeDefined();
      expect(m!.axis).toBe(r!.axis);
      expect(m!.target).toBe(r!.target);
      expect(m!.neutralEvents).toEqual(r!.neutralEvents);
    }
  });

  it('runFullFidelityCheck reports 33/33 matched', async () => {
    const { diffs, summary } = await runFullFidelityCheck();
    expect(diffs).toHaveLength(33);
    expect(summary.total).toBe(33);
    expect(summary.matched).toBe(33);
    expect(summary.mismatched).toBe(0);
  });

  it('per-axis fidelity summary reports 3/3 for each of 11 axes', async () => {
    const { summary } = await runFullFidelityCheck();
    expect(summary.perAxis).toHaveLength(11);
    for (const p of summary.perAxis) {
      expect(p.matched).toBe(3);
      expect(p.total).toBe(3);
    }
  });

  it('each result carries axis + target + mode metadata', async () => {
    const results = await runAllMockAdapters();
    for (const r of results) {
      expect(ALL_AXES).toContain(r.axis);
      expect(ALL_TARGETS).toContain(r.target);
      expect(r.mode).toBe('mock');
    }
  });

  it('event counts are non-zero', async () => {
    const results = await runAllMockAdapters();
    for (const r of results) {
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });
});
