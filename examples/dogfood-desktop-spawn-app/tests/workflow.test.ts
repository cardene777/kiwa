import { describe, expect, it, vi } from 'vitest';
import { invokeDesktopCli } from '@kiwa-lab/desktop';
import {
  ALL_CLIS,
  CLI_BACKED_AXES,
  NON_CLI_AXES,
  listNonCliAxes,
  runAllCliStubs,
  runAxisBackedCliChain,
} from '../src/workflow.js';

/**
 * No child process may be spawned from this suite.
 *
 * `executeSpawn` builds the child's environment from the `env` the caller
 * passes. An `env` without `PATH` leaves `execvp` searching a default path, and
 * on macOS that path holds `osascript` and `defaults` — two of the eight
 * commands below. This suite used to run both, out of a unit test, with
 * whatever arguments `runAllCliStubs` happened to build.
 *
 * `KIWA_DESKTOP_SPAWN=dry-run` returns the shape contract without a child. This
 * mock makes that the only path: drop `dry-run` from an `env` below and the
 * test fails naming the executable it tried to run.
 */
vi.mock('node:child_process', () => ({
  spawn: (executable: string) => {
    throw new Error(`this test suite spawns no child process (tried to spawn: ${executable})`);
  },
}));

const DRY_RUN_ENV = { KIWA_DESKTOP_MODE: 'real', KIWA_DESKTOP_SPAWN: 'dry-run' };

/** What `invokeDesktopCli` returns instead of spawning. */
const DRY_RUN_PREFIX = '[v0.6 dry-run] ';

describe('dogfood-desktop-spawn-app — spawn workflow through the dry-run contract', () => {
  it('8 CLI-backed axes registered', () => {
    expect(CLI_BACKED_AXES).toHaveLength(8);
  });

  it('4 non-CLI axes registered', () => {
    expect(NON_CLI_AXES).toHaveLength(4);
    expect(NON_CLI_AXES).toEqual(['electron', 'tauri', 'webview', 'dark-mode']);
  });

  it('8 CLIs registered', () => {
    expect(ALL_CLIS).toHaveLength(8);
  });

  it('all 8 CLIs are invoked, and none of them spawns', async () => {
    const results = await runAllCliStubs(DRY_RUN_ENV);
    expect(results).toHaveLength(8);
    for (const r of results) {
      expect(r.invoked).toBe(true);
      expect(r.exitCode).toBe(0);
      expect(r.stdout.startsWith(DRY_RUN_PREFIX)).toBe(true);
      expect(r.durationMs).toBeGreaterThanOrEqual(0);
    }
  });

  it('dry-run stdout names the command and the arguments it was given', async () => {
    const results = await runAllCliStubs(DRY_RUN_ENV);
    const byCommand = new Map(results.map((r) => [r.command, r.stdout]));
    expect(byCommand.get('electron-builder')).toBe('[v0.6 dry-run] electron-builder --target=electron');
    expect(byCommand.get('osascript')).toBe('[v0.6 dry-run] osascript --target=osascript');
    expect(byCommand.get('notify-send')).toBe('[v0.6 dry-run] notify-send --target=notify');
  });

  it('osascript exists on every Mac, and this suite still refuses to run it', async () => {
    await expect(
      invokeDesktopCli({ command: 'osascript', args: [], env: { KIWA_DESKTOP_MODE: 'real' } }),
    ).rejects.toThrow(/spawns no child process \(tried to spawn: osascript\)/);
  });

  it('runAllCliStubs throws when KIWA_DESKTOP_MODE is unset', async () => {
    await expect(runAllCliStubs({})).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('runAllCliStubs throws when KIWA_DESKTOP_MODE=mock (fail-closed)', async () => {
    await expect(runAllCliStubs({ KIWA_DESKTOP_MODE: 'mock' })).rejects.toThrow(/KIWA_DESKTOP_MODE/);
  });

  it('runAxisBackedCliChain emits 8 result (axis -> cli -> SpawnResult)', async () => {
    const chain = await runAxisBackedCliChain(DRY_RUN_ENV);
    expect(chain).toHaveLength(8);
    for (const step of chain) {
      expect(step.cli).not.toBeNull();
      expect(step.result).not.toBeNull();
      expect(step.result?.invoked).toBe(true);
    }
  });

  it('runAxisBackedCliChain covers exactly the CLI-backed axes', async () => {
    const chain = await runAxisBackedCliChain(DRY_RUN_ENV);
    const chainAxes = chain.map((s) => s.axis);
    expect(new Set(chainAxes)).toEqual(new Set(CLI_BACKED_AXES));
  });

  it('listNonCliAxes returns a copy the caller cannot use to mutate the source', () => {
    const first = listNonCliAxes();
    first.push('electron');
    expect(listNonCliAxes()).toHaveLength(4);
  });

  it('CLI_BACKED_AXES + NON_CLI_AXES cover 12 distinct axes', () => {
    const total = [...CLI_BACKED_AXES, ...NON_CLI_AXES];
    expect(total).toHaveLength(12);
    expect(new Set(total).size).toBe(12);
  });

  it('a SpawnResult holds its own copy of the args it was given', async () => {
    const args = ['--one', '--two'];
    const r = await invokeDesktopCli({ command: 'ffmpeg', args, env: DRY_RUN_ENV });
    expect(r.args).toEqual(args);
    expect(r.args).not.toBe(args);

    r.args.push('--three');
    expect(args).toEqual(['--one', '--two']);
  });

  it('args upper bound (32) enforced', async () => {
    const okArgs = new Array(32).fill('x');
    const r = await invokeDesktopCli({ command: 'ffmpeg', args: okArgs, env: DRY_RUN_ENV });
    expect(r.args).toHaveLength(32);

    const overArgs = new Array(33).fill('x');
    await expect(
      invokeDesktopCli({ command: 'ffmpeg', args: overArgs, env: DRY_RUN_ENV }),
    ).rejects.toThrow(/args exceeds max 32/);
  });
});
