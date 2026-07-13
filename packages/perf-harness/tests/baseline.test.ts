import { mkdtempSync, writeFileSync } from 'node:fs';
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
