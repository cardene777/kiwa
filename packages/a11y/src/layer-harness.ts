/**
 * 3-layer a11y harness (v1.30-2).
 *
 * Every kiwa package publishes an `.axe-config.mjs` whose `layers` field
 * enumerates which of the three audit layers a package participates in:
 *
 *   - `jsdom`         — static DOM audit (axe-core over a jsdom Element).
 *   - `playwright`    — dynamic browser audit (axe-core over a Playwright Page).
 *   - `ssrHydration`  — SSR + hydration diff audit (axe-core over the SSR
 *                       string parsed into a jsdom Element, plus a hydrated
 *                       Element if supplied — violations are the union with
 *                       provenance recorded).
 *
 * A package with no runtime DOM (all `@kiwa-test/*` packages currently — every
 * one of them is a test-adapter package that returns lightweight JSX-like
 * trees, not real DOM) marks each layer `applicable: false`. axe still needs
 * to *run* at least once per layer to prove the harness is wired, so an
 * `absent` layer records an explicit `absent` reason instead of running axe.
 *
 * SSOT: docs/quality/a11y-thresholds.md § 3-layer harness.
 */
import type {
  AuditOptions,
  AxeResults,
  AxeViolation,
} from './types.js';
import { runAxe, reportViolations } from './audit.js';

/** Impact buckets in the order axe-core emits them. */
export const IMPACTS = ['critical', 'serious', 'moderate', 'minor'] as const;
export type Impact = (typeof IMPACTS)[number];

/**
 * Per-layer violation summary — the shape that lands in
 * `.a11y-baseline/{pkg}.json`. `applicable: false` means the package
 * intentionally does not participate in the layer (e.g. Core-tier no-DOM
 * package skipping the Playwright layer). `applicable: true` records axe's
 * verdict.
 */
export interface LayerReport {
  layer: 'jsdom' | 'playwright' | 'ssrHydration';
  applicable: boolean;
  /** One-line reason recorded when applicable is false. */
  reason?: string;
  violations: Record<Impact, number>;
  /** Rule ids of every surviving violation, deduplicated per layer. */
  surviving: Array<{ id: string; impact: Impact | null; help: string; nodes: number }>;
}

/** Aggregated 3-layer report — the whole baseline payload for one package. */
export interface HarnessReport {
  package: string;
  generatedAt: string;
  layers: {
    jsdom: LayerReport;
    playwright: LayerReport;
    ssrHydration: LayerReport;
  };
  /** Sum of all impact counts across every applicable layer. */
  totals: Record<Impact, number>;
  /** True when every layer either passed axe or is explicitly absent. */
  ok: boolean;
}

/**
 * Fixture surface a `.axe-config.mjs` can hand to the harness. A missing field
 * means the layer is `absent` — the harness records that verdict without
 * spinning up axe (the corresponding cost — jsdom construction, Playwright
 * browser boot, SSR string render — is skipped).
 */
export interface HarnessFixtures {
  jsdom?: {
    /** Element / Document / selector to hand to axe-core. */
    context: AuditOptions['context'];
    /** Optional axe-core `runOptions` override for this layer. */
    runOptions?: AuditOptions['runOptions'];
  };
  playwright?: {
    /**
     * Awaited result of `page.evaluate(() => axe.run(document, opts))` —
     * axe-playwright caller is responsible for wiring; the harness only
     * aggregates the result to keep this module Playwright-free at build
     * time (Playwright is a peerDep, not a dep, so requiring it at import
     * time would break Node-only consumers).
     */
     results: AxeResults;
  };
  ssrHydration?: {
    /** SSR HTML string produced by the framework adapter under test. */
    ssrHtml: string;
    /**
     * Optional post-hydration Element — when supplied, axe runs against both
     * the SSR-parsed Element and this Element, and violations are unioned by
     * rule id with provenance recorded per layer.
     */
    hydrated?: Element | Document;
    /** Optional axe-core `runOptions` override for this layer. */
    runOptions?: AuditOptions['runOptions'];
  };
}

/** Empty impact bucket used both as the zero baseline and as a reset target. */
export function zeroImpacts(): Record<Impact, number> {
  return { critical: 0, serious: 0, moderate: 0, minor: 0 };
}

/**
 * Bucket a set of axe violations by impact, returning the same shape as
 * `LayerReport.violations`. Exported so tests can call it without hitting
 * axe-core.
 */
export function bucketViolations(
  violations: AxeViolation[],
): { counts: Record<Impact, number>; surviving: LayerReport['surviving'] } {
  const counts = zeroImpacts();
  const surviving: LayerReport['surviving'] = [];
  for (const v of violations) {
    const impact = (v.impact ?? null) as Impact | null;
    if (impact !== null && impact in counts) {
      counts[impact] += 1;
    }
    surviving.push({
      id: v.id,
      impact,
      help: v.help,
      nodes: v.nodes.length,
    });
  }
  return { counts, surviving };
}

/**
 * Merge the SSR-parsed violation set with the hydrated violation set,
 * dedupliated by rule id (an SSR-only violation, a hydration-only violation
 * and a shared violation each surface once). Exposed for tests.
 */
export function unionByRule(
  a: AxeViolation[],
  b: AxeViolation[],
): AxeViolation[] {
  const seen = new Map<string, AxeViolation>();
  for (const v of [...a, ...b]) {
    if (!seen.has(v.id)) {
      seen.set(v.id, v);
    }
  }
  return [...seen.values()];
}

/** SSOT reason strings — the layer name + why the harness skipped it. */
const ABSENT_REASONS = {
  jsdom: 'no jsdom fixture — package produces no static DOM output.',
  playwright: 'no playwright fixture — package has no browser-runtime surface.',
  ssrHydration: 'no ssrHydration fixture — package emits no SSR string.',
} as const satisfies Record<LayerReport['layer'], string>;

/**
 * Build the `applicable: false` short-circuit every layer returns when its
 * fixture is missing. Kept as a helper so the three layer runners share
 * one shape and one reason source.
 */
function absentLayer(layer: LayerReport['layer']): LayerReport {
  return {
    layer,
    applicable: false,
    reason: ABSENT_REASONS[layer],
    violations: zeroImpacts(),
    surviving: [],
  };
}

/** Bundle bucketed violations into an `applicable: true` LayerReport. */
function applicableLayer(
  layer: LayerReport['layer'],
  violations: AxeViolation[],
): LayerReport {
  const { counts, surviving } = bucketViolations(violations);
  return { layer, applicable: true, violations: counts, surviving };
}

/**
 * Build an `AuditOptions` from an optional context + optional runOptions.
 * exactOptionalPropertyTypes requires each field to be omitted when undefined
 * rather than set to `undefined`, so the assembly is spelled out here.
 */
function buildAuditOptions(
  context: AuditOptions['context'] | undefined,
  runOptions: AuditOptions['runOptions'] | undefined,
): AuditOptions {
  const opts: AuditOptions = {};
  if (context !== undefined) opts.context = context;
  if (runOptions !== undefined) opts.runOptions = runOptions;
  return opts;
}

async function runJsdomLayer(
  fixture: HarnessFixtures['jsdom'],
): Promise<LayerReport> {
  if (!fixture) return absentLayer('jsdom');
  const results = await runAxe(buildAuditOptions(fixture.context, fixture.runOptions));
  return applicableLayer('jsdom', results.violations);
}

function runPlaywrightLayer(
  fixture: HarnessFixtures['playwright'],
): LayerReport {
  if (!fixture) return absentLayer('playwright');
  return applicableLayer('playwright', fixture.results.violations);
}

async function runSsrHydrationLayer(
  fixture: HarnessFixtures['ssrHydration'],
): Promise<LayerReport> {
  if (!fixture) return absentLayer('ssrHydration');
  // Parse the SSR string into a jsdom Element without pulling `jsdom` at
  // build time (it's a peerDep). Callers running under vitest with
  // environment=jsdom already have `document` on globalThis, which is the
  // supported entrypoint for this layer.
  if (typeof document === 'undefined') {
    throw new Error(
      'ssrHydration layer requires a jsdom-like global document (vitest env=jsdom).',
    );
  }
  // axe-core requires the scanned Element to be attached to the document,
  // otherwise it raises "No elements found for include in page Context".
  // Attach the SSR host, scan, then detach — the DOM is left in the state
  // the caller handed it.
  const ssrHost = document.createElement('div');
  ssrHost.innerHTML = fixture.ssrHtml;
  document.body.appendChild(ssrHost);
  let ssrResults: AxeResults;
  try {
    ssrResults = await runAxe(buildAuditOptions(ssrHost, fixture.runOptions));
  } finally {
    ssrHost.remove();
  }
  const hydratedResults = fixture.hydrated
    ? await runAxe(buildAuditOptions(fixture.hydrated, fixture.runOptions))
    : null;
  const union = unionByRule(ssrResults.violations, hydratedResults?.violations ?? []);
  return applicableLayer('ssrHydration', union);
}

/**
 * Compute the totals (sum by impact across every applicable layer) — a
 * layer marked `absent` contributes zero.
 */
export function computeTotals(
  layers: HarnessReport['layers'],
): Record<Impact, number> {
  const totals = zeroImpacts();
  for (const layer of Object.values(layers)) {
    if (!layer.applicable) continue;
    for (const impact of IMPACTS) {
      totals[impact] += layer.violations[impact];
    }
  }
  return totals;
}

/**
 * True iff every layer either produced a zero-violation axe run or is
 * explicitly absent. `critical` is the hard gate; non-critical impact
 * accounting stays in the totals so tier thresholds can still cap them.
 */
export function isHarnessOk(layers: HarnessReport['layers']): boolean {
  for (const layer of Object.values(layers)) {
    if (!layer.applicable) continue;
    if (layer.violations.critical > 0) return false;
  }
  return true;
}

/**
 * Run the 3-layer harness against a set of fixtures. Missing layers are
 * recorded as `absent`. Returns the whole baseline payload.
 *
 * @param pkgName — the `@kiwa-test/…` package name recorded in the report.
 * @param fixtures — optional per-layer fixture bundle.
 * @param now — override for `generatedAt` so tests can be deterministic.
 */
export async function runLayerHarness(
  pkgName: string,
  fixtures: HarnessFixtures = {},
  now: Date = new Date(),
): Promise<HarnessReport> {
  const layers = {
    jsdom: await runJsdomLayer(fixtures.jsdom),
    playwright: runPlaywrightLayer(fixtures.playwright),
    ssrHydration: await runSsrHydrationLayer(fixtures.ssrHydration),
  } satisfies HarnessReport['layers'];
  return {
    package: pkgName,
    generatedAt: now.toISOString(),
    layers,
    totals: computeTotals(layers),
    ok: isHarnessOk(layers),
  };
}

/**
 * Convenience — turn a `HarnessReport` into the summary string
 * `reportViolations` produces, unioned across every applicable layer.
 * Kept for symmetry with the single-layer API in `audit.ts`.
 */
export function summariseHarness(report: HarnessReport): string {
  const applicable = Object.values(report.layers).filter((l) => l.applicable);
  if (applicable.length === 0) {
    return `${report.package}: no applicable layers (Core-tier no-DOM package).`;
  }
  const all: AxeViolation[] = [];
  for (const layer of applicable) {
    for (const v of layer.surviving) {
      all.push({
        id: v.id,
        impact: v.impact,
        description: '',
        help: v.help,
        helpUrl: '',
        nodes: Array.from({ length: v.nodes }, () => ({ target: [], html: '' })),
      });
    }
  }
  return reportViolations(
    { violations: all, passes: [], incomplete: [], inapplicable: [] },
    { maxImpact: 'minor' },
  ).summary;
}
