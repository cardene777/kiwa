import { describe, expect, it } from 'vitest';
import {
  cliForAxis,
  invokeMobileCli,
  type MobileCliCommand,
} from '@kiwa-test/mobile';
import {
  listNonCliAxes,
  runAllCliStubs,
  runAxisBackedCliChain,
} from '../src/workflow.js';

const REAL_ENV = { KIWA_MOBILE_MODE: 'real' };
const MOCK_ENV = { KIWA_MOBILE_MODE: 'mock' };

describe('Mobile v0.5 spawn workflow dogfood (v1.54-2、 depth-5 pattern 1 例目 candidate)', () => {
  it('all 6 CLI stubs invoked under real env', async () => {
    const results = await runAllCliStubs(REAL_ENV);
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.invoked).toBe(true);
      expect(r.exitCode).toBe(0);
      expect(r.stdout).toContain('v0.5 spawn stub');
    }
  });

  it('all 6 CLI stubs fail-closed under mock env', async () => {
    await expect(runAllCliStubs(MOCK_ENV)).rejects.toThrow(/KIWA_MOBILE_MODE/);
  });

  it('CLI-backed axis chain returns 7 axis (react-native / expo / metro / fabric / turbo-modules / codegen / new-architecture)', async () => {
    const chain = await runAxisBackedCliChain(REAL_ENV);
    expect(chain).toHaveLength(7);
    for (const { axis, cli, result } of chain) {
      expect(cli).not.toBeNull();
      expect(result).not.toBeNull();
      expect(result?.invoked).toBe(true);
    }
  });

  it('non-CLI-backed axis (navigation / reanimated / async-storage / secure-storage) return null CLI mapping', () => {
    const axes = listNonCliAxes();
    expect(axes).toEqual(['navigation', 'reanimated', 'async-storage', 'secure-storage']);
    for (const axis of axes) {
      expect(cliForAxis(axis)).toBeNull();
    }
  });

  it('spawn stub durationMs is non-negative', async () => {
    const r = await invokeMobileCli({
      command: 'metro bundle',
      args: [],
      env: REAL_ENV,
    });
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('spawn stub preserves args', async () => {
    const r = await invokeMobileCli({
      command: 'gradle build',
      args: ['--info', '--stacktrace'],
      env: REAL_ENV,
    });
    expect(r.args).toEqual(['--info', '--stacktrace']);
  });

  it('6 CLI enumeration completeness', async () => {
    const results = await runAllCliStubs(REAL_ENV);
    const commands = results.map((r) => r.command).sort();
    const expected: MobileCliCommand[] = [
      'codegen run',
      'expo build',
      'gradle build',
      'metro bundle',
      'pod install',
      'react-native start',
    ];
    expect(commands).toEqual(expected);
  });

  it('unique stdout per command', async () => {
    const results = await runAllCliStubs(REAL_ENV);
    const stdouts = new Set(results.map((r) => r.stdout));
    expect(stdouts.size).toBe(6);
  });

  it('env-gate error message includes command name', async () => {
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: [],
        env: {},
      }),
    ).rejects.toThrow(/invokeMobileCli\(expo build\)/);
  });

  it('args upper bound (32) enforced', async () => {
    const okArgs = new Array(32).fill('x');
    const r = await invokeMobileCli({
      command: 'expo build',
      args: okArgs,
      env: REAL_ENV,
    });
    expect(r.args).toHaveLength(32);

    const overArgs = new Array(33).fill('x');
    await expect(
      invokeMobileCli({
        command: 'expo build',
        args: overArgs,
        env: REAL_ENV,
      }),
    ).rejects.toThrow(/args exceeds max 32/);
  });
});
