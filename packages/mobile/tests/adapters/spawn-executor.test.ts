import { EventEmitter } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import {
  executeSpawn,
  invokeMobileCli,
  invokeMobileCliWith,
  sanitizeEnv,
  type SpawnExecutorInput,
  type SpawnFn,
} from '../../src/index.js';

/**
 * Test-only dummy spawn = 実 CLI 未 install 環境でも決定的挙動を検証。
 */
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

describe('v1.55-1 executeSpawn — 実 spawn wrapper', () => {
  it('captures stdout + stderr', async () => {
    const input: SpawnExecutorInput = {
      command: 'expo build',
      args: ['--platform', 'ios'],
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
      { command: 'metro bundle', args: [], env: { PATH: '/usr/bin' } },
      makeSpawn({ exitCode: 2, stderr: 'boom' }),
    );
    expect(r.exitCode).toBe(2);
    expect(r.stderr).toContain('boom');
  });

  it('timeout kills long-running child', async () => {
    const r = await executeSpawn(
      { command: 'gradle build', args: [], env: { PATH: '/usr/bin' }, timeoutMs: 10 },
      ((_c: string, _a: readonly string[]) => {
        const child = new DummyChild();
        // never emit close; timeout should fire and we manually emit close after kill call
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
        { command: 'pod install', args: [], env: { PATH: '/usr/bin' } },
        makeSpawn({ errorAfterMs: 0 }),
      ),
    ).rejects.toThrow(/spawn failed/);
  });

  it('buffer upper bound truncates + marks exceeded', async () => {
    const r = await executeSpawn(
      {
        command: 'react-native start',
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

  it('sanitizeEnv keeps only allowlist for expo build', () => {
    const out = sanitizeEnv('expo build', {
      PATH: '/usr/bin',
      SECRET_TOKEN: 'nope',
      EXPO_TOKEN: 'ok',
      HOME: '/root',
    });
    expect(out).toEqual({ PATH: '/usr/bin', HOME: '/root', EXPO_TOKEN: 'ok' });
    expect(out.SECRET_TOKEN).toBeUndefined();
  });

  it('sanitizeEnv per command differs (gradle allows JAVA_HOME)', () => {
    const gradleEnv = sanitizeEnv('gradle build', {
      PATH: '/usr/bin',
      JAVA_HOME: '/opt/java',
      EXPO_TOKEN: 'nope-here',
    });
    expect(gradleEnv.JAVA_HOME).toBe('/opt/java');
    expect(gradleEnv.EXPO_TOKEN).toBeUndefined();
  });
});

describe('v1.55-1 invokeMobileCli — v0.5 shape preserving on real spawn', () => {
  it('fires real spawn (via DI) and returns SpawnResult shape', async () => {
    const r = await invokeMobileCliWith(
      {
        command: 'expo build',
        args: ['--platform', 'ios'],
        env: { KIWA_MOBILE_MODE: 'real', PATH: '/usr/bin' },
      },
      makeSpawn({ stdout: 'built', exitCode: 0 }),
    );
    expect(r.invoked).toBe(true);
    expect(r.stdout).toBe('built');
    expect(r.exitCode).toBe(0);
    expect(r.command).toBe('expo build');
    expect(r.args).toEqual(['--platform', 'ios']);
  });

  it('dry-run env keeps v0.5 shape without invoking spawn', async () => {
    let invoked = false;
    const spy = ((_c: string, _a: readonly string[]) => {
      invoked = true;
      return new DummyChild() as unknown as ReturnType<SpawnFn>;
    }) as unknown as SpawnFn;
    const r = await invokeMobileCliWith(
      {
        command: 'metro bundle',
        args: [],
        env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run', PATH: '/usr/bin' },
      },
      spy,
    );
    expect(invoked).toBe(false);
    expect(r.stdout).toContain('[v0.6 dry-run]');
  });

  it('env-gate still throws without KIWA_MOBILE_MODE=real', async () => {
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: [],
        env: { PATH: '/usr/bin' },
      }),
    ).rejects.toThrow(/KIWA_MOBILE_MODE/);
  });

  it('args upper bound (32) still enforced', async () => {
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: new Array(33).fill('x'),
        env: { KIWA_MOBILE_MODE: 'real', PATH: '/usr/bin' },
      }),
    ).rejects.toThrow(/args exceeds max 32/);
  });
});
