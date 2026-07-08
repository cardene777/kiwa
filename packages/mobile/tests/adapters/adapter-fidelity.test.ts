import { describe, expect, it } from 'vitest';
import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  runFidelityCheck,
  summarizeFidelity,
  type AdapterInvocation,
  type MobileAxis,
} from '../../src/index.js';

const ALL_AXES: MobileAxis[] = [
  'react-native',
  'expo',
  'metro',
  'navigation',
  'reanimated',
  'async-storage',
  'secure-storage',
  'fabric',
  'turbo-modules',
  'codegen',
  'new-architecture',
];

describe('v1.53 adapter interface (pair 深度 4 段拡張達成 4 例目 depth-4 record)', () => {
  it('MOCK_ADAPTERS covers all 11 axes', () => {
    expect(Object.keys(MOCK_ADAPTERS).sort()).toEqual([...ALL_AXES].sort());
  });

  it('REAL_ADAPTERS covers all 11 axes', () => {
    expect(Object.keys(REAL_ADAPTERS).sort()).toEqual([...ALL_AXES].sort());
  });

  it('mock adapter scan completes for each axis (ios)', async () => {
    for (const axis of ALL_AXES) {
      const inv: AdapterInvocation = { scanId: `mock-${axis}`, target: 'ios', mode: 'mock' };
      const r = await MOCK_ADAPTERS[axis].scan(inv);
      expect(r.axis).toBe(axis);
      expect(r.mode).toBe('mock');
      expect(r.completed).toBe(true);
      expect(r.eventCount).toBeGreaterThan(0);
    }
  });

  it('real adapter scan completes for each axis (android)', async () => {
    for (const axis of ALL_AXES) {
      const inv: AdapterInvocation = { scanId: `real-${axis}`, target: 'android', mode: 'real' };
      const r = await REAL_ADAPTERS[axis].scan(inv);
      expect(r.axis).toBe(axis);
      expect(r.mode).toBe('real');
      expect(r.completed).toBe(true);
    }
  });

  it('neutralEvents extracted from history', async () => {
    const r = await MOCK_ADAPTERS['react-native'].scan({ scanId: 'x', target: 'ios', mode: 'mock' });
    expect(r.neutralEvents.length).toBeGreaterThan(0);
    for (const e of r.neutralEvents) {
      expect(e).toMatch(/^rn\./);
    }
  });
});

describe('v1.53 fidelity harness — mock vs real trace diff (全 11 axis)', () => {
  it('runFidelityCheck returns 11 × 3 = 33 diff rows', async () => {
    const diffs = await runFidelityCheck(ALL_AXES);
    expect(diffs).toHaveLength(33);
  });

  it('every diff has matching neutralEvents + completed', async () => {
    const diffs = await runFidelityCheck(ALL_AXES);
    for (const d of diffs) {
      expect(d.neutralEventsMatch).toBe(true);
      expect(d.completedMatch).toBe(true);
    }
  });

  it('summarizeFidelity reports 33/33 matched', async () => {
    const diffs = await runFidelityCheck(ALL_AXES);
    const summary = summarizeFidelity(diffs);
    expect(summary.total).toBe(33);
    expect(summary.matched).toBe(33);
    expect(summary.mismatched).toBe(0);
  });

  it('perAxis reports 3/3 for every axis', async () => {
    const diffs = await runFidelityCheck(ALL_AXES);
    const summary = summarizeFidelity(diffs);
    expect(summary.perAxis).toHaveLength(11);
    for (const p of summary.perAxis) {
      expect(p.matched).toBe(3);
      expect(p.total).toBe(3);
    }
  });

  it('subset target check works', async () => {
    const diffs = await runFidelityCheck(['react-native', 'fabric'], ['ios']);
    expect(diffs).toHaveLength(2);
    for (const d of diffs) {
      expect(d.target).toBe('ios');
      expect(d.neutralEventsMatch).toBe(true);
    }
  });
});
