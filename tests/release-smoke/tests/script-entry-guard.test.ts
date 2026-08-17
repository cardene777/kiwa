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
    expect(isMainModule(join(dir, 'missing.mjs'), pathToFileURL(one).href)).toBe(false);
    expect(isMainModule(undefined, pathToFileURL(one).href)).toBe(false);
    expect(isMainModule('', pathToFileURL(one).href)).toBe(false);
  });

  it('leaves no script comparing file:// strings', () => {
    // The form is easy to write from memory and impossible to notice failing,
    // so the check is on the shape rather than on any one script.
    const offenders = scriptFiles().filter((file) => {
      const source = readFileSync(file, 'utf-8');
      return /import\.meta\.url\s*===\s*`file:\/\/\$\{process\.argv\[1\]\}`/.test(source);
    });
    expect(offenders.map((file) => file.slice(REPO_ROOT.length + 1))).toEqual([]);
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
