import { describe, expect, it } from 'vitest';
import { checkSpecConformance, checkLayoutRegression, assertDesignConformance, assertNoLayoutRegression } from '../../src/index.js';

describe('design-check integration — spec + layout workflow', () => {
  it('T-INT-D-001 spec check + layout check の end-to-end workflow', () => {
    const spec = { colors: { primary: '#3b82f6' } };
    const specResult = checkSpecConformance(spec, spec);
    expect(specResult.pass).toBe(true);

    const snap = { elements: [{ selector: '#btn', x: 0, y: 0, width: 100, height: 40, visible: true }] };
    const layoutResult = checkLayoutRegression(snap, snap);
    expect(layoutResult.pass).toBe(true);
  });

  it('T-INT-D-002 spec fail + layout pass の combined 判定', () => {
    const spec = { colors: { p: '#000' } };
    const actual = { colors: { p: '#fff' } };
    const specResult = checkSpecConformance(spec, actual);
    expect(specResult.pass).toBe(false);

    const snap = { elements: [{ selector: '#a', x: 0, y: 0, width: 10, height: 10, visible: true }] };
    const layoutResult = checkLayoutRegression(snap, snap);
    expect(layoutResult.pass).toBe(true);
  });

  it('T-INT-D-003 assert helpers を chain (pass 経路)', () => {
    const spec = { colors: { p: '#000' } };
    expect(() => {
      assertDesignConformance(spec, spec);
      assertNoLayoutRegression(
        { elements: [{ selector: '#a', x: 0, y: 0, width: 10, height: 10, visible: true }] },
        { elements: [{ selector: '#a', x: 0, y: 0, width: 10, height: 10, visible: true }] },
      );
    }).not.toThrow();
  });

  it('T-INT-D-004 spec pass + layout fail の combined 判定', () => {
    const spec = { colors: { p: '#000' } };
    expect(() => assertDesignConformance(spec, spec)).not.toThrow();
    expect(() =>
      assertNoLayoutRegression(
        { elements: [{ selector: '#a', x: 0, y: 0, width: 10, height: 10, visible: true }] },
        { elements: [] },
      ),
    ).toThrow(/layout regression/);
  });

  it('T-INT-D-005 real design system の complex spec check', () => {
    const spec = {
      colors: { primary: '#3b82f6', secondary: '#f59e0b', danger: '#ef4444' },
      spacing: { xs: 4, sm: 8, md: 16, lg: 32 },
      typography: { body: { fontSize: 14, fontWeight: 400 } },
      components: { Button: { padding: 8, borderRadius: 4 }, Card: { padding: 16, borderRadius: 8 } },
    };
    const result = checkSpecConformance(spec, spec);
    expect(result.pass).toBe(true);
    expect(result.checkedCount).toBeGreaterThanOrEqual(10);
  });
});
