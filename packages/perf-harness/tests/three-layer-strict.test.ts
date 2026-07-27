import { afterEach, describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import { runPerf3LayerStrict } from '../src/index.js';

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

  it('does not overwrite a baseline measured under a different premise', async () => {
    const tmpDir = tempDir();
    const baselinePath = join(tmpDir, 'baseline.json');
    const common = { fn: () => {}, serialP95CapMs: 1000 };
    const settings = { serialIterations: 30, concurrency: 3, memoryIterations: 30 };

    // GC を呼べる状態で baseline を作る。
    const gcStub = () => undefined;
    const originalGc = (globalThis as unknown as { gc?: () => void }).gc;
    (globalThis as unknown as { gc: () => void }).gc = gcStub;
    let seeded: string;
    try {
      await runPerf3LayerStrict({
        moduleName: 'premise',
        ops: [{ name: 'existing', ...common }],
        reportPath: join(tmpDir, 'r1.md'),
        baselinePath,
        ...settings,
      });
      seeded = readFileSync(baselinePath, 'utf8');
    } finally {
      if (originalGc === undefined) delete (globalThis as unknown as { gc?: () => void }).gc;
      else (globalThis as unknown as { gc: () => void }).gc = originalGc;
    }

    // GC 無しで測る。前提が違うので比較対象にできないが、この値で上書きすると
    // 次に正しい環境で測ったときも再 seed になり、その間の回帰を見逃す。
    await runPerf3LayerStrict({
      moduleName: 'premise',
      ops: [
        { name: 'existing', ...common },
        { name: 'added', ...common },
      ],
      reportPath: join(tmpDir, 'r2.md'),
      baselinePath,
      ...settings,
    });

    expect(readFileSync(baselinePath, 'utf8')).toBe(seeded);
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
      ...settings,
    });

    expect(slowed.outcomes[0]!.regressionVerdict).toBe('regressed');
    expect(slowed.outcomes[0]!.serialGatePassed).toBe(true);
    expect(slowed.allPassed).toBe(false);
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
