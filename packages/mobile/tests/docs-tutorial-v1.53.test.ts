/**
 * v1.53-3 docs 補強 — tutorial 113 code snippet 検証。
 * **31 milestone 連続 snippet validation streak** = v1.23 → v1.53。 kiwa 史上最長記録更新継続。
 */
import { describe, expect, it } from 'vitest';
import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  runFidelityCheck,
  summarizeFidelity,
  type AdapterInvocation,
  type MobileAxis,
} from '../src/index.js';

describe('tutorial 113 — Single axis mock adapter snippet', () => {
  it('Fabric mock scan completes with neutralEvents', async () => {
    const inv: AdapterInvocation = { scanId: 'demo', target: 'ios', mode: 'mock' };
    const r = await MOCK_ADAPTERS.fabric.scan(inv);
    expect(r.completed).toBe(true);
    expect(r.eventCount).toBeGreaterThan(0);
    expect(r.neutralEvents).toContain('fabric.mount_completed');
  });
});

describe('tutorial 113 — Real adapter snippet', () => {
  it('TurboModules real scan completes for android', async () => {
    const inv: AdapterInvocation = { scanId: 'demo', target: 'android', mode: 'real' };
    const r = await REAL_ADAPTERS['turbo-modules'].scan(inv);
    expect(r.completed).toBe(true);
    expect(r.mode).toBe('real');
  });
});

describe('tutorial 113 — Fidelity harness snippet', () => {
  it('all 33 diffs match', async () => {
    const ALL_AXES: MobileAxis[] = [
      'react-native', 'expo', 'metro',
      'navigation', 'reanimated', 'async-storage', 'secure-storage',
      'fabric', 'turbo-modules', 'codegen', 'new-architecture',
    ];
    const diffs = await runFidelityCheck(ALL_AXES);
    const summary = summarizeFidelity(diffs);
    expect(summary.total).toBe(33);
    expect(summary.matched).toBe(33);
    expect(summary.mismatched).toBe(0);
  });
});
