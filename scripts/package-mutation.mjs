#!/usr/bin/env node
/**
 * One package's mutation run, from a clean build.
 *
 * Stryker mutates the compiled `.vitest-dist/src/*.js`, and that directory is
 * gitignored. A package whose `test:mutation` was a bare `stryker run` therefore
 * scored whatever happened to be on disk: nothing on a clean checkout, and stale
 * JavaScript in a workspace where an earlier build was left behind. #1955 found
 * 20 packages in that shape; `cli` was the only one that compiled first.
 *
 * The steps are the ones `cli` already used — remove, compile, run — moved into
 * one file so the 22 packages share an implementation instead of 22 copies of a
 * shell chain. Each package's script is exactly:
 *
 *   "test:mutation": "node ../../scripts/package-mutation.mjs"
 *
 * `tests/release-smoke/tests/mutation-gate-coverage.test.ts` requires that
 * string, so a package cannot quietly go back to running Stryker directly.
 *
 * Arguments are not forwarded to Stryker; see `runPackageMutation` for why.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMainModule } from './lib/is-main-module.mjs';
import { recordForPackage } from './record-artifact-inputs.mjs';

/** Repo root, found from this file rather than from the caller's cwd. */
const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));

/**
 * Where `tsc` puts the copy Stryker measures.
 *
 * Deleted and recompiled by every run, which is what makes it usable as the
 * instant the inputs were read: `recordForPackage` refuses to record an input
 * newer than this build, because such an input never reached the report.
 */
const BUILD_DIR = '.vitest-dist';
/**
 * Where Stryker writes the report the gate reads.
 *
 * Removed alongside the build, before anything that can fail. A run that stops
 * early — a failed compile, a missing config, an interrupt — would otherwise
 * leave the previous run's `mutation.json` in place, and
 * `check-mutation-gates.mjs` reads whatever report it finds. Deleting first
 * turns that into "no mutation.json", which the gate already fails on.
 */
const REPORT_DIR = 'mutation-report';
const TS_PROJECT = 'tsconfig.vitest.json';
const CONFIG_PATTERN = /^\.?stryker\.(config|conf)\.[a-z0-9]+$/i;

/** Whether `cwd` is a package at all. Nothing is deleted before this holds. */
export function packageDirProblem(cwd) {
  return existsSync(resolve(cwd, 'package.json')) ? null : 'no package.json';
}

/** What the package needs before Stryker can produce a meaningful report. */
export function mutationSetupProblems(cwd, listDir = readdirSync) {
  const problems = [];
  if (!existsSync(resolve(cwd, TS_PROJECT))) problems.push(`no ${TS_PROJECT}`);
  if (!listDir(cwd).some((name) => CONFIG_PATTERN.test(name))) problems.push('no Stryker config');
  return problems;
}

function runStep(command, args, cwd) {
  // The package manager puts the package's `node_modules/.bin` on PATH before
  // running its script, and a child process inherits it, so `tsc` and `stryker`
  // resolve the same way they did when the script called them directly.
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.error) {
    process.stderr.write(`${command}: ${result.error.message}\n`);
    return 1;
  }
  if (result.signal) {
    process.stderr.write(`${command} terminated by ${result.signal}\n`);
    return 1;
  }
  return result.status ?? 1;
}

/**
 * Remove, compile, run — in that order, and only as far as each step allows.
 *
 * The removals and the compile are what make the score belong to the current
 * source, so a check has to be able to see that they happen and that a failed
 * step stops the run. `rm`, `run`, and the two problem reports are parameters
 * for that reason: the order and the short-circuits are observable without
 * spawning anything.
 *
 * The removals come before the setup check, not after. A package missing its
 * config cannot produce a report now, and leaving the last one in place is how
 * the gate scores a run that did not happen. They come after the package check,
 * because a wrong working directory is the one case where deleting anything is
 * the wrong move.
 *
 * Stryker gets no arguments beyond `run`. Forwarding them would let a single
 * invocation narrow its own scope (`--mutate`) or redirect its report
 * (`--reporters`, `--jsonReporter`) while the gate goes on reading the result as
 * if it covered the package. The config is the only place scope is set.
 *
 * @returns the exit code to leave with.
 */
/**
 * Record what this run measured.
 *
 * Through the shared recorder so the artefact, the inputs, and the build are
 * resolved the same way coverage resolves them. Stryker measures the compiled
 * copy and this run takes minutes (35 for `dapp`), so an edit landing in that
 * window must not be recorded as what was measured.
 *
 * Exported because the entry-point block below only runs as a CLI inside a real
 * package, where nothing checks it. Calling through here puts the wiring —
 * which kind, which root — somewhere a test can reach.
 */
export function recordMutationInputs(cwd, repoRoot = REPO_ROOT) {
  return recordForPackage({ kind: 'mutation', cwd, repoRoot });
}

export function runPackageMutation({
  cwd,
  rm,
  run,
  warn = () => {},
  dirProblem = null,
  setupProblems = () => [],
  record = () => ({ ok: false, reason: 'no recorder supplied' }),
}) {
  if (dirProblem) {
    warn(`${cwd}: ${dirProblem} — run this through a package's \`test:mutation\` script.\n`);
    return 2;
  }

  rm(resolve(cwd, BUILD_DIR));
  rm(resolve(cwd, REPORT_DIR));

  const problems = setupProblems();
  if (problems.length > 0) {
    warn(`${cwd}: cannot run mutation testing here — ${problems.join(', ')}.\n`);
    return 2;
  }

  const compiled = run('tsc', ['-p', TS_PROJECT], cwd);
  if (compiled !== 0) {
    warn('compile failed — not running Stryker against a stale build.\n');
    return compiled;
  }

  const scored = run('stryker', ['run'], cwd);
  if (scored !== 0) return scored;

  // Only after a run that produced a report. A sidecar written beside an
  // artefact from an earlier run would pair this content with those numbers,
  // and the gate would read the stale report as current (#2135).
  const recorded = record();
  if (!recorded.ok) {
    // Not a failure of the run. The gate falls back to comparing timestamps
    // when the sidecar is absent, which is what it did before #2135.
    warn(`could not record the input fingerprint: ${recorded.reason}\n`);
  }
  return 0;
}

if (isMainModule(process.argv[1], import.meta.url)) {
  const cwd = process.cwd();
  process.exit(
    runPackageMutation({
      cwd,
      rm: (dir) => rmSync(dir, { recursive: true, force: true }),
      run: runStep,
      warn: (message) => process.stderr.write(message),
      dirProblem: packageDirProblem(cwd),
      setupProblems: () => mutationSetupProblems(cwd),
      // Not reachable from a test: this block runs only when the file is the
      // entry point, and getting here needs a real Stryker run (a fixture
      // package stops at `setupProblems`, which returns 2 before recording).
      // What the call does is checked through `recordMutationInputs`; what is
      // left unchecked is this one line wiring it in.
      record: () => recordMutationInputs(cwd),
    }),
  );
}
