/**
 * v1.64-3 docs 補強 — tutorial 124 code snippet 検証。
 * 42 milestone 連続 snippet validation streak = v1.23 → v1.64。 kiwa 史上最長記録更新継続。
 * systematic pattern 39 度目適用、 depth-9 pattern 新設 candidate 到達。
 */
import { describe, expect, it } from 'vitest';
import { probeAndInvoke, probeAndInvokeAll } from '../src/index.js';

describe('tutorial 124 — probeAndInvoke single axis snippet', () => {
  it('electron = no-cli-mapping (semantics-only)', async () => {
    const result = await probeAndInvoke({ axis: 'electron', target: 'macos' });
    expect(result.status).toBe('no-cli-mapping');
    expect(result.spawnResult).toBeNull();
  });
});

describe('tutorial 124 — probeAndInvokeAll matrix snippet', () => {
  it('12 axis × 3 target = 36 pair 全走査', async () => {
    const summary = await probeAndInvokeAll();
    expect(summary.total).toBe(36);
    const buckets =
      summary.invoked.length +
      summary.cliUnavailable.length +
      summary.axisSkipped.length +
      summary.noCliMapping.length;
    expect(buckets).toBe(36);
  });
});

describe('tutorial 124 — 4 status routes snippet', () => {
  it('全 status 経路 が type-safe', async () => {
    const result = await probeAndInvoke({ axis: 'auto-updater', target: 'macos' });
    expect(['invoked', 'cli-unavailable', 'axis-skipped', 'no-cli-mapping']).toContain(result.status);
  });
});
