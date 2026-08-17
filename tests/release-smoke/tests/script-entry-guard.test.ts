// A script must not exit 0 having done nothing (Issue #1957).
//
// Scripts decide whether they were run or imported by comparing
// `import.meta.url` with `process.argv[1]`. Building a `file://` string from
// argv and comparing it as text fails in two cases — a path that needs URL
// encoding, and a path reached through a symlink — and the failure is silent:
// the guard does not fire, the body never runs, and the process exits 0. For a
// gate script that reads as "checked, passed".
//
// It has happened twice. `rebuild-plugin-metadata.mjs` had a `--check` run that
// exited 0 without checking, and #1955 found the same shape in the mutation
// runners. This axis keeps the fixed form from being written back.
import { execFile } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import ts from 'typescript';
import { afterAll, describe, expect, it } from 'vitest';

import { repoRoot } from './repo-root.js';

const execFileAsync = promisify(execFile);
const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = repoRoot(HERE);
const HELPER = resolve(REPO_ROOT, 'scripts/lib/is-main-module.mjs');

const fixtures: string[] = [];
afterAll(() => {
  for (const dir of fixtures) rmSync(dir, { recursive: true, force: true });
});

function tempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  fixtures.push(dir);
  return dir;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const loadHelper = (): Promise<any> => import(pathToFileURL(HELPER).href);

/**
 * Reads of `process.argv[1]` that are not the shared helper's argument.
 *
 * Parsed, not matched. Stripping comments with a regex to avoid false hits was
 * the first attempt, and it cut both ways: a `//` inside a string removed real
 * code, and the shapes that needed excluding kept growing. The parser knows
 * what a comment and a string literal are, so the question becomes a walk over
 * expressions.
 *
 * **Its reach is direct reads.** `const a = process.argv; a[1]` and
 * `const [, first] = process.argv` are not caught, and following values through
 * variables would put this check back in the business of enumerating forms —
 * the loop that produced the two versions above. Nobody writes an entry check
 * that way, and the property that actually matters (a script that exits 0
 * having done nothing) is covered for the gate scripts by running them below.
 */
function handRolledEntryChecks(file: string): string[] {
  const source = readFileSync(file, 'utf-8');
  const parsed = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  const offenders: string[] = [];

  const visit = (node: ts.Node): void => {
    if (
      ts.isElementAccessExpression(node) &&
      node.expression.getText(parsed) === 'process.argv' &&
      node.argumentExpression.getText(parsed) === '1'
    ) {
      const call = node.parent;
      const viaHelper =
        call !== undefined &&
        ts.isCallExpression(call) &&
        call.expression.getText(parsed) === 'isMainModule';
      if (!viaHelper) {
        const { line } = parsed.getLineAndCharacterOfPosition(node.getStart(parsed));
        offenders.push(`${file}:${line + 1}`);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(parsed);
  return offenders;
}

/** Every `.mjs` under `scripts/`, including `scripts/lib/`. */
function scriptFiles(): string[] {
  const found: string[] = [];
  const visit = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules') visit(full);
      } else if (entry.name.endsWith('.mjs')) {
        found.push(full);
      }
    }
  };
  visit(resolve(REPO_ROOT, 'scripts'));
  return found.sort();
}

describe('scripts know whether they were run or imported', () => {
  it('says yes for the file being run, whatever the path looks like', async () => {
    const { isMainModule } = await loadHelper();

    // Encoding: a directory with a space. Both spellings name the same file, so
    // resolving paths accepts what comparing URL text rejected.
    const spacedDir = tempDir('kiwa guard ');
    const spaced = join(spacedDir, 'script.mjs');
    writeFileSync(spaced, '// probe\n');
    expect(isMainModule(spaced, pathToFileURL(spaced).href)).toBe(true);
    expect(isMainModule(spaced, `file://${spaced}`)).toBe(true);

    // Symlink: the same file reached through a link. macOS resolves `/tmp` to
    // `/private/tmp`, so this is the ordinary case.
    const linkDir = tempDir('kiwa-guard-link-');
    const link = join(linkDir, 'linked.mjs');
    symlinkSync(spaced, link);
    expect(isMainModule(link, pathToFileURL(spaced).href)).toBe(true);
  });

  it('says no for anything that is not that file', async () => {
    const { isMainModule } = await loadHelper();
    const dir = tempDir('kiwa-guard-neg-');
    const one = join(dir, 'one.mjs');
    const two = join(dir, 'two.mjs');
    writeFileSync(one, '// one\n');
    writeFileSync(two, '// two\n');

    expect(isMainModule(one, pathToFileURL(two).href)).toBe(false);
    // Unresolvable paths err toward "imported": a broken invocation must not
    // run a gate's side effects.
    const quiet = () => {};
    expect(isMainModule(join(dir, 'missing.mjs'), pathToFileURL(one).href, quiet)).toBe(false);
    expect(isMainModule(undefined, pathToFileURL(one).href)).toBe(false);
    expect(isMainModule('', pathToFileURL(one).href)).toBe(false);
  });

  it('leaves no script deciding this for itself', () => {
    // Not a search for the broken spelling — that is a list of forms, and the
    // one written next will be the one not on it. `process.argv[1]` has no use
    // in these scripts other than the entry check, so the rule is that every
    // read of it is the shared helper's argument.
    const offenders = scriptFiles()
      .filter((file) => file !== HELPER)
      .flatMap((file) => handRolledEntryChecks(file))
      .map((hit) => hit.slice(REPO_ROOT.length + 1));
    expect(offenders).toEqual([]);
  });

  it('sees a hand-rolled check and ignores one that only looks like it', () => {
    const dir = tempDir('kiwa-guard-scan-');
    const write = (name: string, body: string) => {
      const file = join(dir, name);
      writeFileSync(file, body);
      return file;
    };

    // The two forms this repo has actually shipped.
    expect(handRolledEntryChecks(write('old.mjs', 'if (import.meta.url === `file://${process.argv[1]}`) run();\n'))).toHaveLength(1);
    expect(handRolledEntryChecks(write('url.mjs', "const e = pathToFileURL(process.argv[1] ?? '').href === import.meta.url;\n"))).toHaveLength(1);

    // A different function taking it directly is still a hand-rolled check —
    // the allowance is for the shared helper, not for "it is inside a call".
    expect(handRolledEntryChecks(write('direct.mjs', 'const e = pathToFileURL(process.argv[1]).href === import.meta.url;\n'))).toHaveLength(1);

    // The helper's own call is what the rule allows.
    expect(handRolledEntryChecks(write('ok.mjs', 'if (isMainModule(process.argv[1], import.meta.url)) run();\n'))).toEqual([]);

    // A comment or a string that quotes the form is not code.
    expect(handRolledEntryChecks(write('comment.mjs', '// process.argv[1] used to be compared here\nconst a = 1;\n'))).toEqual([]);
    expect(handRolledEntryChecks(write('string.mjs', 'const doc = "compare process.argv[1] yourself";\n'))).toEqual([]);
    // And a `//` inside a string does not hide the code after it, which is what
    // the regex version got wrong.
    expect(handRolledEntryChecks(write('url-in-string.mjs', 'const u = "https://example.com";\nconst e = process.argv[1];\n'))).toHaveLength(1);
  });

  it('reports an unresolvable path instead of failing quietly', async () => {
    const { isMainModule } = await loadHelper();
    // "Resolved to nothing" is the state that used to look like success. It
    // still answers "not the main module", but it says so.
    const messages: string[] = [];
    expect(
      isMainModule('/no/such/file.mjs', 'file:///no/such/file.mjs', (m: string) =>
        messages.push(m),
      ),
    ).toBe(false);
    expect(messages.join('')).toContain('/no/such/file.mjs');

    // The ordinary answers stay silent.
    messages.length = 0;
    isMainModule(HELPER, pathToFileURL(HELPER).href, (m: string) => messages.push(m));
    isMainModule(undefined, pathToFileURL(HELPER).href, (m: string) => messages.push(m));
    expect(messages).toEqual([]);
  });

  it('runs the body when executed and stays quiet when imported', async () => {
    // Two gates and a reporter, each of which would otherwise report success
    // without doing its work.
    const scripts = [
      'scripts/check-mutation-gates.mjs',
      'scripts/check-a11y-gates.mjs',
      'scripts/post-coverage-diff.mjs',
    ];

    for (const script of scripts) {
      const executed = await execFileAsync(process.execPath, [resolve(REPO_ROOT, script)], {
        cwd: REPO_ROOT,
        maxBuffer: 8 * 1024 * 1024,
      });
      expect(executed.stdout.length, `${script}: produced no output when run`).toBeGreaterThan(0);

      const imported = await execFileAsync(
        process.execPath,
        [
          '--input-type=module',
          '-e',
          `await import(${JSON.stringify(pathToFileURL(resolve(REPO_ROOT, script)).href)});`,
        ],
        { cwd: REPO_ROOT, maxBuffer: 8 * 1024 * 1024 },
      );
      expect(imported.stdout, `${script}: ran its body on import`).toBe('');
    }
  });
});
