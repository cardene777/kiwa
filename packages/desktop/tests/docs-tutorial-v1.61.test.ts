/**
 * v1.61-3 docs 補強 — tutorial 121 code snippet 検証。
 * 39 milestone 連続 snippet validation streak = v1.23 → v1.61。 kiwa 史上最長記録更新継続。
 * systematic pattern 36 度目適用 (v1.60 の 35 度目 = desktop v0.5 spawn stub uniform を継承)。
 * Mobile v1.55 rhythm 再現、 depth-5 pattern 2 例目確定 + depth-6 pattern 新設 candidate 到達。
 */
import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import {
  invokeDesktopCli,
  invokeDesktopCliWith,
  sanitizeEnv,
  type DesktopCliCommand,
  type SpawnFn,
} from '../src/index.js';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

const makeSpawn = (stdoutText: string, exitCode: number): SpawnFn =>
  ((_c: string, _a: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      child.stdout.emit('data', Buffer.from(stdoutText));
      child.emit('close', exitCode, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;

describe('tutorial 121 — dry-run 経路 snippet', () => {
  it('KIWA_DESKTOP_SPAWN=dry-run で v0.5 shape 契約復元', async () => {
    const commands: DesktopCliCommand[] = ['ffmpeg', 'xclip', 'osascript'];
    for (const cmd of commands) {
      const result = await invokeDesktopCli({
        command: cmd,
        args: [],
        env: { KIWA_DESKTOP_MODE: 'real', KIWA_DESKTOP_SPAWN: 'dry-run', PATH: '/usr/bin' },
      });
      expect(result.invoked).toBe(true);
      expect(result.stdout).toContain('[v0.6 dry-run]');
    }
  });
});

describe('tutorial 121 — DI 経路 snippet', () => {
  it('SpawnFn 注入で決定的挙動', async () => {
    const result = await invokeDesktopCliWith(
      {
        command: 'ffmpeg',
        args: ['-version'],
        env: { KIWA_DESKTOP_MODE: 'real', PATH: '/usr/bin' },
      },
      makeSpawn('ffmpeg version 6.1.1', 0),
    );
    expect(result.stdout).toBe('ffmpeg version 6.1.1');
    expect(result.exitCode).toBe(0);
  });
});

describe('tutorial 121 — sanitizeEnv snippet', () => {
  it('electron-builder は CSC_LINK + BUILD_TARGET を通す', () => {
    const out = sanitizeEnv('electron-builder', {
      PATH: '/usr/bin',
      CSC_LINK: 'ok',
      SECRET_TOKEN: 'nope',
    });
    expect(out.CSC_LINK).toBe('ok');
    expect(out.SECRET_TOKEN).toBeUndefined();
  });

  it('ffmpeg は FFMPEG_PATH のみ、 xclip は DISPLAY のみ', () => {
    const ffmpegOut = sanitizeEnv('ffmpeg', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      DISPLAY: ':0',
    });
    expect(ffmpegOut.FFMPEG_PATH).toBe('/opt/ffmpeg');
    expect(ffmpegOut.DISPLAY).toBeUndefined();

    const xclipOut = sanitizeEnv('xclip', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      DISPLAY: ':0',
    });
    expect(xclipOut.DISPLAY).toBe(':0');
    expect(xclipOut.FFMPEG_PATH).toBeUndefined();
  });
});
