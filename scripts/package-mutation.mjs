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
 * Extra arguments are forwarded to Stryker (`pnpm -F @kiwa-lab/core run
 * test:mutation -- --concurrency 2`).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const BUILD_DIR = '.vitest-dist';
const TS_PROJECT = 'tsconfig.vitest.json';
const CONFIG_PATTERN = /^\.?stryker\.(config|conf)\.[a-z0-9]+$/i;

/** What the package needs before this script can do anything useful. */
export function checkPreconditions(cwd, listDir = readdirSync) {
  const problems = [];
  if (!existsSync(resolve(cwd, 'package.json'))) problems.push('no package.json');
  if (!existsSync(resolve(cwd, TS_PROJECT))) problems.push(`no ${TS_PROJECT}`);
  const hasConfig = listDir(cwd).some((name) => CONFIG_PATTERN.test(name));
  if (!hasConfig) problems.push('no Stryker config');
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
 * The removal and the compile are what make the score belong to the current
 * source, so a check has to be able to see that they happen and that a failed
 * compile stops the run. `rm` and `run` are parameters for that reason: the
 * order and the short-circuit are observable without spawning anything.
 *
 * @returns the exit code to leave with.
 */
export function runPackageMutation({ cwd, rm, run, args = [], warn = () => {} }) {
  // Remove first: a partial build from an interrupted run is the shape that
  // produces a green report for code that is no longer there.
  rm(resolve(cwd, BUILD_DIR));

  const compiled = run('tsc', ['-p', TS_PROJECT], cwd);
  if (compiled !== 0) {
    warn('compile failed — not running Stryker against a stale build.\n');
    return compiled;
  }

  return run('stryker', ['run', ...args], cwd);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cwd = process.cwd();
  const problems = checkPreconditions(cwd);
  if (problems.length > 0) {
    process.stderr.write(
      `${cwd}: cannot run mutation testing here — ${problems.join(', ')}.\n` +
        "Run this through a package's `test:mutation` script.\n",
    );
    process.exit(2);
  }

  process.exit(
    runPackageMutation({
      cwd,
      rm: (dir) => rmSync(dir, { recursive: true, force: true }),
      run: runStep,
      args: process.argv.slice(2),
      warn: (message) => process.stderr.write(message),
    }),
  );
}
