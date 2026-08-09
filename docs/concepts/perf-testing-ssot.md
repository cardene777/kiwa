# Perf testing SSOT — p50 / p95 / p99 + baseline persistence + regression detection SSOT for kiwa v1.25

Introduced in v1.13-1 as `@kiwa-lab/perf-harness` v0.1 (`measure` + `saveBaseline` + `detectRegression`), extended in v1.14-post as `runPerf3Layer` (serial + concurrent + memory 3-layer), and rolled out to all 33 kiwa packages in the v1.25 milestone. This document is the SSOT for **what a kiwa perf suite measures, how the numbers are computed, and how a regression is decided**. Every downstream perf suite in `packages/*/tests/perf/*.perf.ts` reads these rules from here — do not re-derive them locally.

## Why a perf SSOT

Perf tests without a shared standard fail three ways.

- **Threshold drift**. One package uses p50 < 5 ms as the gate, another uses p95 < 10 ms, a third uses mean < 8 ms. When a regression fires on package A but not on B, the reader cannot tell whether B is genuinely fine or whether B's gate is looser than A's. The 11-axis release gate defines `perf.p95Ms` as the single perf axis; every downstream suite converges on that same metric.
- **Iteration count drift**. A suite that runs 10 iterations gives a p95 that is dominated by warmup noise. A suite that runs 10 000 iterations wastes 10 seconds per package × 33 packages. The SSOT pins **3 warmup + 100 iteration** as the shared floor — enough samples to make Welch's t-test meaningful, few enough that the full sweep completes in under 90 seconds.
- **Regression detection drift**. Deltas of 5 % / 10 % / 30 % all get called "regression" in different suites. The SSOT pins the delta threshold at **20 %** and the significance test at Welch's t-test (`|t| > 2`). Both conditions must hold for a `regressed` verdict — a delta alone can be noise, and a t-test alone can flag a statistically-significant 1 % move that no user notices.

The 4 rules below are the smallest set that make kiwa perf suites comparable across packages, milestones, and forks.

## Rule 1 — 3 warmup + 100 iteration is the shared floor

Every `measure` call in the kiwa monorepo passes `warmup: 3` and `iterations: 100` unless there is a written override in the package's `README.md`. Fewer iterations get too noisy for Welch's t-test to reject the null hypothesis; more iterations waste CI time.

```ts
import { measure } from '@kiwa-lab/perf-harness';

const result = await measure({
  name: 'primaryApi',
  iterations: 100,
  warmup: 3,
  fn: async () => {
    await primaryApi({ input: 'x' });
  },
});
```

Warmup samples are discarded — they are executed but not recorded. This lets V8's inline caches settle so the recorded samples reflect the steady-state cost, not the JIT compilation cost.

### Exceptions

- **Real driver mode**. `KIWA_MODE=real` swaps the adapter for a real testcontainers process. Real driver perf typically runs at `iterations: 20` because each iteration is 100-500 ms and the goal is to catch order-of-magnitude divergence from the mock, not to fit a tight p95 envelope.
- **AI-LLM perf**. The 11-axis release gate defines a separate `latency.p95Ms` axis (≤ 3 000 ms) for AI-LLM providers. Those suites use `iterations: 20-50` because each LLM round-trip is 500-3 000 ms.

## Rule 2 — p95 is the primary axis, p50 + p99 are informational

The 11-axis release gate exposes `perf.p95Ms` as the single perf axis. `evaluatePerfGate` maps `MeasureResult.p95` onto that axis and every downstream suite gates on it.

- **p50** — surfaces the "typical" latency. Useful for reasoning about UX, less useful as a gate because it hides tail regressions.
- **p95** — surfaces the "bad-day" latency. This is the gate. 100 ms is the shared default cap for adapter-scope work.
- **p99** — surfaces the "worst-day" latency. Reported for context; not gated because the 100-sample floor gives only ~1 sample at p99, so the reading is too noisy to gate on reliably.

The percentile computation is a straightforward rank-based extraction (`Math.ceil(sorted.length * ratio) - 1`) — not a Hyndman-Fan interpolation, not a t-digest. Simple, deterministic, easy to reproduce by hand from the raw samples.

## Rule 3 — baseline persistence is JSON, path is `.perf-baseline/{module}.json`

The `saveBaseline(path, result)` call writes `${JSON.stringify(result, null, 2)}\n` — the full `MeasureResult` object including every sample. This lets a downstream reader recompute p50 / p95 / p99 without re-running the measurement.

`defaultBaselinePath('my-module')` resolves to `${cwd}/.perf-baseline/my-module.json`. The cwd anchor means each kiwa package writes its own baseline at `packages/{package}/.perf-baseline/{package}.json` when vitest runs from the package root.

```ts
import {
  defaultBaselinePath,
  loadBaseline,
  measure,
  saveBaseline,
} from '@kiwa-lab/perf-harness';

const path = defaultBaselinePath('my-module');
const current = await measure({ name: 'my-module', iterations: 100, warmup: 3, fn });
const baseline = await loadBaseline(path);
if (!baseline) {
  await saveBaseline(path, current); // First run — seed the baseline.
}
```

Commit the baseline JSON to lock the envelope into the repo. A regression on a future PR then shows up as a diff on the JSON file alongside the code diff — reviewers can see the exact number that moved.

## Rule 4 — regression = 20 % delta + Welch t-test significant

`detectRegression({ current, baseline, threshold: 0.2 })` returns four fields.

- `deltaPct` — signed p95 change. Positive = current is slower than baseline.
- `welchT` — Welch's t-statistic across the raw sample arrays. `|welchT| > 2` is the significance bar.
- `significant` — boolean derived from the t-test.
- `verdict` — `'stable'` / `'improved'` / `'regressed'`. `regressed` fires when `significant && deltaPct >= threshold`; `improved` fires when `significant && deltaPct <= -threshold`; everything else is `stable`.

Dual-gating (delta + significance) is what suppresses false positives. A 25 % delta with `welchT = 1.2` (many overlapping samples) is `stable`, not `regressed`. A 5 % delta with `welchT = 3.0` (tight distributions) is `stable`, not `regressed`. Only "large **and** tight" fires the alarm.

```ts
import { detectRegression, measure } from '@kiwa-lab/perf-harness';

const baseline = await loadBaseline(defaultBaselinePath('my-module'));
const current = await measure({ name: 'my-module', iterations: 100, warmup: 3, fn });
if (baseline) {
  const verdict = detectRegression({ current, baseline, threshold: 0.2 });
  if (verdict.verdict === 'regressed') {
    throw new Error(`perf regression on my-module: deltaPct=${verdict.deltaPct} welchT=${verdict.welchT}`);
  }
}
```

## The 3-layer harness — serial + concurrent + memory

`measure` alone captures serial latency at concurrency 1. Real production traffic is not serial, and a p95 that looks fine at concurrency 1 can collapse under contention. v1.14-post introduced `runPerf3Layer` to gate three axes in one call.

- **serial** — `measure` at concurrency 1, 200 iterations, 5 warmup. Baseline latency floor.
- **concurrent** — `measureConcurrent` at concurrency 10, 50 iterations per worker (500 total). Contention detector.
- **memory** — `measureMemory` at 200 iterations, gate on `arrayBuffersDelta` (not `heapUsedDelta`, which is dominated by GC timing). Leak detector.

```ts
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa-lab/perf-harness';
import path from 'node:path';

const result = await runPerf3Layer({
  moduleName: 'my-module',
  reportPath: path.join(
    resolveKiwaRepoRoot(process.cwd()),
    'docs/quality-reports/perf/my-module.md',
  ),
  ops: [
    { name: 'primaryApi', serialP95CapMs: 5, fn: () => primaryApi() },
  ],
});
```

Each op is gated against a per-op serial cap (`serialP95CapMs`). The concurrent cap defaults to 2× the serial cap; override with `concurrentP95CapMs` when the op is expected to scale worse than linearly. The memory cap defaults to 100 KB `arrayBuffers` delta across 200 iterations; override with `memoryArrayBuffersCapBytes`.

## Package coverage (v1.25)

The v1.25 milestone applied the 3-layer harness to every kiwa package.

| Layer | Packages |
|---|---|
| core (9) | `@kiwa-lab/core` + `@kiwa-lab/dapp` + `@kiwa-lab/api` + `@kiwa-lab/ui` + `@kiwa-lab/data` + `@kiwa-lab/cli-test` + `@kiwa-lab/observability` + `@kiwa-lab/e2e` + `@kiwa-lab/cli` |
| framework adapter (3) | `@kiwa-lab/nextjs` + `@kiwa-lab/edge` + `@kiwa-lab/hono` |
| test type (2) | `@kiwa-lab/a11y` + `@kiwa-lab/component` |
| SaaS layer (5) | `@kiwa-lab/auth` + `@kiwa-lab/queue` + `@kiwa-lab/cache` + `@kiwa-lab/orm` + `@kiwa-lab/search` |

Every package writes a per-op p95 baseline, runs the 3-layer gate on every `pnpm test:perf` invocation, and feeds the report into `docs/quality-reports/perf/{package}.md`. The release gate (`evaluateReleaseGate`) treats a `regressed` verdict on any package as a release blocker on the `perf.p95Ms` axis.

## Where each axis lands in the release gate

The 11-axis release gate exposes one perf axis — `perf.p95Ms` — with a default cap of 100 ms for the unit-scope adapter surface. The v1.25 sweep confirms that every kiwa package clears the 100 ms cap on the primary paths tested; regressions above the cap block the release.

| Axis | Default cap | Overrideable | Source |
|---|---|---|---|
| perf.p95Ms | 100 ms | yes (per-op `serialP95CapMs`) | `docs/quality/release-gate.md` |
| concurrent p95 | 2× serial cap | yes (per-op `concurrentP95CapMs`) | `runPerf3Layer` default |
| memory arrayBuffers | 100 KB / 200 iter | yes (per-op `memoryArrayBuffersCapBytes`) | `runPerf3Layer` default |

Concurrent + memory gates are not in the 11-axis release gate — they are per-package gates enforced inside `runPerf3Layer`. A concurrent or memory breach fails the local vitest run but does not cascade to the release-gate report, because the release gate is scoped to a single primary axis per category (`perf.p95Ms`, `coverage.line`, `fidelity.ratio`, etc.).

## Related

- [Tutorial 45 — Perf-harness baseline (p95 walkthrough)](../tutorials/45-perf-harness-baseline)
- [Tutorial 46 — Perf baseline migration (existing 3 package → 33 package sweep)](../tutorials/46-perf-baseline-migration)
- [Migration guide v1.24 → v1.25](../migrations/v1.24-to-v1.25)
- [Release gate SSOT (11-axis)](../quality/release-gate)
