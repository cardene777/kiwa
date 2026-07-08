import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import type { SpawnFn } from '@kiwa/desktop';
import {
  runDryRunWorkflow,
  runWithInjectedSpawn,
  sanitizeEnvForCommand,
} from '../src/workflow.js';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

function makeSpawn(stdoutText: string, exitCode: number): SpawnFn {
  return ((_c: string, _a: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      child.stdout.emit('data', Buffer.from(stdoutText));
      child.emit('close', exitCode, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('dogfood-desktop-v06-spawn-app (v1.61-2、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 candidate、 Mobile v1.55 rhythm 再現)', () => {
  it('runDryRunWorkflow emits 8 SpawnResult with dry-run shape', async () => {
    const results = await runDryRunWorkflow();
    expect(results).toHaveLength(8);
    for (const r of results) {
      expect(r.invoked).toBe(true);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('[v0.6 dry-run]');
      expect(r.stderr).toBe('');
    }
  });

  it('runDryRunWorkflow includes all 8 CLI commands', async () => {
    const results = await runDryRunWorkflow();
    const commands = new Set(results.map((r) => r.command));
    expect(commands).toEqual(
      new Set([
        'electron-builder',
        'electron-updater',
        'ffmpeg',
        'xclip',
        'osascript',
        'notify-send',
        'defaults',
        'reg',
      ]),
    );
  });

  it('runWithInjectedSpawn uses DI spawn function', async () => {
    const spawnFn = makeSpawn('ffmpeg version 6.1.1', 0);
    const result = await runWithInjectedSpawn(spawnFn);
    expect(result.invoked).toBe(true);
    expect(result.stdout).toBe('ffmpeg version 6.1.1');
    expect(result.exitCode).toBe(0);
    expect(result.command).toBe('ffmpeg');
    expect(result.args).toEqual(['-version']);
  });

  it('runWithInjectedSpawn propagates non-zero exit code', async () => {
    const spawnFn = makeSpawn('', 1);
    const result = await runWithInjectedSpawn(spawnFn);
    expect(result.exitCode).toBe(1);
  });

  it('sanitizeEnvForCommand strips secrets for electron-builder', () => {
    const out = sanitizeEnvForCommand('electron-builder', {
      PATH: '/usr/bin',
      HOME: '/root',
      CSC_LINK: 'ok',
      SECRET_TOKEN: 'nope',
      LEAK: 'nope-here',
    });
    expect(out.PATH).toBe('/usr/bin');
    expect(out.CSC_LINK).toBe('ok');
    expect(out.SECRET_TOKEN).toBeUndefined();
    expect(out.LEAK).toBeUndefined();
  });

  it('sanitizeEnvForCommand per-command differs (ffmpeg vs xclip)', () => {
    const ffmpegOut = sanitizeEnvForCommand('ffmpeg', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      DISPLAY: ':0',
    });
    expect(ffmpegOut.FFMPEG_PATH).toBe('/opt/ffmpeg');
    expect(ffmpegOut.DISPLAY).toBeUndefined();

    const xclipOut = sanitizeEnvForCommand('xclip', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      DISPLAY: ':0',
    });
    expect(xclipOut.DISPLAY).toBe(':0');
    expect(xclipOut.FFMPEG_PATH).toBeUndefined();
  });

  it('sanitizeEnvForCommand notify-send allows DBUS + XDG_RUNTIME_DIR', () => {
    const out = sanitizeEnvForCommand('notify-send', {
      PATH: '/usr/bin',
      DBUS_SESSION_BUS_ADDRESS: '/tmp/bus',
      XDG_RUNTIME_DIR: '/run/user/1000',
      SECRET: 'nope',
    });
    expect(out.DBUS_SESSION_BUS_ADDRESS).toBe('/tmp/bus');
    expect(out.XDG_RUNTIME_DIR).toBe('/run/user/1000');
    expect(out.SECRET).toBeUndefined();
  });

  it('sanitizeEnvForCommand reg allows Windows env only', () => {
    const out = sanitizeEnvForCommand('reg', {
      PATH: 'C:\\Windows',
      USERPROFILE: 'C:\\Users\\me',
      APPDATA: 'C:\\Users\\me\\AppData',
      LOCALAPPDATA: 'C:\\Users\\me\\AppData\\Local',
      DISPLAY: ':0',
    });
    expect(out.USERPROFILE).toBe('C:\\Users\\me');
    expect(out.APPDATA).toBe('C:\\Users\\me\\AppData');
    expect(out.LOCALAPPDATA).toBe('C:\\Users\\me\\AppData\\Local');
    expect(out.DISPLAY).toBeUndefined();
  });

  it('runDryRunWorkflow does not invoke real spawn (dry-run 経路)', async () => {
    // dry-run では 実 spawn 実行しないので、 未 install CLI (electron-builder / reg 等) でも 完走する
    const results = await runDryRunWorkflow();
    expect(results.every((r) => r.stdout.startsWith('[v0.6 dry-run]'))).toBe(true);
  });

  it('durationMs is a number for all dry-run results', async () => {
    const results = await runDryRunWorkflow();
    for (const r of results) {
      expect(typeof r.durationMs).toBe('number');
      expect(r.durationMs).toBeGreaterThanOrEqual(0);
    }
  });
});
