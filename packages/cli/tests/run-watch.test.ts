import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { planRunWatch, runWatch, RUN_WATCH_LAYER_DIRS, type RunWatchLayer } from '../src/commands/run-watch.js';

const dirs: string[] = [];

afterEach(() => {
  while (dirs.length > 0) {
    const dir = dirs.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function mkPkg(): string {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-watch-'));
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: 'consumer', version: '0.0.0' }), 'utf8');
  dirs.push(dir);
  return dir;
}

describe('planRunWatch', () => {
  it('produces vitest watch command per layer', () => {
    const plans = planRunWatch(['unit', 'api']);
    expect(plans.length).toBe(2);
    expect(plans[0]?.cmd).toBe('pnpm');
    expect(plans[0]?.args).toEqual(['exec', 'vitest', '--watch', '--dir', RUN_WATCH_LAYER_DIRS.unit]);
    expect(plans[1]?.args.includes(RUN_WATCH_LAYER_DIRS.api)).toBe(true);
  });

  it('T-RW-001 empty layers - empty plans', () => {
    const plans = planRunWatch([]);
    expect(plans).toEqual([]);
  });

  it('T-RW-002 all 6 layers - unit / api / ui / data / cli / e2e', () => {
    const all: RunWatchLayer[] = ['unit', 'api', 'ui', 'data', 'cli', 'e2e'];
    const plans = planRunWatch(all);
    expect(plans.length).toBe(6);
    expect(plans.map((p) => p.layer)).toEqual(all);
  });

  it('T-RW-003 layer dir mapping - unit→tests/unit / api→tests/integration', () => {
    expect(RUN_WATCH_LAYER_DIRS.unit).toBe('tests/unit');
    expect(RUN_WATCH_LAYER_DIRS.api).toBe('tests/integration');
    expect(RUN_WATCH_LAYER_DIRS.ui).toBe('tests');
    expect(RUN_WATCH_LAYER_DIRS.data).toBe('tests');
    expect(RUN_WATCH_LAYER_DIRS.cli).toBe('tests');
    expect(RUN_WATCH_LAYER_DIRS.e2e).toBe('tests/e2e');
  });

  it('T-RW-004 plan structure - 各 plan に cmd "pnpm" / args 5要素', () => {
    const plans = planRunWatch(['unit']);
    expect(plans[0]?.cmd).toBe('pnpm');
    expect(plans[0]?.args.length).toBe(5);
    expect(plans[0]?.args[0]).toBe('exec');
    expect(plans[0]?.args[1]).toBe('vitest');
    expect(plans[0]?.args[2]).toBe('--watch');
    expect(plans[0]?.args[3]).toBe('--dir');
  });
});

describe('runWatch', () => {
  it('returns the planned commands in dry-run mode without spawning', () => {
    const dir = mkPkg();
    const result = runWatch({ layers: ['unit'], cwd: dir, dryRun: true });
    expect(result.children.length).toBe(0);
    expect(result.plans.length).toBe(1);
    expect(result.plans[0]?.layer).toBe('unit');
  });

  it('rejects unknown layers', () => {
    const dir = mkPkg();
    expect(() => runWatch({ layers: ['weird' as unknown as 'unit'], cwd: dir, dryRun: true })).toThrow(/unknown layer/);
  });

  it('requires package.json in cwd', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-watch-empty-'));
    dirs.push(dir);
    expect(() => runWatch({ layers: ['unit'], cwd: dir, dryRun: true })).toThrow(/no package.json/);
  });

  it('rejects empty layer list', () => {
    const dir = mkPkg();
    expect(() => runWatch({ layers: [], cwd: dir, dryRun: true })).toThrow(/at least one layer/);
  });

  it('invokes spawnFn for each layer when not dry-run', () => {
    const dir = mkPkg();
    const calls: Array<{ cmd: string; args: string[] }> = [];
    const fakeChild = {
      on: () => undefined,
    } as unknown as ReturnType<typeof runWatch>['children'][number];
    const result = runWatch({
      layers: ['unit', 'ui'],
      cwd: dir,
      spawnFn: (cmd, args) => {
        calls.push({ cmd, args });
        return fakeChild;
      },
    });
    expect(calls.length).toBe(2);
    expect(result.children.length).toBe(2);
    expect(calls[0]?.cmd).toBe('pnpm');
  });

  it('T-RW-005 error message - "kiwa run --watch:" prefix', () => {
    const dir = mkPkg();
    expect(() => runWatch({ layers: [], cwd: dir, dryRun: true })).toThrow(/kiwa run --watch:/);
  });

  it('T-RW-006 unknown layer error message contains layer name', () => {
    const dir = mkPkg();
    expect(() => runWatch({ layers: ['xxx' as unknown as 'unit'], cwd: dir, dryRun: true })).toThrow(/xxx/);
  });

  it('T-RW-007 no package.json error message contains cwd', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-watch-no-pkg-'));
    dirs.push(dir);
    expect(() => runWatch({ layers: ['unit'], cwd: dir, dryRun: true })).toThrow(new RegExp(dir.replace(/\//g, '\\/')));
  });

  it('T-RW-008 spawnFn opts.env contains KIWA_WATCH_LAYER', () => {
    const dir = mkPkg();
    const envs: Array<NodeJS.ProcessEnv> = [];
    const fakeChild = {
      on: () => undefined,
    } as unknown as ReturnType<typeof runWatch>['children'][number];
    runWatch({
      layers: ['unit', 'cli'],
      cwd: dir,
      spawnFn: (_cmd, _args, spawnOpts) => {
        envs.push(spawnOpts.env);
        return fakeChild;
      },
    });
    expect(envs[0]?.KIWA_WATCH_LAYER).toBe('unit');
    expect(envs[1]?.KIWA_WATCH_LAYER).toBe('cli');
  });

  it('T-RW-009 spawnFn opts.stdio = "inherit"', () => {
    const dir = mkPkg();
    let stdio: string | undefined;
    const fakeChild = { on: () => undefined } as unknown as ReturnType<typeof runWatch>['children'][number];
    runWatch({
      layers: ['unit'],
      cwd: dir,
      spawnFn: (_cmd, _args, spawnOpts) => {
        stdio = spawnOpts.stdio;
        return fakeChild;
      },
    });
    expect(stdio).toBe('inherit');
  });

  it('T-RW-010 spawnFn opts.cwd matches input cwd', () => {
    const dir = mkPkg();
    let observedCwd: string | undefined;
    const fakeChild = { on: () => undefined } as unknown as ReturnType<typeof runWatch>['children'][number];
    runWatch({
      layers: ['unit'],
      cwd: dir,
      spawnFn: (_cmd, _args, spawnOpts) => {
        observedCwd = spawnOpts.cwd;
        return fakeChild;
      },
    });
    expect(observedCwd).toBe(dir);
  });

  it('T-RW-011 dry-run preserves layer order', () => {
    const dir = mkPkg();
    const result = runWatch({ layers: ['e2e', 'unit', 'cli'], cwd: dir, dryRun: true });
    expect(result.plans.map((p) => p.layer)).toEqual(['e2e', 'unit', 'cli']);
  });

  it('T-RW-012 dry-run returns empty children even with multiple layers', () => {
    const dir = mkPkg();
    const result = runWatch({ layers: ['unit', 'ui', 'data'], cwd: dir, dryRun: true });
    expect(result.children.length).toBe(0);
    expect(result.plans.length).toBe(3);
  });

  it('T-RW-013 dry-run validates layers before package.json check', () => {
    const dir = mkPkg();
    expect(() => runWatch({ layers: ['unknown' as unknown as 'unit'], cwd: dir, dryRun: true })).toThrow(/unknown layer/);
  });

  it('T-RW-014 validates package.json after layer validation passes', () => {
    const dir = mkdtempSync(join(tmpdir(), 'kiwa-watch-x-'));
    dirs.push(dir);
    expect(() => runWatch({ layers: ['unit'], cwd: dir, dryRun: true })).toThrow(/no package.json/);
  });

  it('T-RW-015 spawnFn called with same cmd "pnpm" for all layers', () => {
    const dir = mkPkg();
    const cmds: string[] = [];
    const fakeChild = { on: () => undefined } as unknown as ReturnType<typeof runWatch>['children'][number];
    runWatch({
      layers: ['unit', 'api', 'ui', 'data', 'cli', 'e2e'],
      cwd: dir,
      spawnFn: (cmd, _args, _spawnOpts) => {
        cmds.push(cmd);
        return fakeChild;
      },
    });
    expect(cmds).toEqual(['pnpm', 'pnpm', 'pnpm', 'pnpm', 'pnpm', 'pnpm']);
  });
});
