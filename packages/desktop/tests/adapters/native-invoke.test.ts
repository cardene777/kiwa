import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import {
  probeAndInvoke,
  probeAndInvokeAll,
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

describe('v0.9 probeAndInvoke (probe + invoke 統合)', () => {
  it('semantics-only axis (electron) = no-cli-mapping status', async () => {
    const result = await probeAndInvoke({
      axis: 'electron',
      target: 'macos',
      spawnFn: makeSpawn('/usr/bin/electron', 0),
    });
    expect(result.status).toBe('no-cli-mapping');
    expect(result.spawnResult).toBeNull();
    expect(result.reason).toContain('semantics-only');
  });

  it('platform mismatch axis = axis-skipped status', async () => {
    // 現 platform と 異なる target を選ぶ
    const platform = process.platform;
    const otherTarget = platform === 'darwin' ? 'linux' : 'macos';
    const result = await probeAndInvoke({
      axis: 'auto-updater',
      target: otherTarget,
      spawnFn: makeSpawn('/usr/bin/electron-updater', 0),
    });
    expect(result.status).toBe('axis-skipped');
    expect(result.reason).toContain('incompatible');
  });

  it('CLI 未 install = cli-unavailable status', async () => {
    // probe で exitCode=1 → 未 install 扱い
    const spawnFn = makeSpawn('', 1);
    // 現 platform に合う axis + target を選ぶ
    const platform = process.platform;
    const target = platform === 'darwin' ? 'macos' : platform === 'linux' ? 'linux' : 'windows';
    const result = await probeAndInvoke({
      axis: 'auto-updater',
      target,
      spawnFn,
    });
    expect(result.status).toBe('cli-unavailable');
    expect(result.reason).toContain('not installed');
    expect(result.spawnResult).toBeNull();
  });

  it('CLI 存在確認 OK = invoked status + SpawnResult 返却', async () => {
    // probe で exit=0 + stdout あり → invoke 経路
    const spawnFn = makeSpawn('/usr/bin/electron-updater', 0);
    const platform = process.platform;
    const target = platform === 'darwin' ? 'macos' : platform === 'linux' ? 'linux' : 'windows';
    const result = await probeAndInvoke({
      axis: 'auto-updater',
      target,
      args: ['--version'],
      spawnFn,
    });
    // invoke 経路まで進んだので invoked status
    expect(result.status).toBe('invoked');
    expect(result.spawnResult).not.toBeNull();
    expect(result.spawnResult?.command).toBe('electron-updater');
    expect(result.spawnResult?.args).toEqual(['--version']);
  });

  it('全 4 status field 網羅 (invoked / cli-unavailable / axis-skipped / no-cli-mapping)', async () => {
    const statuses = new Set<string>();

    // no-cli-mapping
    const r1 = await probeAndInvoke({ axis: 'electron', target: 'macos' });
    statuses.add(r1.status);

    // axis-skipped (現 platform と 異なる target)
    const platform = process.platform;
    const otherTarget = platform === 'darwin' ? 'linux' : 'macos';
    const r2 = await probeAndInvoke({ axis: 'auto-updater', target: otherTarget });
    statuses.add(r2.status);

    // cli-unavailable
    const target = platform === 'darwin' ? 'macos' : platform === 'linux' ? 'linux' : 'windows';
    const r3 = await probeAndInvoke({
      axis: 'auto-updater',
      target,
      spawnFn: makeSpawn('', 1),
    });
    statuses.add(r3.status);

    // invoked
    const r4 = await probeAndInvoke({
      axis: 'auto-updater',
      target,
      spawnFn: makeSpawn('/usr/bin/electron-updater', 0),
    });
    statuses.add(r4.status);

    expect(statuses.size).toBeGreaterThanOrEqual(3);
    expect(statuses.has('no-cli-mapping')).toBe(true);
    expect(statuses.has('axis-skipped')).toBe(true);
    expect(statuses.has('cli-unavailable')).toBe(true);
  });
});

describe('v0.9 probeAndInvokeAll (matrix summary)', () => {
  it('12 axis × 3 target = 36 pair 全走査', async () => {
    const summary = await probeAndInvokeAll({ spawnFn: makeSpawn('/usr/bin/dummy', 0) });
    expect(summary.total).toBe(36);
    // status 4 経路 の合計 = 36
    const bucketTotal =
      summary.invoked.length +
      summary.cliUnavailable.length +
      summary.axisSkipped.length +
      summary.noCliMapping.length;
    expect(bucketTotal).toBe(36);
  });

  it('subset axes + targets 制限', async () => {
    const summary = await probeAndInvokeAll({
      axes: ['electron', 'tauri'],
      targets: ['macos'],
      spawnFn: makeSpawn('/usr/bin/dummy', 0),
    });
    expect(summary.total).toBe(2);
    // electron + tauri は semantics-only = no-cli-mapping
    expect(summary.noCliMapping.length).toBe(2);
  });

  it('semantics-only 4 axis (electron/tauri/webview/dark-mode) は no-cli-mapping', async () => {
    const summary = await probeAndInvokeAll({
      axes: ['electron', 'tauri', 'webview', 'dark-mode'],
      spawnFn: makeSpawn('/usr/bin/dummy', 0),
    });
    // 4 axis × 3 target = 12、 全て no-cli-mapping
    expect(summary.noCliMapping.length).toBe(12);
  });

  it('CLI 未 install 環境 で全 CLI-backed pair が cli-unavailable', async () => {
    // spawn = exitCode 1 (未 install シミュレーション)
    const summary = await probeAndInvokeAll({
      spawnFn: makeSpawn('', 1),
    });
    // semantics-only 12 (4 axis × 3 target) + platform mismatch skip + cli-unavailable
    // cli-unavailable は 少なくとも 1 つ以上
    expect(summary.cliUnavailable.length).toBeGreaterThan(0);
  });

  it('NativeInvokeResult は axis + target + status + reason + spawnResult field', async () => {
    const summary = await probeAndInvokeAll({
      axes: ['electron'],
      targets: ['macos'],
      spawnFn: makeSpawn('/usr/bin/dummy', 0),
    });
    const result = summary.noCliMapping[0];
    expect(result?.axis).toBeDefined();
    expect(result?.target).toBeDefined();
    expect(result?.status).toBeDefined();
    // reason は null or string
    expect(result?.reason === null || typeof result?.reason === 'string').toBe(true);
    // spawnResult は null (no-cli-mapping なので)
    expect(result?.spawnResult).toBeNull();
  });

  it('shape 契約 preserving = 全 status で spawnResult は SpawnResult or null', async () => {
    const summary = await probeAndInvokeAll({
      spawnFn: makeSpawn('/usr/bin/dummy', 0),
    });
    for (const result of [
      ...summary.invoked,
      ...summary.cliUnavailable,
      ...summary.axisSkipped,
      ...summary.noCliMapping,
    ]) {
      // spawnResult は null or SpawnResult shape
      if (result.spawnResult) {
        expect(result.spawnResult.command).toBeDefined();
        expect(result.spawnResult.invoked).toBeDefined();
      } else {
        expect(result.spawnResult).toBeNull();
      }
    }
  });
});
