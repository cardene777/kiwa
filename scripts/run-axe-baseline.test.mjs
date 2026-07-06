// Behaviour tests for run-axe-baseline.mjs helpers (v1.30-2 3-layer runner).
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/run-axe-baseline.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  validateAxeConfig,
  buildLayersAbsentBaseline,
  ceilingOf,
  formatThreshold,
  tierBreaches,
} from './run-axe-baseline.mjs';

test('validateAxeConfig accepts a Core-tier config', () => {
  const config = {
    runOptions: { runOnly: { type: 'tag', values: ['wcag2aa'] } },
    thresholds: { critical: 0, serious: 0, moderate: { max: 3 } },
    baselinePath: '.a11y-baseline/core.json',
  };
  const result = validateAxeConfig(config);
  assert.equal(result.ok, true);
  assert.equal(result.baselinePath, '.a11y-baseline/core.json');
});

test('validateAxeConfig accepts a Framework-tier config with { max: N } bounds', () => {
  const config = {
    thresholds: { critical: 0, serious: { max: 3 }, moderate: { max: 10 } },
    baselinePath: '.a11y-baseline/nextjs.json',
  };
  const result = validateAxeConfig(config);
  assert.equal(result.ok, true);
});

test('validateAxeConfig surfaces the optional fixtures field when present', () => {
  const config = {
    thresholds: { critical: 0, serious: 0, moderate: 0 },
    baselinePath: '.a11y-baseline/x.json',
    fixtures: { jsdom: { context: '#root' } },
  };
  const result = validateAxeConfig(config);
  assert.equal(result.ok, true);
  assert.deepEqual(result.fixtures, { jsdom: { context: '#root' } });
});

test('validateAxeConfig rejects null / non-object exports', () => {
  assert.equal(validateAxeConfig(null).ok, false);
  assert.equal(validateAxeConfig(undefined).ok, false);
  assert.equal(validateAxeConfig('nope').ok, false);
  assert.equal(validateAxeConfig(42).ok, false);
});

test('validateAxeConfig rejects a config missing "thresholds"', () => {
  const result = validateAxeConfig({ baselinePath: '.a11y-baseline/x.json' });
  assert.equal(result.ok, false);
  assert.match(result.error, /"thresholds"/);
});

test('validateAxeConfig enforces critical === 0 (SSOT invariant, never overridable)', () => {
  const result = validateAxeConfig({
    thresholds: { critical: 1, serious: 0, moderate: 0 },
    baselinePath: '.a11y-baseline/x.json',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /critical/i);
  assert.match(result.error, /must be 0/);
});

test('validateAxeConfig rejects a config missing "baselinePath"', () => {
  const result = validateAxeConfig({
    thresholds: { critical: 0, serious: 0, moderate: 0 },
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /baselinePath/);
});

test('validateAxeConfig rejects an empty "baselinePath"', () => {
  const result = validateAxeConfig({
    thresholds: { critical: 0, serious: 0, moderate: 0 },
    baselinePath: '',
  });
  assert.equal(result.ok, false);
  assert.match(result.error, /baselinePath/);
});

test('buildLayersAbsentBaseline shapes the harness-report format with every layer absent', () => {
  const baseline = buildLayersAbsentBaseline(
    '@kiwa-test/core',
    new Date('2026-07-06T00:00:00Z'),
  );
  assert.equal(baseline.package, '@kiwa-test/core');
  assert.equal(baseline.generatedAt, '2026-07-06T00:00:00.000Z');
  assert.equal(baseline.ok, true);
  for (const layer of ['jsdom', 'playwright', 'ssrHydration']) {
    assert.equal(baseline.layers[layer].applicable, false);
    assert.equal(typeof baseline.layers[layer].reason, 'string');
    assert.deepEqual(baseline.layers[layer].violations, {
      critical: 0,
      serious: 0,
      moderate: 0,
      minor: 0,
    });
    assert.deepEqual(baseline.layers[layer].surviving, []);
  }
  assert.deepEqual(baseline.totals, { critical: 0, serious: 0, moderate: 0, minor: 0 });
});

test('buildLayersAbsentBaseline reasons name the missing fixture for each layer', () => {
  const baseline = buildLayersAbsentBaseline('@kiwa-test/nextjs');
  assert.match(baseline.layers.jsdom.reason, /no jsdom fixture/);
  assert.match(baseline.layers.playwright.reason, /no playwright fixture/);
  assert.match(baseline.layers.ssrHydration.reason, /no ssrHydration fixture/);
});

test('formatThreshold prints raw numbers verbatim and { max: N } as "<= N"', () => {
  assert.equal(formatThreshold(0), '0');
  assert.equal(formatThreshold(3), '3');
  assert.equal(formatThreshold({ max: 3 }), '<= 3');
  assert.equal(formatThreshold({ max: 10 }), '<= 10');
});

test('ceilingOf normalises raw numbers and { max: N } and preserves undefined', () => {
  assert.equal(ceilingOf(0), 0);
  assert.equal(ceilingOf(5), 5);
  assert.equal(ceilingOf({ max: 7 }), 7);
  assert.equal(ceilingOf(undefined), undefined);
  assert.equal(ceilingOf(null), undefined);
});

test('tierBreaches flags critical > 0 no matter the ceiling shape', () => {
  const breaches = tierBreaches(
    { critical: 1, serious: 0, moderate: 0 },
    { critical: 0, serious: 0, moderate: 0 },
  );
  assert.equal(breaches.length, 1);
  assert.match(breaches[0], /critical 1 > 0/);
});

test('tierBreaches flags serious over Framework-tier max', () => {
  const breaches = tierBreaches(
    { critical: 0, serious: 4, moderate: 0 },
    { critical: 0, serious: { max: 3 }, moderate: { max: 10 } },
  );
  assert.equal(breaches.length, 1);
  assert.match(breaches[0], /serious 4 > 3/);
});

test('tierBreaches returns an empty list when every impact is under its ceiling', () => {
  const breaches = tierBreaches(
    { critical: 0, serious: 2, moderate: 8 },
    { critical: 0, serious: { max: 3 }, moderate: { max: 10 } },
  );
  assert.deepEqual(breaches, []);
});

test('tierBreaches treats an undefined ceiling as "no cap" (minor is never enforced)', () => {
  const breaches = tierBreaches(
    { critical: 0, serious: 0, moderate: 0, minor: 42 },
    { critical: 0, serious: 0, moderate: 0 },
  );
  assert.deepEqual(breaches, []);
});
