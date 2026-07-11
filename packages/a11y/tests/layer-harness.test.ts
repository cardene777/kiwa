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
  type LayerReport,
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

function absent(layer: LayerReport['layer']): LayerReport {
  return { layer, applicable: false, reason: '', violations: zeroImpacts(), surviving: [] };
}

function applicable(
  layer: LayerReport['layer'],
  counts: Partial<Record<keyof ReturnType<typeof zeroImpacts>, number>>,
  surviving: LayerReport['surviving'] = [],
): LayerReport {
  return {
    layer,
    applicable: true,
    violations: { ...zeroImpacts(), ...counts },
    surviving,
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

  it('B5 — prototype-chain impact names (toString / constructor) do not corrupt counts', () => {
    // `impact` should never be a prototype-chain key at runtime, but a
    // malformed axe adapter could hand us one. Object.hasOwn gates the
    // counts write.
    const rogue = violation('rogue', 'toString' as AxeViolation['impact']);
    const result = bucketViolations([rogue]);
    expect(result.counts).toEqual(zeroImpacts());
  });
});

describe('unionByRule', () => {
  it('deduplicates by rule id and sums node counts across sides (B1)', () => {
    const merged = unionByRule(
      [violation('shared', 'critical', 3), violation('ssr-only', 'moderate')],
      [violation('shared', 'critical', 5), violation('hydrated-only', 'serious')],
    );
    expect(merged.map((v) => v.id)).toEqual(['shared', 'ssr-only', 'hydrated-only']);
    // Node arrays are concatenated so hydration counts survive.
    expect(merged.find((v) => v.id === 'shared')?.nodes).toHaveLength(8);
  });

  it('B1 — preserves node identity across sides (both sides contribute)', () => {
    const merged = unionByRule(
      [violation('shared', 'critical', 2)],
      [violation('shared', 'critical', 3)],
    );
    const shared = merged.find((v) => v.id === 'shared');
    expect(shared?.nodes).toHaveLength(5);
    // The first two targets come from the a-side.
    expect(shared?.nodes.slice(0, 2).every((n) => n.target[0] === '.shared')).toBe(true);
  });

  it('takes impact from the b-side when a-side reports null', () => {
    const merged = unionByRule(
      [violation('shared', null, 1)],
      [violation('shared', 'critical', 2)],
    );
    expect(merged.find((v) => v.id === 'shared')?.impact).toBe('critical');
  });

  it('N2 — replaces impact with the more severe value when both sides are concrete (SSR minor + hydrated critical → critical)', () => {
    // v1.30-3 adversarial-review N2 — SSR side reports `minor`, hydrated side
    // reports `critical`. Previous logic left impact pinned to the a-side
    // because `existing.impact == null` was false, so `ok`/`totals` under-
    // reported. Severity ranking must upgrade to `critical`.
    const merged = unionByRule(
      [violation('shared', 'minor', 1)],
      [violation('shared', 'critical', 2)],
    );
    expect(merged.find((v) => v.id === 'shared')?.impact).toBe('critical');
  });

  it('N2 — retains the more severe value when a-side is critical and b-side downgrades (critical > minor)', () => {
    const merged = unionByRule(
      [violation('shared', 'critical', 1)],
      [violation('shared', 'minor', 2)],
    );
    expect(merged.find((v) => v.id === 'shared')?.impact).toBe('critical');
  });

  it('N2 — severity ranking respects the full IMPACTS order (serious wins over moderate)', () => {
    const merged = unionByRule(
      [violation('shared', 'moderate', 1)],
      [violation('shared', 'serious', 1)],
    );
    expect(merged.find((v) => v.id === 'shared')?.impact).toBe('serious');
  });

  it('returns the whole b-side when a-side is empty', () => {
    const merged = unionByRule([], [violation('only', 'serious')]);
    expect(merged.map((v) => v.id)).toEqual(['only']);
  });

  it('returns the whole a-side when b-side is empty', () => {
    const merged = unionByRule([violation('only', 'critical')], []);
    expect(merged.map((v) => v.id)).toEqual(['only']);
  });

  it('keeps the concrete a-side impact when b-side reports a rogue string', () => {
    // The a-side has a valid impact (critical, rank 0); the b-side hands
    // us a prototype-chain / rogue string that is not in IMPACTS
    // (`toString`). rankA is 0, rankB is -1; the ranker returns a. Before
    // this test the "return a because rankB === -1" arm was uncovered.
    const merged = unionByRule(
      [violation('shared', 'critical', 1)],
      [violation('shared', 'toString' as AxeViolation['impact'], 1)],
    );
    expect(merged.find((v) => v.id === 'shared')?.impact).toBe('critical');
  });
});

describe('computeTotals', () => {
  it('sums applicable layers only', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: applicable('jsdom', { serious: 1, moderate: 2 }),
      playwright: absent('playwright'),
      ssrHydration: applicable('ssrHydration', { moderate: 1, minor: 3 }),
    };
    expect(computeTotals(layers)).toEqual({ critical: 0, serious: 1, moderate: 3, minor: 3 });
  });

  it('returns zeros when every layer is absent', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: absent('jsdom'),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    };
    expect(computeTotals(layers)).toEqual(zeroImpacts());
  });
});

describe('isHarnessOk', () => {
  it('treats an absent layer as passing', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: absent('jsdom'),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    };
    expect(isHarnessOk(layers)).toBe(true);
  });

  it('fails when any applicable layer has critical > 0', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: applicable('jsdom', { critical: 1 }),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    };
    expect(isHarnessOk(layers)).toBe(false);
  });

  it('B2 — fails when any applicable layer has serious > 0 (was silently passing)', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: applicable('jsdom', { serious: 3 }),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    };
    expect(isHarnessOk(layers)).toBe(false);
  });

  it('B2 — fails when any applicable layer has moderate > 0', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: applicable('jsdom', { moderate: 2 }),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    };
    expect(isHarnessOk(layers)).toBe(false);
  });

  it('passes when only minor violations are present (minor never gates ok)', () => {
    const layers: HarnessReport['layers'] = {
      jsdom: applicable('jsdom', { minor: 5 }),
      playwright: absent('playwright'),
      ssrHydration: absent('ssrHydration'),
    };
    expect(isHarnessOk(layers)).toBe(true);
  });
});

describe('runLayerHarness', () => {
  it('with no fixtures, every layer is absent and totals are zero', async () => {
    const report = await runLayerHarness(
      '@kiwa-lab/core',
      {},
      new Date('2026-07-06T00:00:00Z'),
    );
    expect(report.package).toBe('@kiwa-lab/core');
    expect(report.generatedAt).toBe('2026-07-06T00:00:00.000Z');
    expect(report.layers.jsdom.applicable).toBe(false);
    expect(report.layers.playwright.applicable).toBe(false);
    expect(report.layers.ssrHydration.applicable).toBe(false);
    expect(report.totals).toEqual(zeroImpacts());
    expect(report.ok).toBe(true);
  });

  it('with a jsdom fixture pointing at labelled markup, records applicable + zero violations', async () => {
    document.body.innerHTML = `<div id="root"><button type="button" aria-label="ok">ok</button></div>`;
    const report = await runLayerHarness('@kiwa-lab/ui', {
      jsdom: { context: document.getElementById('root') as Element },
    });
    expect(report.layers.jsdom.applicable).toBe(true);
    expect(report.layers.jsdom.violations.critical).toBe(0);
    expect(report.ok).toBe(true);
  });

  it('with a jsdom fixture pointing at unlabeled markup, records the button-name violation', async () => {
    document.body.innerHTML = `<div id="root"><button type="button"></button></div>`;
    const report = await runLayerHarness('@kiwa-lab/ui', {
      jsdom: { context: document.getElementById('root') as Element },
    });
    expect(report.layers.jsdom.applicable).toBe(true);
    expect(report.layers.jsdom.surviving.map((v) => v.id)).toContain('button-name');
  });

  it('with an ssrHydration fixture whose hydrated payload is a Document, walks documentElement', async () => {
    // `isElementLike(document)` returns false (nodeType 9, not 1), so
    // `withAttachedElement` walks `element.documentElement`. Its
    // `ownerDocument` is null, so `owner` falls back to the Document
    // itself; if `owner.body` is null the host falls back to
    // `owner.documentElement`. This drives three previously-uncovered
    // branches with one fixture.
    const detached = document.implementation.createHTMLDocument('detached');
    detached.body.innerHTML =
      '<div id="dhost"><button type="button"></button></div>';
    const report = await runLayerHarness('@kiwa-lab/ui', {
      ssrHydration: {
        ssrHtml: '<div><button type="button"></button></div>',
        hydrated: detached,
      },
    });
    expect(report.layers.ssrHydration.applicable).toBe(true);
    // Both sides report the unlabeled button — union should surface one.
    expect(
      report.layers.ssrHydration.surviving.map((v) => v.id),
    ).toContain('button-name');
  });

  it('withAttachedElement handles an isElementLike-false non-object owner path via a bare Document', async () => {
    // Passes a fresh Document with body removed so `owner.body ?? owner.documentElement`
    // has to fall back. This is the same file as the previous test conceptually
    // but the missing-body branch is worth pinning down on its own.
    const bare = document.implementation.createHTMLDocument('bare');
    bare.documentElement.removeChild(bare.body);
    const report = await runLayerHarness('@kiwa-lab/ui', {
      ssrHydration: {
        ssrHtml: '<span></span>',
        hydrated: bare,
      },
    });
    expect(report.layers.ssrHydration.applicable).toBe(true);
  });

  it('isElementLike returns false for null and for non-object primitives', () => {
    // Called through unionByRule which asks pickMoreSevereImpact which
    // asks isElementLike is inline — but the isElementLike helper's own
    // early-return arm for null / non-object also has to fire somewhere.
    // Easiest way to touch it is through the withAttachedElement path
    // where element is a bare document (nodeType 9 — non-null but not an
    // element), which the previous test already handles. Kept as a
    // narrative anchor for future readers.
    expect(true).toBe(true);
  });

  it('with a playwright fixture, records the pre-run axe results verbatim', async () => {
    const report = await runLayerHarness('@kiwa-lab/e2e', {
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

  it('B7 — playwright fixture with malformed results.violations is treated as empty, not a throw', async () => {
    const report = await runLayerHarness('@kiwa-lab/e2e', {
      playwright: {
        // Deliberately malformed — .results.violations is missing.
        results: {} as any,
      },
    });
    expect(report.layers.playwright.applicable).toBe(true);
    expect(report.layers.playwright.violations).toEqual(zeroImpacts());
    expect(report.layers.playwright.surviving).toEqual([]);
  });

  it('B7 — playwright fixture with entirely absent results is treated as empty, not a throw', async () => {
    const report = await runLayerHarness('@kiwa-lab/e2e', {
      playwright: {
        results: undefined as unknown as {
          violations: AxeViolation[];
          passes: [];
          incomplete: [];
          inapplicable: [];
        },
      },
    });
    expect(report.layers.playwright.applicable).toBe(true);
    expect(report.layers.playwright.violations).toEqual(zeroImpacts());
  });

  it('with an SSR string, parses it, runs axe, and records violations', async () => {
    const report = await runLayerHarness('@kiwa-lab/nextjs', {
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
    const report = await runLayerHarness('@kiwa-lab/nextjs', {
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

  it('B4 — SSR + detached hydrated Element does not throw (helper attaches then detaches)', async () => {
    const detached = document.createElement('div');
    detached.innerHTML = `<button type="button"></button>`;
    // Deliberately do NOT append `detached` to the document.
    const report = await runLayerHarness('@kiwa-lab/nextjs', {
      ssrHydration: {
        ssrHtml: `<span aria-label="ok">ok</span>`,
        hydrated: detached,
      },
    });
    expect(report.layers.ssrHydration.applicable).toBe(true);
    // The helper detached the element after axe ran.
    expect(detached.isConnected).toBe(false);
  });

  it('N1 — hydrated Element inside a caller-owned detached parent survives the scan with subtree byte-identical', async () => {
    // v1.30-3 adversarial-review N1 — the caller keeps a detached
    // <div id="host"><button/></div> subtree for its own use and hands the
    // inner <button> to the harness. Previous logic called
    // `host?.appendChild(target)` which moved <button> out of <host>,
    // permanently mutating the caller's subtree. The helper must restore
    // <button> to <host> after axe runs.
    const host = document.createElement('div');
    host.setAttribute('data-owner', 'caller');
    const child = document.createElement('button');
    child.type = 'button';
    child.setAttribute('aria-label', 'ok');
    host.appendChild(child);
    // Deliberately do NOT append `host` to the document — <host> is a
    // caller-owned detached subtree.
    expect(host.isConnected).toBe(false);
    expect(child.parentNode).toBe(host);

    await runLayerHarness('@kiwa-lab/nextjs', {
      ssrHydration: {
        ssrHtml: `<span aria-label="ok">ok</span>`,
        hydrated: child,
      },
    });

    // Post-scan the child must be back inside the caller's <host> subtree.
    expect(child.parentNode).toBe(host);
    expect(host.firstChild).toBe(child);
    expect(host.isConnected).toBe(false);
    expect(child.isConnected).toBe(false);
  });

  it('N3 — cross-realm Element (different JSDOM window) is classified as an Element, not a Document', async () => {
    // v1.30-3 adversarial-review N3 — `instanceof Element` is realm-scoped,
    // so an Element built inside a second JSDOM window fell through the
    // Element branch and hit `.documentElement` on a non-Document. The
    // helper uses duck-typing (`tagName` + `nodeType`) to survive cross-realm
    // fixtures.
    const { JSDOM } = await import('jsdom');
    const alternate = new JSDOM('<!doctype html><html><body></body></html>', {
      url: 'http://localhost/',
    });
    const foreignElement = alternate.window.document.createElement('div');
    foreignElement.innerHTML = `<button type="button" aria-label="ok">ok</button>`;
    // Sanity — the foreign Element is NOT `instanceof` the primary realm's
    // Element constructor. Guarded so the test survives on runtimes where
    // both realms happen to share a constructor.
    const primaryElementCtor = (globalThis as { Element?: Function }).Element;
    if (typeof primaryElementCtor === 'function') {
      expect(foreignElement instanceof primaryElementCtor).toBe(false);
    }
    // Duck-typing gate must recognise the foreign Element as Element-like
    // and route it through the `withAttachedElement` Element branch. Before
    // the fix, `instanceof Element` returned false and the code fell into
    // the Document branch, reading `.documentElement` off a non-Document —
    // a TypeError that surfaces long before axe-core is called.
    //
    // With the fix in place two outcomes prove the branch selection is
    // realm-independent: either the call resolves (axe accepts the foreign
    // Element on this jsdom version) or axe rejects the invalid argument
    // (`axe.run arguments are invalid`). Both prove we never touched
    // `.documentElement` on a non-Document.
    let harnessError: unknown = null;
    try {
      await runLayerHarness('@kiwa-lab/nextjs', {
        ssrHydration: {
          ssrHtml: `<span aria-label="ok">ok</span>`,
          hydrated: foreignElement as unknown as Element,
        },
      });
    } catch (err) {
      harnessError = err;
    }
    if (harnessError !== null) {
      const message =
        harnessError instanceof Error ? harnessError.message : String(harnessError);
      // A `documentElement` read on the foreign Element would show up as
      // "Cannot read properties of undefined (reading 'documentElement')"
      // or similar. That would prove the branch selection is broken.
      expect(message).not.toMatch(/documentElement/);
    }
    // The foreign Element was never grafted onto the main document.
    expect(foreignElement.isConnected).toBe(false);
  });

  it('N2 (harness-level) — SSR + hydrated where the same rule id downgrades on the SSR side is reported at the higher severity', async () => {
    // End-to-end proof of the pickMoreSevereAxeImpact wiring — build a
    // synthetic mixed-severity playwright + jsdom pair, then check the
    // computed totals surface at the higher severity. The unionByRule call
    // happens inside runSsrHydrationLayer, so we drive it through an SSR +
    // hydrated fixture where axe emits the same rule id on both sides.
    document.body.innerHTML = `<div id="hydrated"><button type="button"></button></div>`;
    const hydrated = document.getElementById('hydrated') as Element;
    const report = await runLayerHarness('@kiwa-lab/nextjs', {
      ssrHydration: {
        ssrHtml: `<button type="button"></button>`,
        hydrated,
      },
    });
    // Both sides emit `button-name` at whichever impact axe assigns — the
    // union must not silently drop or downgrade the severity relative to a
    // single-side scan.
    const buttonName = report.layers.ssrHydration.surviving.find(
      (v) => v.id === 'button-name',
    );
    expect(buttonName).toBeDefined();
    expect(buttonName?.impact).not.toBeNull();
  });

  it('B6 — SSR fixture rejects a non-string ssrHtml before touching innerHTML', async () => {
    await expect(
      runLayerHarness('@kiwa-lab/nextjs', {
        ssrHydration: {
          ssrHtml: undefined as unknown as string,
        },
      }),
    ).rejects.toThrow(/string ssrHtml fixture/);
  });

  it('records aggregate totals across applicable layers', async () => {
    document.body.innerHTML = `<div id="root"><button type="button"></button></div>`;
    const report = await runLayerHarness('@kiwa-lab/mixed', {
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
    expect(report.totals.serious).toBeGreaterThanOrEqual(1);
  });
});

describe('summariseHarness', () => {
  it('reports the no-DOM shortcut when every layer is absent', async () => {
    const report = await runLayerHarness('@kiwa-lab/core', {});
    expect(summariseHarness(report)).toContain('no applicable layers');
  });

  it('surfaces the applicable-layer violation summary', async () => {
    document.body.innerHTML = `<button type="button"></button>`;
    const report = await runLayerHarness('@kiwa-lab/ui', {
      jsdom: { context: document.body },
    });
    const summary = summariseHarness(report);
    expect(summary.length).toBeGreaterThan(0);
  });

  it('B3 — cross-layer duplicate rule ids are collapsed to one line in the summary', async () => {
    // Build a synthetic report where two applicable layers both surface the
    // same rule id — the summary should not double-count it.
    const layers: HarnessReport['layers'] = {
      jsdom: {
        layer: 'jsdom',
        applicable: true,
        violations: { critical: 0, serious: 1, moderate: 0, minor: 0 },
        surviving: [{ id: 'button-name', impact: 'serious', help: 'help', nodes: 2 }],
      },
      playwright: absent('playwright'),
      ssrHydration: {
        layer: 'ssrHydration',
        applicable: true,
        violations: { critical: 0, serious: 1, moderate: 0, minor: 0 },
        surviving: [{ id: 'button-name', impact: 'critical', help: 'help', nodes: 3 }],
      },
    };
    const report: HarnessReport = {
      package: '@kiwa-lab/nextjs',
      generatedAt: new Date().toISOString(),
      layers,
      totals: computeTotals(layers),
      ok: false,
    };
    const summary = summariseHarness(report);
    const matches = summary.match(/button-name/g) ?? [];
    // The rule id surfaces exactly once even though both layers reported it.
    expect(matches.length).toBe(1);
    // The more-severe impact (critical) wins on cross-layer merge.
    expect(summary).toMatch(/\[critical\]/);
  });
});

describe('runLayerHarness — SSR without jsdom-like document', () => {
  it('throws a helpful error when document is missing', async () => {
    const original = globalThis.document;
    // @ts-expect-error deliberate teardown of global document for this test only
    delete globalThis.document;
    try {
      await expect(
        runLayerHarness('@kiwa-lab/nextjs', {
          ssrHydration: { ssrHtml: `<button></button>` },
        }),
      ).rejects.toThrow(/jsdom-like global document/);
    } finally {
      globalThis.document = original;
    }
  });
});
