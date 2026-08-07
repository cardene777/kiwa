import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = resolve(repoRoot(HERE), 'tests', 'release-smoke', 'tests');

/** Strip comments so a mention in prose is not read as code. */
function code(body: string): string {
  return body.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
}

/**
 * Does this file work out where it is?
 *
 * Asked at the source rather than at the use. Looking for `resolve(HERE` missed
 * `const START = HERE; resolve(START, '..', ...)` — the same counting through
 * one more name. Every file that needs its own location gets it the one way
 * Node offers, so that is what to look for.
 */
function inScope(body: string): boolean {
  return /dirname\(\s*fileURLToPath\(\s*import\.meta\.url\s*\)\s*\)/.test(code(body));
}

/**
 * Does it get the repository root the one supported way?
 *
 * The import and the call have to agree on the name. Checking for a fixed
 * `repoRoot(` and the module path separately let a file import the helper,
 * leave `repoRoot(HERE)` in a comment, and count directories in the code.
 */
function usesHelper(body: string): boolean {
  const source = code(body);
  const imported = /import\s*\{[^}]*\brepoRoot\b(?:\s+as\s+(\w+))?[^}]*\}\s*from\s*'\.\/repo-root\.js'/.exec(
    source,
  );
  if (!imported) return false;
  const name = imported[1] ?? 'repoRoot';
  return new RegExp(`\\b${name}\\(\\s*HERE\\s*\\)`).test(source);
}

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

describe('the guard picks its targets without reading names', () => {
  it('catches a file that calls the root something else', () => {
    // The previous form selected by variable name, so `PROJECT_DIR` was outside
    // the check and could count directories freely.
    const body = [
      "const HERE = dirname(fileURLToPath(import.meta.url));",
      "const PROJECT_DIR = resolve(HERE, '..', '..', '..', '..');",
    ].join('\n');
    expect(inScope(body), 'path を組み立てている file は対象').toBe(true);
    expect(usesHelper(body), 'helper を使っていない').toBe(false);
  });

  it('does not accept a mention of the helper as use of it', () => {
    // `repoRoot` appearing anywhere is not the same as calling it with this
    // file's own location and importing it. A comment naming the helper, or a
    // local function that shadows the name, would satisfy a looser check while
    // the root is still counted by hand.
    expect(usesHelper('// use repoRoot here later\nconst ROOT = resolve(HERE, "../../../..");')).toBe(
      false,
    );
    expect(usesHelper('function repoRoot() { return "/" }\nconst ROOT = repoRoot();')).toBe(false);
    expect(usesHelper("import { repoRoot } from './repo-root.js';\nconst ROOT = repoRoot(OTHER);")).toBe(
      false,
    );
    // Both halves are required. Calling it without importing it does not
    // compile today, but the check should say what it wants rather than lean
    // on the compiler to say it.
    expect(usesHelper('const ROOT = repoRoot(HERE);')).toBe(false);
  });

  it('catches a file that counts directories through another name', () => {
    // `resolve(HERE` was the shape being looked for, so one intermediate name
    // put the same counting outside the check.
    const body = [
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      'const START = HERE;',
      "const PROJECT_DIR = resolve(START, '..', '..', '..', '..');",
    ].join('\n');
    expect(inScope(body)).toBe(true);
    expect(usesHelper(body)).toBe(false);
  });

  it('does not count an import plus a mention as use', () => {
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      '// was: repoRoot(HERE)',
      "const ROOT = resolve(HERE, '..', '..', '..', '..');",
    ].join('\n');
    expect(usesHelper(body)).toBe(false);
  });

  it('accepts the helper under an alias', () => {
    const body = [
      "import { repoRoot as findRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      'const ROOT = findRoot(HERE);',
    ].join('\n');
    expect(usesHelper(body)).toBe(true);
  });

  it('leaves alone a file that never builds a path from its own location', () => {
    expect(inScope("import { x } from './y.js';\nconst a = 1;")).toBe(false);
  });

  it('accepts the helper as the only way in scope', () => {
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      'const ROOT = repoRoot(HERE);',
    ].join('\n');
    expect(inScope(body)).toBe(true);
    expect(usesHelper(body)).toBe(true);
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
    const covered: string[] = [];
    const missing: string[] = [];
    for (const name of readdirSync(TESTS_DIR).filter((f) => f.endsWith('.test.ts'))) {
      const body = readFileSync(join(TESTS_DIR, name), 'utf8');
      const uses = usesHelper(body);
      // In scope if it builds a path from its own location — that is the act
      // this guard is about, and it is visible without knowing what the result
      // gets called. Selecting by variable name (`REPO_ROOT`, `ROOT`) left a
      // file that named it anything else outside the check entirely.
      if (!inScope(body)) continue;
      (uses ? covered : missing).push(name);
    }
    expect(missing, 'root を helper 以外で決めている').toEqual([]);
    // A guard that finds nothing to guard is not a guard.
    expect(covered.length).toBeGreaterThan(20);
  });
});
