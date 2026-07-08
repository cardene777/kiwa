import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import {
  computeSkipMatrix,
  platformGate,
  probeCliAvailable,
  shouldSkipAxis,
  type SpawnFn,
} from '../../src/index.js';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

function makeSpawn(stdoutText: string, exitCode: number): SpawnFn {
  return ((_c: string, _a: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      if (stdoutText) child.stdout.emit('data', Buffer.from(stdoutText));
      child.emit('close', exitCode, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('v0.8 probeCliAvailable', () => {
  it('CLI が見つかったら available=true + probePath 返却 (which /usr/bin/ffmpeg)', async () => {
    const result = await probeCliAvailable({
      command: 'ffmpeg',
      platform: 'linux',
      spawnFn: makeSpawn('/usr/bin/ffmpeg', 0),
    });
    expect(result.available).toBe(true);
    expect(result.probePath).toBe('/usr/bin/ffmpeg');
    expect(result.command).toBe('ffmpeg');
    expect(result.platform).toBe('linux');
  });

  it('CLI が見つからないと available=false + probePath=null', async () => {
    const result = await probeCliAvailable({
      command: 'reg',
      platform: 'linux',
      spawnFn: makeSpawn('', 1),
    });
    expect(result.available).toBe(false);
    expect(result.probePath).toBeNull();
  });

  it('win32 platform で where 実行', async () => {
    const result = await probeCliAvailable({
      command: 'reg',
      platform: 'win32',
      spawnFn: makeSpawn('C:\\Windows\\System32\\reg.exe', 0),
    });
    expect(result.available).toBe(true);
    expect(result.probePath).toBe('C:\\Windows\\System32\\reg.exe');
  });

  it('durationMs は数値', async () => {
    const result = await probeCliAvailable({
      command: 'ffmpeg',
      platform: 'linux',
      spawnFn: makeSpawn('/usr/bin/ffmpeg', 0),
    });
    expect(typeof result.durationMs).toBe('number');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });
});

describe('v0.8 platformGate', () => {
  it('現 platform と target の 互換性 判定', () => {
    const gate = platformGate('macos');
    expect(gate.target).toBe('macos');
    expect(typeof gate.platform).toBe('string');
    // 現 test 実行環境の platform 次第で compatible = true / false
    expect(typeof gate.compatible).toBe('boolean');
  });

  it('DesktopTarget 3 種 全て gate 対応', () => {
    for (const target of ['macos', 'windows', 'linux'] as const) {
      const gate = platformGate(target);
      expect(gate.target).toBe(target);
    }
  });
});

describe('v0.8 shouldSkipAxis', () => {
  it('electron / tauri / webview / dark-mode = semantics-only、 常に skip=false', () => {
    for (const target of ['macos', 'windows', 'linux'] as const) {
      for (const axis of ['electron', 'tauri', 'webview', 'dark-mode'] as const) {
        const decision = shouldSkipAxis(axis, target);
        expect(decision.skip).toBe(false);
      }
    }
  });

  it('current platform と target 不一致で skip=true (platform mismatch)', () => {
    const platform = process.platform;
    // 現 platform と 異なる target を選ぶ
    const otherTargets = (['macos', 'windows', 'linux'] as const).filter((t) => {
      if (platform === 'darwin') return t !== 'macos';
      if (platform === 'linux') return t !== 'linux';
      if (platform === 'win32') return t !== 'windows';
      return true;
    });
    for (const target of otherTargets) {
      const decision = shouldSkipAxis('auto-updater', target);
      expect(decision.skip).toBe(true);
      expect(decision.reason).toContain('incompatible');
    }
  });

  it('reason field に skip 理由が含まれる', () => {
    const platform = process.platform;
    if (platform === 'darwin') {
      const decision = shouldSkipAxis('auto-updater', 'linux');
      expect(decision.reason).toContain('incompatible');
    }
  });
});

describe('v0.8 computeSkipMatrix', () => {
  it('12 axis × 3 target = 36 pair 全 matrix', () => {
    const matrix = computeSkipMatrix();
    expect(matrix).toHaveLength(36);
  });

  it('semantics-only axis (electron/tauri/webview/dark-mode) は 全 target で skip=false', () => {
    const matrix = computeSkipMatrix();
    const semanticsOnly = matrix.filter((m) =>
      ['electron', 'tauri', 'webview', 'dark-mode'].includes(m.axis),
    );
    for (const entry of semanticsOnly) {
      expect(entry.skip).toBe(false);
    }
  });

  it('matrix 全 entry に axis + target + skip + reason field', () => {
    const matrix = computeSkipMatrix();
    for (const entry of matrix) {
      expect(entry.axis).toBeDefined();
      expect(entry.target).toBeDefined();
      expect(typeof entry.skip).toBe('boolean');
      // reason は null or string
      expect(entry.reason === null || typeof entry.reason === 'string').toBe(true);
    }
  });
});
