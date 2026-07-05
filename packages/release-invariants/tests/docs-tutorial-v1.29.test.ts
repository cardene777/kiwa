/**
 * v1.29-3 docs 補強 (Issue #988) — tutorial 55 code snippet 検証。
 *
 * `docs/tutorials/55-release-script-filter-ssot.md` に載っている code snippet
 * が実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 の
 * docs-tutorial-v*.test.ts と同 pattern。 7 milestone 連続 pattern
 * (v1.23-v1.29) を確立する。
 *
 * v1.29 は @kiwa-test/release-invariants v0.1 の 3 pure invariant checker
 * (checkReleaseScriptFilter + checkProvenanceFlagAbsence +
 * checkGateScriptPackageCoverage) + 1-shot buildReleaseInvariantsSummary
 * aggregator を扱う。 tutorial 55 は systematic root cause pattern SSOT の
 * walkthrough (mock adapter + file adapter + 4 behavior test の RED/GREEN
 * cycle)。 tutorial 内の TypeScript snippet を behavior test で 1:1 に走らせ
 * る。 file adapter (fs 経路) は tutorial 内で shape 説明のみとし、 mock
 * adapter で 4 invariant scenario を網羅する。
 */
import { describe, expect, it } from 'vitest';
import {
  buildReleaseInvariantsSummary,
  checkGateScriptPackageCoverage,
  checkProvenanceFlagAbsence,
  checkReleaseScriptFilter,
  type PublishablePackage,
  type ReleaseInvariantsSummary,
} from '../src/index.js';

// ---------------------------------------------------------------------------
// Tutorial 55 — Section 2 adapter contract shape
// ---------------------------------------------------------------------------

interface ReleaseInvariantsAdapter {
  readonly mode: 'file' | 'mock';
  loadPublishable(): Promise<PublishablePackage[]>;
  loadReleaseScript(): Promise<string>;
  loadMutationGateScript(): Promise<string>;
  summarize(): Promise<ReleaseInvariantsSummary>;
}

// ---------------------------------------------------------------------------
// Tutorial 55 — Section 3 mock adapter
// ---------------------------------------------------------------------------

interface MockReleaseInvariantsInput {
  publishable: PublishablePackage[];
  releaseScript: string;
  mutationGateScript: string;
}

function createMockReleaseInvariants(
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

// ---------------------------------------------------------------------------
// Tutorial 55 — Section 4 behavior tests (4 RED/GREEN scenarios)
// ---------------------------------------------------------------------------

const PUBLISHABLE: PublishablePackage[] = [
  { name: '@kiwa-test/core' },
  { name: '@kiwa-test/realtime' },
];

describe('tutorial 55 — release invariants', () => {
  it('reports ok when both halves + no provenance + mutation coverage all pass', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && ' +
        'pnpm publish --filter @kiwa-test/core --filter @kiwa-test/realtime',
      mutationGateScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(true);
    expect(summary.releaseScriptFilter.ok).toBe(true);
    expect(summary.provenanceFlagAbsence.ok).toBe(true);
    expect(summary.gateScriptPackageCoverage.ok).toBe(true);
  });

  it('reports partial when the build filter is present but the publish filter is missing', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && ' +
        'pnpm publish --filter @kiwa-test/core',
      mutationGateScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(false);
    expect(summary.releaseScriptFilter.ok).toBe(false);
    expect(summary.releaseScriptFilter.missingPublishFilter).toEqual([
      '@kiwa-test/realtime',
    ]);
    expect(summary.releaseScriptFilter.missingBuildFilter).toEqual([]);
    // the offending package's entry has partial=true
    const realtime = summary.releaseScriptFilter.entries.find(
      (e) => e.name === '@kiwa-test/realtime',
    )!;
    expect(realtime.partial).toBe(true);
    expect(realtime.buildFilterPresent).toBe(true);
    expect(realtime.publishFilterPresent).toBe(false);
  });

  it('reports provenance flag creep back when --provenance is next to pnpm publish', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && ' +
        'pnpm publish --filter @kiwa-test/core --filter @kiwa-test/realtime --provenance',
      mutationGateScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(false);
    expect(summary.provenanceFlagAbsence.ok).toBe(false);
    expect(summary.provenanceFlagAbsence.provenanceFlagPresent).toBe(true);
    expect(summary.provenanceFlagAbsence.excerpts.length).toBeGreaterThan(0);
    expect(summary.provenanceFlagAbsence.excerpts[0]).toContain('--provenance');
  });

  it('reports missing mutation coverage when the gate script omits a publishable package', async () => {
    const adapter = createMockReleaseInvariants({
      publishable: PUBLISHABLE,
      releaseScript:
        'pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && ' +
        'pnpm publish --filter @kiwa-test/core --filter @kiwa-test/realtime',
      mutationGateScript: 'pnpm -F @kiwa-test/core run test:mutation',
    });
    const summary = await adapter.summarize();
    expect(summary.ok).toBe(false);
    expect(summary.gateScriptPackageCoverage.ok).toBe(false);
    expect(summary.gateScriptPackageCoverage.missingMutationFilter).toEqual([
      '@kiwa-test/realtime',
    ]);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 55 — cross-check with direct API (bypassing the adapter)
// ---------------------------------------------------------------------------

describe('tutorial 55 — direct API cross-check', () => {
  it('checkReleaseScriptFilter reports both halves for the happy path', () => {
    const result = checkReleaseScriptFilter(
      'pnpm -F @kiwa-test/core -F @kiwa-test/realtime build && ' +
        'pnpm publish --filter @kiwa-test/core --filter @kiwa-test/realtime',
      PUBLISHABLE,
    );
    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(2);
    expect(result.entries.every((e) => e.ok)).toBe(true);
    expect(result.entries.every((e) => !e.partial)).toBe(true);
  });

  it('checkProvenanceFlagAbsence reports no excerpts for a clean script', () => {
    const result = checkProvenanceFlagAbsence(
      'pnpm publish --filter @kiwa-test/core --access public --no-git-checks',
    );
    expect(result.ok).toBe(true);
    expect(result.provenanceFlagPresent).toBe(false);
    expect(result.excerpts).toEqual([]);
  });

  it('checkProvenanceFlagAbsence caps excerpts at 3 for repeated occurrences', () => {
    const result = checkProvenanceFlagAbsence(
      Array.from({ length: 10 })
        .map(() => 'pnpm publish --filter x --provenance')
        .join(' && '),
    );
    expect(result.ok).toBe(false);
    expect(result.excerpts).toHaveLength(3);
  });

  it('checkGateScriptPackageCoverage reports every publishable package', () => {
    const result = checkGateScriptPackageCoverage(
      'pnpm -F @kiwa-test/core -F @kiwa-test/realtime run test:mutation',
      PUBLISHABLE,
    );
    expect(result.ok).toBe(true);
    expect(result.entries).toHaveLength(2);
    expect(result.missingMutationFilter).toEqual([]);
  });
});
