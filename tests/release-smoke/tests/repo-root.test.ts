import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = resolve(repoRoot(HERE), 'tests', 'release-smoke', 'tests');

describe('repoRoot finds the same place from either layout', () => {
  it('answers the same from the source tree and the build output', () => {
    // The two places these tests run from are one directory apart. A root that
    // differs between them is a root that is wrong in one of them.
    const fromSource = repoRoot(resolve(repoRoot(HERE), 'tests/release-smoke/tests'));
    const fromDist = repoRoot(resolve(repoRoot(HERE), 'tests/release-smoke/.vitest-dist/tests'));
    expect(fromSource).toBe(fromDist);
  });

  it('is the directory that holds the workspace file', () => {
    const root = repoRoot(HERE);
    expect(readdirSync(root)).toContain('pnpm-workspace.yaml');
  });

  it('refuses rather than guessing when there is no workspace above', () => {
    // Returning something wrong is worse than failing: the tests that read an
    // empty directory pass having checked nothing.
    const outside = mkdtempSync(join(tmpdir(), 'kiwa-no-workspace-'));
    try {
      mkdirSync(join(outside, 'a', 'b'), { recursive: true });
      expect(() => repoRoot(join(outside, 'a', 'b'))).toThrow(/pnpm-workspace\.yaml not found/);
    } finally {
      rmSync(outside, { recursive: true, force: true });
    }
  });

  it('stops at the nearest workspace file', () => {
    const outer = mkdtempSync(join(tmpdir(), 'kiwa-nested-'));
    try {
      const inner = join(outer, 'nested');
      mkdirSync(join(inner, 'deep'), { recursive: true });
      writeFileSync(join(outer, 'pnpm-workspace.yaml'), 'packages: []\n');
      writeFileSync(join(inner, 'pnpm-workspace.yaml'), 'packages: []\n');
      expect(repoRoot(join(inner, 'deep'))).toBe(inner);
    } finally {
      rmSync(outer, { recursive: true, force: true });
    }
  });
});

describe('no test resolves the repository root by counting directories', () => {
  it('every test file uses the helper', () => {
    // The fixed-depth form is right for the compiled layout and points outside
    // the repository for the source one. Measured, all of these fail loudly
    // there rather than passing — the one that passed on nothing was
    // `tsup-clean-race`, whose probe swallowed the build error and enumerated
    // an empty directory (#1821). What this guards is the other cost: running
    // any of them from source breaks, and the reason is not visible from the
    // failure.
    // Checked positively. Forbidding a pattern only forbids the spelling it
    // matches — renaming the variable, using `join`, writing `'../../../..'`
    // as one argument, or going through an intermediate all reintroduce the
    // same depth while the guard stays green. Requiring the helper leaves no
    // second way to answer the question.
    const usesHelper: string[] = [];
    const missing: string[] = [];
    for (const name of readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.ts'))) {
      const body = readFileSync(join(TESTS_DIR, name), 'utf8');
      // A test that never asks for the root has nothing to get wrong.
      if (!/\b(REPO_ROOT|ROOT|PACKAGES_DIR)\b/.test(body)) continue;
      if (/repoRoot\(HERE\)/.test(body) && /from '\.\/repo-root\.js'/.test(body)) {
        usesHelper.push(name);
      } else {
        missing.push(name);
      }
    }
    expect(missing, 'root を helper 以外で決めている').toEqual([]);
    // A guard that finds nothing to guard is not a guard.
    expect(usesHelper.length).toBeGreaterThan(20);
  });
});
