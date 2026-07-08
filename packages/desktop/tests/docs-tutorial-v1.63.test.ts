/**
 * v1.63-3 docs 補強 — tutorial 123 code snippet 検証。
 * 41 milestone 連続 snippet validation streak = v1.23 → v1.63。 kiwa 史上最長記録更新継続。
 * systematic pattern 38 度目適用、 depth-8 pattern 新設 candidate 到達。
 */
import { describe, expect, it } from 'vitest';
import { probeCliAvailable, runFidelityCheckWithProbe, shouldSkipAxis } from '../src/index.js';

describe('tutorial 123 — probe CLI snippet', () => {
  it('probeCliAvailable = ProbeResult 返却', async () => {
    const result = await probeCliAvailable({ command: 'ffmpeg' });
    expect(typeof result.available).toBe('boolean');
    expect(typeof result.durationMs).toBe('number');
    expect(result.command).toBe('ffmpeg');
  });
});

describe('tutorial 123 — platform gate + skip snippet', () => {
  it('semantics-only axis (electron/tauri/webview/dark-mode) = skip=false', () => {
    for (const axis of ['electron', 'tauri', 'webview', 'dark-mode'] as const) {
      for (const target of ['macos', 'windows', 'linux'] as const) {
        expect(shouldSkipAxis(axis, target).skip).toBe(false);
      }
    }
  });
});

describe('tutorial 123 — probe-aware fidelity check snippet', () => {
  it('diffs + skippedPairs 総和 = 36 pair', async () => {
    const { diffs, skippedPairs } = await runFidelityCheckWithProbe({});
    expect(diffs.length + skippedPairs.length).toBe(36);
  });
});
