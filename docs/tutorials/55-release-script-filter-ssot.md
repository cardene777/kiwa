# Release script filter SSOT — turning a 4-time recurring bug into an invariant in 15 min

## What you'll build

A provider-neutral `ReleaseInvariantsAdapter` with two implementations — a **mock adapter** backed by `@kiwa/release-invariants` v0.1's `checkReleaseScriptFilter` + `checkProvenanceFlagAbsence` + `checkGateScriptPackageCoverage` + `buildReleaseInvariantsSummary`, and a **file adapter** stub that reads the real `package.json` under `REPO_ROOT`. Both satisfy the same 4-op contract (`loadPublishable` / `checkFilter` / `checkProvenance` / `checkGateCoverage`), so a fidelity harness can diff them against a repository under audit. This is the exact pattern the release-smoke `release-script-filter.test.ts` (v1.29-1, PR #989) uses to run 40 per-package assertions against the root `package.json` release script.

## Prerequisites

- Node.js ≥ 20
- `pnpm` (or npm / yarn)
- An empty directory to work in

## Step-by-step build

### 1. Bootstrap the project

```bash
mkdir kiwa-release-invariants && cd kiwa-release-invariants
pnpm init
pnpm add -D @kiwa/release-invariants@^0.1 vitest typescript @types/node
```

`package.json`:

```json
{
  "type": "module",
  "scripts": {
    "test": "vitest run"
  }
}
```

### 2. Define the provider-neutral adapter contract

`src/adapters/interface.ts` — the 4 ops any release-invariants source exposes when the 3 invariants (filter / provenance / gate coverage) all apply.

```ts
import type {
  PublishablePackage,
  ReleaseInvariantsSummary,
} from '@kiwa/release-invariants';

export interface ReleaseInvariantsAdapter {
  readonly mode: 'file' | 'mock';

  loadPublishable(): Promise<PublishablePackage[]>;

  loadReleaseScript(): Promise<string>;

  loadMutationGateScript(): Promise<string>;

  summarize(): Promise<ReleaseInvariantsSummary>;
}
```

The adapter is intentionally thin. Every reader — release-smoke, docs snippet validation, a downstream monorepo's own gate — only needs the 3 script strings + the publishable list to construct the same summary shape.

### 3. Write the mock adapter using `@kiwa/release-invariants`

`src/adapters/mock.ts` — a fully in-memory adapter that pretends to have loaded a `package.json` and returns a caller-supplied summary.

```ts
import {
  buildReleaseInvariantsSummary,
  type PublishablePackage,
  type ReleaseInvariantsSummary,
} from '@kiwa/release-invariants';
import type { ReleaseInvariantsAdapter } from './interface.js';

export interface MockReleaseInvariantsInput {
  publishable: PublishablePackage[];
  releaseScript: string;
  mutationGateScript: string;
}

export function createMockReleaseInvariants(
  input: MockReleaseInvariantsInput,
): ReleaseInvariantsAdapter {
  return {
    mode: 'mock',
    async loadPublishable() {
      return input.publishable;
    },
    async loadReleaseScript() {
      return input.releaseScript;
    },
    async loadMutationGateScript() {
      return input.mutationGateScript;
    },
    async summarize(): Promise<ReleaseInvariantsSummary> {
      return buildReleaseInvariantsSummary({
        publishable: input.publishable,
        releaseScript: input.releaseScript,
        mutationGateScript: input.mutationGateScript,
      });
    },
  };
}
```

### 4. Write behavior tests — the RED → GREEN cycle

`tests/adapter.test.ts` — 4 tests that pin the exact failure mode v1.14 / v1.25 / v1.27 / v1.28 rediscovered.

```ts
import { describe, expect, it } from 'vitest';
import { createMockReleaseInvariants } from '../src/adapters/mock.js';

const PUBLISHABLE = [
  { name: '@kiwa/core' },
  { name: '@kiwa/realtime' },
];

describe('release invariants', () => {
  it('reports ok when both halves + no provenance + mutation coverage all pass', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime build && ' +
        'pnpm publish --filter @kiwa/core --filter @kiwa/realtime',
      mutationGateScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(true);
  });

  it('reports partial when the build filter is present but the publish filter is missing', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime build && ' +
        'pnpm publish --filter @kiwa/core',
      mutationGateScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(false);
    expect(summary.releaseScriptFilter.missingPublishFilter).toEqual([
      '@kiwa/realtime',
    ]);
  });

  it('reports provenance flag creep back when --provenance is next to pnpm publish', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime build && ' +
        'pnpm publish --filter @kiwa/core --filter @kiwa/realtime --provenance',
      mutationGateScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(false);
    expect(summary.provenanceFlagAbsence.provenanceFlagPresent).toBe(true);
    expect(summary.provenanceFlagAbsence.excerpts.length).toBeGreaterThan(0);
  });

  it('reports missing mutation coverage when the gate script omits a publishable package', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa/core -F @kiwa/realtime build && ' +
        'pnpm publish --filter @kiwa/core --filter @kiwa/realtime',
      mutationGateScript: 'pnpm -F @kiwa/core run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(false);
    expect(summary.gateScriptPackageCoverage.missingMutationFilter).toEqual([
      '@kiwa/realtime',
    ]);
  });
});
```

### 5. Run the tests

```bash
pnpm test
```

The 4 tests pass on the mock adapter with zero I/O — the invariants are pure functions over 3 strings.

## What the tests protect

- **Half-only filter** (v1.14 payment, v1.25 perf-harness, v1.27 quality-metrics, v1.28 realtime). An `-F` without a matching `--filter` builds the package but never publishes it — the npm registry silently stays behind by one minor version.
- **Provenance flag creep** (v1.14 removal). A well-meaning contributor re-adds `--provenance` next to `pnpm publish`; npm CLI 10 refuses to sign without OIDC federation; the release exits non-zero mid-milestone. The invariant catches the token before the release script runs.
- **Mutation gate coverage drift** (v1.27 sweep). If `test:mutation` omits a publishable package, the mutation baseline the release gate reads is missing that package's kill-rate. The gate passes without ever asking. The invariant walks the publishable list against the mutation script and fails fast if any entry is absent.

## Wiring the file adapter for a real repo

`src/adapters/file.ts` — the shape a real release-smoke suite uses, reading the 3 strings from the root `package.json`.

```ts
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildReleaseInvariantsSummary } from '@kiwa/release-invariants';
import type { ReleaseInvariantsAdapter } from './interface.js';

interface RootPackageJson {
  scripts?: {
    release?: string;
    'test:mutation'?: string;
  };
}

export function createFileReleaseInvariants(input: {
  repoRoot: string;
  publishable: { name: string }[];
}): ReleaseInvariantsAdapter {
  let cachedRelease: string | null = null;
  let cachedMutation: string | null = null;

  async function loadRoot(): Promise<RootPackageJson> {
    const raw = await readFile(resolve(input.repoRoot, 'package.json'), 'utf8');
    return JSON.parse(raw) as RootPackageJson;
  }

  return {
    mode: 'file',
    async loadPublishable() {
      return input.publishable;
    },
    async loadReleaseScript() {
      if (cachedRelease !== null) return cachedRelease;
      const root = await loadRoot();
      cachedRelease = root.scripts?.release ?? '';
      return cachedRelease;
    },
    async loadMutationGateScript() {
      if (cachedMutation !== null) return cachedMutation;
      const root = await loadRoot();
      cachedMutation = root.scripts?.['test:mutation'] ?? '';
      return cachedMutation;
    },
    async summarize() {
      return buildReleaseInvariantsSummary({
        publishable: input.publishable,
        releaseScript: await this.loadReleaseScript(),
        mutationGateScript: await this.loadMutationGateScript(),
      });
    },
  };
}
```

The mock and file adapters are shape-compatible — every downstream test targets the `ReleaseInvariantsAdapter` contract, and the fidelity harness diffs the summary rows.

## Next steps

- Read `docs/concepts/release-invariants.md` for the SSOT catalog of all 3 invariants + their systematic root cause pattern (v1.14 → v1.28 4-time rediscovery + v1.29 SSOT).
- Read `docs/migrations/v1.28-to-v1.29.md` for the additive, non-breaking, opt-in migration path — every existing release script keeps working; the invariants layer on top.
- Wire the adapter into your own repo's release-smoke suite so the systematic root cause pattern never surfaces a 5th time.
