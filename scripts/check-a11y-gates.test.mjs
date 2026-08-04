// Behaviour tests for check-a11y-gates.mjs (13-axis release gate).
// Runs with Node's built-in test runner (no vitest dependency at repo root):
//   node --test scripts/check-a11y-gates.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

import {
  A11Y_PACKAGE_TIER,
  A11Y_TIER_THRESHOLD,
  computeBreaches,
  thresholdFor,
} from './check-a11y-gates.mjs';

const RUNNER = fileURLToPath(new URL('./check-a11y-gates.mjs', import.meta.url));

test('A11Y_TIER_THRESHOLD SSOT matches the tier table in docs/quality/a11y-thresholds.md', () => {
  // Same numbers as packages/quality-metrics/src/gate.ts DEFAULT_A11Y_TIER_THRESHOLDS.
  assert.deepEqual(A11Y_TIER_THRESHOLD, {
    core: { critical: 0, serious: 0, moderate: 3 },
    framework: { critical: 0, serious: 3, moderate: 10 },
    saas: { critical: 0, serious: 0, moderate: 0 },
    'test-type': { critical: 0, serious: 3, moderate: 10 },
  });
});

test('A11Y_TIER_THRESHOLD critical bar is 0 in every tier (SSOT invariant)', () => {
  for (const tier of ['core', 'framework', 'saas', 'test-type']) {
    assert.equal(A11Y_TIER_THRESHOLD[tier].critical, 0);
  }
});

test('A11Y_PACKAGE_TIER covers the release set named by root test:a11y', () => {
  // 件数を直接固定すると、 package が増減するたびに「守る対象が変わった」 ことを
  // 退行として報告してしまう (#1785 で 46 -> 31 package)。 root の filter list を
  // 正として集合そのものを突き合わせる。
  const root = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf-8'));
  const filtered = [...root.scripts['test:a11y'].matchAll(/-F (@kiwa-lab\/[a-z0-9-]+)/g)]
    .map((m) => m[1]);
  const packages = Object.keys(A11Y_PACKAGE_TIER);
  assert.deepEqual([...packages].sort(), [...new Set(filtered)].sort());
  // Every entry has a valid tier.
  for (const [pkg, entry] of Object.entries(A11Y_PACKAGE_TIER)) {
    assert.ok(
      ['core', 'framework', 'saas', 'test-type'].includes(entry.tier),
      `${pkg} has invalid tier ${entry.tier}`,
    );
  }
});

test('thresholdFor returns tier default when no override', () => {
  // @kiwa-lab/core is a Core-tier package with no override.
  assert.deepEqual(thresholdFor('@kiwa-lab/core'), { critical: 0, serious: 0, moderate: 3 });
});

test('thresholdFor returns undefined for unknown package', () => {
  assert.equal(thresholdFor('@kiwa-lab/nonexistent'), undefined);
});

test('computeBreaches returns empty for zero violations', () => {
  const totals = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  const threshold = { critical: 0, serious: 3, moderate: 10 };
  assert.deepEqual(computeBreaches(totals, threshold), []);
});

test('computeBreaches surfaces critical breach even when only 1 above ceiling', () => {
  const totals = { critical: 1, serious: 0, moderate: 0, minor: 0 };
  const threshold = { critical: 0, serious: 3, moderate: 10 };
  const breaches = computeBreaches(totals, threshold);
  assert.equal(breaches.length, 1);
  assert.match(breaches[0], /critical 1 > 0/);
});

test('computeBreaches surfaces serious breach against Framework tier ceiling 3', () => {
  const totals = { critical: 0, serious: 5, moderate: 0, minor: 0 };
  const threshold = { critical: 0, serious: 3, moderate: 10 };
  const breaches = computeBreaches(totals, threshold);
  assert.equal(breaches.length, 1);
  assert.match(breaches[0], /serious 5 > 3/);
});

test('computeBreaches surfaces moderate breach against Core tier ceiling 3', () => {
  const totals = { critical: 0, serious: 0, moderate: 4, minor: 0 };
  const threshold = { critical: 0, serious: 0, moderate: 3 };
  const breaches = computeBreaches(totals, threshold);
  assert.equal(breaches.length, 1);
  assert.match(breaches[0], /moderate 4 > 3/);
});

test('computeBreaches surfaces all three impacts when every ceiling breached', () => {
  const totals = { critical: 2, serious: 5, moderate: 15, minor: 0 };
  const threshold = { critical: 0, serious: 3, moderate: 10 };
  const breaches = computeBreaches(totals, threshold);
  assert.equal(breaches.length, 3);
});

test('CLI reports PASS when every baseline sits inside its tier ceiling', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'a11y-gate-pass-'));
  try {
    // Create a minimal repo layout: packages/<pkg>/.a11y-baseline/<pkg>.json
    // for every package the gate expects.
    for (const [pkg, entry] of Object.entries(A11Y_PACKAGE_TIER)) {
      const basename = pkg.split('/')[1];
      const dir = join(tmp, 'packages', basename, '.a11y-baseline');
      mkdirSync(dir, { recursive: true });
      writeFileSync(
        join(dir, `${basename}.json`),
        JSON.stringify({
          package: pkg,
          generatedAt: '2026-07-06T00:00:00Z',
          layers: {},
          totals: { critical: 0, serious: 0, moderate: 0, minor: 0 },
          ok: true,
        }),
      );
    }
    const result = spawnSync('node', [RUNNER], {
      env: { ...process.env, KIWA_GATE_ROOT: tmp },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, `stderr: ${result.stderr}`);
    assert.match(result.stdout, /# A11y gate report/);
    assert.match(result.stderr, /All packages passed a11y thresholds/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI reports FAIL when any baseline breaches its tier ceiling', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'a11y-gate-fail-'));
  try {
    for (const [pkg, entry] of Object.entries(A11Y_PACKAGE_TIER)) {
      const basename = pkg.split('/')[1];
      const dir = join(tmp, 'packages', basename, '.a11y-baseline');
      mkdirSync(dir, { recursive: true });
      // Fail one Framework tier package with critical=1 (SSOT invariant hit).
      const totals =
        pkg === '@kiwa-lab/nextjs'
          ? { critical: 1, serious: 0, moderate: 0, minor: 0 }
          : { critical: 0, serious: 0, moderate: 0, minor: 0 };
      writeFileSync(
        join(dir, `${basename}.json`),
        JSON.stringify({
          package: pkg,
          generatedAt: '2026-07-06T00:00:00Z',
          layers: {},
          totals,
          ok: true,
        }),
      );
    }
    const result = spawnSync('node', [RUNNER], {
      env: { ...process.env, KIWA_GATE_ROOT: tmp },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /A11y gate failed for/);
    assert.match(result.stderr, /nextjs.*critical 1 > 0/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('CLI reports FAIL when a baseline is missing (no silent skip)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'a11y-gate-missing-'));
  try {
    // Intentionally do NOT create baseline dirs. Every package should show
    // up as "no baseline at..." and the run must fail.
    const result = spawnSync('node', [RUNNER], {
      env: { ...process.env, KIWA_GATE_ROOT: tmp },
      encoding: 'utf8',
    });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /no baseline at/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
