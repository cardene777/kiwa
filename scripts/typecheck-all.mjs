#!/usr/bin/env node
/**
 * Typecheck every workspace package, and report every failure.
 *
 * `pnpm -r typecheck` stops at the first package that fails. One red package
 * hides the rest, and the count is invisible: this repository sat with eight red
 * packages, failing for five distinct reasons, while a single error was all
 * anyone ever saw.
 *
 * Usage:
 *   node scripts/typecheck-all.mjs             summary, first error per package
 *   node scripts/typecheck-all.mjs --verbose   every error line
 *   node scripts/typecheck-all.mjs --jobs 4    run several at once, see below
 *
 * Exits 1 when any package fails, so it can be a gate.
 *
 * Sequential by default. Many `typecheck` scripts build the workspace packages
 * they depend on, so two of them running at once rewrite the same `dist` while
 * the other reads it, and `tsc` reports members that exist. Run this with
 * `--jobs 4` and it will invent red packages that pass when run alone.
 */

import { execFile } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const VERBOSE = process.argv.includes('--verbose');

/** Concurrency. One, unless the caller says otherwise and accepts the races. */
const JOBS = (() => {
  const at = process.argv.indexOf('--jobs');
  if (at === -1) return 1;
  const value = Number(process.argv[at + 1]);
  if (!Number.isInteger(value) || value < 1) throw new Error('--jobs takes a positive integer');
  return value;
})();

/** The workspace roots, kept in step with `pnpm-workspace.yaml`. */
const AREAS = ['packages', 'examples', 'tests', 'promo'];

/** Directories under `dir`, skipping dotfiles and installed packages. */
function subdirectories(dir) {
  try {
    return readdirSync(dir)
      .filter((entry) => !entry.startsWith('.') && entry !== 'node_modules')
      .filter((entry) => {
        try {
          return statSync(join(dir, entry)).isDirectory();
        } catch {
          return false;
        }
      });
  } catch {
    return [];
  }
}

/** Every package that declares a `typecheck` script. */
function findPackages(dir, depth = 1) {
  if (depth > 3) return [];
  const found = [];
  const manifest = join(dir, 'package.json');
  if (existsSync(manifest)) {
    const json = JSON.parse(readFileSync(manifest, 'utf-8'));
    if (json.scripts?.typecheck) found.push({ dir, name: json.name ?? relative(ROOT, dir) });
  }
  for (const entry of subdirectories(dir)) found.push(...findPackages(join(dir, entry), depth + 1));
  return found;
}

/** Run one package's `typecheck`. Resolves with the result rather than throwing. */
function typecheck({ dir, name }) {
  return new Promise((resolve) => {
    const options = { cwd: dir, maxBuffer: 32 * 1024 * 1024 };
    execFile('pnpm', ['typecheck'], options, (error, stdout, stderr) => {
      const output = `${stdout}${stderr}`;
      const errors = output.split('\n').filter((line) => /error TS\d+/.test(line));
      resolve({ name, dir: relative(ROOT, dir), ok: error === null, errors, output });
    });
  });
}

/** Run `fn` over `items`, at most `limit` at a time. */
async function pool(items, limit, fn) {
  const results = [];
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const index = next;
      next += 1;
      results[index] = await fn(items[index]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

const packages = AREAS.flatMap((area) => {
  const abs = join(ROOT, area);
  return existsSync(abs) ? findPackages(abs) : [];
}).sort((a, b) => a.dir.localeCompare(b.dir));

process.stdout.write(`typechecking ${packages.length} packages, ${JOBS} at a time\n\n`);

const results = await pool(packages, JOBS, typecheck);
const red = results.filter((result) => !result.ok);

for (const result of red) {
  process.stdout.write(`RED  ${result.dir}\n`);
  if (result.errors.length === 0) {
    // Non-zero without a TS error: a missing dependency, a failed build step.
    const tail = result.output.trim().split('\n').slice(-2).join(' / ');
    process.stdout.write(`       (exit non-zero, no TS error) ${tail.slice(0, 150)}\n`);
    continue;
  }
  for (const line of VERBOSE ? result.errors : result.errors.slice(0, 1)) {
    process.stdout.write(`       ${line.trim().slice(0, 150)}\n`);
  }
  if (!VERBOSE && result.errors.length > 1) {
    process.stdout.write(`       ... and ${result.errors.length - 1} more (--verbose)\n`);
  }
}

process.stdout.write(`\ngreen: ${results.length - red.length}   red: ${red.length}\n`);
process.exit(red.length === 0 ? 0 : 1);
