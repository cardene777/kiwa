# Perf baseline migration — transfer the pattern from 3 packages to 33 in 15 min

## What you'll build

The v1.25 milestone (Issue #926) applied `@kiwa/perf-harness` v0.2 to every kiwa package. This tutorial captures the exact recipe you follow when a new package (or a fork of the monorepo) needs to join the sweep — the same primitives from tutorial 45, wired up through the 3-layer harness (`runPerf3Layer`) so that serial + concurrent + memory all get gated in one pass. Follow the 6 steps below and any pure package gets a p95 baseline + regression detector in under 15 minutes. This is the pattern kiwa's 33 packages already use, spelled out step-by-step.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- A kiwa monorepo checkout (or a fork with the same `packages/*` layout)

## Step-by-step migration

### 1. Pick the primary API paths

For a package with 5-10 exported functions, pick the 2-3 that downstream users call most. In `@kiwa/core`, that is `parseSpec` (spec markdown → structured spec) + `createPool` (async resource pool). In `@kiwa/dapp`, it is `contractCall` + `readStorageSlot`. In `@kiwa/edge`, it is `invokeEdgeHandler` + `kvRead` + `kvWrite`.

The rule is that each op should exercise a distinct primary code path, not a variation of the same one. Measuring 3 slightly different reads of the same KV is noise; measuring `parseSpec` + `createPool` catches independent regressions in independent modules.

### 2. Create the perf test directory

```bash
mkdir -p packages/my-package/tests/perf
touch packages/my-package/tests/perf/my-package.perf.ts
```

By convention, the filename ends in `.perf.ts` so the vitest workspace filter can pick it up with `pnpm test:perf` without dragging in unit tests.

### 3. Wire the 3-layer harness

`packages/my-package/tests/perf/my-package.perf.ts` — one `runPerf3Layer` call, one op per primary path.

```ts
import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { resolveKiwaRepoRoot, runPerf3Layer } from '@kiwa/perf-harness';
import { primaryApi, secondaryApi } from '../../src/index.js';

const MODULE = 'my-package';
const REPORT_PATH = path.join(
  resolveKiwaRepoRoot(process.cwd()),
  'docs/quality-reports/perf',
  `${MODULE}.md`,
);

describe(MODULE, () => {
  it(
    '3-layer perf: primaryApi + secondaryApi primary paths',
    async () => {
      const result = await runPerf3Layer({
        moduleName: MODULE,
        reportPath: REPORT_PATH,
        ops: [
          {
            name: 'primaryApi',
            serialP95CapMs: 5,
            fn: () => {
              primaryApi({ input: 'hello' });
            },
          },
          {
            name: 'secondaryApi',
            serialP95CapMs: 10,
            fn: async () => {
              await secondaryApi({ id: 'x' });
            },
          },
        ],
      });

      for (const outcome of result.outcomes) {
        expect.soft(outcome.serialGatePassed, `${outcome.name} serial p95`).toBe(true);
        expect.soft(outcome.concurrentGatePassed, `${outcome.name} concurrent p95`).toBe(true);
        expect.soft(outcome.memoryGatePassed, `${outcome.name} memory arrayBuffers`).toBe(true);
      }
      expect(result.allPassed).toBe(true);
    },
    120_000,
  );
});
```

Three things to notice.

- `resolveKiwaRepoRoot(process.cwd())` walks up until it finds a `package.json` with `"name": "kiwa-monorepo"`. That lets the report path work regardless of vitest's cwd (root workspace vs per-package invocation).
- `serialP95CapMs` is the per-op hard cap. The concurrent cap defaults to 2× the serial cap; override with `concurrentP95CapMs` when your op scales worse than linearly under load.
- `expect.soft` accumulates every gate failure before the terminal `expect(result.allPassed).toBe(true)` — so one failing op does not mask the other's status in the report.

### 4. Add the `test:perf` script

`packages/my-package/package.json` — mirror the pattern used across the existing 33 packages.

```json
{
  "scripts": {
    "test:perf": "node --expose-gc ./node_modules/vitest/vitest.mjs run tests/perf"
  }
}
```

`--expose-gc` gives `measureMemory` a chance to call `global.gc()` before each sample — otherwise the `arrayBuffers` delta reading is noisier. The `runPerf3Layer` internals falls back to a delta without forced GC when `--expose-gc` is missing, so the test still passes without the flag; it just gets more variance.

### 5. Seed the baseline on the first run

```bash
pnpm --filter @kiwa/my-package test:perf
```

On the first invocation, `runPerf3Layer` writes `packages/my-package/.perf-baseline/my-package.json` because `loadBaseline` returned `null`. On subsequent runs, it reads the baseline and every op's `regressionVerdict` reflects the delta against the persisted baseline (`stable` / `improved` / `regressed`).

Commit the baseline JSON to lock the envelope into the repo — a regression on a future PR then shows up as a diff in `.perf-baseline/my-package.json` alongside the code change.

### 6. Register with the workspace filter

`package.json` (repo root) — add the package to the `test:perf` sweep list so `pnpm test:perf` in the root workspace runs your new suite alongside the existing 32.

```json
{
  "scripts": {
    "test:perf": "pnpm -r --filter '@kiwa/*' test:perf"
  }
}
```

The `-r --filter '@kiwa/*'` glob picks up every workspace package named `@kiwa/…` automatically, so as long as your `package.json` name follows the convention, no additional wiring is required.

## Migration verification checklist

- [ ] `tests/perf/{package}.perf.ts` exists with one `runPerf3Layer` call per package
- [ ] `test:perf` script in `package.json` runs vitest under `--expose-gc`
- [ ] `.perf-baseline/{package}.json` committed after first run
- [ ] `docs/quality-reports/perf/{package}.md` regenerated with the 3-layer table
- [ ] `pnpm test:perf` at repo root includes the package in the sweep
- [ ] p95 stays under the per-op `serialP95CapMs` cap
- [ ] Memory arrayBuffers delta stays under 100 KB across 200 iterations

## Pattern references — the 3 pilot packages

The v1.13 milestone seeded `@kiwa/ai-llm`, `@kiwa/quality-metrics`, and `@kiwa/realtime` with the initial `measure` + `saveBaseline` pattern. v1.25 generalises the pattern to every other package. If you want to see the exact shape of a production-grade perf suite, read.

- [`packages/core/tests/perf/core.perf.ts`](https://github.com/cardene777/kiwa/blob/main/packages/core/tests/perf/core.perf.ts) — the reference implementation on `parseSpec` + `createPool`. Two ops, both pure, both sub-5-ms p95 caps.
- [`packages/edge/tests/perf/edge.perf.ts`](https://github.com/cardene777/kiwa/blob/main/packages/edge/tests/perf/edge.perf.ts) — a stateful example with 8 axes (durable-object / websocket / kv / geo / cron / subrequest / cpu / streaming). Shows how to compose multiple op specs that share setup.
- [`packages/auth/tests/perf/auth.perf.ts`](https://github.com/cardene777/kiwa/blob/main/packages/auth/tests/perf/auth.perf.ts) — a provider-heavy example (6 providers × 4 protocols) with provider-specific `serialP95CapMs` overrides.

Follow any of the three as a template and the migration cost per new package is 10-15 minutes.

## Where to next

- [Tutorial 45 — Perf-harness baseline (p95 walkthrough)](./45-perf-harness-baseline)
- [Concept — Perf-testing SSOT (p50 / p95 / p99 + baseline persistence + regression detection SSOT)](../concepts/perf-testing-ssot)
- [Migration guide — v1.24 → v1.25](../migrations/v1.24-to-v1.25)
- [Release gate SSOT (11-axis)](../quality/release-gate)
