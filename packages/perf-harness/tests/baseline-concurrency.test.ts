import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import { join } from 'node:path';
import {
  BASELINE_SCHEMA,
  BaselineRevisionConflictError,
  buildMeasureResult,
  captureEnv,
  loadBaseline,
  loadBaselineSnapshot,
  runPerf3Layer,
  saveBaselineEnvelope,
} from '../src/index.js';
import { runPerf3LayerLive } from '../src/live.js';
import type { MeasureResult } from '../src/types.js';

/**
 * #1757 — 重なった実行が baseline の更新を互いに消す問題。
 *
 * 読んだ時点の snapshot から、 測定が終わってから全体を書き戻していた。 読んでから書くまでの
 * 間に別の実行が書いても検知できず、 後から書いた側が先の更新を消していた。 保存が一時 file
 * 経由の置換なので壊れた JSON にはならないが、 記録は失われる。
 */

const created: string[] = [];

function tempDir(): string {
  const dir = mkdtempSync(join(os.tmpdir(), 'perf-harness-conc-'));
  created.push(dir);
  return dir;
}

afterEach(() => {
  while (created.length > 0) {
    const dir = created.pop();
    if (dir) rmSync(dir, { recursive: true, force: true });
  }
});

function envelope(keys: string[]) {
  const results: Record<string, MeasureResult> = {};
  for (const key of keys) results[key] = buildMeasureResult(key, 4, 0, [1, 1, 1, 1]);
  return { schema: BASELINE_SCHEMA as 2, env: captureEnv(), results };
}

function keysOf(path: string): string[] {
  return Object.keys(JSON.parse(readFileSync(path, 'utf8')).results).sort();
}

describe('saveBaselineEnvelope — 読んだ後の書き換えを検知する (#1757)', () => {
  it('版が一致すれば書ける', async () => {
    const dir = tempDir();
    const path = join(dir, 'b.json');
    await saveBaselineEnvelope(path, envelope(['alpha.serial']));

    const loaded = (await loadBaseline(path))!;
    expect(loaded.revision).toMatch(/^[0-9a-f]{64}$/);

    await saveBaselineEnvelope(path, envelope(['alpha.serial', 'beta.serial']), {
      expectedRevision: loaded.revision,
    });
    expect(keysOf(path)).toEqual(['alpha.serial', 'beta.serial']);
  });

  it('読んだ後に書き換わっていれば 1 byte も書かない', async () => {
    const dir = tempDir();
    const path = join(dir, 'b.json');
    await saveBaselineEnvelope(path, envelope(['alpha.serial']));
    const loaded = (await loadBaseline(path))!;

    // 別の実行が先に beta を足す。
    await saveBaselineEnvelope(path, envelope(['alpha.serial', 'beta.serial']));

    // 古い版を持ったまま書こうとすると弾かれる。
    await expect(
      saveBaselineEnvelope(path, envelope(['alpha.serial', 'gamma.serial']), {
        expectedRevision: loaded.revision,
      }),
    ).rejects.toThrow(BaselineRevisionConflictError);

    // 先に書いた側の記録が残る。
    expect(keysOf(path)).toEqual(['alpha.serial', 'beta.serial']);
  });

  it('baseline が無い前提で読んだのに誰かが作っていたら書かない', async () => {
    const dir = tempDir();
    const path = join(dir, 'b.json');
    // 読んだ時点では無い。
    expect(await loadBaseline(path)).toBeNull();
    // 別の実行が作る。
    await saveBaselineEnvelope(path, envelope(['alpha.serial']));

    await expect(
      saveBaselineEnvelope(path, envelope(['beta.serial']), { expectedRevision: null }),
    ).rejects.toThrow(BaselineRevisionConflictError);
    expect(keysOf(path)).toEqual(['alpha.serial']);
  });

  it('版を渡さなければ従来どおり確認しない', async () => {
    const dir = tempDir();
    const path = join(dir, 'b.json');
    await saveBaselineEnvelope(path, envelope(['alpha.serial']));
    // 既存の呼出との互換。
    await saveBaselineEnvelope(path, envelope(['beta.serial']));
    expect(keysOf(path)).toEqual(['beta.serial']);
  });
});

describe('重なった実行で先に書いた記録が残る (#1757)', () => {
  /** 測定の途中で別の実行が書き込む状況を作る。 */
  function interleave(dir: string, name: string, onMeasure: () => void) {
    return {
      moduleName: name,
      ops: [{ name: 'alpha', fn: onMeasure, serialP95CapMs: 1000 }],
      reportPath: join(dir, `${name}.md`),
      baselinePath: join(dir, 'shared.json'),
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    };
  }

  it('mock 経路 — 測定中に書き換わった実行は書込を見送る', async () => {
    const dir = tempDir();
    const shared = join(dir, 'shared.json');
    // 先に別の実行の記録を置く。
    await saveBaselineEnvelope(shared, envelope(['other.serial']));

    let injected = false;
    const result = await runPerf3Layer(
      interleave(dir, 'conc-mock', () => {
        // 測定の最中に別の実行が書き終える。
        if (injected) return;
        injected = true;
        writeFileSync(
          shared,
          `${JSON.stringify({
            schema: BASELINE_SCHEMA,
            env: captureEnv(),
            results: {
              'other.serial': buildMeasureResult('other.serial', 4, 0, [1, 1, 1, 1]),
              'later.serial': buildMeasureResult('later.serial', 4, 0, [2, 2, 2, 2]),
            },
          })}\n`,
          'utf8',
        );
      }),
    );

    // 後から書く側は諦める。 上書きしていれば later.serial が消えている。
    expect(keysOf(shared)).toContain('later.serial');
    expect(result.baselineSeeded).toBe(false);
  });

  it('実 API 経路 — 同じく書込を見送る', async () => {
    const dir = tempDir();
    const shared = join(dir, 'shared.json');
    await saveBaselineEnvelope(shared, envelope(['other.live.serial']));

    let injected = false;
    await runPerf3LayerLive({
      moduleName: 'conc-live',
      ops: [
        {
          name: 'alpha',
          requiredEnv: [],
          serialP95CapMs: 1000,
          fn: () => {
            if (injected) return;
            injected = true;
            writeFileSync(
              shared,
              `${JSON.stringify({
                schema: BASELINE_SCHEMA,
                env: captureEnv(),
                results: {
                  'other.live.serial': buildMeasureResult('other.live.serial', 4, 0, [1, 1, 1, 1]),
                  'later.live.serial': buildMeasureResult('later.live.serial', 4, 0, [2, 2, 2, 2]),
                },
              })}\n`,
              'utf8',
            );
          },
        },
      ],
      reportPath: join(dir, 'live.md'),
      baselinePath: shared,
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });

    expect(keysOf(shared)).toContain('later.live.serial');
  });
});

describe('中身と版を 1 回の read から採る (#1757 review)', () => {
  it('壊れた記録でも版を返す', async () => {
    const dir = tempDir();
    const path = join(dir, 'b.json');
    // 解釈できない中身。file 自体は存在する。
    writeFileSync(path, JSON.stringify({ schema: 2, env: {}, results: 'not a map' }), 'utf8');

    const snapshot = await loadBaselineSnapshot(path);
    // 読めない = 作り直す判断。だが版は要る。
    expect(snapshot.envelope).toBeNull();
    expect(snapshot.revision).toMatch(/^[0-9a-f]{64}$/);
  });

  it('file が無ければ版も null', async () => {
    const dir = tempDir();
    const snapshot = await loadBaselineSnapshot(join(dir, 'absent.json'));
    expect(snapshot.envelope).toBeNull();
    expect(snapshot.revision).toBeNull();
  });

  it('返す版がその中身のものである', async () => {
    const dir = tempDir();
    const path = join(dir, 'b.json');
    await saveBaselineEnvelope(path, envelope(['alpha.serial']));
    const snapshot = await loadBaselineSnapshot(path);

    // 版が中身と組になっていれば、そのまま保存に使える。
    // 別々に read すると、その間の書込で「古い中身 + 新しい版」 の組ができ、
    // 照合が通って先の更新を上書きしてしまう。
    await saveBaselineEnvelope(path, envelope(['alpha.serial', 'beta.serial']), {
      expectedRevision: snapshot.revision,
    });
    expect(keysOf(path)).toEqual(['alpha.serial', 'beta.serial']);
  });
});

describe('競合を report と verdict に出す (#1757 review)', () => {
  it('比較できた op しか無い実行でも report に競合が出る', async () => {
    const dir = tempDir();
    const shared = join(dir, 'shared.json');
    const reportPath = join(dir, 'r.md');
    await saveBaselineEnvelope(shared, envelope(['other.serial']));

    let injected = false;
    await runPerf3Layer({
      moduleName: 'conc-report',
      ops: [
        {
          name: 'alpha',
          serialP95CapMs: 1000,
          fn: () => {
            if (injected) return;
            injected = true;
            writeFileSync(
              shared,
              `${JSON.stringify({
                schema: BASELINE_SCHEMA,
                env: captureEnv(),
                results: {
                  'other.serial': buildMeasureResult('other.serial', 4, 0, [1, 1, 1, 1]),
                  'later.serial': buildMeasureResult('later.serial', 4, 0, [2, 2, 2, 2]),
                },
              })}\n`,
              'utf8',
            );
          },
        },
      ],
      reportPath,
      baselinePath: shared,
      serialIterations: 5,
      serialWarmup: 1,
      concurrency: 2,
      iterationsPerWorker: 2,
      memoryIterations: 5,
    });

    // 上限違反を疑わせる文言だけだと、読み手が存在しない原因を探す。
    expect(readFileSync(reportPath, 'utf8')).toContain('上書きを避けて譲った');
  });
});
