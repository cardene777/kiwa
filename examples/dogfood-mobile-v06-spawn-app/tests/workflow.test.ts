import { EventEmitter } from 'node:events';
import { describe, expect, it } from 'vitest';
import type { SpawnFn } from '@kiwa-test/mobile';
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

function makeQuickSpawn(stdout: string): SpawnFn {
  return ((_cmd: string, _args: readonly string[]) => {
    const child = new DummyChild();
    setTimeout(() => {
      child.stdout.emit('data', Buffer.from(stdout));
      child.emit('close', 0, null);
    }, 0);
    return child as unknown as ReturnType<SpawnFn>;
  }) as unknown as SpawnFn;
}

describe('Mobile v0.6 spawn dogfood workflow (v1.55-2、 depth-5 pattern 実装完成)', () => {
  it('runDryRunWorkflow returns 6 SpawnResult stubs', async () => {
    const results = await runDryRunWorkflow();
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.invoked).toBe(true);
      expect(r.stdout).toContain('[v0.6 dry-run]');
      expect(r.exitCode).toBe(0);
    }
  });

  it('runDryRunWorkflow every stdout contains its own command', async () => {
    const results = await runDryRunWorkflow();
    for (const r of results) {
      expect(r.stdout).toContain(r.command);
    }
  });

  it('runWithInjectedSpawn captures injected stdout', async () => {
    const r = await runWithInjectedSpawn(makeQuickSpawn('bundle ok'));
    expect(r.stdout).toBe('bundle ok');
    expect(r.exitCode).toBe(0);
    expect(r.command).toBe('metro bundle');
    expect(r.args).toEqual(['--reset-cache']);
  });

  it('runWithInjectedSpawn different injections yield different outputs', async () => {
    const r1 = await runWithInjectedSpawn(makeQuickSpawn('bundle A'));
    const r2 = await runWithInjectedSpawn(makeQuickSpawn('bundle B'));
    expect(r1.stdout).toBe('bundle A');
    expect(r2.stdout).toBe('bundle B');
  });

  it('sanitizeEnvForCommand strips out secret env vars for expo build', () => {
    const env = sanitizeEnvForCommand('expo build', {
      PATH: '/usr/bin',
      HOME: '/root',
      EXPO_TOKEN: 'ok',
      DATABASE_PASSWORD: 'nope',
      GITHUB_TOKEN: 'nope',
    });
    expect(env.PATH).toBe('/usr/bin');
    expect(env.EXPO_TOKEN).toBe('ok');
    expect(env.DATABASE_PASSWORD).toBeUndefined();
    expect(env.GITHUB_TOKEN).toBeUndefined();
  });

  it('sanitizeEnvForCommand differs per command (gradle vs expo)', () => {
    const expoEnv = sanitizeEnvForCommand('expo build', {
      PATH: '/usr/bin',
      JAVA_HOME: '/opt/java',
    });
    const gradleEnv = sanitizeEnvForCommand('gradle build', {
      PATH: '/usr/bin',
      JAVA_HOME: '/opt/java',
    });
    expect(expoEnv.JAVA_HOME).toBeUndefined();
    expect(gradleEnv.JAVA_HOME).toBe('/opt/java');
  });

  it('sanitizeEnvForCommand handles missing values gracefully', () => {
    const env = sanitizeEnvForCommand('metro bundle', {});
    expect(Object.keys(env)).toHaveLength(0);
  });

  it('runDryRunWorkflow includes all 6 canonical commands', async () => {
    const results = await runDryRunWorkflow();
    const commands = results.map((r) => r.command).sort();
    expect(commands).toEqual([
      'codegen run',
      'expo build',
      'gradle build',
      'metro bundle',
      'pod install',
      'react-native start',
    ]);
  });

  it('runWithInjectedSpawn preserves durationMs monotonicity', async () => {
    const r = await runWithInjectedSpawn(makeQuickSpawn('quick'));
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('sanitizeEnvForCommand secure-mode: no secrets pass through by accident', () => {
    const secrets = {
      AWS_SECRET_ACCESS_KEY: 'leak',
      NPM_TOKEN: 'leak',
      OPENAI_API_KEY: 'leak',
      STRIPE_SECRET_KEY: 'leak',
    };
    for (const cmd of ['expo build', 'metro bundle', 'codegen run', 'react-native start', 'pod install', 'gradle build'] as const) {
      const sanitized = sanitizeEnvForCommand(cmd, { PATH: '/usr/bin', ...secrets });
      for (const key of Object.keys(secrets)) {
        expect(sanitized[key], `${cmd} leaked ${key}`).toBeUndefined();
      }
    }
  });
});
