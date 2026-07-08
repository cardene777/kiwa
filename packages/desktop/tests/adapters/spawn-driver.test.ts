import { describe, expect, it } from 'vitest';
import {
  buildSpawnInvocation,
  cliForAxis,
  invokeDesktopCli,
  type DesktopCliCommand,
  type SpawnInvocation,
} from '../../src/index.js';
import type { DesktopAxis } from '../../src/semantics/index.js';

describe('desktop spawn-driver v0.5 stub 契約層 (Mobile v1.54 rhythm 再現)', () => {
  const baseEnv = { KIWA_DESKTOP_MODE: 'real' };

  it('invokeDesktopCli succeeds under KIWA_DESKTOP_MODE=real', async () => {
    const inv: SpawnInvocation = {
      command: 'ffmpeg',
      args: ['-i', 'input.mp4', 'output.webm'],
      env: baseEnv,
    };
    const result = await invokeDesktopCli(inv);
    expect(result.invoked).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.command).toBe('ffmpeg');
    expect(result.args).toEqual(['-i', 'input.mp4', 'output.webm']);
    expect(result.stdout).toContain('[v0.5 stub]');
    expect(result.stderr).toBe('');
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('fail-closed when KIWA_DESKTOP_MODE 未設定', async () => {
    const inv: SpawnInvocation = { command: 'ffmpeg', args: [], env: {} };
    await expect(invokeDesktopCli(inv)).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('fail-closed when KIWA_DESKTOP_MODE=mock', async () => {
    const inv: SpawnInvocation = { command: 'ffmpeg', args: [], env: { KIWA_DESKTOP_MODE: 'mock' } };
    await expect(invokeDesktopCli(inv)).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('args 上限 32 超過で throw', async () => {
    const inv: SpawnInvocation = {
      command: 'electron-builder',
      args: new Array<string>(33).fill('a'),
      env: baseEnv,
    };
    await expect(invokeDesktopCli(inv)).rejects.toThrow(/args exceeds max 32/);
  });

  it('args 上限 32 ちょうどは pass', async () => {
    const inv: SpawnInvocation = {
      command: 'electron-builder',
      args: new Array<string>(32).fill('a'),
      env: baseEnv,
    };
    const result = await invokeDesktopCli(inv);
    expect(result.invoked).toBe(true);
    expect(result.args).toHaveLength(32);
  });

  it('shape 契約 preserving = SpawnResult 6 field 全埋め', async () => {
    const result = await invokeDesktopCli({ command: 'xclip', args: ['-selection', 'clipboard'], env: baseEnv });
    expect(result).toMatchObject({
      command: 'xclip',
      invoked: true,
      exitCode: 0,
      stderr: '',
    });
    expect(typeof result.stdout).toBe('string');
    expect(typeof result.durationMs).toBe('number');
    expect(Array.isArray(result.args)).toBe(true);
  });

  it('args reference immutability (defensive copy)', async () => {
    const args = ['-a', '-b'];
    const result = await invokeDesktopCli({ command: 'ffmpeg', args, env: baseEnv });
    args.push('-c'); // mutate caller side
    expect(result.args).toEqual(['-a', '-b']); // result 保持
  });
});

describe('cliForAxis mapping (12 axis → 8 CLI + 4 null)', () => {
  it('CLI-backed axis returns command', () => {
    expect(cliForAxis('auto-updater')).toBe('electron-updater');
    expect(cliForAxis('fs-permissions')).toBe('osascript');
    expect(cliForAxis('notification')).toBe('notify-send');
    expect(cliForAxis('menu-bar')).toBe('electron-builder');
    expect(cliForAxis('tray-icon')).toBe('electron-builder');
    expect(cliForAxis('screen-recording')).toBe('ffmpeg');
    expect(cliForAxis('global-shortcut')).toBe('defaults');
    expect(cliForAxis('clipboard')).toBe('xclip');
  });

  it('non-CLI axis returns null', () => {
    expect(cliForAxis('electron')).toBeNull();
    expect(cliForAxis('tauri')).toBeNull();
    expect(cliForAxis('webview')).toBeNull();
    expect(cliForAxis('dark-mode')).toBeNull();
  });

  it('全 12 axis で mapping 定義済', () => {
    const AXES: DesktopAxis[] = [
      'electron',
      'tauri',
      'webview',
      'auto-updater',
      'fs-permissions',
      'notification',
      'menu-bar',
      'tray-icon',
      'screen-recording',
      'global-shortcut',
      'clipboard',
      'dark-mode',
    ];
    for (const axis of AXES) {
      const cli = cliForAxis(axis);
      expect(cli === null || typeof cli === 'string').toBe(true);
    }
  });
});

describe('buildSpawnInvocation factory', () => {
  it('default args = [] + env = process.env', () => {
    const inv = buildSpawnInvocation({ command: 'ffmpeg' });
    expect(inv.command).toBe('ffmpeg');
    expect(inv.args).toEqual([]);
    expect(inv.env).toBeDefined();
    expect(inv.cwd).toBeUndefined();
  });

  it('explicit args + env', () => {
    const inv = buildSpawnInvocation({
      command: 'xclip',
      args: ['-selection', 'clipboard'],
      env: { KIWA_DESKTOP_MODE: 'real' },
    });
    expect(inv.args).toEqual(['-selection', 'clipboard']);
    expect(inv.env).toEqual({ KIWA_DESKTOP_MODE: 'real' });
  });

  it('explicit cwd', () => {
    const inv = buildSpawnInvocation({ command: 'ffmpeg', cwd: '/tmp/work' });
    expect(inv.cwd).toBe('/tmp/work');
  });

  it('cwd undefined → property 省略 (exactOptionalPropertyTypes 対応)', () => {
    const inv = buildSpawnInvocation({ command: 'ffmpeg' });
    expect('cwd' in inv).toBe(false);
  });

  it('DesktopCliCommand 8 種全て factory 経由生成可', () => {
    const commands: DesktopCliCommand[] = [
      'electron-builder',
      'electron-updater',
      'ffmpeg',
      'xclip',
      'osascript',
      'notify-send',
      'defaults',
      'reg',
    ];
    for (const cmd of commands) {
      const inv = buildSpawnInvocation({ command: cmd });
      expect(inv.command).toBe(cmd);
    }
  });
});
