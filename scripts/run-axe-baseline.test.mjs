// Behaviour tests for run-axe-baseline.mjs helpers (v1.30-1 infra runner).
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/run-axe-baseline.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { validateAxeConfig, buildBaselineStub, formatThreshold } from './run-axe-baseline.mjs';

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

test('buildBaselineStub records package name + infraStub marker + zero violations', () => {
  const stub = buildBaselineStub('@kiwa-test/core', new Date('2026-07-06T00:00:00Z'));
  assert.equal(stub.package, '@kiwa-test/core');
  assert.equal(stub.infraStub, true);
  assert.equal(stub.generatedAt, '2026-07-06T00:00:00.000Z');
  assert.deepEqual(stub.violations, { critical: 0, serious: 0, moderate: 0, minor: 0 });
  assert.deepEqual(stub.surviving, []);
  assert.match(stub.note, /v1\.30-1 infra stub/);
});

test('formatThreshold prints raw numbers verbatim and { max: N } as "<= N"', () => {
  assert.equal(formatThreshold(0), '0');
  assert.equal(formatThreshold(3), '3');
  assert.equal(formatThreshold({ max: 3 }), '<= 3');
  assert.equal(formatThreshold({ max: 10 }), '<= 10');
});
