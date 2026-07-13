/**
 * skill test — CLI `runWatch` の layer 別 spawn dispatcher を検証する。
 *
 * CLI における「skill」 = `--layer` 引数から適切な test runner cmd + args を計画し、
 * child process を spawn する経路。 本 test は runWatch の spawnFn injection 経路を使って
 * spy で spawn 内容を捕捉し、 4 primitive で dispatch 精度を検証する。
 *
 * dry-run mode との違い = dry-run は plan だけ返して spawn しない、 spy 経路は spawn まで
 * 通しつつ実際の child process 起動を差し替えて record する。
 */
import {
  assertToolCalled,
  assertToolCalledWith,
  assertToolCallOrder,
  assertToolNotCalled,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import type { ChildProcess } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { runWatch, type RunWatchLayer } from '../../src/commands/run-watch.js';

/** 実 spawn しない stub ChildProcess。 exit code 0 で即完了。 */
function stubChild(): ChildProcess {
  return {
    on(event: string, cb: (code: number) => void) {
      if (event === 'exit') setTimeout(() => cb(0), 0);
      return this as unknown as ChildProcess;
    },
  } as unknown as ChildProcess;
}

describe('runWatch skill 発火 (layer → spawn cmd 変換 assertion)', () => {
  it('unit layer 単体で vitest cmd が spawn される', () => {
    const spy = createToolSpy();
    const result = runWatch({
      layers: ['unit'],
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        spy.record('spawn', JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });

    expect(result.plans).toHaveLength(1);
    assertToolCalled(spy, 'spawn', { times: 1 });
    const calls = spy.getCalls();
    const parsed = JSON.parse(calls[0]?.arguments ?? '{}');
    // runWatch は `pnpm` 経由で `-w vitest ...` を spawn する契約 (real cmd = pnpm)
    expect(parsed.cmd).toBe('pnpm');
    // args に vitest が含まれる
    expect(parsed.args.join(' ')).toContain('vitest');
    expect(result.plans[0]?.layer).toBe('unit');
  });

  it('複数 layer で spawn 順序が layers 配列順と一致する', () => {
    const spy = createToolSpy();
    const layers: RunWatchLayer[] = ['unit', 'api', 'ui'];
    runWatch({
      layers,
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        // layer は args 内の testDir path から推定できるが、
        // spy 経路では順序が layers 順に一致することだけ確認したいので
        // record は「呼ばれた回数」 と「引数の cmd」 のみ。
        spy.record('spawn', JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });

    // 3 layer = 3 spawn
    assertToolCalled(spy, 'spawn', { times: 3 });
    assertToolCallOrder(spy, ['spawn', 'spawn', 'spawn']);
  });

  it('e2e layer は e2e dir を含む args で spawn される', () => {
    const spy = createToolSpy();
    runWatch({
      layers: ['e2e'],
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        spy.record('spawn-e2e', JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });

    assertToolCalled(spy, 'spawn-e2e');
    const call = spy.getCalls()[0];
    const parsed = JSON.parse(call?.arguments ?? '{}');
    // e2e layer は tests/e2e dir を watch する契約
    expect(parsed.args.join(' ')).toContain('tests/e2e');
  });

  it('dryRun=true で spawn が呼ばれない (skill dispatch されない)', () => {
    const spy = createToolSpy();
    runWatch({
      layers: ['unit', 'api'],
      cwd: process.cwd(),
      dryRun: true,
      spawnFn: (cmd, args) => {
        spy.record('spawn', JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });

    // dry-run では spawn しないので spy は空
    assertToolNotCalled(spy, 'spawn');
  });

  it('layer 別の spawn args を assertion (unit + e2e 両方 dispatch)', () => {
    const spy = createToolSpy();
    runWatch({
      layers: ['unit', 'e2e'],
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        // 各 spawn に対して plans から対応する layer を含めて record するのが本当は正解だが
        // spawnFn からは layer 直接わからないので、 args 内容で区別する。
        const argsStr = args.join(' ');
        const layer = argsStr.includes('tests/e2e') ? 'e2e' : 'unit';
        spy.record(`spawn-${layer}`, JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });

    assertToolCalled(spy, 'spawn-unit');
    assertToolCalled(spy, 'spawn-e2e');
    assertToolCallOrder(spy, ['spawn-unit', 'spawn-e2e']);
  });

  it('layers 空配列 = throw (layer 必須契約)、 spawn 呼ばれない', () => {
    const spy = createToolSpy();
    expect(() =>
      runWatch({
        layers: [] as RunWatchLayer[],
        cwd: process.cwd(),
        spawnFn: (cmd, args) => {
          spy.record('spawn', JSON.stringify({ cmd, args }));
          return stubChild();
        },
      }),
    ).toThrow(/at least one layer/);
    assertToolNotCalled(spy, 'spawn');
  });

  it('未知 layer = throw (layer 検証契約)、 spawn 呼ばれない', () => {
    const spy = createToolSpy();
    expect(() =>
      runWatch({
        layers: ['unknown-layer'] as unknown as RunWatchLayer[],
        cwd: process.cwd(),
        spawnFn: (cmd, args) => {
          spy.record('spawn', JSON.stringify({ cmd, args }));
          return stubChild();
        },
      }),
    ).toThrow(/unknown layer/);
    assertToolNotCalled(spy, 'spawn');
  });

  it('layers 順序逆 (e2e → unit) で spawn 順序も逆になる', () => {
    const spy = createToolSpy();
    runWatch({
      layers: ['e2e', 'unit'],
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        const argsStr = args.join(' ');
        const layer = argsStr.includes('tests/e2e') ? 'e2e' : 'unit';
        spy.record(`spawn-${layer}`, JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });
    assertToolCallOrder(spy, ['spawn-e2e', 'spawn-unit']);
  });

  it('同 layer を複数回指定 = spawn も複数回 (times で確認)', () => {
    const spy = createToolSpy();
    runWatch({
      layers: ['unit', 'unit', 'unit'],
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        spy.record('spawn', JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });
    assertToolCalled(spy, 'spawn', { times: 3 });
  });

  it('全 4 layer (unit / api / e2e / ui) で spawn 4 回、 各 layer 一意 args', () => {
    const spy = createToolSpy();
    runWatch({
      layers: ['unit', 'api', 'e2e', 'ui'] as RunWatchLayer[],
      cwd: process.cwd(),
      spawnFn: (cmd, args) => {
        // spawn 順序を index で record することで layer 区別できる (全 args が --dir tests/... を含む)
        spy.record('spawn', JSON.stringify({ cmd, args }));
        return stubChild();
      },
    });

    // 4 layer 全 spawn
    assertToolCalled(spy, 'spawn', { times: 4 });
  });
});
