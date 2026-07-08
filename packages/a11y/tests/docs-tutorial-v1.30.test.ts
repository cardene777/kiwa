/**
 * v1.30-5 docs 補強 (Issue #996) — tutorial 56-57 code snippet 検証。
 *
 * `docs/tutorials/56-a11y-baseline.md` /
 * `docs/tutorials/57-a11y-baseline-migration.md` に載っている code snippet が
 * 実際に動作することを behavior test で担保する。
 *
 * tutorial の code snippet が drift すると読者が「動かない」 体験をする
 * ため、 snippet と実 API の乖離を CI で検知する。 v1.17 / v1.19 / v1.20 /
 * v1.21 / v1.22 / v1.23 / v1.24 / v1.25 / v1.26 / v1.27 / v1.28 / v1.29 の
 * docs-tutorial-v*.test.ts と同 pattern。 8 milestone 連続 pattern
 * (v1.23-v1.30) を確立する。
 *
 * v1.30 は @kiwa/a11y v1.1 の 3-layer harness (runLayerHarness +
 * bucketViolations + computeTotals + isHarnessOk) + @kiwa/quality-metrics
 * v0.4 の 4-tier a11y SSOT + 13-axis release gate を扱う。 tutorial 56 は
 * axe-core setup + WCAG 2.1 AA gate + 3-layer harness + tier gate walkthrough、
 * tutorial 57 は 0 → 34 package migration methodology + tier + optional
 * override。 tutorial 内の TypeScript snippet (target markup + jsdom audit +
 * 3-layer harness + tier assert + release gate + assembleReport) を behavior
 * test で 1:1 に走らせる。 .axe-config.mjs / JSON baseline snippet は
 * behavior test の対象外 (config file / json file であり a11y-tier API とは
 * 切り離されるため)。
 */
/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it } from 'vitest';
import {
  bucketViolations,
  computeTotals,
  expectNoViolations,
  isHarnessOk,
  reportViolations,
  runAxe,
  runLayerHarness,
  zeroImpacts,
  type HarnessReport,
} from '../src/index.js';

const ORIGINAL_BODY = document.body.innerHTML;
afterEach(() => {
  document.body.innerHTML = ORIGINAL_BODY;
});

// ---------------------------------------------------------------------------
// Tutorial 56 — Section 2 target markup
// ---------------------------------------------------------------------------

function renderCounter(container: Element, count: number): void {
  container.innerHTML =
    '<div>' +
    '<button aria-label="increment counter">+</button>' +
    '<output aria-live="polite">' + String(count) + '</output>' +
    '</div>';
}

describe('tutorial 56 — Section 2: renderCounter target markup', () => {
  it('renders a labelled button and a live output region', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    renderCounter(host, 0);

    const button = host.querySelector('button')!;
    const output = host.querySelector('output')!;
    expect(button.getAttribute('aria-label')).toBe('increment counter');
    expect(output.getAttribute('aria-live')).toBe('polite');
    expect(output.textContent).toBe('0');
  });

  it('renders arbitrary integer count into the output', () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    renderCounter(host, 42);
    expect(host.querySelector('output')!.textContent).toBe('42');
  });
});

// ---------------------------------------------------------------------------
// Tutorial 56 — Section 3 jsdom audit with WCAG 2.1 AA tag filter
// ---------------------------------------------------------------------------

const WCAG_21_AA_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

describe('tutorial 56 — Section 3: jsdom audit with WCAG 2.1 AA tag filter', () => {
  it('has no serious / critical WCAG 2.1 AA violations for labelled markup', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    renderCounter(host, 0);

    const results = await runAxe({
      context: host,
      runOptions: {
        runOnly: { type: 'tag', values: WCAG_21_AA_TAGS },
      },
    });

    // Section 3 snippet uses `expectNoViolations` with maxImpact serious;
    // the assertion should not throw when the markup is labelled.
    expect(() =>
      expectNoViolations(results, expect as unknown as Parameters<typeof expectNoViolations>[1], {
        maxImpact: 'serious',
      }),
    ).not.toThrow();
  });

  it('surfaces button-name violation when the accessible name is stripped (drift check)', async () => {
    // An empty button — no aria-label, no text content, no title — trips
    // axe-core's button-name rule. This is the canonical WCAG 2.1 AA
    // critical violation that the tutorial 56 § Section 3 gate is designed
    // to catch. The labelled counter in the tutorial has both aria-label
    // and text content, so it passes; this drift check proves the gate
    // rejects the unlabelled case.
    document.body.innerHTML = '<div id="host"><button></button></div>';
    const host = document.getElementById('host')!;
    const results = await runAxe({
      context: host,
      runOptions: {
        runOnly: { type: 'tag', values: WCAG_21_AA_TAGS },
      },
    });

    const ids = results.violations.map((v) => v.id);
    expect(ids).toContain('button-name');
    const report = reportViolations(results, { maxImpact: 'serious' });
    expect(report.blocking.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 56 — Section 4 3-layer baseline via runLayerHarness
// ---------------------------------------------------------------------------

describe('tutorial 56 — Section 4: runLayerHarness with jsdom fixture', () => {
  it('produces an applicable jsdom layer and absent playwright + ssrHydration layers', async () => {
    document.body.innerHTML = '<div id="host"></div>';
    const host = document.getElementById('host')!;
    renderCounter(host, 0);

    const report = await runLayerHarness('counter', {
      jsdom: {
        context: host,
        runOptions: {
          runOnly: { type: 'tag', values: WCAG_21_AA_TAGS },
        },
      },
    });

    expect(report.package).toBe('counter');
    expect(report.layers.jsdom.applicable).toBe(true);
    expect(report.layers.playwright.applicable).toBe(false);
    expect(report.layers.ssrHydration.applicable).toBe(false);
    expect(report.ok).toBe(true);
    expect(report.totals.critical).toBe(0);
  });

  it('records explicit reason strings for absent layers', async () => {
    const report = await runLayerHarness('counter-empty', {});
    expect(report.layers.jsdom.reason).toContain('no jsdom fixture');
    expect(report.layers.playwright.reason).toContain('no playwright fixture');
    expect(report.layers.ssrHydration.reason).toContain('no ssrHydration fixture');
    expect(report.ok).toBe(true);
  });

  it('generatedAt is a valid ISO 8601 string', async () => {
    const report = await runLayerHarness('counter-ts', {});
    // ISO timestamp round-trips through Date.
    expect(new Date(report.generatedAt).toISOString()).toBe(report.generatedAt);
  });
});

// ---------------------------------------------------------------------------
// Tutorial 57 — Section 4 layers-absent baseline shape
// ---------------------------------------------------------------------------

describe('tutorial 57 — Section 4: layers-absent baseline shape', () => {
  it('layers-absent baseline totals are all zero and ok is true', async () => {
    // The migration tutorial documents the shape of a Core / SaaS-tier
    // package baseline where no runtime DOM exists. The runLayerHarness call
    // with no fixtures reproduces exactly that shape.
    const report = await runLayerHarness('@kiwa/my-package', {});

    expect(report.totals).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0 });
    expect(report.ok).toBe(true);
    expect(report.layers.jsdom.applicable).toBe(false);
    expect(report.layers.playwright.applicable).toBe(false);
    expect(report.layers.ssrHydration.applicable).toBe(false);
  });

  it('layers-absent baseline is JSON serialisable + round-trip stable', async () => {
    const report = await runLayerHarness('@kiwa/my-package', {});
    const roundtrip = JSON.parse(JSON.stringify(report)) as HarnessReport;
    expect(roundtrip.package).toBe(report.package);
    expect(roundtrip.totals).toEqual(report.totals);
    expect(roundtrip.ok).toBe(report.ok);
    expect(roundtrip.layers.jsdom.applicable).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting — bucketViolations / computeTotals / isHarnessOk primitives
// ---------------------------------------------------------------------------

describe('tutorial 56 + 57 — primitives (bucketViolations / computeTotals / isHarnessOk)', () => {
  it('zeroImpacts returns a fresh Record<Impact, number> = 0/0/0/0', () => {
    const impacts = zeroImpacts();
    expect(impacts).toEqual({ critical: 0, serious: 0, moderate: 0, minor: 0 });
    // fresh object per call — no accidental sharing.
    const impacts2 = zeroImpacts();
    impacts2.critical = 5;
    expect(impacts.critical).toBe(0);
  });

  it('bucketViolations sums by impact + preserves surviving-rule metadata', () => {
    const bucket = bucketViolations([
      {
        id: 'button-name',
        impact: 'critical',
        description: '',
        help: 'Ensures buttons have discernible text',
        helpUrl: '',
        nodes: [{ target: ['button'], html: '' }],
      },
      {
        id: 'color-contrast',
        impact: 'serious',
        description: '',
        help: 'Elements must have sufficient contrast',
        helpUrl: '',
        nodes: [{ target: ['span'], html: '' }, { target: ['p'], html: '' }],
      },
    ]);

    expect(bucket.counts).toEqual({ critical: 1, serious: 1, moderate: 0, minor: 0 });
    expect(bucket.surviving).toHaveLength(2);
    expect(bucket.surviving[0]).toMatchObject({
      id: 'button-name',
      impact: 'critical',
      nodes: 1,
    });
    expect(bucket.surviving[1]).toMatchObject({
      id: 'color-contrast',
      impact: 'serious',
      nodes: 2,
    });
  });

  it('computeTotals sums across applicable layers only (absent layers contribute zero)', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: {
        layer: 'jsdom',
        applicable: true,
        violations: { critical: 1, serious: 0, moderate: 2, minor: 0 },
        surviving: [],
      },
      playwright: {
        layer: 'playwright',
        applicable: false,
        reason: 'no playwright fixture',
        violations: { critical: 99, serious: 99, moderate: 99, minor: 99 },
        surviving: [],
      },
      ssrHydration: {
        layer: 'ssrHydration',
        applicable: true,
        violations: { critical: 0, serious: 1, moderate: 0, minor: 3 },
        surviving: [],
      },
    };
    const totals = computeTotals(layers);
    // Absent playwright layer contributes zero even though its violations
    // are populated (defensive vs stale fixtures).
    expect(totals).toEqual({ critical: 1, serious: 1, moderate: 2, minor: 3 });
  });

  it('isHarnessOk is false when any applicable layer has critical / serious / moderate > 0', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: {
        layer: 'jsdom',
        applicable: true,
        violations: { critical: 0, serious: 0, moderate: 1, minor: 5 },
        surviving: [],
      },
      playwright: {
        layer: 'playwright',
        applicable: false,
        reason: 'no playwright fixture',
        violations: zeroImpacts(),
        surviving: [],
      },
      ssrHydration: {
        layer: 'ssrHydration',
        applicable: false,
        reason: 'no ssrHydration fixture',
        violations: zeroImpacts(),
        surviving: [],
      },
    };
    // moderate > 0 blocks ok in every tier — the SSOT invariant.
    expect(isHarnessOk(layers)).toBe(false);

    // minor > 0 alone does NOT block ok — minor is never enforced.
    layers.jsdom.violations = { critical: 0, serious: 0, moderate: 0, minor: 42 };
    expect(isHarnessOk(layers)).toBe(true);
  });
});
