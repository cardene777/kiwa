import { mkdirSync, mkdtempSync, rmSync, writeFileSync, readdirSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';
import ts from 'typescript';

const HERE = dirname(fileURLToPath(import.meta.url));
const TESTS_DIR = resolve(repoRoot(HERE), 'tests', 'release-smoke', 'tests');

/**
 * Parse a test file so the checks below look at code rather than at text.
 *
 * A file that does not parse is not a file this guard can judge. Returning a
 * partial tree would answer "not in scope" for it, and a file that silently
 * leaves the check is exactly what this guard exists to prevent.
 */
function parse(body: string): ts.SourceFile {
  const source = ts.createSourceFile('probe.ts', body, ts.ScriptTarget.ESNext, true);
  const errors = (source as unknown as { parseDiagnostics?: unknown[] }).parseDiagnostics ?? [];
  if (errors.length > 0) throw new Error(`source が構文として読めない (${errors.length} 件)`);
  return source;
}

/** Walk every node once. */
function visit(node: ts.Node, seen: (node: ts.Node) => void): void {
  seen(node);
  node.forEachChild((child) => visit(child, seen));
}

/**
 * Does this file work out where it is?
 *
 * Asked at `import.meta` and nothing else. A module cannot learn its own path
 * without it — `fileURLToPath(import.meta.url)`, `new URL('.', import.meta.url)`
 * and `import.meta.dirname` all go through it — so its presence is the question
 * and its absence is the answer.
 *
 * Matching call shapes was tried three times and broken three times: first by a
 * different variable name, then by an intermediate assignment, then by aliasing
 * `fileURLToPath`. Each fix enumerated one more spelling. This stops
 * enumerating.
 *
 * It errs wide. A file mentioning `import.meta` for some other reason is asked
 * to use the helper it does not need, which fails visibly and is corrected in
 * one line. The other direction fails silently.
 */
function inScope(body: string): boolean {
  let found = false;
  visit(parse(body), (node) => {
    if (node.kind === ts.SyntaxKind.MetaProperty) found = true;
  });
  return found;
}

/**
 * Does it get the repository root the one supported way?
 *
 * Two things have to line up.
 *
 * 1. The helper is imported from `./repo-root.js` (alias allowed)
 * 2. The root is initialised at module scope by calling that binding
 *
 * 2 is what makes 1 mean anything. Matching the name anywhere in the file
 * accepted one that imported the helper and then declared
 * `const repoRoot = () => '/'` inside a function, calling the decoy while the
 * real root was counted by hand.
 *
 * A separate shadow check was written for that and then removed: no mutation
 * could kill it. Restricting the call to module scope already covers it —
 * an inner declaration cannot change what the module-scope call resolves to,
 * and redeclaring an import at module scope is not valid TypeScript.
 */
function usesHelper(body: string): boolean {
  const source = parse(body);

  let imported: string | null = null;
  visit(source, (node) => {
    if (!ts.isImportDeclaration(node)) return;
    if (!ts.isStringLiteral(node.moduleSpecifier)) return;
    if (node.moduleSpecifier.text !== './repo-root.js') return;
    const bindings = node.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) return;
    for (const element of bindings.elements) {
      // `repoRoot as findRoot` puts the original in `propertyName`.
      if ((element.propertyName?.text ?? element.name.text) === 'repoRoot') {
        imported = element.name.text;
      }
    }
  });
  if (imported === null) return false;
  const helper: string = imported;

  // The root is a module-scope binding initialised by the helper. Restricting
  // the shape here is what keeps a decoy call somewhere else from counting.
  let initialised = false;
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer) continue;
      // The call may be composed — `resolve(repoRoot(HERE), 'tests')` is a
      // module-scope initialisation too. What matters is that it happens at
      // module scope, which is what keeps a decoy inside a function from
      // counting.
      visit(declaration.initializer, (node) => {
        if (!ts.isCallExpression(node) || !ts.isIdentifier(node.expression)) return;
        if (node.expression.text !== helper) return;
        const [arg] = node.arguments;
        if (arg && ts.isIdentifier(arg) && arg.text === 'HERE') initialised = true;
      });
    }
  }
  return initialised;
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

  it('wants the module URL, not any argument', () => {
    // `dirname(fileURLToPath(x))` resolves whatever `x` names. Only
    // `import.meta.url` is the file asking where it is.
    expect(inScope('const D = dirname(fileURLToPath(someOtherUrl));')).toBe(false);
    expect(inScope('const D = dirname(fileURLToPath(import.meta.url));')).toBe(true);
  });

  it('is in scope for every way a module can locate itself', () => {
    // Matching call shapes was broken three times, each time by a spelling the
    // last fix had not listed. These are the ones review named.
    for (const body of [
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      'const f = fileURLToPath;\nconst HERE = dirname(f(import.meta.url));',
      "const HERE = new URL('.', import.meta.url).pathname;",
      'const HERE = import.meta.dirname;',
      'const u = import.meta.url;',
    ]) {
      expect(inScope(body), body).toBe(true);
    }
  });

  it('rejects a decoy that shadows the helper name', () => {
    // Importing the helper and then declaring something with the same name in
    // an inner scope let the decoy be called while the real root was counted
    // by hand. TypeScript allows the shadow, so the compiler does not object.
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      "const ROOT = resolve(HERE, '..', '..', '..', '..');",
      'function inner() {',
      "  const repoRoot = () => '/';",
      '  return repoRoot(HERE);',
      '}',
    ].join('\n');
    expect(usesHelper(body)).toBe(false);
  });

  it('rejects a call that only happens inside a function', () => {
    // The root has to be settled at module scope. A call somewhere in the file
    // says nothing about what the root was set from.
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      "const ROOT = resolve(HERE, '..', '..', '..', '..');",
      'function unused() { return repoRoot(HERE); }',
    ].join('\n');
    expect(usesHelper(body)).toBe(false);
  });

  it('rejects a parameter that shadows HERE', () => {
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      'function f(HERE: string) { return repoRoot(HERE); }',
      "const ROOT = resolve(HERE, '..', '..', '..', '..');",
    ].join('\n');
    expect(usesHelper(body)).toBe(false);
  });

  it('accepts the helper composed into a larger expression', () => {
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      "const TESTS = resolve(repoRoot(HERE), 'tests');",
    ].join('\n');
    expect(usesHelper(body)).toBe(true);
  });

  it('refuses a file it cannot parse rather than calling it out of scope', () => {
    // Answering "not in scope" for an unparseable file lets it leave the check
    // quietly, which is the shape this guard exists to prevent.
    expect(() => inScope('const HERE = dirname(fileURLToPath(import.meta.url\n')).toThrow(
      /構文として読めない/,
    );
  });

  it('does not read a URL inside a string as a comment', () => {
    // The regex form cut everything after `//`, so a file holding a URL lost
    // the rest of that line. Whether it mattered depended on what came after.
    const body = [
      "const docs = 'https://example.com/a//b';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
    ].join('\n');
    expect(inScope(body), 'URL の // を comment と読まない').toBe(true);
  });

  it('does not read a self-location call written inside a string', () => {
    // The other direction: text that looks like the call is not the call.
    const body = "const note = 'dirname(fileURLToPath(import.meta.url))';";
    expect(inScope(body)).toBe(false);
  });

  it('does not read a helper call written inside a string', () => {
    const body = [
      "import { repoRoot } from './repo-root.js';",
      'const HERE = dirname(fileURLToPath(import.meta.url));',
      "const note = 'repoRoot(HERE)';",
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
