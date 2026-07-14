import { describe, expect, it } from 'vitest';
import { checkLayoutRegression, assertNoLayoutRegression } from '../src/index.js';

describe('checkLayoutRegression', () => {
  it('T-DLR-001 完全一致で pass', () => {
    const snapshot = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const result = checkLayoutRegression(snapshot, snapshot);
    expect(result.pass).toBe(true);
  });

  it('T-DLR-002 position shift 検知', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = {
      elements: [{ selector: '#a', x: 50, y: 0, width: 100, height: 50, visible: true }],
    };
    const result = checkLayoutRegression(baseline, actual);
    expect(result.pass).toBe(false);
    expect(result.regressions[0]!.kind).toBe('position-shift');
  });

  it('T-DLR-003 size change 検知', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 200, height: 50, visible: true }],
    };
    const result = checkLayoutRegression(baseline, actual);
    expect(result.pass).toBe(false);
    expect(result.regressions[0]!.kind).toBe('size-change');
  });

  it('T-DLR-004 visibility change 検知', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: false }],
    };
    const result = checkLayoutRegression(baseline, actual);
    expect(result.pass).toBe(false);
    expect(result.regressions[0]!.kind).toBe('visibility-change');
  });

  it('T-DLR-005 missing element 検知', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = { elements: [] };
    const result = checkLayoutRegression(baseline, actual);
    expect(result.pass).toBe(false);
    expect(result.regressions[0]!.kind).toBe('missing');
  });

  it('T-DLR-006 tolerance 内は pass', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = {
      elements: [{ selector: '#a', x: 1, y: 1, width: 101, height: 51, visible: true }],
    };
    const result = checkLayoutRegression(baseline, actual, { positionTolerance: 2, sizeTolerance: 2 });
    expect(result.pass).toBe(true);
  });

  it('T-DLR-007 overflow 検知 (viewport width 超過)', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 500, height: 50, visible: true }],
    };
    const result = checkLayoutRegression(baseline, actual, { viewportWidth: 400, sizeTolerance: 2 });
    expect(result.pass).toBe(false);
    const kinds = result.regressions.map((r) => r.kind);
    expect(kinds).toContain('overflow');
  });

  it('T-DLR-008 overlap 検知 (element 同士重複)', () => {
    const baseline = { elements: [] };
    const actual = {
      elements: [
        { selector: '#a', x: 0, y: 0, width: 100, height: 100, visible: true },
        { selector: '#b', x: 50, y: 50, width: 100, height: 100, visible: true },
      ],
    };
    const result = checkLayoutRegression(baseline, actual);
    expect(result.pass).toBe(false);
    expect(result.regressions.some((r) => r.kind === 'overlap')).toBe(true);
  });

  it('T-DLR-009 assertNoLayoutRegression pass で throw なし', () => {
    const snap = { elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }] };
    expect(() => assertNoLayoutRegression(snap, snap)).not.toThrow();
  });

  it('T-DLR-010 assertNoLayoutRegression fail で throw', () => {
    const baseline = { elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }] };
    const actual = { elements: [] };
    expect(() => assertNoLayoutRegression(baseline, actual)).toThrow(/layout regression detected/);
  });
});
