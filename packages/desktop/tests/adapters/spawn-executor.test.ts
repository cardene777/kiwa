import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import {
  executeSpawn,
  invokeDesktopCli,
  invokeDesktopCliWith,
  sanitizeEnv,
  type SpawnExecutorInput,
  type SpawnFn,
} from '../../src/index.js';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

function makeSpawn(opts: {
  stdout?: string;
  stderr?: string;
  exitCode?: number;
  errorAfterMs?: number;
  hangForever?: boolean;
  bigChunkBytes?: number;
}): SpawnFn {
  return ((_cmd: string, _args: readonly string[]) => {
    const child = new DummyChild();
    if (opts.errorAfterMs !== undefined) {
      setTimeout(() => child.emit('error', new Error('spawn failed')), opts.errorAfterMs);
    } else if (opts.hangForever) {
      // don't fire close
    } else if (opts.bigChunkBytes !== undefined) {
      setTimeout(() => {
        const chunk = Buffer.alloc(opts.bigChunkBytes!);
        child.stdout.emit('data', chunk);
      }, 0);
    } else {
      setTimeout(() => {
        if (opts.stdout) child.stdout.emit('data', Buffer.from(opts.stdout));
        if (opts.stderr) child.stderr.emit('data', Buffer.from(opts.stderr));
        child.emit('close', opts.exitCode ?? 0, null);
      }, 0);
    }
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('v1.61-1 executeSpawn — 実 spawn wrapper (Mobile v0.6 pattern 転用)', () => {
  it('captures stdout + stderr', async () => {
    const input: SpawnExecutorInput = {
      command: 'ffmpeg',
      args: ['-i', 'in.mp4'],
      env: { PATH: '/usr/bin' },
    };
    const r = await executeSpawn(input, makeSpawn({ stdout: 'ok', stderr: 'warn', exitCode: 0 }));
    expect(r.stdout).toBe('ok');
    expect(r.stderr).toBe('warn');
    expect(r.exitCode).toBe(0);
    expect(r.timedOut).toBe(false);
  });

  it('reports non-zero exit code', async () => {
    const r = await executeSpawn(
      { command: 'electron-builder', args: [], env: { PATH: '/usr/bin' } },
      makeSpawn({ exitCode: 2, stderr: 'boom' }),
    );
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('boom');
  });

  it('timeout kills long-running child', async () => {
    const r = await executeSpawn(
      { command: 'ffmpeg', args: [], env: { PATH: '/usr/bin' }, timeoutMs: 10 },
      ((_c: string, _a: readonly string[]) => {
        const child = new DummyChild();
        vi.spyOn(child, 'kill').mockImplementation(() => {
          setTimeout(() => child.emit('close', null, 'SIGKILL'), 0);
          return true as unknown as void;
        });
        return child as unknown as ReturnType<SpawnFn>;
      }) as unknown as SpawnFn,
    );
    expect(r.timedOut).toBe(true);
  });

  it('rejects on spawn error', async () => {
    await expect(
      executeSpawn(
        { command: 'osascript', args: [], env: { PATH: '/usr/bin' } },
        makeSpawn({ errorAfterMs: 0 }),
      ),
    ).rejects.toThrow(/spawn failed/);
  });

  it('buffer upper bound truncates + marks exceeded', async () => {
    const r = await executeSpawn(
      {
        command: 'xclip',
        args: [],
        env: { PATH: '/usr/bin' },
        maxBufferBytes: 8,
      },
      ((_c: string, _a: readonly string[]) => {
        const child = new DummyChild();
        // eslint-disable-next-line
        vi.spyOn(child as any, 'kill').mockImplementation(() => {
          setTimeout(() => child.emit('close', null, 'SIGKILL'), 0);
        });
        setTimeout(() => child.stdout.emit('data', Buffer.alloc(64)), 0);
        return child as unknown as ReturnType<SpawnFn>;
      }) as unknown as SpawnFn,
    );
    expect(r.stdout).toContain('[buffer exceeded]');
  });

  it('sanitizeEnv keeps only allowlist for electron-builder', () => {
    const out = sanitizeEnv('electron-builder', {
      PATH: '/usr/bin',
      SECRET_TOKEN: 'nope',
      CSC_LINK: 'ok',
      HOME: '/root',
      BUILD_TARGET: 'darwin',
    });
    expect(out).toEqual({
      PATH: '/usr/bin',
      HOME: '/root',
      CSC_LINK: 'ok',
      BUILD_TARGET: 'darwin',
    });
    expect(out.SECRET_TOKEN).toBeUndefined();
  });

  it('sanitizeEnv per command differs (ffmpeg allows FFMPEG_PATH not CSC_LINK)', () => {
    const ffmpegEnv = sanitizeEnv('ffmpeg', {
      PATH: '/usr/bin',
      FFMPEG_PATH: '/opt/ffmpeg',
      CSC_LINK: 'nope-here',
    });
    expect(ffmpegEnv.FFMPEG_PATH).toBe('/opt/ffmpeg');
    expect(ffmpegEnv.CSC_LINK).toBeUndefined();
  });

  it('sanitizeEnv notify-send allows DISPLAY + DBUS', () => {
    const out = sanitizeEnv('notify-send', {
      PATH: '/usr/bin',
      DISPLAY: ':0',
      DBUS_SESSION_BUS_ADDRESS: '/tmp/bus',
      SECRET: 'nope',
    });
    expect(out.DISPLAY).toBe(':0');
    expect(out.DBUS_SESSION_BUS_ADDRESS).toBe('/tmp/bus');
    expect(out.SECRET).toBeUndefined();
  });

  it('sanitizeEnv reg allows Windows-specific env', () => {
    const out = sanitizeEnv('reg', {
      PATH: 'C:\\Windows',
      USERPROFILE: 'C:\\Users\\me',
      APPDATA: 'C:\\Users\\me\\AppData',
      LEAK: 'nope',
    });
    expect(out.USERPROFILE).toBe('C:\\Users\\me');
    expect(out.APPDATA).toBe('C:\\Users\\me\\AppData');
    expect(out.LEAK).toBeUndefined();
  });
});

describe('v1.61-1 invokeDesktopCli — v0.5 shape preserving on real spawn', () => {
  it('fires real spawn (via DI) and returns SpawnResult shape', async () => {
    const r = await invokeDesktopCliWith(
      {
        command: 'ffmpeg',
        args: ['-i', 'in.mp4'],
        env: { KIWA_DESKTOP_MODE: 'real', PATH: '/usr/bin' },
      },
      makeSpawn({ stdout: 'transcoded', exitCode: 0 }),
    );
    expect(r.invoked).toBe(true);
    expect(r.stdout).toBe('transcoded');
    expect(r.exitCode).toBe(0);
    expect(r.command).toBe('ffmpeg');
    expect(r.args).toEqual(['-i', 'in.mp4']);
  });

  it('dry-run env keeps v0.5 shape without invoking spawn', async () => {
    let invoked = false;
    const spy = ((_c: string, _a: readonly string[]) => {
      invoked = true;
      return new DummyChild() as unknown as ReturnType<SpawnFn>;
    }) as unknown as SpawnFn;
    const r = await invokeDesktopCliWith(
      {
        command: 'electron-builder',
        args: [],
        env: { KIWA_DESKTOP_MODE: 'real', KIWA_DESKTOP_SPAWN: 'dry-run', PATH: '/usr/bin' },
      },
      spy,
    );
    expect(invoked).toBe(false);
    expect(r.stdout).toContain('[v0.6 dry-run]');
  });

  it('env-gate still throws without KIWA_DESKTOP_MODE=real', async () => {
    await expect(
      invokeDesktopCli({
        command: 'ffmpeg',
        args: [],
        env: { PATH: '/usr/bin' },
      }),
    ).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('args upper bound (32) still enforced', async () => {
    await expect(
      invokeDesktopCli({
        command: 'ffmpeg',
        args: new Array(33).fill('x'),
        env: { KIWA_DESKTOP_MODE: 'real', PATH: '/usr/bin' },
      }),
    ).rejects.toThrow(/args exceeds max 32/);
  });
});
