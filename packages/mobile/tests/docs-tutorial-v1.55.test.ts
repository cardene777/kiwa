/**
 * v1.55-3 docs 補強 — tutorial 115 code snippet 検証。
 * **33 milestone 連続 snippet validation streak** = v1.23 → v1.55。 kiwa 史上最長記録更新継続。
 */
import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import {
  invokeMobileCli,
  invokeMobileCliWith,
  sanitizeEnv,
  type SpawnFn,
} from '../src/index.js';

class DummyChild extends EventEmitter {
  stdout = new EventEmitter();
  stderr = new EventEmitter();
  kill(_signal?: NodeJS.Signals | number) {}
}

function makeSpawn(stdout: string): SpawnFn {
  return ((_cmd: string, _args: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      child.stdout.emit('data', Buffer.from(stdout));
      child.emit('close', 0, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('tutorial 115 — Dry-run mode snippet', () => {
  it('returns shape without invoking spawn', async () => {
    const r = await invokeMobileCli({
      command: 'expo build',
      args: ['--platform', 'ios'],
      env: { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run', PATH: '/usr/bin' },
    });
    expect(r.invoked).toBe(true);
    expect(r.stdout).toContain('[v0.6 dry-run]');
    expect(r.exitCode).toBe(0);
  });
});

describe('tutorial 115 — DI 経路 snippet', () => {
  it('captures injected stdout', async () => {
    const r = await invokeMobileCliWith(
      {
        command: 'metro bundle',
        args: [],
        env: { KIWA_MOBILE_MODE: 'real', PATH: '/usr/bin' },
      },
      makeSpawn('bundle ok'),
    );
    expect(r.stdout).toBe('bundle ok');
    expect(r.exitCode).toBe(0);
  });
});

describe('tutorial 115 — env sanitize snippet', () => {
  it('drops secrets, keeps command-specific tokens', () => {
    const env = sanitizeEnv('expo build', {
      PATH: '/usr/bin',
      EXPO_TOKEN: 'ok',
      DATABASE_PASSWORD: 'nope',
      GITHUB_TOKEN: 'nope',
    });
    expect(env.EXPO_TOKEN).toBe('ok');
    expect(env.DATABASE_PASSWORD).toBeUndefined();
    expect(env.GITHUB_TOKEN).toBeUndefined();
  });
});
