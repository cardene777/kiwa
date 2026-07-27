import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { expect, it } from 'vitest';
import {
  buildMeasureResult,
  detectRegression,
  evaluatePerfGate,
  loadBaseline,
  saveBaseline,
} from '../src/index.js';

it('keeps the documented baseline comparison runnable', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'kiwa-perf-'));
  const baselinePath = join(directory, 'reply.json');

  try {
    const baseline = buildMeasureResult(
      'reply',
      40,
      3,
      Array.from({ length: 40 }, (_, index) => 10 + (index % 3) * 0.05),
    );
    const current = buildMeasureResult(
      'reply',
      40,
      3,
      Array.from({ length: 40 }, (_, index) => 11 + (index % 3) * 0.05),
    );

    await saveBaseline(baselinePath, baseline);
    const loaded = await loadBaseline(baselinePath);
    expect(loaded?.envMismatch).toEqual([]);

    const comparison = detectRegression({
      current,
      baseline: loaded!.envelope.results.reply!,
      threshold: 0.2,
    });
    expect(comparison.verdict).toBe('stable');
    expect(comparison.deltaPct).toBeLessThan(0.2);

    expect(evaluatePerfGate({ result: current, thresholds: { p95Ms: 20 } }).verdict)
      .toMatchObject({ passed: true, blockers: [] });
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
