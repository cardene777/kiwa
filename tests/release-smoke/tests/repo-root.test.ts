import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = resolve(HERE, '..', '..', '..', 'tests', 'release-smoke', 'tests');

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
    // the repository for the source one. Ten of these tests enumerate and
    // assert an empty result, so outside the repository they pass having
    // checked nothing — which is how #1821 hid for two full sweeps.
    const offenders = readdirSync(TESTS_DIR)
      .filter((name) => name.endsWith('.test.ts'))
      .filter((name) =>
        /const\s+(REPO_ROOT|ROOT)\s*=\s*resolve\(HERE(?:,\s*'\.\.'){3,}\)/.test(
          readFileSync(join(TESTS_DIR, name), 'utf8'),
        ),
      );
    expect(offenders).toEqual([]);
  });
});
