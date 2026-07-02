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

    expect(loaded).toEqual(result);
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
