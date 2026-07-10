import { describe, expect, it, vi } from 'vitest';
import {
  cliForAxis,
  invokeMobileCli,
  type MobileCliCommand,
} from '@kiwa-lab/mobile';
import {
  listNonCliAxes,
  runAllCliStubs,
  runAxisBackedCliChain,
} from '../src/workflow.js';

/**
 * No child process may be spawned from this suite.
 *
 * `executeSpawn` builds the child's environment from the `env` the caller
 * passes, so an `env` without `PATH` leaves `execvp` searching a default path.
 * On macOS that default path holds `osascript` and `defaults`; the desktop twin
 * of this suite used to run both. The mobile CLIs are absent everywhere, which
 * only turned the same mistake into `ENOENT`.
 *
 * `KIWA_MOBILE_SPAWN=dry-run` returns the shape contract without a child. This
 * mock makes that the only path: drop `dry-run` from an `env` below and the
 * test fails naming the executable it tried to run.
 */
vi.mock('node:child_process', () => ({
  spawn: (executable: string) => {
    throw new Error(`this test suite spawns no child process (tried to spawn: ${executable})`);
  },
}));

const DRY_RUN_ENV = { KIWA_MOBILE_MODE: 'real', KIWA_MOBILE_SPAWN: 'dry-run' };
const MOCK_ENV = { KIWA_MOBILE_MODE: 'mock' };

/** What `invokeMobileCli` returns instead of spawning. */
const DRY_RUN_PREFIX = '[v0.6 dry-run] ';

describe('dogfood-mobile-real-cli-app — spawn workflow through the dry-run contract', () => {
  it('all 6 CLIs are invoked, and none of them spawns', async () => {
    const results = await runAllCliStubs(DRY_RUN_ENV);
    expect(results).toHaveLength(6);
    for (const r of results) {
      expect(r.invoked).toBe(true);
      expect(r.exitCode).toBe(0);
      expect(r.stdout.startsWith(DRY_RUN_PREFIX)).toBe(true);
    }
  });

  it('dry-run stdout names the command and the arguments it was given', async () => {
    const results = await runAllCliStubs(DRY_RUN_ENV);
    const byCommand = new Map(results.map((r) => [r.command, r.stdout]));
    expect(byCommand.get('expo build')).toBe('[v0.6 dry-run] expo build --target=expo');
    expect(byCommand.get('gradle build')).toBe('[v0.6 dry-run] gradle build --target=gradle');
    expect(byCommand.get('pod install')).toBe('[v0.6 dry-run] pod install --target=pod');
  });

  it('spawning is what happens without dry-run, and this suite refuses it', async () => {
    await expect(
      invokeMobileCli({ command: 'expo build', args: [], env: { KIWA_MOBILE_MODE: 'real' } }),
    ).rejects.toThrow(/spawns no child process \(tried to spawn: expo\)/);
  });

  it('all 6 CLIs fail-closed under mock env', async () => {
    await expect(runAllCliStubs(MOCK_ENV)).rejects.toThrow(/KIWA_MOBILE_MODE/);
  });

  it('CLI-backed axis chain returns 7 axis (react-native / expo / metro / fabric / turbo-modules / codegen / new-architecture)', async () => {
    const chain = await runAxisBackedCliChain(DRY_RUN_ENV);
    expect(chain).toHaveLength(7);
    for (const { cli, result } of chain) {
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

  it('durationMs is non-negative', async () => {
    const r = await invokeMobileCli({ command: 'metro bundle', args: [], env: DRY_RUN_ENV });
    expect(r.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('args are preserved', async () => {
    const r = await invokeMobileCli({
      command: 'gradle build',
      args: ['--info', '--stacktrace'],
      env: DRY_RUN_ENV,
    });
    expect(r.args).toEqual(['--info', '--stacktrace']);
  });

  it('6 CLI enumeration completeness', async () => {
    const results = await runAllCliStubs(DRY_RUN_ENV);
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
    const results = await runAllCliStubs(DRY_RUN_ENV);
    const stdouts = new Set(results.map((r) => r.stdout));
    expect(stdouts.size).toBe(6);
  });

  it('env-gate error message includes command name', async () => {
    await expect(
      invokeMobileCli({ command: 'expo build', args: [], env: {} }),
    ).rejects.toThrow(/invokeMobileCli\(expo build\)/);
  });

  it('args upper bound (32) enforced', async () => {
    const okArgs = new Array(32).fill('x');
    const r = await invokeMobileCli({ command: 'expo build', args: okArgs, env: DRY_RUN_ENV });
    expect(r.args).toHaveLength(32);

    const overArgs = new Array(33).fill('x');
    await expect(
      invokeMobileCli({ command: 'expo build', args: overArgs, env: DRY_RUN_ENV }),
    ).rejects.toThrow(/args exceeds max 32/);
  });
});
