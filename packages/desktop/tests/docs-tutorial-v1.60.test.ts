/**
 * v1.60-3 docs 補強 — tutorial 120 code snippet 検証。
 * 38 milestone 連続 snippet validation streak = v1.23 → v1.60。 kiwa 史上最長記録更新継続。
 * systematic pattern 35 度目適用 (v1.59 の 34 度目 = desktop v0.4 adapter interface uniform を継承)。
 * Mobile v1.54 rhythm 再現、 depth-5 pattern 2 例目 candidate 到達。
 */
import { describe, expect, it } from 'vitest';
import {
  buildSpawnInvocation,
  cliForAxis,
  invokeDesktopCli,
  type SpawnInvocation,
} from '../src/index.js';

describe('tutorial 120 — invokeDesktopCli snippet', () => {
  it('ffmpeg 呼出 with KIWA_DESKTOP_MODE=real', async () => {
    const inv: SpawnInvocation = {
      command: 'ffmpeg',
      args: ['-i', 'input.mp4', 'output.webm'],
      env: { KIWA_DESKTOP_MODE: 'real' },
    };
    const result = await invokeDesktopCli(inv);
    expect(result.invoked).toBe(true);
    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('[v0.5 stub]');
  });

  it('fail-closed when KIWA_DESKTOP_MODE 未設定', async () => {
    await expect(invokeDesktopCli({ command: 'ffmpeg', args: [], env: {} })).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });
});

describe('tutorial 120 — cliForAxis mapping snippet', () => {
  it('CLI-backed axis (8 axes)', () => {
    expect(cliForAxis('auto-updater')).toBe('electron-updater');
    expect(cliForAxis('screen-recording')).toBe('ffmpeg');
    expect(cliForAxis('clipboard')).toBe('xclip');
    expect(cliForAxis('notification')).toBe('notify-send');
  });

  it('non-CLI axis (4 axes) returns null', () => {
    expect(cliForAxis('electron')).toBeNull();
    expect(cliForAxis('tauri')).toBeNull();
    expect(cliForAxis('webview')).toBeNull();
    expect(cliForAxis('dark-mode')).toBeNull();
  });
});

describe('tutorial 120 — buildSpawnInvocation snippet', () => {
  it('default args + env', () => {
    const inv = buildSpawnInvocation({ command: 'xclip' });
    expect(inv.command).toBe('xclip');
    expect(inv.args).toEqual([]);
  });

  it('explicit args + env + cwd', () => {
    const inv = buildSpawnInvocation({
      command: 'ffmpeg',
      args: ['-i', 'in.mp4'],
      env: { KIWA_DESKTOP_MODE: 'real' },
      cwd: '/tmp',
    });
    expect(inv.args).toEqual(['-i', 'in.mp4']);
    expect(inv.cwd).toBe('/tmp');
  });
});

describe('tutorial 120 — args 上限 + fail-closed snippet', () => {
  it('args 33 で throw', async () => {
    const inv = {
      command: 'electron-builder' as const,
      args: new Array<string>(33).fill('a'),
      env: { KIWA_DESKTOP_MODE: 'real' },
    };
    await expect(invokeDesktopCli(inv)).rejects.toThrow(/args exceeds max 32/);
  });

  it('args 32 ちょうどは pass', async () => {
    const inv = {
      command: 'electron-builder' as const,
      args: new Array<string>(32).fill('a'),
      env: { KIWA_DESKTOP_MODE: 'real' },
    };
    const result = await invokeDesktopCli(inv);
    expect(result.invoked).toBe(true);
  });
});
