/**
 * v1.59-3 docs 補強 — tutorial 119 code snippet 検証。
 * 37 milestone 連続 snippet validation streak = v1.23 → v1.59。 kiwa 史上最長記録更新継続。
 * systematic pattern 34 度目適用 (v1.58 の 33 度目 = desktop v0.3 4 axis uniform を継承)。
 * Mobile v1.53 rhythm 再現、 depth-4 record 5 例目到達。
 */
import { describe, expect, it } from 'vitest';
import {
  MOCK_ADAPTERS,
  REAL_ADAPTERS,
  runFidelityCheck,
  summarizeFidelity,
  type AdapterInvocation,
} from '../src/index.js';

describe('tutorial 119 — Adapter interface snippet', () => {
  it('electron mock adapter completes on macos', async () => {
    const inv: AdapterInvocation = { scanId: 'e-macos', target: 'macos', mode: 'mock' };
    const result = await MOCK_ADAPTERS['electron'].scan(inv);
    expect(result.axis).toBe('electron');
    expect(result.completed).toBe(true);
    expect(result.neutralEvents).toEqual([
      'electron.app_ready',
      'electron.window_created',
      'electron.ipc_message_dispatched',
      'electron.app_quit',
    ]);
  });

  it('clipboard real adapter produces same shape as mock', async () => {
    const mockRes = await MOCK_ADAPTERS['clipboard'].scan({
      scanId: 'shape',
      target: 'windows',
      mode: 'mock',
    });
    const realRes = await REAL_ADAPTERS['clipboard'].scan({
      scanId: 'shape',
      target: 'windows',
      mode: 'real',
    });
    expect(realRes.neutralEvents).toEqual(mockRes.neutralEvents);
    expect(realRes.eventCount).toBe(mockRes.eventCount);
  });
});

describe('tutorial 119 — Fidelity harness snippet', () => {
  it('runFidelityCheck 全 36 pair matched', async () => {
    const diffs = await runFidelityCheck({});
    expect(diffs).toHaveLength(36);
    for (const d of diffs) {
      expect(d.matched).toBe(true);
      expect(d.mockEvents).toEqual(d.realEvents);
    }
  });

  it('summarizeFidelity matchedRatio 1.0', async () => {
    const diffs = await runFidelityCheck({});
    const summary = summarizeFidelity(diffs);
    expect(summary.matchedRatio).toBe(1);
    expect(summary.total).toBe(36);
  });

  it('subset axes / targets 対応', async () => {
    const diffs = await runFidelityCheck({
      axes: ['electron', 'clipboard'],
      targets: ['macos'],
    });
    expect(diffs).toHaveLength(2);
  });
});
