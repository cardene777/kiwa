import { describe, expect, it } from 'vitest';
import { checkSpecConformance, checkLayoutRegression } from '../../src/index.js';

describe('design-check fidelity — spec/layout contract', () => {
  it('T-FID-D-001 checkSpecConformance 同 input で idempotent', () => {
    const spec = { colors: { p: '#000' } };
    const actual = { colors: { p: '#000' } };
    const r1 = checkSpecConformance(spec, actual);
    const r2 = checkSpecConformance(spec, actual);
    expect(r1).toEqual(r2);
  });

  it('T-FID-D-002 divergences count 正確性', () => {
    const spec = { colors: { p: '#000', s: '#fff' } };
    const actual = { colors: { p: '#111' } };
    const result = checkSpecConformance(spec, actual);
    expect(result.divergences.length).toBe(2);
  });

  it('T-FID-D-003 layout regression pass の pass flag', () => {
    const snap = { elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }] };
    const result = checkLayoutRegression(snap, snap);
    expect(result.pass).toBe(true);
    expect(result.regressions.length).toBe(0);
  });

  it('T-FID-D-004 conformance categories 網羅 (missing / mismatch)', () => {
    const spec = { colors: { p: '#000', s: '#fff' } };
    const actual = { colors: { p: '#111' } };
    const result = checkSpecConformance(spec, actual);
    const cats = result.divergences.map((d) => d.category);
    expect(cats).toContain('missing');
    expect(cats).toContain('mismatch');
  });

  it('T-FID-D-005 regression detail message shape', () => {
    const baseline = {
      elements: [{ selector: '#a', x: 0, y: 0, width: 100, height: 50, visible: true }],
    };
    const actual = { elements: [] };
    const result = checkLayoutRegression(baseline, actual);
    expect(result.regressions[0]!.detail).toContain('not found');
  });
});
