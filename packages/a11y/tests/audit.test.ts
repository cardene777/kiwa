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
