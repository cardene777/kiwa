import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { planRunWatch, runWatch, RUN_WATCH_LAYER_DIRS } from '../src/commands/run-watch.js';

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
});
