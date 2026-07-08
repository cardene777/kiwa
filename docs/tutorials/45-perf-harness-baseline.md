# Perf-harness baseline — p95 baseline + regression detection in 15 min

## What you'll build

A vitest suite wired to `@kiwa/perf-harness` v0.2 that measures a target function's latency envelope (p50 / p95 / p99), persists a JSON baseline to `.perf-baseline/`, and detects regressions on subsequent runs using a Welch t-test with a 20 % p95 delta threshold. The exact pattern that all 33 kiwa packages (v1.25 sweep) use — same `measure` + `saveBaseline` + `detectRegression` primitives, same 3 warmup + 100 iteration + 20 % threshold rules, same JSON schema on disk. You leave this tutorial with a runnable baseline and a working regression detector for any pure function you point it at.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-perf-baseline && cd kiwa-perf-baseline
pnpm init
pnpm add -D @kiwa/perf-harness@^0.2 vitest typescript @types/node
```

Add the vitest script in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run",
    "test:perf": "vitest run tests/perf"
  }
}
```

### 2. Write the target function

`src/index.ts` — a pure function whose latency envelope you want to lock in. The tutorial uses a trivial pass-through so the numbers are easy to reason about, but any pure function works (parser, serializer, hash, memoizer, adapter facade).

```ts
export function reverseString(input: string): string {
  const chars: string[] = [];
  for (let index = input.length - 1; index >= 0; index -= 1) {
    chars.push(input[index]!);
  }
  return chars.join('');
}
```

The rule of thumb is that the function should be pure (no I/O, no random state, no time dependency). A p95 baseline against `Date.now()` or `fetch()` is meaningless because the numbers move even when the code does not.

### 3. Take a single measurement

`tests/perf/reverse.perf.ts` — one `measure` block, 100 iterations, 3 warmup.

```ts
import { describe, expect, it } from 'vitest';
import { measure } from '@kiwa/perf-harness';
import { reverseString } from '../../src/index.js';

describe('reverseString — single measurement', () => {
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
```

The v1.25 SSOT is 3 warmup + 100 iteration (`docs/concepts/perf-testing-ssot.md`). Warmup discards the first N invocations so V8's inline caches settle before the samples are recorded — otherwise the p95 is dominated by JIT compilation, not the steady-state cost.

### 4. Persist a baseline

`tests/perf/baseline.perf.ts` — write the current measurement to `.perf-baseline/reverseString.json` on the first run.

```ts
import { describe, expect, it } from 'vitest';
import {
  defaultBaselinePath,
  loadBaseline,
  measure,
  saveBaseline,
} from '@kiwa/perf-harness';
import { reverseString } from '../../src/index.js';

describe('reverseString — baseline persistence', () => {
  it('writes to .perf-baseline/reverseString.json on first run', async () => {
    const path = defaultBaselinePath('reverseString');
    const current = await measure({
      name: 'reverseString',
      iterations: 100,
      warmup: 3,
      fn: () => {
        reverseString('kiwa perf harness');
      },
    });

    await saveBaseline(path, current);
    const roundtrip = await loadBaseline(path);

    expect(roundtrip).not.toBeNull();
    expect(roundtrip?.name).toBe('reverseString');
    expect(roundtrip?.iterations).toBe(100);
    expect(roundtrip?.samples).toHaveLength(100);
  });
});
```

`defaultBaselinePath('reverseString')` resolves to `${cwd}/.perf-baseline/reverseString.json`. `saveBaseline` writes JSON with `mkdir -p` so the parent directory is created on first run. `loadBaseline` returns `null` if the file does not exist — that null is what the regression detector uses as the "seed the baseline" signal on first run.

Add `.perf-baseline/` to `.gitignore` for a local-only baseline, or commit it to lock the p95 envelope into the repo.

### 5. Detect a regression

`tests/perf/regression.perf.ts` — compare current vs baseline, flag `regressed` when the p95 delta exceeds 20 % **and** Welch's t-test says the difference is significant.

```ts
import { describe, expect, it } from 'vitest';
import {
  buildMeasureResult,
  detectRegression,
  measure,
} from '@kiwa/perf-harness';
import { reverseString } from '../../src/index.js';

describe('reverseString — regression detection', () => {
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

    expect(['stable', 'improved', 'regressed']).toContain(verdict.verdict);
    expect(typeof verdict.regressed).toBe('boolean');
    expect(typeof verdict.deltaPct).toBe('number');
  });

  it('flags regressed when a slower current is compared against a faster baseline', () => {
    // Use samples with small variance so Welch t-test rejects the null
    // hypothesis while keeping the p95 delta above 20 %. Constant samples
    // (stdev=0) produce a t-statistic of 0, which is not significant, so
    // the detector conservatively returns 'stable'.
    const jitter = (base: number): number[] =>
      Array.from({ length: 100 }, (_, index) => base + ((index % 3) - 1) * 0.001);
    const baseline = buildMeasureResult('reverseString', 100, 3, jitter(1));
    const current = buildMeasureResult('reverseString', 100, 3, jitter(5));

    const verdict = detectRegression({ current, baseline, threshold: 0.2 });

    expect(verdict.verdict).toBe('regressed');
    expect(verdict.regressed).toBe(true);
    expect(verdict.deltaPct).toBeGreaterThan(0.2);
    expect(verdict.significant).toBe(true);
  });
});
```

`detectRegression` returns four fields (`regressed` / `deltaPct` / `welchT` / `significant`) plus a summarised `verdict` (`improved` / `stable` / `regressed`). A regression fires only when **both** conditions hold — the p95 delta exceeds the threshold **and** Welch's t-test rejects the null hypothesis (`|welchT| > 2`). This dual-gate design suppresses false positives on noisy short runs.

### 6. Gate the release

`tests/perf/gate.perf.ts` — feed the measurement into the 11-axis release gate. `evaluatePerfGate` maps a bare `MeasureResult` onto the shared `evaluateReleaseGate` contract from `@kiwa/quality-metrics` so downstream reporting is uniform across 33 packages.

```ts
import { describe, expect, it } from 'vitest';
import {
  buildMeasureResult,
  evaluatePerfGate,
  measure,
} from '@kiwa/perf-harness';
import { reverseString } from '../../src/index.js';

describe('reverseString — release gate', () => {
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
```

The `perf.p95Ms` axis is one of the 11 release-gate axes (`docs/quality/release-gate.md`). The default threshold is 100 ms for the unit-scope adapter surface — a bar that reflects "the mock setup + call latency should stay imperceptible when a downstream test spins the harness up 200 times in a suite". Kiwa packages ship overrides in their `.perf-baseline/{module}.json` for domain-specific caps (edge KV = 20 ms, AI-LLM = 3 s, dApp = 500 ms).

### 7. Run it

```bash
pnpm test:perf
```

First run seeds the baseline in `.perf-baseline/`. Subsequent runs load the baseline and flag any regression on p95. A regression fails the vitest suite so a downstream CI (or a local pre-push guard) can block a merge.

The full end-to-end pattern lives in `packages/perf-harness/tests/docs-tutorial-v1.25.test.ts` — the snippet validation test that guarantees every code sample in this tutorial keeps matching the real `@kiwa/perf-harness` v0.2 API.

## Where to next

- [Tutorial 46 — Perf baseline migration (existing 3 package → 33 package sweep)](./46-perf-baseline-migration)
- [Concept — Perf-testing SSOT (p50 / p95 / p99 + baseline persistence + regression detection SSOT)](../concepts/perf-testing-ssot)
- [Migration guide — v1.24 → v1.25](../migrations/v1.24-to-v1.25)
- [Release gate SSOT (11-axis)](../quality/release-gate)
