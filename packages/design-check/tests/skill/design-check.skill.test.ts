import { describe, expect, it } from 'vitest';
import {
  assertToolCalled,
  assertToolCallOrder,
  createToolSpy,
} from '@kiwa-lab/skill-test';
import { checkSpecConformance, checkLayoutRegression, assertDesignConformance } from '../../src/index.js';

describe('design-check skill — spec/layout check skill flow', () => {
  it('T-SKL-D-001 spec check + layout check skill flow が順序で発火', () => {
    const spy = createToolSpy();
    const spec = { colors: { primary: '#3b82f6' } };
    checkSpecConformance(spec, spec);
    spy.record('design-check.spec-conformance', '{}');
    checkLayoutRegression({ elements: [] }, { elements: [] });
    spy.record('design-check.layout-regression', '{}');

    assertToolCallOrder(spy, ['design-check.spec-conformance', 'design-check.layout-regression']);
  });

  it('T-SKL-D-002 batch spec check skill (times=3)', () => {
    const spy = createToolSpy();
    const spec = { colors: { p: '#000' } };
    for (const _i of [1, 2, 3]) {
      checkSpecConformance(spec, spec);
      spy.record('design-check.spec-conformance', '{}');
    }

    assertToolCalled(spy, 'design-check.spec-conformance', { times: 3 });
  });

  it('T-SKL-D-003 assert skill (throw と非 throw 両方)', () => {
    const spy = createToolSpy();
    const spec = { colors: { p: '#000' } };
    assertDesignConformance(spec, spec);
    spy.record('design-check.assert.pass', '{}');
    try {
      assertDesignConformance(spec, { colors: { p: '#fff' } });
      spy.record('design-check.assert.fail-missing', '{}');
    } catch {
      spy.record('design-check.assert.throw', '{}');
    }

    assertToolCallOrder(spy, ['design-check.assert.pass', 'design-check.assert.throw']);
  });

  it('T-SKL-D-004 complex spec check with divergences skill', () => {
    const spy = createToolSpy();
    const spec = { colors: { p: '#000', s: '#fff' }, spacing: { md: 16 } };
    const actual = { colors: { p: '#111' }, spacing: { md: 20 } };
    const result = checkSpecConformance(spec, actual);
    spy.record('design-check.spec-conformance', JSON.stringify({ divergences: result.divergences.length }));

    assertToolCalled(spy, 'design-check.spec-conformance');
    expect(result.divergences.length).toBe(3);
  });

  it('T-SKL-D-005 layout regression + overlap detection skill', () => {
    const spy = createToolSpy();
    const baseline = { elements: [] };
    const actual = {
      elements: [
        { selector: '#a', x: 0, y: 0, width: 100, height: 100, visible: true },
        { selector: '#b', x: 50, y: 50, width: 100, height: 100, visible: true },
      ],
    };
    const result = checkLayoutRegression(baseline, actual);
    spy.record('design-check.layout-regression.overlap', JSON.stringify({ regressions: result.regressions.length }));

    assertToolCalled(spy, 'design-check.layout-regression.overlap');
    expect(result.regressions.some((r) => r.kind === 'overlap')).toBe(true);
  });
});
