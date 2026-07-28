import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { pruneStaleOps, runPerf3LayerStrict } from '../src/index.js';

describe('runPerf3LayerStrict — v0.3 strict variant', () => {
  // 固定 directory を共有すると、各 case 末尾の削除が別 case の書込みと重なり、
  // 途中状態の baseline を読んで "Unexpected end of JSON input" で落ちる。
  // case ごとに独立した directory を作る。
  const created: string[] = [];

  function tempDir(): string {
    const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-strict-'));
    created.push(dir);
    return dir;
  }

  afterEach(() => {
    while (created.length > 0) {
      const dir = created.pop();
      if (dir) rmSync(dir, { recursive: true, force: true });
    }
  });

  it('applies strict defaults (iter 400 + concurrency 20 + memory 400)', async () => {
    const tmpDir = tempDir();
    const result = await runPerf3LayerStrict({
      moduleName: 'strict-test',
      ops: [
        {
          name: 'noop',
          fn: () => {},
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(tmpDir, 'report.md'),
      baselinePath: join(tmpDir, 'baseline.json'),
    });
    expect(result.outcomes).toHaveLength(1);
    const outcome = result.outcomes[0]!;
    expect(outcome.serial.iterations).toBe(400);
    expect(outcome.concurrent.iterations).toBe(2000); // concurrency 20 × iter 100
    expect(outcome.memory.iterationCount).toBe(400);
  });

  it('accepts explicit overrides', async () => {
    const tmpDir = tempDir();
    const result = await runPerf3LayerStrict({
      moduleName: 'strict-test-override',
      ops: [
        {
          name: 'noop',
          fn: () => {},
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(tmpDir, 'report.md'),
      baselinePath: join(tmpDir, 'baseline.json'),
      serialIterations: 50,
      concurrency: 5,
      memoryIterations: 100,
    });
    expect(result.outcomes[0]!.serial.iterations).toBe(50);
    expect(result.outcomes[0]!.memory.iterationCount).toBe(100);
  });

  it('seeds newly added ops into an existing baseline', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const common = { fn: () => {}, serialP95CapMs: 1000 };
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    // 1 回目: op が 1 つだけの状態で baseline を作る。
    await runPerf3LayerStrict({
      moduleName: 'seed-new-ops',
      ops: [{ name: 'existing', ...common }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    // 2 回目: op を増やす。baseline file は既にあるため従来は seed されず、
    // 追加した op が永久に「基準値なし」のまま回帰判定できなかった。
    const second = await runPerf3LayerStrict({
      moduleName: 'seed-new-ops',
      ops: [
        { name: 'existing', ...common },
        { name: 'added', ...common },
      ],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });
    expect(second.outcomes.find((o) => o.name === 'added')?.regressionVerdict).toBe(
      'n/a (baseline seeded)',
    );

    // 3 回目: 追加した op にも判定が付く。
    const third = await runPerf3LayerStrict({
      moduleName: 'seed-new-ops',
      ops: [
        { name: 'existing', ...common },
        { name: 'added', ...common },
      ],
      reportPath: join(tmpDir, 'r3.md'),
      baselinePath,
      ...settings,
    });
    expect(third.outcomes.find((o) => o.name === 'added')?.regressionVerdict).not.toBe(
      'n/a (baseline seeded)',
    );
    expect(third.outcomes.find((o) => o.name === 'existing')?.regressionVerdict).not.toBe(
      'n/a (baseline seeded)',
    );
  });

  it('keeps the existing op untouched while seeding a new one', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const common = { fn: () => {}, serialP95CapMs: 1000 };
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    await runPerf3LayerStrict({
      moduleName: 'keep-existing',
      ops: [{ name: 'existing', ...common }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });
    const seeded = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, { samples: number[] }>;
    };

    await runPerf3LayerStrict({
      moduleName: 'keep-existing',
      ops: [
        { name: 'existing', ...common },
        { name: 'added', ...common },
      ],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });
    const merged = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, { samples: number[] }>;
    };

    // 既存 op を上書きすると比較対象が毎回入れ替わり、回帰を検出できなくなる。
    expect(merged.results['existing.serial']).toEqual(seeded.results['existing.serial']);
    expect(merged.results['existing.concurrent']).toEqual(seeded.results['existing.concurrent']);
    expect(merged.results['added.serial']).toBeDefined();
  });

  it('fails the memory gate when GC is required but unavailable', async () => {
    const tmpDir = tempDir();
    // GC を呼べない測定は解放される一時使用まで拾うため、上限との比較が成立しない。
    // 既定で失敗にすると GC 無しで動いていた既存の呼出が一斉に落ちるので opt-in。
    const originalGc = (globalThis as unknown as { gc?: () => void }).gc;
    delete (globalThis as unknown as { gc?: () => void }).gc;
    try {
      const base = {
        moduleName: 'gc-missing',
        ops: [{ name: 'noop', fn: () => {}, serialP95CapMs: 1000 }],
        baselinePath: join(tmpDir, 'baseline.json'),
        serialIterations: 30,
        concurrency: 3,
        memoryIterations: 30,
      };

      const lenient = await runPerf3LayerStrict({
        ...base,
        reportPath: join(tmpDir, 'lenient.md'),
      });
      expect(lenient.outcomes[0]!.memoryGatePassed).toBe(true);

      const strict = await runPerf3LayerStrict({
        ...base,
        reportPath: join(tmpDir, 'strict.md'),
        requireGc: true,
      });
      expect(strict.outcomes[0]!.memoryGatePassed).toBe(false);
      expect(strict.allPassed).toBe(false);
      expect(readFileSync(join(tmpDir, 'strict.md'), 'utf8')).toContain('| no |');
    } finally {
      if (originalGc !== undefined) {
        (globalThis as unknown as { gc: () => void }).gc = originalGc;
      }
    }
  });

  it('does not overwrite a baseline from a measurement that is not valid', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const common = { fn: () => {}, serialP95CapMs: 1000 };
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    // GC を呼べる状態で baseline を作る。
    const originalGc = (globalThis as unknown as { gc?: () => void }).gc;
    (globalThis as unknown as { gc: () => void }).gc = () => undefined;
    let seeded: string;
    try {
      await runPerf3LayerStrict({
        moduleName: 'premise',
        ops: [{ name: 'existing', ...common }],
        reportPath: join(tmpDir, 'r1.md'),
        baselinePath,
        requireGc: true,
        ...settings,
      });
      seeded = readFileSync(baselinePath, 'utf8');
    } finally {
      if (originalGc === undefined) delete (globalThis as unknown as { gc?: () => void }).gc;
      else (globalThis as unknown as { gc: () => void }).gc = originalGc;
    }

    // GC を要求しているのに使えない実行は測定自体が成立しない。
    // この値で作り直すと、成立しない前提を新しい正としてしまう。
    const invalid = await runPerf3LayerStrict({
      moduleName: 'premise',
      ops: [
        { name: 'existing', ...common },
        { name: 'added', ...common },
      ],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      requireGc: true,
      ...settings,
    });

    expect(invalid.baselineSeeded).toBe(false);
    expect(readFileSync(baselinePath, 'utf8')).toBe(seeded);
  });

  it('reseeds under a new premise so comparison recovers', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const common = { fn: () => {}, serialP95CapMs: 1000 };
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    // GC を呼べる状態で baseline を作る。
    const originalGc = (globalThis as unknown as { gc?: () => void }).gc;
    (globalThis as unknown as { gc: () => void }).gc = () => undefined;
    try {
      await runPerf3LayerStrict({
        moduleName: 'reseed',
        ops: [{ name: 'op', ...common }],
        reportPath: join(tmpDir, 'r1.md'),
        baselinePath,
        ...settings,
      });
    } finally {
      if (originalGc === undefined) delete (globalThis as unknown as { gc?: () => void }).gc;
      else (globalThis as unknown as { gc: () => void }).gc = originalGc;
    }

    // 前提が変わった状態で測る。保存しないままだと手動削除まで永久に
    // 比較できないので、測定が成立している実行なら作り直す。
    const reseeded = await runPerf3LayerStrict({
      moduleName: 'reseed',
      ops: [{ name: 'op', ...common }],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });
    expect(reseeded.baselineSeeded).toBe(true);
    expect(reseeded.outcomes[0]!.regressionVerdict).toBe('n/a (baseline seeded)');

    // 作り直した前提の下では次回から比較が働く。
    const compared = await runPerf3LayerStrict({
      moduleName: 'reseed',
      ops: [{ name: 'op', ...common }],
      reportPath: join(tmpDir, 'r3.md'),
      baselinePath,
      ...settings,
    });
    expect(compared.baselineSeeded).toBe(false);
    expect(compared.outcomes[0]!.regressionVerdict).not.toBe('n/a (baseline seeded)');
  });

  it('links to the threshold SSOT from nested report paths', async () => {
    const tmpDir = tempDir();
    const nested = join(tmpDir, 'docs', 'quality-reports', 'perf', 'saas');
    mkdirSync(nested, { recursive: true });

    await runPerf3LayerStrict({
      moduleName: 'nested-link',
      ops: [{ name: 'noop', fn: () => {}, serialP95CapMs: 1000 }],
      reportPath: join(nested, 'report.md'),
      baselinePath: join(tmpDir, 'baseline.json'),
      serialIterations: 30,
      concurrency: 3,
      memoryIterations: 30,
    });

    // 固定の相対 path だと 1 階層深いだけでリンクが外れる。
    const body = readFileSync(join(nested, 'report.md'), 'utf8');
    expect(body).toContain('../../../quality/perf-thresholds');
  });

  it('fails the gate when a significant regression is detected', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    // 1 回目は速い実装で baseline を作る。
    await runPerf3LayerStrict({
      moduleName: 'regression-gate',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000 }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    // 2 回目は明確に遅くする。cap には収まるが 20% を大きく超える悪化なので
    // gate は落ちる (docs/quality/perf-thresholds.md § Regression detection defaults)。
    const slowed = await runPerf3LayerStrict({
      moduleName: 'regression-gate',
      ops: [
        {
          name: 'op',
          fn: () => {
            const until = performance.now() + 1;
            while (performance.now() < until) {
              /* burn */
            }
          },
          serialP95CapMs: 10_000,
        },
      ],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      // 回帰判定を gate に載せるかは呼出側が決める (#1708 で既定を false にした)。
      regressionGate: true,
      ...settings,
    });

    expect(slowed.outcomes[0]!.regressionVerdict).toBe('regressed');
    expect(slowed.outcomes[0]!.serialGatePassed).toBe(true);
    expect(slowed.allPassed).toBe(false);

    // 感度の補足は「まだ検知に至っていない」 行の説明なので、検知できた行には
    // 付けない。付けると report 上で「regressed」 と「検知には … が必要」 が
    // 同じ行に並び、判定と矛盾して読める (#1708)。
    expect(slowed.outcomes[0]!.regressionNote).toBeUndefined();
    const report = readFileSync(join(tmpDir, 'r2.md'), 'utf8');
    expect(report).toMatch(/\| regressed \|/);
    expect(report).not.toMatch(/検知には/);
  });

  it('回帰判定は既定では gate に載らない (#1708)', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'default.json');
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    await runPerf3LayerStrict({
      moduleName: 'regression-default',
      ops: [{ name: 'op', fn: () => {}, serialP95CapMs: 10_000 }],
      reportPath: join(tmpDir, 'd1.md'),
      baselinePath,
      ...settings,
    });
    const slowed = await runPerf3LayerStrict({
      moduleName: 'regression-default',
      ops: [
        {
          name: 'op',
          fn: () => {
            const until = performance.now() + 1;
            while (performance.now() < until) {
              /* burn */
            }
          },
          serialP95CapMs: 10_000,
        },
      ],
      reportPath: join(tmpDir, 'd2.md'),
      baselinePath,
      ...settings,
    });

    // 判定と根拠は残す。gate に載せるかどうかだけを呼出側が決める。
    expect(slowed.outcomes[0]!.regressionVerdict, '判定は出す').toBe('regressed');
    expect(slowed.allPassed, '既定では gate を落とさない').toBe(true);
    expect(readFileSync(join(tmpDir, 'd2.md'), 'utf8')).toMatch(/\| regressed \|/);
  });

  it('理由を書いた op だけ回帰判定を gate から外す (#1708)', async () => {
    const tmpDir = tempDir();
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };
    const fast = { name: 'op', fn: () => {}, serialP95CapMs: 10_000 };
    const slow = {
      name: 'op',
      fn: () => {
        const until = performance.now() + 1;
        while (performance.now() < until) {
          /* burn */
        }
      },
      serialP95CapMs: 10_000,
    };

    // gate 対象のまま = 従来どおり落ちる。
    const gatedBaseline = join(tmpDir, 'gated.json');
    await runPerf3LayerStrict({
      moduleName: 'regression-waiver-off',
      ops: [fast],
      reportPath: join(tmpDir, 'g1.md'),
      baselinePath: gatedBaseline,
      ...settings,
    });
    const gated = await runPerf3LayerStrict({
      moduleName: 'regression-waiver-off',
      ops: [slow],
      reportPath: join(tmpDir, 'g2.md'),
      baselinePath: gatedBaseline,
      regressionGate: true,
      ...settings,
    });
    expect(gated.allPassed).toBe(false);

    // 理由つきで外すと gate は落ちないが、判定そのものは残る。
    const waivedBaseline = join(tmpDir, 'waived.json');
    await runPerf3LayerStrict({
      moduleName: 'regression-waiver-on',
      ops: [{ ...fast, regressionGateWaived: '実行ごとの振れ幅が閾値を超える' }],
      reportPath: join(tmpDir, 'w1.md'),
      baselinePath: waivedBaseline,
      regressionGate: true,
      ...settings,
    });
    const waived = await runPerf3LayerStrict({
      moduleName: 'regression-waiver-on',
      ops: [{ ...slow, regressionGateWaived: '実行ごとの振れ幅が閾値を超える' }],
      reportPath: join(tmpDir, 'w2.md'),
      baselinePath: waivedBaseline,
      regressionGate: true,
      ...settings,
    });
    expect(waived.outcomes[0]!.regressionVerdict, '判定は残す').toBe('regressed');
    expect(waived.allPassed, 'gate は落ちない').toBe(true);

    const report = readFileSync(join(tmpDir, 'w2.md'), 'utf8');
    expect(report).toMatch(/regressed — gate 対象外 \(実行ごとの振れ幅が閾値を超える\)/);
  });

  it('回帰の除外は上限の判定には効かない (#1708)', async () => {
    const tmpDir = tempDir();
    // 上限は 1 回の実行の中で完結する判定なので、実行間の振れ幅とは無関係。
    const result = await runPerf3LayerStrict({
      moduleName: 'regression-waiver-cap',
      ops: [
        {
          name: 'over-cap',
          fn: () => {
            const until = performance.now() + 2;
            while (performance.now() < until) {
              /* burn */
            }
          },
          serialP95CapMs: 0.1,
          regressionGateWaived: '実行ごとの振れ幅が閾値を超える',
        },
      ],
      reportPath: join(tmpDir, 'cap.md'),
      baselinePath: join(tmpDir, 'cap.json'),
      serialIterations: 10,
      concurrency: 2,
      memoryIterations: 10,
    });

    expect(result.outcomes[0]!.serialGatePassed).toBe(false);
    expect(result.allPassed).toBe(false);
  });

  it('理由を書いた op だけ memory 軸の判定を外す (#1708)', async () => {
    const tmpDir = tempDir();
    const settings = { serialIterations: 10, concurrency: 2, memoryIterations: 20 };
    // 反復ごとに Buffer を保持する。arrayBuffers の増分が上限を超える。
    const retained: Buffer[] = [];
    const leaky = {
      fn: () => {
        retained.push(Buffer.alloc(20 * 1024));
      },
      serialP95CapMs: 10_000,
    };

    const gated = await runPerf3LayerStrict({
      moduleName: 'memory-waiver-off',
      ops: [{ name: 'leak', ...leaky }],
      reportPath: join(tmpDir, 'gated.md'),
      baselinePath: join(tmpDir, 'gated.json'),
      ...settings,
    });
    expect(gated.outcomes[0]!.memoryGatePassed, '既定では上限で落ちる').toBe(false);
    expect(readFileSync(join(tmpDir, 'gated.md'), 'utf8')).toMatch(/\| FAIL \|/);

    const waived = await runPerf3LayerStrict({
      moduleName: 'memory-waiver-on',
      ops: [{ name: 'leak', ...leaky, memoryGateWaived: '測れていない理由' }],
      reportPath: join(tmpDir, 'waived.md'),
      baselinePath: join(tmpDir, 'waived.json'),
      ...settings,
    });
    expect(waived.outcomes[0]!.memoryGatePassed, '理由を書けば gate は落ちない').toBe(true);

    // 上限を上げて通した状態と区別できるように、PASS ではなく理由つきで書く。
    const report = readFileSync(join(tmpDir, 'waived.md'), 'utf8');
    expect(report).toMatch(/WAIVED \(測れていない理由\)/);
    expect(report).not.toMatch(/\| PASS \|\n?$/);
  });

  it('空文字の理由では memory 軸を外さない (#1708)', async () => {
    const tmpDir = tempDir();
    const retained: Buffer[] = [];
    const result = await runPerf3LayerStrict({
      moduleName: 'memory-waiver-blank',
      ops: [
        {
          name: 'leak',
          fn: () => {
            retained.push(Buffer.alloc(20 * 1024));
          },
          serialP95CapMs: 10_000,
          // 理由を書かずに外せると、記録の無い除外が増える。
          memoryGateWaived: '   ',
        },
      ],
      reportPath: join(tmpDir, 'blank.md'),
      baselinePath: join(tmpDir, 'blank.json'),
      serialIterations: 10,
      concurrency: 2,
      memoryIterations: 20,
    });

    expect(result.outcomes[0]!.memoryGatePassed).toBe(false);
  });

  it('感度の補足は判定できない行にだけ付く (#1708)', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };
    const op = { name: 'tiny', fn: () => {}, serialP95CapMs: 10_000 };

    // 何もしない関数は p95 が下限 0.5ms を大きく下回る。
    await runPerf3LayerStrict({
      moduleName: 'floor-note',
      ops: [op],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });
    const second = await runPerf3LayerStrict({
      moduleName: 'floor-note',
      ops: [op],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });

    expect(second.outcomes[0]!.regressionVerdict).not.toBe('regressed');
    expect(second.outcomes[0]!.regressionNote).toMatch(/検知には \+0\.5ms/);
    expect(readFileSync(join(tmpDir, 'r2.md'), 'utf8')).toMatch(/検知には \+0\.5ms/);
  });

  it('drops ops that are no longer measured only when pruning is requested', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const common = { fn: () => {}, serialP95CapMs: 1000 };
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    await runPerf3LayerStrict({
      moduleName: 'drop-stale',
      ops: [{ name: 'retired', ...common }],
      reportPath: join(tmpDir, 'r1.md'),
      baselinePath,
      ...settings,
    });

    // 既定では残す。絞り込み実行で op が一度欠けただけで過去値を失うと、
    // 次の完全実行で再 seed され、直前の退行を見逃す。
    await runPerf3LayerStrict({
      moduleName: 'drop-stale',
      ops: [{ name: 'current', ...common }],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });
    const kept = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, unknown>;
    };
    expect(kept.results['retired.serial']).toBeDefined();

    // suite 全体を回す呼出だけが掃除する。op 名を別処理へ付け替えたときに
    // 無関係な過去値と比較しないため。
    await runPerf3LayerStrict({
      moduleName: 'drop-stale',
      ops: [{ name: 'current', ...common }],
      reportPath: join(tmpDir, 'r3.md'),
      baselinePath,
      pruneStaleBaselineOps: true,
      ...settings,
    });
    const pruned = JSON.parse(readFileSync(baselinePath, 'utf8')) as {
      results: Record<string, unknown>;
    };
    expect(pruned.results['retired.serial']).toBeUndefined();
    expect(pruned.results['current.serial']).toBeDefined();
  });

  describe('pruneStaleOps — 掃除を有効にする経路 (#1708)', () => {
    const original = process.env['KIWA_PERF_PRUNE_STALE'];
    afterEach(() => {
      if (original === undefined) delete process.env['KIWA_PERF_PRUNE_STALE'];
      else process.env['KIWA_PERF_PRUNE_STALE'] = original;
    });

    it('呼出が明示していれば環境変数より優先する', () => {
      process.env['KIWA_PERF_PRUNE_STALE'] = '1';
      expect(pruneStaleOps({ pruneStaleBaselineOps: false })).toBe(false);

      delete process.env['KIWA_PERF_PRUNE_STALE'];
      expect(pruneStaleOps({ pruneStaleBaselineOps: true })).toBe(true);
    });

    it('suite 全体を回す経路が立てる環境変数で有効になる', () => {
      process.env['KIWA_PERF_PRUNE_STALE'] = '1';
      expect(pruneStaleOps({})).toBe(true);
    });

    it('絞り込み実行では有効にならない', () => {
      // 個別 package の実行や -t 付き実行では変数が立たない。
      delete process.env['KIWA_PERF_PRUNE_STALE'];
      expect(pruneStaleOps({})).toBe(false);

      // 1 以外の値を「有効」 と解釈すると、 無関係な値が掃除を起こす。
      process.env['KIWA_PERF_PRUNE_STALE'] = '0';
      expect(pruneStaleOps({})).toBe(false);
    });
  });

  it('strict + regression detection works together', async () => {
    const tmpDir = tempDir();
    // First run seeds baseline
    const first = await runPerf3LayerStrict({
      moduleName: 'strict-regression',
      ops: [
        {
          name: 'noop',
          fn: () => {},
          serialP95CapMs: 1000,
        },
      ],
      reportPath: join(tmpDir, 'r.md'),
      baselinePath: join(tmpDir, 'b.json'),
      serialIterations: 30,
      concurrency: 3,
      memoryIterations: 30,
    });
    expect(first.baselineSeeded).toBe(true);
  });
});
