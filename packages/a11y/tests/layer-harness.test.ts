/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it } from 'vitest';
import {
  bucketViolations,
  computeTotals,
  isHarnessOk,
  runLayerHarness,
  summariseHarness,
  unionByRule,
  zeroImpacts,
  type AxeViolation,
  type HarnessReport,
} from '../src/index.js';

const ORIGINAL = document.body.innerHTML;
afterEach(() => {
  document.body.innerHTML = ORIGINAL;
});

function violation(
  id: string,
  impact: AxeViolation['impact'],
  nodes = 1,
): AxeViolation {
  return {
    id,
    impact,
    description: '',
    help: `help ${id}`,
    helpUrl: '',
    nodes: Array.from({ length: nodes }, () => ({ target: [`.${id}`], html: '' })),
  };
}

describe('bucketViolations', () => {
  it('groups violations by impact and preserves node counts', () => {
    const result = bucketViolations([
      violation('a', 'critical', 2),
      violation('b', 'serious'),
      violation('c', 'moderate'),
      violation('d', 'minor'),
    ]);
    expect(result.counts).toEqual({ critical: 1, serious: 1, moderate: 1, minor: 1 });
    expect(result.surviving).toEqual([
      { id: 'a', impact: 'critical', help: 'help a', nodes: 2 },
      { id: 'b', impact: 'serious', help: 'help b', nodes: 1 },
      { id: 'c', impact: 'moderate', help: 'help c', nodes: 1 },
      { id: 'd', impact: 'minor', help: 'help d', nodes: 1 },
    ]);
  });

  it('records null-impact violations in surviving without touching counts', () => {
    const result = bucketViolations([violation('x', null)]);
    expect(result.counts).toEqual(zeroImpacts());
    expect(result.surviving[0]).toEqual({ id: 'x', impact: null, help: 'help x', nodes: 1 });
  });

  it('handles an empty input by returning zero counts and an empty surviving list', () => {
    const result = bucketViolations([]);
    expect(result.counts).toEqual(zeroImpacts());
    expect(result.surviving).toEqual([]);
  });
});

describe('unionByRule', () => {
  it('deduplicates by rule id — first occurrence wins', () => {
    const merged = unionByRule(
      [violation('shared', 'critical', 3), violation('ssr-only', 'moderate')],
      [violation('shared', 'critical', 99), violation('hydrated-only', 'serious')],
    );
    expect(merged.map((v) => v.id)).toEqual(['shared', 'ssr-only', 'hydrated-only']);
    expect(merged.find((v) => v.id === 'shared')?.nodes).toHaveLength(3);
  });

  it('returns the whole b-side when a-side is empty', () => {
    const merged = unionByRule([], [violation('only', 'serious')]);
    expect(merged.map((v) => v.id)).toEqual(['only']);
  });

  it('returns the whole a-side when b-side is empty', () => {
    const merged = unionByRule([violation('only', 'critical')], []);
    expect(merged.map((v) => v.id)).toEqual(['only']);
  });
});

describe('computeTotals', () => {
  it('sums applicable layers only', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: {
        layer: 'jsdom',
        applicable: true,
        violations: { critical: 0, serious: 1, moderate: 2, minor: 0 },
        surviving: [],
      },
      playwright: {
        layer: 'playwright',
        applicable: false,
        reason: 'no fixture',
        violations: { critical: 99, serious: 99, moderate: 99, minor: 99 },
        surviving: [],
      },
      ssrHydration: {
        layer: 'ssrHydration',
        applicable: true,
        violations: { critical: 0, serious: 0, moderate: 1, minor: 3 },
        surviving: [],
      },
    };
    expect(computeTotals(layers)).toEqual({ critical: 0, serious: 1, moderate: 3, minor: 3 });
  });

  it('returns zeros when every layer is absent', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: { layer: 'jsdom', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
      playwright: { layer: 'playwright', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
      ssrHydration: { layer: 'ssrHydration', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
    };
    expect(computeTotals(layers)).toEqual(zeroImpacts());
  });
});

describe('isHarnessOk', () => {
  it('treats an absent layer as passing', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: { layer: 'jsdom', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
      playwright: { layer: 'playwright', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
      ssrHydration: { layer: 'ssrHydration', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
    };
    expect(isHarnessOk(layers)).toBe(true);
  });

  it('fails when any applicable layer has critical > 0', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: {
        layer: 'jsdom',
        applicable: true,
        violations: { critical: 1, serious: 0, moderate: 0, minor: 0 },
        surviving: [],
      },
      playwright: { layer: 'playwright', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
      ssrHydration: { layer: 'ssrHydration', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
    };
    expect(isHarnessOk(layers)).toBe(false);
  });

  it('passes when applicable layers are all critical-clean, even with serious hits', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: {
        layer: 'jsdom',
        applicable: true,
        violations: { critical: 0, serious: 3, moderate: 0, minor: 0 },
        surviving: [],
      },
      playwright: { layer: 'playwright', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
      ssrHydration: { layer: 'ssrHydration', applicable: false, reason: '', violations: zeroImpacts(), surviving: [] },
    };
    expect(isHarnessOk(layers)).toBe(true);
  });
});

describe('runLayerHarness', () => {
  it('with no fixtures, every layer is absent and totals are zero', async () => {
    const report = await runLayerHarness(
      '@kiwa-test/core',
      {},
      new Date('2026-07-06T00:00:00Z'),
    );
    expect(report.package).toBe('@kiwa-test/core');
    expect(report.generatedAt).toBe('2026-07-06T00:00:00.000Z');
    expect(report.layers.jsdom.applicable).toBe(false);
    expect(report.layers.playwright.applicable).toBe(false);
    expect(report.layers.ssrHydration.applicable).toBe(false);
    expect(report.totals).toEqual(zeroImpacts());
    expect(report.ok).toBe(true);
  });

  it('with a jsdom fixture pointing at labelled markup, records applicable + zero violations', async () => {
    document.body.innerHTML = `<div id="root"><button type="button" aria-label="ok">ok</button></div>`;
    const report = await runLayerHarness('@kiwa-test/ui', {
      jsdom: { context: document.getElementById('root') as Element },
    });
    expect(report.layers.jsdom.applicable).toBe(true);
    expect(report.layers.jsdom.violations.critical).toBe(0);
    expect(report.ok).toBe(true);
  });

  it('with a jsdom fixture pointing at unlabeled markup, records the button-name violation', async () => {
    document.body.innerHTML = `<div id="root"><button type="button"></button></div>`;
    const report = await runLayerHarness('@kiwa-test/ui', {
      jsdom: { context: document.getElementById('root') as Element },
    });
    expect(report.layers.jsdom.applicable).toBe(true);
    expect(report.layers.jsdom.surviving.map((v) => v.id)).toContain('button-name');
  });

  it('with a playwright fixture, records the pre-run axe results verbatim', async () => {
    const report = await runLayerHarness('@kiwa-test/e2e', {
      playwright: {
        results: {
          violations: [violation('color-contrast', 'serious')],
          passes: [],
          incomplete: [],
          inapplicable: [],
        },
      },
    });
    expect(report.layers.playwright.applicable).toBe(true);
    expect(report.layers.playwright.violations.serious).toBe(1);
    expect(report.layers.playwright.surviving[0]?.id).toBe('color-contrast');
  });

  it('with an SSR string, parses it, runs axe, and records violations', async () => {
    const report = await runLayerHarness('@kiwa-test/nextjs', {
      ssrHydration: {
        ssrHtml: `<button type="button"></button>`,
      },
    });
    expect(report.layers.ssrHydration.applicable).toBe(true);
    expect(report.layers.ssrHydration.surviving.map((v) => v.id)).toContain('button-name');
  });

  it('with SSR + hydrated fixtures, unions violations without double-counting by rule id', async () => {
    document.body.innerHTML = `<div id="hydrated"><button type="button"></button></div>`;
    const hydrated = document.getElementById('hydrated') as Element;
    const report = await runLayerHarness('@kiwa-test/nextjs', {
      ssrHydration: {
        ssrHtml: `<button type="button"></button>`,
        hydrated,
      },
    });
    // Both SSR and hydrated emit the same rule id — union dedupes it to one.
    const buttonNameCount = report.layers.ssrHydration.surviving.filter(
      (v) => v.id === 'button-name',
    ).length;
    expect(buttonNameCount).toBe(1);
  });

  it('records aggregate totals across applicable layers', async () => {
    document.body.innerHTML = `<div id="root"><button type="button"></button></div>`;
    const report = await runLayerHarness('@kiwa-test/mixed', {
      jsdom: { context: document.getElementById('root') as Element },
      playwright: {
        results: {
          violations: [violation('color-contrast', 'serious')],
          passes: [],
          incomplete: [],
          inapplicable: [],
        },
      },
    });
    // jsdom emits button-name (serious/critical impact varies by axe version);
    // playwright layer adds 1 serious. Total serious >= 1.
    expect(report.totals.serious).toBeGreaterThanOrEqual(1);
  });
});

describe('summariseHarness', () => {
  it('reports the no-DOM shortcut when every layer is absent', async () => {
    const report = await runLayerHarness('@kiwa-test/core', {});
    expect(summariseHarness(report)).toContain('no applicable layers');
  });

  it('surfaces the applicable-layer violation summary', async () => {
    document.body.innerHTML = `<button type="button"></button>`;
    const report = await runLayerHarness('@kiwa-test/ui', {
      jsdom: { context: document.body },
    });
    // The summary uses reportViolations' phrasing.
    const summary = summariseHarness(report);
    expect(summary.length).toBeGreaterThan(0);
  });
});

describe('runLayerHarness — SSR without jsdom-like document', () => {
  it('throws a helpful error when document is missing', async () => {
    const original = globalThis.document;
    // @ts-expect-error deliberate teardown of global document for this test only
    delete globalThis.document;
    try {
      await expect(
        runLayerHarness('@kiwa-test/nextjs', {
          ssrHydration: { ssrHtml: `<button></button>` },
        }),
      ).rejects.toThrow(/jsdom-like global document/);
    } finally {
      globalThis.document = original;
    }
  });
});
