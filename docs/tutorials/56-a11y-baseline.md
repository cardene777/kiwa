# A11y baseline — axe-core + WCAG 2.1 AA gate + 3-layer harness in 15 min

## What you'll build

A vitest suite wired to `@kiwa/a11y` v1.1 that runs [axe-core](https://github.com/dequelabs/axe-core) over a jsdom DOM fixture with the WCAG 2.1 AA rule set, aggregates the 3-layer harness verdict (jsdom / Playwright / SSR-hydration) into a persisted baseline JSON at `.a11y-baseline/{package}.json`, and gates a `@kiwa/quality-metrics` v0.4 release-gate 13th axis (`a11y.tier`) against the 4-tier threshold table (Core 0/0/3 / Framework 0/3/10 / SaaS 0/0/0 / Test type 0/3/10). The exact pattern all 34 kiwa packages (v1.30 sweep) use — same `runAxe` + `reportViolations` + `expectNoViolations` primitives, same `runLayerHarness` + `computeTotals` + `isHarnessOk` aggregator, same `a11yFromBaseline` + `assertA11yTier` + `resolveA11yTier` gate helpers, same JSON schema on disk. You leave this tutorial with a runnable axe-core suite, a persisted 3-layer baseline, and a working tier gate for any package you point it at.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-a11y-baseline && cd kiwa-a11y-baseline
pnpm init
pnpm add -D @kiwa/a11y@^1.1 @kiwa/quality-metrics@^0.4 \
  axe-core jsdom vitest typescript @types/node
```

Add the vitest scripts in `package.json`.

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run --environment jsdom",
    "test:a11y": "vitest run tests/a11y --environment jsdom"
  }
}
```

`axe-core` is a peer dependency of `@kiwa/a11y` — it must be installed alongside the adapter or `runAxe` throws at first call.

### 2. Write the target markup

`src/counter.ts` — a tiny component that renders a button. The tutorial uses inline HTML because the point is the audit path, not the framework. Any DOM tree that jsdom can parse works — React / Vue / Svelte / Solid rendered output all plug in the same way.

```ts
export function renderCounter(container: Element, count: number): void {
  container.innerHTML =
    '<div>' +
    '<button aria-label="increment counter">+</button>' +
    '<output aria-live="polite">' + String(count) + '</output>' +
    '</div>';
}
```

The rule of thumb is that the markup should be deterministic — no random ids, no `Date.now()` in the DOM. axe-core resolves selectors when it reports a violation node, and non-determinism turns the surviving-rules list into a shifting target that no baseline can pin.

### 3. Run axe with the WCAG 2.1 AA rule set

`tests/a11y/counter.a11y.test.ts` — one `runAxe` call, WCAG 2.1 AA tag filter, `expectNoViolations` gate at `serious` impact.

```ts
import { describe, expect, it } from 'vitest';
import { runAxe, expectNoViolations } from '@kiwa/a11y';
import { renderCounter } from '../../src/counter.js';

describe('renderCounter — jsdom a11y audit', () => {
  it('has no serious / critical WCAG 2.1 AA violations', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    renderCounter(host, 0);

    const results = await runAxe({
      context: host,
      runOptions: {
        runOnly: {
          type: 'tag',
          values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
        },
      },
    });

    expectNoViolations(results, expect, { maxImpact: 'serious' });
  });
});
```

Three things to notice.

- `runOnly.type: 'tag'` restricts axe to WCAG 2.1 AA — the same tag set every `packages/*/.axe-config.mjs` in the v1.30 sweep pins. Best-practice rules (`best-practice` tag) are excluded because they surface style suggestions, not conformance failures.
- `context: host` scopes the audit to a specific subtree. Without it, axe walks the entire `document`, which in a shared test file leaks violations from other tests' leftover markup.
- `expectNoViolations(results, expect, { maxImpact: 'serious' })` fails the test when any violation at `serious` or `critical` impact survives. Impact ordering is `critical > serious > moderate > minor` — the same rank axe-core emits.

### 4. Persist a 3-layer baseline

`tests/a11y/baseline.a11y.test.ts` — feed the jsdom fixture into `runLayerHarness` and write the aggregated report to `.a11y-baseline/counter.json`.

```ts
import { describe, expect, it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { runLayerHarness } from '@kiwa/a11y';
import { renderCounter } from '../../src/counter.js';

describe('renderCounter — 3-layer baseline', () => {
  it('writes .a11y-baseline/counter.json on first run', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    renderCounter(host, 0);

    const report = await runLayerHarness('counter', {
      jsdom: {
        context: host,
        runOptions: {
          runOnly: {
            type: 'tag',
            values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'],
          },
        },
      },
    });

    expect(report.package).toBe('counter');
    expect(report.layers.jsdom.applicable).toBe(true);
    expect(report.layers.playwright.applicable).toBe(false);
    expect(report.layers.ssrHydration.applicable).toBe(false);
    expect(report.ok).toBe(true);
    expect(report.totals.critical).toBe(0);

    const path = resolve('.a11y-baseline/counter.json');
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, JSON.stringify(report, null, 2) + '\n', 'utf8');
  });
});
```

Three things to notice.

- `runLayerHarness(pkg, fixtures)` records every layer whether or not a fixture is supplied. Missing fixtures (`playwright` and `ssrHydration` here) record `applicable: false` with an explicit reason — the baseline documents the intent to skip the layer rather than silently omitting it.
- `report.ok` is `true` when every applicable layer has zero critical + zero serious + zero moderate violations. `minor` never gates `ok` because it is unbounded on every current tier.
- The baseline JSON lives under `.a11y-baseline/{package}.json` and is **tracked in git** — an a11y regression on a future PR shows up as a diff on the JSON alongside the code diff. Reviewers see the exact rule that moved and the surviving-node count.

### 5. Wire the tier gate

`tests/a11y/gate.a11y.test.ts` — feed the baseline totals into `@kiwa/quality-metrics` v0.4 and fail the vitest suite when any impact ceiling is breached.

```ts
import { describe, expect, it } from 'vitest';
import {
  a11yFromBaseline,
  assertA11yTier,
  resolveA11yTier,
} from '@kiwa/quality-metrics';

describe('renderCounter — tier gate', () => {
  it('passes when all 3 impacts meet the Test type tier ceiling', () => {
    const metric = a11yFromBaseline({
      totals: { critical: 0, serious: 0, moderate: 0, minor: 2 },
    });
    expect(() =>
      assertA11yTier({ metric, tier: resolveA11yTier('Test type') }),
    ).not.toThrow();
  });

  it('fails when serious violations exceed the Test type ceiling of 3', () => {
    const metric = a11yFromBaseline({
      totals: { critical: 0, serious: 4, moderate: 0 },
    });
    expect(() =>
      assertA11yTier({ metric, tier: 'test-type' }),
    ).toThrow(/serious impact 4 > 3/);
  });

  it('fails when critical > 0 regardless of tier', () => {
    const metric = a11yFromBaseline({ totals: { critical: 1 } });
    expect(() => assertA11yTier({ metric, tier: 'core' })).toThrow(
      /critical impact 1 > 0/,
    );
  });
});
```

`assertA11yTier` walks the 3 impacts (critical / serious / moderate) against the tier default (Core 0/0/3 / Framework 0/3/10 / SaaS 0/0/0 / Test type 0/3/10) and throws on the first breach with the axis + actual + threshold + tier in the message. Both the verbal `Core` / `Framework` / `SaaS` / `Test type` spelling (via `resolveA11yTier`) and the machine `core` / `framework` / `saas` / `test-type` enum work — the SSOT and the runtime agree by construction.

The `critical: 0` invariant is enforced by the `A11yThreshold` type literal — no per-package override can raise the critical bar above 0. Serious and moderate ceilings can be loosened for a package with a documented reason in the PR body (SSOT: `docs/quality/a11y-thresholds.md` § Overrides).

### 6. Gate the release with the 13th axis

`tests/a11y/release-gate.a11y.test.ts` — pass `a11yTier` through the third argument of `evaluateReleaseGate` so the report is measured against the tier-aware 13th axis alongside the legacy 7 / 11 / 12 axes.

```ts
import { describe, expect, it } from 'vitest';
import {
  a11yFromBaseline,
  evaluateReleaseGate,
  type QualityReport,
} from '@kiwa/quality-metrics';

function baseReport(): QualityReport {
  return {
    provider: '@kiwa/example',
    version: '0.1.0',
    reportedAt: '2026-07-06T00:00:00Z',
    coverage: { line: 90, branch: 82, function: 95 },
    testCount: { behavior: 20, integration: 5, e2e: 2, total: 27 },
    fidelity: { mockCoveredMethods: 8, realTotalMethods: 10, ratio: 80 },
    perf: { p50Ms: 5, p95Ms: 50, p99Ms: 80, samples: 100 },
    mutation: { mutations: 100, killed: 80, survived: 20, killRate: 80 },
    a11y: a11yFromBaseline({
      totals: { critical: 0, serious: 0, moderate: 0, minor: 1 },
    }),
  };
}

describe('release gate — 13-axis a11y tier', () => {
  it('adds a 13th axis when a11yTier is passed', () => {
    const verdict = evaluateReleaseGate(baseReport(), {}, { a11yTier: 'test-type' });
    expect(verdict.passed).toBe(true);
    expect(verdict.axesEvaluated).toBe(8);
  });

  it('blocks a report when serious exceeds the tier ceiling', () => {
    const report = baseReport();
    report.a11y = a11yFromBaseline({
      totals: { critical: 0, serious: 5, moderate: 0 },
    });
    const verdict = evaluateReleaseGate(report, {}, { a11yTier: 'test-type' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'a11y.tier');
    expect(blocker?.threshold).toBe(3);
    expect(blocker?.actual).toBe(5);
  });

  it('fails when report.a11y is missing but a11yTier is set', () => {
    const report = baseReport();
    delete report.a11y;
    const verdict = evaluateReleaseGate(report, {}, { a11yTier: 'saas' });
    expect(verdict.passed).toBe(false);
    const blocker = verdict.blockers.find((b) => b.axis === 'a11y.tier');
    expect(blocker?.actual).toBe(Number.POSITIVE_INFINITY);
  });
});
```

`evaluateReleaseGate(report, thresholdOverrides, context)` keeps the third argument optional. Without `a11yTier`, the verdict count stays at 7 (non-AI-LLM) or 11 (AI-LLM) or 12 (with `mutationTier`) — backward compatible with every v1.11-1.29 consumer. With `a11yTier`, the count grows by one and a threshold miss surfaces as an `a11y.tier` blocker.

The `report.a11y` fallback is deliberate. A missing `a11y` block would otherwise register as 0 violations everywhere and slip past a naïve `>= threshold` check. The gate coerces the missing block to `critical: Infinity` and refuses to pass — the "no signal" case fails safe.

### 7. Run it

```bash
pnpm test:a11y
```

First run seeds the baseline in `.a11y-baseline/counter.json`. Subsequent runs regenerate the report; a regression on any future PR shows up as a diff on the baseline JSON alongside the code change.

The full end-to-end pattern lives in `packages/a11y/tests/docs-tutorial-v1.30.test.ts` — the snippet validation test that guarantees every code sample in this tutorial keeps matching the real `@kiwa/a11y` v1.1 API. Every v1.23 → v1.30 tutorial ships this snippet-validation pair; the 8-milestone streak is the SSOT for structural drift blocking.

## Where to next

- [Tutorial 57 — A11y baseline migration (0 → 34 package sweep methodology)](./57-a11y-baseline-migration)
- [Concept — A11y testing SSOT (WCAG 2.1 AA + 4-tier threshold + baseline persistence + 3-layer harness)](../concepts/a11y-testing-ssot)
- [Migration guide — v1.29 → v1.30](../migrations/v1.29-to-v1.30)
- [A11y thresholds SSOT (4-tier rationale)](../quality/a11y-thresholds)
- [Release gate SSOT (13-axis)](../quality/release-gate)
