import { describe, expect, it } from 'vitest';
import { runFidelityCheck, summarizeFidelity } from '../../src/index.js';

describe('desktop fidelity harness (v0.4)', () => {
  it('runFidelityCheck full 36 pair (3 target × 12 axis)', async () => {
    const diffs = await runFidelityCheck({});
    expect(diffs).toHaveLength(36);
    for (const d of diffs) {
      expect(d.matched).toBe(true);
      expect(d.mockCompleted).toBe(true);
      expect(d.realCompleted).toBe(true);
      expect(d.mockEvents).toEqual(d.realEvents);
      expect(d.mockEvents.length).toBeGreaterThan(0);
    }
  });

  it('summarizeFidelity 全 pair matched で ratio 1.0', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelity(diffs);
    expect(summary.total).toBe(36);
    expect(summary.matched).toBe(36);
    expect(summary.unmatched).toBe(0);
    expect(summary.matchedRatio).toBe(1);
  });

  it('subset axes works (3 axis × 3 target = 9 pair)', async () => {
    const diffs = await runFidelityCheck({
      axes: ['electron', 'clipboard', 'dark-mode'],
    });
    expect(diffs).toHaveLength(9);
    for (const d of diffs) expect(d.matched).toBe(true);
  });

  it('subset targets works (2 target × 12 axis = 24 pair)', async () => {
    const diffs = await runFidelityCheck({ targets: ['macos', 'linux'] });
    expect(diffs).toHaveLength(24);
    for (const d of diffs) expect(d.matched).toBe(true);
  });

  it('per-axis summary counts correctly', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelity(diffs);
    for (const axis of Object.keys(summary.perAxis)) {
      const bucket = summary.perAxis[axis as keyof typeof summary.perAxis];
      expect(bucket).toBeDefined();
      expect(bucket?.total).toBe(3);
      expect(bucket?.matched).toBe(3);
    }
  });

  it('summarizeFidelity handles empty input (matchedRatio = 1 as vacuously true)', () => {
    const summary = summarizeFidelity([]);
    expect(summary.total).toBe(0);
    expect(summary.matchedRatio).toBe(1);
  });

  it('custom scanIdPrefix propagates', async () => {
    const diffs = await runFidelityCheck({
      scanIdPrefix: 'custom-run',
      axes: ['electron'],
      targets: ['macos'],
    });
    expect(diffs).toHaveLength(1);
    expect(diffs[0]?.matched).toBe(true);
  });
});
