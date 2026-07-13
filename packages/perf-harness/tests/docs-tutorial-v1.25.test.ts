/**
 * v1.25-5 docs 補強 (Issue #931) — tutorial 45-46 code snippet 検証。
 *
 * `docs/tutorials/45-perf-harness-baseline.md` /
 * `docs/tutorials/46-perf-baseline-migration.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 の docs-tutorial-v*.test.ts と同 pattern。
 *
 * v1.25 は @kiwa-lab/perf-harness v0.2 の 33 package coverage sweep を扱う。
 * runPerf3Layer 系 API は既に他 package の perf test で covered のため、
 * 本 test では tutorial に載る measure / saveBaseline / loadBaseline /
 * detectRegression / evaluatePerfGate primitive に focus する。
 */
import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildMeasureResult,
  defaultBaselinePath,
  detectRegression,
  evaluatePerfGate,
  loadBaseline,
  measure,
  saveBaseline,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 45 — Perf-harness baseline
// ---------------------------------------------------------------------------

// Section 2 — Write the target function
function reverseString(input: string): string {
  const chars: string[] = [];
  for (let index = input.length - 1; index >= 0; index -= 1) {
    chars.push(input[index]!);
  }
  return chars.join('');
}

describe('tutorial 45 — reverseString target function', () => {
  it('returns the reversed input for a non-empty string', () => {
    expect(reverseString('kiwa perf harness')).toBe('ssenrah frep awik');
  });

  it('returns the empty string when input is empty', () => {
    expect(reverseString('')).toBe('');
  });
});

describe('tutorial 45 — single measurement', () => {
  it('captures p50 / p95 / p99 across 100 iterations', async () => {
    const result = await measure({
      name: 'reverseString',
      iterations: 100,
      warmup: 3,
      fn: () => {
        reverseString('kiwa perf harness');
      },
    });

    expect(result.iterations).toBe(100);
    expect(result.warmup).toBe(3);
    expect(result.samples).toHaveLength(100);
    expect(result.p50).toBeGreaterThanOrEqual(0);
    expect(result.p95).toBeGreaterThanOrEqual(result.p50);
    expect(result.p99).toBeGreaterThanOrEqual(result.p95);
    expect(result.mean).toBeGreaterThanOrEqual(0);
    expect(result.stdev).toBeGreaterThanOrEqual(0);
  });
});

describe('tutorial 45 — baseline persistence', () => {
  let tempDir: string;
  let originalCwd: string;

  beforeEach(() => {
    originalCwd = process.cwd();
    tempDir = mkdtempSync(path.join(os.tmpdir(), 'perf-baseline-'));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    rmSync(tempDir, { recursive: true, force: true });
  });

  it('writes to .perf-baseline/reverseString.json on first run', async () => {
    const baselinePath = defaultBaselinePath('reverseString');
    expect(baselinePath).toBe(path.join(process.cwd(), '.perf-baseline', 'reverseString.json'));

    const current = await measure({
      name: 'reverseString',
      iterations: 100,
      warmup: 3,
      fn: () => {
        reverseString('kiwa perf harness');
      },
    });

    await saveBaseline(baselinePath, current);
    const roundtrip = await loadBaseline(baselinePath);

    expect(roundtrip).not.toBeNull();
    const result = roundtrip?.envelope.results['reverseString'];
    expect(result?.name).toBe('reverseString');
    expect(result?.iterations).toBe(100);
    expect(result?.samples).toHaveLength(100);
  });

  it('returns null when the baseline does not yet exist', async () => {
    const baselinePath = defaultBaselinePath('never-seeded');
    const loaded = await loadBaseline(baselinePath);
    expect(loaded).toBeNull();
  });
});

describe('tutorial 45 — regression detection', () => {
  it('flags a valid verdict when re-measured against a same-code baseline', async () => {
    const baseline = await measure({
      name: 'reverseString',
      iterations: 100,
      warmup: 3,
      fn: () => {
        reverseString('kiwa perf harness');
      },
    });
    const current = await measure({
      name: 'reverseString',
      iterations: 100,
      warmup: 3,
      fn: () => {
        reverseString('kiwa perf harness');
      },
    });

    const verdict = detectRegression({ current, baseline, threshold: 0.2 });

    // Verdict is one of the three known values; the concrete outcome depends
    // on machine noise. The tutorial documents the expected 'stable' path so
    // we assert on the type set — not a strict equality — to keep the test
    // deterministic across CI runners.
    expect(['stable', 'improved', 'regressed']).toContain(verdict.verdict);
    expect(typeof verdict.regressed).toBe('boolean');
    expect(typeof verdict.deltaPct).toBe('number');
    expect(typeof verdict.ci.lower).toBe('number');
    expect(typeof verdict.ci.upper).toBe('number');
    expect(typeof verdict.significant).toBe('boolean');
  });

  it('flags regressed when a slower current is compared against a faster baseline', () => {
    // Use samples with small variance so Welch t-test rejects the null
    // hypothesis while keeping the p95 delta above 20 %. Constant samples
    // (stdev=0) produce a t-statistic of 0, which is not significant, so the
    // detector conservatively returns 'stable'. Adding jitter mirrors what a
    // real workload sample distribution looks like.
    const jitter = (base: number): number[] =>
      Array.from({ length: 100 }, (_, index) => base + ((index % 3) - 1) * 0.001);
    const fastSample = jitter(1);
    const slowSample = jitter(5);
    const fastResult = buildMeasureResult('reverseString', 100, 3, fastSample);
    const slowResult = buildMeasureResult('reverseString', 100, 3, slowSample);

    const verdict = detectRegression({
      current: slowResult,
      baseline: fastResult,
      threshold: 0.2,
    });

    expect(verdict.verdict).toBe('regressed');
    expect(verdict.regressed).toBe(true);
    expect(verdict.deltaPct).toBeGreaterThan(0.2);
    expect(verdict.significant).toBe(true);
  });
});

describe('tutorial 45 — release gate', () => {
  it('passes when p95 stays under 100 ms', async () => {
    const result = await measure({
      name: 'reverseString',
      iterations: 100,
      warmup: 3,
      fn: () => {
        reverseString('kiwa perf harness');
      },
    });

    const gate = evaluatePerfGate({
      result,
      thresholds: { p95Ms: 100 },
    });

    expect(gate.verdict.passed).toBe(true);
    expect(gate.breaches).toHaveLength(0);
    expect(gate.report.perf.samples).toBe(100);
  });

  it('flags a breach when p95 exceeds the threshold', () => {
    const slow = Array.from({ length: 100 }, () => 150);
    const gate = evaluatePerfGate({
      result: buildMeasureResult('reverseString', 100, 3, slow),
      thresholds: { p95Ms: 100 },
    });

    expect(gate.verdict.passed).toBe(false);
    expect(gate.breaches).toHaveLength(1);
    expect(gate.breaches[0]?.axis).toBe('perf.p95Ms');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 46 — Perf baseline migration
// ---------------------------------------------------------------------------

// Section 1 — Pick the primary API paths
// The tutorial names 'primaryApi' and 'secondaryApi' as placeholders for a
// package's exported functions. We simulate the migration recipe against
// two trivial fixtures to prove the primitive shape works.
function primaryApi(input: { input: string }): string {
  return input.input.toUpperCase();
}

async function secondaryApi(input: { id: string }): Promise<string> {
  return `${input.id}:${Date.now()}`;
}

describe('tutorial 46 — primaryApi + secondaryApi target functions', () => {
  it('primaryApi upper-cases the input', () => {
    expect(primaryApi({ input: 'hello' })).toBe('HELLO');
  });

  it('secondaryApi returns an id-prefixed marker', async () => {
    const marker = await secondaryApi({ id: 'x' });
    expect(marker.startsWith('x:')).toBe(true);
  });
});

describe('tutorial 46 — measure primitives for migration', () => {
  it('measure runs the primary op and returns a MeasureResult', async () => {
    const result = await measure({
      name: 'primaryApi',
      iterations: 20,
      warmup: 3,
      fn: () => {
        primaryApi({ input: 'hello' });
      },
    });

    expect(result.name).toBe('primaryApi');
    expect(result.iterations).toBe(20);
    expect(result.warmup).toBe(3);
    expect(result.samples).toHaveLength(20);
    expect(result.p95).toBeGreaterThanOrEqual(result.p50);
  });

  it('measure supports async ops for the secondary path', async () => {
    const result = await measure({
      name: 'secondaryApi',
      iterations: 20,
      warmup: 3,
      fn: async () => {
        await secondaryApi({ id: 'x' });
      },
    });

    expect(result.name).toBe('secondaryApi');
    expect(result.samples.every((sample) => sample >= 0)).toBe(true);
  });
});

describe('tutorial 46 — buildMeasureResult round trip', () => {
  it('reconstructs p50 / p95 / p99 from a raw samples array', () => {
    const samples = Array.from({ length: 100 }, (_, index) => index + 1);
    const result = buildMeasureResult('primaryApi', 100, 3, samples);

    expect(result.iterations).toBe(100);
    expect(result.warmup).toBe(3);
    expect(result.p50).toBeGreaterThan(0);
    expect(result.p95).toBeGreaterThan(result.p50);
    expect(result.p99).toBeGreaterThanOrEqual(result.p95);
    expect(result.minMs).toBe(1);
    expect(result.maxMs).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 45 + 46 — regression + gate cross-integration
// ---------------------------------------------------------------------------

describe('tutorial 45 + 46 — end-to-end integration', () => {
  it('composes measure + saveBaseline + detectRegression + evaluatePerfGate', async () => {
    const tempDir = mkdtempSync(path.join(os.tmpdir(), 'perf-integration-'));
    const baselinePath = path.join(tempDir, '.perf-baseline', 'primaryApi.json');

    try {
      // First run: seed the baseline
      const first = await measure({
        name: 'primaryApi',
        iterations: 20,
        warmup: 3,
        fn: () => {
          primaryApi({ input: 'hello' });
        },
      });
      const preRun = await loadBaseline(baselinePath);
      expect(preRun).toBeNull();
      await saveBaseline(baselinePath, first);

      // Second run: load baseline + detect regression + gate
      const second = await measure({
        name: 'primaryApi',
        iterations: 20,
        warmup: 3,
        fn: () => {
          primaryApi({ input: 'hello' });
        },
      });
      const baselineLoaded = await loadBaseline(baselinePath);
      expect(baselineLoaded).not.toBeNull();
      const baseline = baselineLoaded?.envelope.results['primaryApi'];
      expect(baseline?.iterations).toBe(20);

      const regressionVerdict = detectRegression({
        current: second,
        baseline: baseline!,
        threshold: 0.2,
      });
      expect(['stable', 'improved', 'regressed']).toContain(regressionVerdict.verdict);

      const gate = evaluatePerfGate({
        result: second,
        thresholds: { p95Ms: 100 },
      });
      expect(gate.verdict.axesEvaluated).toBe(1);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
