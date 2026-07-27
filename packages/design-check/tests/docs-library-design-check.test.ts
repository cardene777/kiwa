import { expect, it } from 'vitest';
import {
  assertNoLayoutRegression,
  checkLayoutRegression,
  checkSpecConformance,
} from '../src/index.js';

it('validates the Quickstart token conformance and divergence example', () => {
  const matching = checkSpecConformance(
    {
      colors: { primary: '#3b82f6' },
      spacing: { md: 16 },
      typography: { body: { fontSize: 14, lineHeight: 20 } },
      components: { Button: { paddingInline: 16, radius: 8 } },
    },
    {
      colors: { primary: '#3b82f6' },
      spacing: { md: 16 },
      typography: { body: { fontSize: 14, lineHeight: 20 } },
      components: { Button: { paddingInline: 16, radius: 8 } },
    },
  );
  expect(matching).toMatchObject({ pass: true, checkedCount: 4, divergences: [] });

  expect(checkSpecConformance({ spacing: { md: 16 } }, { spacing: { md: 12 } }).divergences)
    .toEqual([{ path: 'spacing.md', expected: 16, actual: 12, category: 'mismatch' }]);
});

it('validates the how-to tolerance, overflow, and overlap example', () => {
  const baseline = {
    elements: [
      { selector: '[data-testid="header"]', x: 0, y: 0, width: 1280, height: 64, visible: true },
      { selector: '[data-testid="content"]', x: 24, y: 88, width: 800, height: 480, visible: true },
    ],
  };
  const matching = {
    elements: [
      { selector: '[data-testid="header"]', x: 2, y: 0, width: 1280, height: 64, visible: true },
      { selector: '[data-testid="content"]', x: 24, y: 88, width: 800, height: 480, visible: true },
    ],
  };
  expect(checkLayoutRegression(baseline, matching, { positionTolerance: 2, sizeTolerance: 2 }).pass).toBe(true);

  const changed = {
    elements: [
      { selector: '[data-testid="header"]', x: 0, y: 0, width: 1300, height: 64, visible: true },
      { selector: '[data-testid="content"]', x: 24, y: 40, width: 800, height: 480, visible: true },
    ],
  };
  const result = checkLayoutRegression(baseline, changed, { viewportWidth: 1280, viewportHeight: 720 });
  expect(result.regressions.map((item) => item.kind)).toEqual(expect.arrayContaining(['overflow', 'overlap']));
  expect(() => assertNoLayoutRegression(baseline, changed, { viewportWidth: 1280, viewportHeight: 720 }))
    .toThrow('layout regression detected');
});
