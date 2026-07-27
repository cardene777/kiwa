import { mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildMeasureResult,
  loadBaseline,
  saveBaseline,
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
