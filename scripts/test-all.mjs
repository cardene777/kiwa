#!/usr/bin/env node
/**
 * Run every workspace package's `test`, and report every failure.
 *
 * `pnpm -r test` stops at the first package that fails. One red package hides
 * the rest, and the count is invisible: this repository sat with six red
 * packages while a single error was all anyone ever saw, and two of them had
 * been red since a rewrite nobody noticed.
 *
 * Three things this reports that `pnpm -r test` cannot:
 *
 *   red      the package failed, and its own output does not blame a tool
 *   blocked  the package failed, and its output names a tool that is absent.
 *            It is printed with the line from the package's output that says
 *            so, and it counts as a failure. A package that did not run has
 *            not passed, and a failure that happens to mention a missing tool
 *            may also have failed for a reason of its own; the first signature
 *            found wins, so classification is a hint and never an excuse.
 *            `--allow-missing-tools` exits 0 anyway.
 *   dirty    the package's tests changed a tracked file. A test that writes
 *            into the repository is a test with a side effect, and a
 *            `git add -A` afterwards sweeps it into an unrelated commit. This
 *            is a failure of the package that did it, whatever its exit code.
 *
 * The dirty check reads `git status --porcelain` at the repository root. A test
 * that writes outside the repository, or into a path `.gitignore` covers, is
 * invisible to it — and anything *you* change while the sweep runs is blamed on
 * whichever package happened to be running. Do not edit the tree during a
 * sweep; a run of this script reported `packages/lean/tests/async.test.ts` as
 * dirtied by `examples/nextjs-safe-multisig`, which had never heard of it.
 *
 * A package killed for hanging can leave a server running. Its results, and the
 * results of every package after it, are worth less than the ones from a clean
 * run.
 *
 * A line is printed as each package finishes, with how long it took. A sweep of
 * this repository takes the better part of an hour; a script that prints
 * nothing until the end cannot be told apart from one that has hung.
 *
 * Usage:
 *   node scripts/test-all.mjs                       summary, first error per package
 *   node scripts/test-all.mjs --verbose            every error line
 *   node scripts/test-all.mjs --allow-missing-tools  exit 0 even if a tool is absent
 *   node scripts/test-all.mjs --only nextjs        only packages whose path matches
 *   node scripts/test-all.mjs --timeout 600        seconds per package (default 900)
 *
 * Exits 1 when any package is red, blocked, or left the working tree dirty.
 *
 * Sequential, always. Many `test` scripts build the workspace packages they
 * depend on, so two of them at once rewrite the same `dist` while the other
 * reads it. `typecheck-all.mjs` kept a `--jobs` flag and it invented red
 * packages that passed when run alone; this one does not offer the choice.
 */

import { execFile, spawn } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

/**
 * A failure whose cause is a tool that is not installed, rather than the code.
 *
 * Every `evidence` string below was copied out of a failing package's own
 * output, produced by hiding the tool and running the sweep. None of them is a
 * guess about what a tool "probably prints". The first draft of this table
 * guessed `spawn anvil ENOENT`; what `packages/dapp/src/anvil.ts:119` actually
 * throws is `anvil not found in PATH`, so the guess classified a blocked
 * package as red.
 *
 * Matching is on the package's own output, never on a guess about what a
 * package needs. A static guess — "it depends on testcontainers, so it needs
 * Docker" — put twenty-six examples in a Docker bucket that pass with the
 * daemon unreachable, and put `packages/dapp` in an anvil bucket though its
 * tests never spawn one.
 */
export const TOOL_SIGNATURES = [
  {
    tool: 'Playwright Chromium',
    install: 'pnpm exec playwright install chromium',
    evidence: ["Executable doesn't exist at"],
  },
  {
    tool: 'Foundry (anvil)',
    install: 'curl -L https://foundry.paradigm.xyz | bash && foundryup',
    evidence: ['anvil not found in PATH'],
  },
];

/**
 * Why a failing package failed, as far as its own output admits.
 *
 * Returns `null` when nothing in the output blames a tool — that is a red
 * package, and calling it blocked would be the thing this script exists to
 * prevent.
 */
export function classifyFailure(output) {
  for (const { tool, install, evidence } of TOOL_SIGNATURES) {
    for (const needle of evidence) {
      const line = output.split('\n').find((l) => l.includes(needle));
      if (line !== undefined) return { tool, install, line: line.trim() };
    }
  }
  return null;
}

/**
 * The paths in `git status --porcelain -z` output.
 *
 * The human format quotes any path with a space or a non-ASCII byte, and writes
 * a rename as `R  old -> new`. Splitting that on ` -> ` mangles a file actually
 * named `a -> b.ts`, and unquoting it correctly means reimplementing git's
 * escaping. `-z` does neither: records are NUL-terminated and nothing is quoted.
 * A rename is two records, the new path and then the old one; both count as
 * touched.
 */
export function parsePorcelain(text) {
  const records = text.split('\0').filter((record) => record.length > 0);
  const paths = [];
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index];
    if (record.length < 4) continue;
    const status = record.slice(0, 2);
    paths.push(record.slice(3));
    // `R` and `C` are followed by a bare record holding the path they came from.
    if (status.includes('R') || status.includes('C')) {
      index += 1;
      if (index < records.length) paths.push(records[index]);
    }
  }
  return paths;
}

/** What appears in `after` and not in `before`. */
export function dirtiedPaths(before, after) {
  const seen = new Set(before);
  return after.filter((p) => !seen.has(p));
}

/**
 * Every workspace project that declares a `test` script, except the root.
 *
 * `projects` is what `pnpm ls -r --depth -1 --json` returns. Asking pnpm rather
 * than walking directories keeps `pnpm-workspace.yaml` the single source of
 * truth: a walk needs a hand-kept list of top directories and a depth limit,
 * and the day someone adds a workspace glob outside that list, the sweep skips
 * it in silence. Both agree today, on 219 packages.
 *
 * The root is excluded because its `test` is `pnpm -r test`, which is the thing
 * this script replaces. Running it here would recurse.
 */
export function discoverPackages(projects, rootDir, readManifest = defaultReadManifest) {
  const found = [];
  for (const project of projects) {
    if (project.path === rootDir) continue;
    const json = readManifest(join(project.path, 'package.json'));
    if (json?.scripts?.test) {
      found.push({ dir: project.path, name: json.name ?? relative(rootDir, project.path) });
    }
  }
  return found.sort((a, b) => a.dir.localeCompare(b.dir));
}

function defaultReadManifest(path) {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * The JSON array in `text`, ignoring anything printed before it.
 *
 * `pnpm` sometimes prints an update notice or a warning to stdout before the
 * document it was asked for, and `JSON.parse` has no tolerance for it. A sweep
 * that dies before running a single package because of a version banner is a
 * bad way to learn this.
 */
export function parseProjectList(text) {
  // Every `[` is a candidate, because a banner can contain one — `warning [pnpm]`
  // is a bracket that is not the start of a document. Take the first that parses.
  for (let start = text.indexOf('['); start !== -1; start = text.indexOf('[', start + 1)) {
    try {
      const parsed = JSON.parse(text.slice(start));
      if (Array.isArray(parsed)) return parsed;
    } catch {
      // Not the document. Keep looking.
    }
  }
  throw new Error('pnpm ls printed no JSON array');
}

/** Ask pnpm which projects the workspace has. */
function listProjects() {
  return new Promise((resolve, reject) => {
    const options = { cwd: ROOT, maxBuffer: 32 * 1024 * 1024 };
    execFile('pnpm', ['ls', '-r', '--depth', '-1', '--json'], options, (error, stdout) => {
      if (error) return reject(new Error(`pnpm ls failed: ${error.message}`));
      try {
        resolve(parseProjectList(stdout));
      } catch (e) {
        reject(new Error(`pnpm ls did not return JSON: ${e.message}`));
      }
    });
  });
}

/** `git status --porcelain -z`, as a list of paths. */
function porcelain() {
  const options = { cwd: ROOT, maxBuffer: 32 * 1024 * 1024, encoding: 'utf-8' };
  return new Promise((resolve) => {
    execFile('git', ['status', '--porcelain', '-z'], options, (_e, out) => {
      resolve(parsePorcelain(out ?? ''));
    });
  });
}

/**
 * SIGKILL the child's process group.
 *
 * Only ever called while the child is known to be running. Once a child has
 * exited and been reaped, its pid is free, and the operating system will hand
 * it to somebody else. `process.kill(-pid)` then signals a process group this
 * script never started — a dev server, an editor, another sweep. The window is
 * small and hard to hit on purpose; forty thousand spawns did not reuse a pid
 * on this machine. It is not a window worth standing in.
 */
function killGroup(child) {
  if (typeof child.pid !== 'number') return;
  try {
    // Negative pid: the whole process group, which `detached` gave us.
    process.kill(-child.pid, 'SIGKILL');
  } catch {
    try {
      child.kill('SIGKILL');
    } catch {
      // Already gone.
    }
  }
}

/**
 * Run a command, and decide for ourselves whether it ran out of time.
 *
 * `execFile`'s own `timeout` cannot be trusted here. It sends `SIGTERM` and
 * then reports whatever the child's exit code turned out to be. `pnpm` catches
 * `SIGTERM` and exits 0, so `error` arrives as `null` and a package killed for
 * hanging is indistinguishable from one that passed. A sweep of this repository
 * reported `examples/nextjs-safe-multisig` as taking 420.5 seconds and passing,
 * with the per-package limit set to 420 seconds.
 *
 * So: our timer, our verdict.
 *
 * We settle on `exit`, not on `close`. `close` waits for the stdio pipes, and a
 * grandchild that outlives its parent — a dev server, a watcher — inherits them
 * and holds them open. Waiting for `close` means a package whose tests passed
 * in a second sits until the timer kills it and is then reported as a hang; and
 * a grandchild that has left the process group (`setsid`) survives the kill and
 * holds the pipes forever, so the promise never settles and the sweep, which
 * has no outer timeout, stops.
 *
 * After `exit` we give the pipes `flushMs` to deliver what the child already
 * wrote, then stop waiting. `killGraceMs` is the backstop for a child that
 * never reports having exited at all.
 */
export function runCommand({
  command,
  args,
  cwd,
  timeoutMs,
  maxBytes = 64 * 1024 * 1024,
  flushMs = 500,
  killGraceMs = 5000,
}) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(command, args, { cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (error) {
      resolve({ ok: false, timedOut: false, overflowed: false, output: String(error.message) });
      return;
    }

    let output = '';
    let bytes = 0;
    let overflowed = false;
    let timedOut = false;
    let exitCode = null;
    let settled = false;
    let timer;
    let flushTimer;
    let graceTimer;

    // No signal is sent from here. By the time a child has exited, its pid
    // belongs to whoever the operating system gives it to next. Anything the
    // child left running outlives the sweep, and the sweep says so rather than
    // firing a signal into a pid it no longer owns.
    const settle = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      clearTimeout(flushTimer);
      clearTimeout(graceTimer);
      resolve({ ok: !timedOut && !overflowed && exitCode === 0, timedOut, overflowed, output });
    };

    const collect = (chunk) => {
      bytes += chunk.length;
      if (bytes > maxBytes) {
        overflowed = true;
        return;
      }
      output += chunk;
    };
    child.stdout.on('data', collect);
    child.stderr.on('data', collect);

    child.on('error', (error) => {
      output += error.message;
      exitCode = -1;
      settle();
    });

    child.on('exit', (code) => {
      exitCode = code;
      flushTimer = setTimeout(settle, flushMs);
    });

    // Everything the child held is closed. Nothing left to wait for.
    child.on('close', (code) => {
      if (exitCode === null) exitCode = code;
      settle();
    });

    timer = setTimeout(() => {
      // The child exited while we were waiting for its pipes. It finished; it
      // did not run out of time. Its pid is no longer ours to signal.
      if (settled || exitCode !== null) return;
      timedOut = true;
      killGroup(child);
      graceTimer = setTimeout(settle, killGraceMs);
    }, timeoutMs);
  });
}

/** Run one package's `test`. Resolves with the result rather than throwing. */
async function runTest({ dir, name }, timeoutMs) {
  const run = await runCommand({ command: 'pnpm', args: ['test'], cwd: dir, timeoutMs });
  return { name, dir: relative(ROOT, dir), ...run };
}

/**
 * The lines of `output` that look like a test failure.
 *
 * Falls back to the tail of the output when nothing matches. A package reported
 * red with no reason underneath it is not evidence of anything: the sweep did
 * that to `examples/nextjs-token-gating`, whose failure is a stack trace from
 * `tsx` that matches none of these shapes.
 */
export function failureLines(output) {
  const matched = output
    .split('\n')
    .filter((line) => /^\s*(×|✕|✘|FAIL|Error:|AssertionError)/.test(line) || / → /.test(line))
    .map((line) => line.trim());
  if (matched.length > 0) return matched;
  return output
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(-3);
}

/**
 * The value after `flag`, or `fallback` when the flag is absent.
 *
 * A flag with nothing after it, or with another flag after it, is an error and
 * not a default. `--only --verbose` used to filter for the string `--verbose`,
 * match no package, and exit 0 having run nothing.
 */
export function argValue(argv, flag, fallback) {
  const at = argv.indexOf(flag);
  if (at === -1) return fallback;
  const value = argv[at + 1];
  if (value === undefined || value.startsWith('-')) throw new Error(`${flag} needs a value`);
  return value;
}

async function main() {
  const verbose = process.argv.includes('--verbose');
  const allowMissingTools = process.argv.includes('--allow-missing-tools');
  const only = argValue(process.argv, '--only', null);
  const timeoutSec = Number(argValue(process.argv, '--timeout', '900'));
  if (!Number.isFinite(timeoutSec) || timeoutSec <= 0) throw new Error('--timeout takes seconds');

  const all = discoverPackages(await listProjects(), ROOT);
  const packages = only ? all.filter((p) => relative(ROOT, p.dir).includes(only)) : all;
  // Running nothing is not the same as everything passing. A typo in `--only`
  // used to print `testing 0 packages` and exit 0.
  if (packages.length === 0) {
    throw new Error(only ? `--only ${only} matched none of ${all.length} packages` : 'no packages have a test script');
  }

  // Dirt that is already here cannot be blamed on the package that runs first,
  // so the sweep ignores it — and therefore cannot see it. Say so, rather than
  // report `dirty: 0` about a tree that is not clean.
  const startingDirt = await porcelain();
  if (startingDirt.length > 0) {
    process.stdout.write(`the working tree is not clean. ${startingDirt.length} paths already changed:\n`);
    for (const path of startingDirt.slice(0, 10)) process.stdout.write(`  ${path}\n`);
    if (startingDirt.length > 10) process.stdout.write(`  ... and ${startingDirt.length - 10} more\n`);
    process.stdout.write('a package that rewrites one of these will not be reported as dirty.\n\n');
  }

  process.stdout.write(`testing ${packages.length} packages, one at a time\n\n`);

  const red = [];
  const blocked = [];
  const dirty = [];
  let green = 0;
  const width = String(packages.length).length;

  for (const [index, pkg] of packages.entries()) {
    const counter = `[${String(index + 1).padStart(width)}/${packages.length}]`;
    const started = Date.now();
    const before = await porcelain();
    const result = await runTest(pkg, timeoutSec * 1000);
    const after = await porcelain();
    const touched = dirtiedPaths(before, after);
    const took = `${((Date.now() - started) / 1000).toFixed(1)}s`;

    if (touched.length > 0) dirty.push({ ...result, touched });

    if (result.ok) {
      if (touched.length === 0) {
        green += 1;
        process.stdout.write(`${counter} ok    ${result.dir}  ${took}\n`);
      } else {
        process.stdout.write(`${counter} DIRTY ${result.dir}  ${took}\n`);
      }
      continue;
    }

    const cause = result.timedOut ? null : classifyFailure(result.output);
    if (cause) {
      blocked.push({ ...result, cause });
      process.stdout.write(`${counter} SKIP  ${result.dir}  (needs ${cause.tool})  ${took}\n`);
      continue;
    }
    red.push(result);
    const why = result.timedOut
      ? `  (killed after ${timeoutSec}s)`
      : result.overflowed
        ? '  (output too large)'
        : '';
    process.stdout.write(`${counter} RED   ${result.dir}${why}  ${took}\n`);
    if (result.timedOut) {
      // A killed package can leave a server behind. `examples/nextjs-safe-multisig`
      // hangs, and the `next-server` its Playwright config starts survives the
      // SIGKILL to the process group and keeps port 3046. The next package to
      // want that port — `examples/nextjs-zk-verifier` uses the same one — then
      // fails for a reason that has nothing to do with it.
      process.stdout.write('        anything it leaked outlives it. Later packages may fail because of this one.\n');
    }
    for (const line of verbose ? failureLines(result.output) : failureLines(result.output).slice(0, 1)) {
      process.stdout.write(`        ${line.slice(0, 150)}\n`);
    }
  }

  if (blocked.length > 0) {
    process.stdout.write('\nnot run, because a tool is missing. This is not "passed".\n');
    if (allowMissingTools) process.stdout.write('(--allow-missing-tools: not counted against the exit code)\n');
    const byTool = new Map();
    for (const b of blocked) {
      if (!byTool.has(b.cause.tool)) byTool.set(b.cause.tool, []);
      byTool.get(b.cause.tool).push(b);
    }
    for (const [tool, list] of byTool) {
      process.stdout.write(`\n  ${tool}  (${list.length} packages)   install: ${list[0].cause.install}\n`);
      for (const b of list) process.stdout.write(`    ${b.dir}\n`);
      process.stdout.write(`    evidence: ${list[0].cause.line.slice(0, 120)}\n`);
    }
  }

  if (dirty.length > 0) {
    process.stdout.write('\nthese packages changed the working tree. A test that writes into the\n');
    process.stdout.write('repository is a test with a side effect.\n\n');
    for (const d of dirty) {
      process.stdout.write(`  ${d.dir}\n`);
      for (const p of d.touched.slice(0, 5)) process.stdout.write(`    ${p}\n`);
      if (d.touched.length > 5) process.stdout.write(`    ... and ${d.touched.length - 5} more\n`);
    }
  }

  const failed = red.length + dirty.length + (allowMissingTools ? 0 : blocked.length);
  process.stdout.write(
    `\ngreen: ${green}   red: ${red.length}   dirty: ${dirty.length}   not run: ${blocked.length}\n`,
  );
  process.exit(failed === 0 ? 0 : 1);
}

// Only run as CLI when invoked directly (not when imported by tests).
const isEntry = pathToFileURL(process.argv[1] ?? '').href === import.meta.url;
if (isEntry) {
  main().catch((err) => {
    process.stderr.write(`[test-all] ${err.stack ?? err.message ?? err}\n`);
    process.exit(1);
  });
}
