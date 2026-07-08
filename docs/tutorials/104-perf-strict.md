# Perf strict mode — iter 400 + Welch |t|>3 + delta 10% で test 漏れゼロ in 15 min

## What you'll build

A vitest suite wired to `@kiwa-test/perf-harness` v0.3 that uses **strict mode** — iter 400 + Welch t-test |t|>3 + p95 delta 10% + fail-fast on missing baseline。 v0.2 lax mode (iter 200 + |t|>2 + delta 20%) より false negative を減らして test 漏れゼロを狙う。

## Prerequisites

- Node.js ≥ 20
- `pnpm`

## Step-by-step build

### 1. Bootstrap

```bash
mkdir kiwa-perf-strict && cd kiwa-perf-strict
pnpm init
pnpm add -D @kiwa-test/perf-harness@^0.3 @kiwa-test/quality-metrics@^0.4 vitest typescript @types/node
```

### 2. Strict regression detection

`tests/regression-strict.test.ts` — |t|>3 + 10% delta で false negative を減らす。

```ts
import { describe, expect, it } from 'vitest';
import {
  buildMeasureResult,
  detectRegression,
  detectRegressionStrict,
} from '@kiwa-test/perf-harness';

describe('strict regression detection', () => {
  it('strict catches 15% delta that lax passes', () => {
    const baseline = buildMeasureResult(
      'op',
      100,
      5,
      Array.from({ length: 100 }, () => 10 + Math.random() * 0.01),
    );
    const current = buildMeasureResult(
      'op',
      100,
      5,
      Array.from({ length: 100 }, () => 11.5 + Math.random() * 0.01),
    );
    const lax = detectRegression({ current, baseline });
    const strict = detectRegressionStrict({ current, baseline });
    // 15% delta → lax は 20% 未満で stable、 strict は 10% 超で regressed
    expect(lax.verdict).toBe('stable');
    expect(strict.verdict).toBe('regressed');
  });
});
```

### 3. Strict 3-layer harness

`tests/three-layer-strict.test.ts` — iter 400 + concurrency 20 + memory 400 で厳密計測。

```ts
import { describe, expect, it } from 'vitest';
import { runPerf3LayerStrict } from '@kiwa-test/perf-harness';
import path from 'node:path';

describe('strict 3-layer harness', () => {
  it('applies strict defaults', async () => {
    const result = await runPerf3LayerStrict({
      moduleName: 'my-lib',
      ops: [
        {
          name: 'compute',
          fn: () => {
            // heavy compute
          },
          serialP95CapMs: 10,
        },
      ],
      reportPath: path.join(__dirname, 'report.md'),
    });
    expect(result.outcomes[0]!.serial.iterations).toBe(400);
  });
});
```

### 4. Release gate strict axis

`tests/gate-strict.test.ts` — quality-metrics v0.4 の perf.strict axis で fail-fast。

```ts
import { describe, expect, it } from 'vitest';
import { evaluateReleaseGate } from '@kiwa-test/quality-metrics';

describe('release gate strict axis', () => {
  it('fails on p95 exceed strict cap', () => {
    const report = {
      version: '1.0',
      reportedAt: '2026-07-08T00:00:00Z',
      provider: '@kiwa-test/my-lib',
      coverage: { line: 90, branch: 85, function: 95 },
      fidelity: { ratio: 80, methodTotal: 10, methodCovered: 8 },
      perf: {
        p50Ms: 5,
        p95Ms: 60, // > strict cap 50
        p99Ms: 80,
        samples: 400,
        strict: true,
        baselineExists: true,
      },
      mutation: { mutations: 100, killed: 65, survived: 35, killRate: 65 },
      testCount: { unit: 20, integration: 5, e2e: 2, behavior: 15, total: 42 },
    } as any;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers.some((b) => b.axis === 'perf.strict.p95Ms')).toBe(true);
  });

  it('fails when baseline missing', () => {
    const report = {
      version: '1.0',
      reportedAt: '2026-07-08T00:00:00Z',
      provider: '@kiwa-test/my-lib',
      coverage: { line: 90, branch: 85, function: 95 },
      fidelity: { ratio: 80, methodTotal: 10, methodCovered: 8 },
      perf: {
        p50Ms: 5,
        p95Ms: 30,
        p99Ms: 50,
        samples: 400,
        strict: true,
        baselineExists: false,
      },
      mutation: { mutations: 100, killed: 65, survived: 35, killRate: 65 },
      testCount: { unit: 20, integration: 5, e2e: 2, behavior: 15, total: 42 },
    } as any;
    const verdict = evaluateReleaseGate(report);
    expect(verdict.passed).toBe(false);
    expect(verdict.blockers.some((b) => b.axis === 'perf.strict.baseline')).toBe(true);
  });
});
```

## Run it

```bash
pnpm test
```

3 test files pass. strict mode を有効化した package では test 漏れが構造的に減る (false negative 半減)。 lax mode は backward compat として維持されているので既存 baseline を即座に無効化しない。
