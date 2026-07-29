import { mkdirSync, mkdtempSync, readdirSync, realpathSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  MEASUREMENT_PREMISE,
  buildMeasureResult,
  captureEnv,
  isComparableEnv,
  loadBaseline,
  resolveBaselineRoot,
  saveBaseline,
  saveBaselineEnvelope,
} from '../src/index.js';

describe('baseline persistence', () => {
  it('T-PH-B-001 round-trips a saved baseline', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'baseline.json');
    const result = buildMeasureResult('reply', 3, 1, [1, 2, 3]);

    await saveBaseline(file, result);
    const loaded = await loadBaseline(file);

    expect(loaded).not.toBeNull();
    expect(loaded?.envelope.schema).toBe(1);
    expect(loaded?.envelope.results['reply']).toEqual(result);
    // env は現行 machine 情報なので envMismatch は空。
    expect(loaded?.envMismatch).toEqual([]);
  });

  it('T-PH-B-001b legacy schema (envelope 化前の単一 result JSON) を自動 upgrade する', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'legacy.json');
    const legacy = buildMeasureResult('op', 3, 1, [10, 11, 12]);
    writeFileSync(file, JSON.stringify(legacy), 'utf8');

    const loaded = await loadBaseline(file);
    expect(loaded).not.toBeNull();
    expect(loaded?.envelope.schema).toBe(1);
    expect(loaded?.envelope.env.gitSha).toBe('unknown');
    expect(loaded?.envelope.results['op']?.samples).toEqual([10, 11, 12]);
    // legacy → env 全 field mismatch。
    expect(loaded?.envMismatch.length).toBeGreaterThan(0);
  });

  it('T-PH-B-001c legacy schema (op 名をキーにした複数 result の map) を項目ごとに展開する', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'legacy-map.json');
    // three-layer が envelope 化される前に保存した形式。op ごとの result が
    // top-level に並ぶ。1 件の legacy result として畳むと op を引けなくなり、
    // 回帰判定が毎回 baseline seeded に落ちる。
    const map = {
      'parseSpec.serial': buildMeasureResult('parseSpec.serial', 3, 1, [1, 2, 3]),
      'parseSpec.concurrent': buildMeasureResult('parseSpec.concurrent', 3, 1, [4, 5, 6]),
      'createPool.serial': buildMeasureResult('createPool.serial', 3, 1, [7, 8, 9]),
    };
    writeFileSync(file, JSON.stringify(map), 'utf8');

    const loaded = await loadBaseline(file);
    expect(loaded).not.toBeNull();
    expect(loaded?.envelope.schema).toBe(1);
    expect(Object.keys(loaded?.envelope.results ?? {}).sort()).toEqual([
      'createPool.serial',
      'parseSpec.concurrent',
      'parseSpec.serial',
    ]);
    expect(loaded?.envelope.results['parseSpec.serial']?.samples).toEqual([1, 2, 3]);
    expect(loaded?.envelope.results['createPool.serial']?.samples).toEqual([7, 8, 9]);
    expect(loaded?.envelope.results['legacy']).toBeUndefined();
  });

  it('T-PH-B-001d result として解釈できない JSON は baseline 無しとして扱う', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    // 空の results を返すと呼び出し側が「baseline はある」と判断して seed し直さず、
    // 回帰判定が永久に n/a のまま修復されない。null を返して seed させる。
    const cases: Array<[string, unknown]> = [
      ['unknown-shape', { note: 'not a baseline' }],
      ['empty-object', {}],
      ['array', [buildMeasureResult('op', 3, 1, [1, 2, 3])]],
      ['schema-without-env', { schema: 1, results: {} }],
      ['result-missing-stats', { name: 'op', samples: [1, 2, 3] }],
      ['result-with-nan-sample', { ...buildMeasureResult('op', 3, 1, [1, 2, 3]), samples: [1, null, 3] }],
    ];

    for (const [label, body] of cases) {
      const file = path.join(dir, `${label}.json`);
      writeFileSync(file, JSON.stringify(body), 'utf8');
      expect(await loadBaseline(file), label).toBeNull();
    }
  });

  it('T-PH-B-001e 保存は一時 file 経由で置き換える (途中状態を読ませない)', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'atomic.json');
    const result = buildMeasureResult('op', 3, 1, [1, 2, 3]);

    await Promise.all([
      saveBaseline(file, result),
      saveBaseline(file, result),
      saveBaseline(file, result),
    ]);

    // 並行保存後も読み手からは常に完全な JSON に見える。
    const loaded = await loadBaseline(file);
    expect(loaded?.envelope.results['op']?.samples).toEqual([1, 2, 3]);
    // 一時 file が残らない。
    expect(readdirSync(dir)).toEqual(['atomic.json']);
  });

  it('T-PH-B-002 returns null when the file does not exist', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const loaded = await loadBaseline(path.join(dir, 'missing.json'));
    expect(loaded).toBeNull();
  });

  it('T-PH-B-003 throws on malformed JSON', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'bad.json');
    writeFileSync(file, '{not-json', 'utf8');

    await expect(loadBaseline(file)).rejects.toThrow();
  });
});

describe('baseline root resolution (#1708)', () => {
  it('T-PH-B-009 workspace の目印まで上に辿った場所を基準にする', () => {
    // /tmp は macOS で /private/tmp への symlink なので、期待値も実体で持つ。
    const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'perf-harness-root-')));
    const root = path.join(dir, 'repo');
    const nested = path.join(root, 'packages', 'thing');
    mkdirSync(nested, { recursive: true });
    writeFileSync(path.join(root, 'pnpm-workspace.yaml'), 'packages:\n  - "packages/*"\n', 'utf8');

    // package から起動しても repo root から起動しても同じ場所を指す。
    expect(resolveBaselineRoot(nested)).toBe(root);
    expect(resolveBaselineRoot(root)).toBe(root);
  });

  it('T-PH-B-010 .git だけがある repo でも基準にできる', () => {
    const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'perf-harness-root-')));
    const root = path.join(dir, 'repo');
    const nested = path.join(root, 'src', 'deep');
    mkdirSync(nested, { recursive: true });
    mkdirSync(path.join(root, '.git'), { recursive: true });

    expect(resolveBaselineRoot(nested)).toBe(root);
  });

  it('T-PH-B-011 目印が無い場所では起点をそのまま使う', () => {
    // repo の外から使う単体 package の呼出を壊さない。
    const dir = realpathSync(mkdtempSync(path.join(os.tmpdir(), 'perf-harness-root-')));
    const standalone = path.join(dir, 'standalone');
    mkdirSync(standalone, { recursive: true });

    // tmp の上流に目印が無いことが前提。 見つかった場合はその場所を返すので
    // 「起点かそれより上」 のいずれかであることだけを確かめる。
    expect(standalone.startsWith(resolveBaselineRoot(standalone))).toBe(true);
  });
});

describe('measurement premise gating (#1708)', () => {
  it('T-PH-B-004 保存した baseline には測り方の版が入る', () => {
    expect(captureEnv().measurementPremise).toBe(MEASUREMENT_PREMISE);
  });

  it('T-PH-B-005 版が記録されていない baseline とは比較しない', () => {
    const current = captureEnv();
    const { measurementPremise: _dropped, ...withoutPremise } = current;

    // 並列実行の負荷を含んだ頃の値。機械も Node も同じでも比較対象にならない。
    expect(isComparableEnv(withoutPremise, current)).toBe(false);
  });

  it('T-PH-B-006 版が違う baseline とは比較しない', () => {
    const current = captureEnv();
    const older = { ...current, measurementPremise: MEASUREMENT_PREMISE - 1 };

    expect(isComparableEnv(older, current)).toBe(false);
  });

  it('T-PH-B-007 版が同じで他の前提も揃っていれば比較する', () => {
    const current = captureEnv();

    // savedAt と gitSha は測定値の意味を変えないため一致を要求しない。
    const sameMachine = { ...current, gitSha: 'deadbee', savedAt: '2020-01-01T00:00:00.000Z' };
    expect(isComparableEnv(sameMachine, current)).toBe(true);
  });

  it('T-PH-B-008 版の差は envMismatch として読み出せる', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'older-premise.json');
    const result = buildMeasureResult('reply', 3, 1, [1, 2, 3]);
    await saveBaselineEnvelope(file, {
      schema: 1,
      env: { ...captureEnv(), measurementPremise: MEASUREMENT_PREMISE - 1 },
      results: { reply: result },
    });

    const loaded = await loadBaseline(file);

    expect(loaded?.envMismatch.map((entry) => entry.field)).toContain('measurementPremise');
  });

  it('T-PH-B-012 統計量を足す前に保存した baseline は sample から補完して読む (#1718)', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'without-p10.json');
    const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const stored = buildMeasureResult('reply', samples.length, 1, samples) as unknown as Record<string, unknown>;
    // p10 導入より前に保存された baseline を再現する。
    delete stored['p10'];
    await saveBaselineEnvelope(file, {
      schema: 1,
      env: captureEnv(),
      results: { reply: stored as never },
    });

    const loaded = await loadBaseline(file);

    // 補完しないと report 生成が undefined を掴んで落ちる。
    expect(loaded?.envelope.results['reply']?.p10).toBe(2);
    // 派生値はすべて sample から決まるので、補完後も他の統計量は元と一致する。
    expect(loaded?.envelope.results['reply']?.p95).toBe(10.5);
    expect(loaded?.envelope.results['reply']?.samples).toEqual(samples);
  });

  it('T-PH-B-013 比較できない件数の記録は読めない記録として扱う (#1718)', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    // bootstrap CI は 2 件未満で退化 CI ({0,0}) を返す。有効な記録として返すと
    // 何倍悪化しても有意にならず永久に stable になり、key が既にあるので
    // 追記経路でも作り直されない。
    for (const [label, samples] of [['no-samples', []], ['one-sample', [1]]] as const) {
      const file = path.join(dir, `${label}.json`);
      const stored = buildMeasureResult('reply', 3, 1, [1, 2, 3]) as unknown as Record<
        string,
        unknown
      >;
      stored['samples'] = samples;
      await saveBaselineEnvelope(file, {
        schema: 1,
        env: captureEnv(),
        results: { reply: stored as never },
      });

      expect(await loadBaseline(file), label).toBeNull();
    }
  });

  it('T-PH-B-014 保存値と sample が食い違う記録は sample 側に揃える (#1718)', async () => {
    const dir = mkdtempSync(path.join(os.tmpdir(), 'perf-harness-'));
    const file = path.join(dir, 'inconsistent.json');
    const samples = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
    const stored = buildMeasureResult('reply', samples.length, 1, samples) as unknown as Record<
      string,
      unknown
    >;
    // 判定は sample から、report は保存値から読む状態を作ると、同じ行に
    // regressed と改善を示す差分が並ぶ。読込時に片方へ揃える。
    stored['p10'] = 100;
    stored['p95'] = 999;
    await saveBaselineEnvelope(file, {
      schema: 1,
      env: captureEnv(),
      results: { reply: stored as never },
    });

    const loaded = await loadBaseline(file);

    expect(loaded?.envelope.results['reply']?.p10).toBe(2);
    expect(loaded?.envelope.results['reply']?.p95).toBe(10.5);
  });});
