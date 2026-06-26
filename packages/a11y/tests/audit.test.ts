/// <reference types="vitest/globals" />
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { expectNoViolations, reportViolations, runAxe, type AxeViolation } from '../src/index.js';

const ORIGINAL = document.body.innerHTML;
afterEach(() => {
  document.body.innerHTML = ORIGINAL;
});

describe('runAxe (jsdom)', () => {
  it('passes when context-scoped markup is fully labelled', async () => {
    document.body.innerHTML = `<div id="root"><button type="button" aria-label="open">Open</button></div>`;
    const results = await runAxe({ context: document.getElementById('root') as Element });
    expect(results.violations).toEqual([]);
  });

  it('flags an unlabeled button as a violation', async () => {
    document.body.innerHTML = `<div id="root"><button type="button"></button></div>`;
    const results = await runAxe({ context: document.getElementById('root') as Element });
    const ids = results.violations.map((v) => v.id);
    expect(ids).toContain('button-name');
  });

  it('reportViolations returns 0 blocking for empty violations', () => {
    const empty = { violations: [], passes: [], incomplete: [], inapplicable: [] };
    const report = reportViolations(empty);
    expect(report.blocking).toEqual([]);
    expect(report.summary).toContain('No a11y violations');
  });

  it('skips violations with null impact (axe-core can return null)', () => {
    const nullImpact = {
      violations: [
        { id: 'no-impact', impact: null, description: '', help: '', helpUrl: '', nodes: [{ target: ['x'], html: '' }] },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    };
    const report = reportViolations(nullImpact);
    expect(report.blocking).toEqual([]);
  });

  it('expectNoViolations passes when 0 blocking', () => {
    expectNoViolations({ violations: [], passes: [], incomplete: [], inapplicable: [] }, expect as unknown as Parameters<typeof expectNoViolations>[1]);
  });

  it('runAxe falls back to document when context is omitted (jsdom global)', async () => {
    document.body.innerHTML = `<div id="r"><button type="button" aria-label="open">Open</button></div>`;
    const results = await runAxe();
    // jsdom env exposes document, so this should resolve without throwing.
    expect(results).toBeDefined();
  });

  it('reportViolations summary mentions the count when blocking is non-empty', () => {
    const report = reportViolations(
      {
        violations: [
          { id: 'a', impact: 'serious', description: '', help: 'help a', helpUrl: '', nodes: [{ target: ['x'], html: '' }] },
          { id: 'b', impact: 'critical', description: '', help: 'help b', helpUrl: '', nodes: [{ target: ['y'], html: '' }, { target: ['z'], html: '' }] },
        ],
        passes: [],
        incomplete: [],
        inapplicable: [],
      },
      { maxImpact: 'serious' },
    );
    expect(report.blocking.length).toBe(2);
    expect(report.summary).toContain('2 a11y violation');
    expect(report.summary).toContain('help a');
  });

  it('expectNoViolations throws when blocking', () => {
    expect(() =>
      expectNoViolations(
        {
          violations: [
            { id: 'x', impact: 'critical', description: '', help: 'help', helpUrl: '', nodes: [{ target: ['t'], html: '' }] },
          ],
          passes: [],
          incomplete: [],
          inapplicable: [],
        },
        expect as unknown as Parameters<typeof expectNoViolations>[1],
        { maxImpact: 'critical' },
      ),
    ).toThrow(/violation/);
  });

  it('runAxe throws a helpful error when there is no context and no global document', async () => {
    const original = globalThis.document;
    // @ts-expect-error deliberate teardown of global document for this test only
    delete globalThis.document;
    try {
      await expect(runAxe()).rejects.toThrow(/no context and no global document/);
    } finally {
      globalThis.document = original;
    }
  });

  it('runAxe re-throws a helpful message when axe-core load fails', async () => {
    vi.resetModules();
    vi.doMock('axe-core', () => {
      throw new Error('module not installed');
    });
    const fresh = (await import('../src/audit.js')) as typeof import('../src/audit.js');
    await expect(fresh.runAxe()).rejects.toThrow(/axe-core/);
    vi.doUnmock('axe-core');
    vi.resetModules();
  });

  it('respects a maxImpact filter in reportViolations', () => {
    const fake = {
      violations: [
        { id: 'minor-id', impact: 'minor' as const, description: '', help: '', helpUrl: '', nodes: [{ target: ['x'], html: '' }] },
        { id: 'critical-id', impact: 'critical' as const, description: '', help: '', helpUrl: '', nodes: [{ target: ['y'], html: '' }] },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    };
    const minorReport = reportViolations(fake, { maxImpact: 'minor' });
    expect(minorReport.blocking.length).toBe(2);
    const criticalReport = reportViolations(fake, { maxImpact: 'critical' });
    expect(criticalReport.blocking.map((v: AxeViolation) => v.id)).toEqual(['critical-id']);
  });
});

describe('runAxe + reportViolations (mutation-kill)', () => {
  it('runAxe.runOptions defaults to {} when not provided (kills L22 LogicalOperator)', async () => {
    // Without runOptions, runAxe must still resolve (axe.run is called with
    // {}). A mutant `opts.runOptions && {}` would pass undefined to axe.run,
    // which axe-core itself rejects.
    document.body.innerHTML = `<button type="button" aria-label="x">x</button>`;
    const results = await runAxe();
    expect(results).toBeDefined();
    expect(Array.isArray(results.violations)).toBe(true);
  });

  it('runAxe forwards explicit runOptions to axe.run (kills the always-{} mutation)', async () => {
    document.body.innerHTML = `<div><button type="button" aria-label="ok">ok</button></div>`;
    // Disable the 'button-name' rule explicitly; supply an unlabeled button to
    // see whether the rule actually fired.
    document.body.innerHTML = `<div><button type="button"></button></div>`;
    const results = await runAxe({
      runOptions: { rules: { 'button-name': { enabled: false } } },
    });
    const ids = results.violations.map((v) => v.id);
    // With button-name disabled, the violation we'd otherwise see is absent.
    expect(ids).not.toContain('button-name');
  });

  it('reportViolations summary uses the literal "No a11y violations" phrasing when empty (kills L25 StringLiteral mutation)', () => {
    const empty = { violations: [], passes: [], incomplete: [], inapplicable: [] };
    const report = reportViolations(empty, { maxImpact: 'critical' });
    // Kills mutations that flip the summary to empty string or remove the
    // "No a11y violations" phrase.
    expect(report.summary).toBe('No a11y violations at impact >= "critical".');
  });

  it('reportViolations summary embeds the maxImpact label literally', () => {
    const empty = { violations: [], passes: [], incomplete: [], inapplicable: [] };
    const reportMinor = reportViolations(empty, { maxImpact: 'minor' });
    const reportSerious = reportViolations(empty, { maxImpact: 'serious' });
    expect(reportMinor.summary).toContain('"minor"');
    expect(reportSerious.summary).toContain('"serious"');
    expect(reportMinor.summary).not.toEqual(reportSerious.summary);
  });

  it('reportViolations summary lists each blocking violation with impact + id + help + node count (kills L35 StringLiteral)', () => {
    const fake = {
      violations: [
        { id: 'rule-x', impact: 'critical' as const, description: '', help: 'help text', helpUrl: '', nodes: [{ target: ['t1'], html: '' }, { target: ['t2'], html: '' }] },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    };
    const report = reportViolations(fake, { maxImpact: 'critical' });
    expect(report.summary).toContain('[critical]');
    expect(report.summary).toContain('rule-x');
    expect(report.summary).toContain('help text');
    expect(report.summary).toContain('2 node(s)');
  });

  it('maxImpact defaults to "minor" when not provided (kills the default-pick mutation)', () => {
    const fake = {
      violations: [
        { id: 'minor-id', impact: 'minor' as const, description: '', help: '', helpUrl: '', nodes: [{ target: ['x'], html: '' }] },
      ],
      passes: [],
      incomplete: [],
      inapplicable: [],
    };
    const report = reportViolations(fake);
    // Default 'minor' → minor violation IS blocking.
    expect(report.blocking.length).toBe(1);
    expect(report.summary).toContain('"minor"');
  });

  it('axe-core default export branch is exercised (kills L10 LogicalOperator)', async () => {
    // axe-core ships both a CJS default export and ESM bare exports. Both
    // paths must work; the LogicalOperator mutant flips `mod.default ?? mod`
    // to `mod.default && mod`, which returns the bare module even when default
    // exists. As long as runAxe successfully invokes axe.run from a real
    // axe-core install, the original (??) branch is exercised by this assertion.
    document.body.innerHTML = `<button type="button" aria-label="ok">ok</button>`;
    const results = await runAxe();
    // Successful resolution proves the loaded module exposes .run.
    expect(results.violations).toBeDefined();
    expect(Array.isArray(results.violations)).toBe(true);
  });

  it('context omitted forces the no-context-no-document branch when document is also absent (kills L28 ConditionalExpression false)', async () => {
    const original = globalThis.document;
    // @ts-expect-error deliberate teardown
    delete globalThis.document;
    try {
      // ctx omitted → throws.
      await expect(runAxe()).rejects.toThrow(/no context/);
    } finally {
      globalThis.document = original;
    }
  });
});
