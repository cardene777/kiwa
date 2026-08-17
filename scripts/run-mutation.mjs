#!/usr/bin/env node
/**
 * Root `test:mutation` driver.
 *
 * The list of packages to run comes from `PACKAGE_TIER` — the same table
 * `check-mutation-gates.mjs` scores against. Before this script, the root
 * `package.json` carried a hand-written `-F @kiwa-lab/…` list, so "what runs"
 * and "what is scored" were two copies that could disagree. `@kiwa-lab/security`
 * is what that cost: a package with a Stryker config that appeared in neither
 * list, running nowhere and scored by nothing (#1951).
 *
 * A check can compare two lists, and #1953 wrote one. Five review rounds went
 * into parsing the filter list out of a shell string — spellings (`-F`,
 * `--filter`, `=` or space), quoting, scopes, exclusions — and each round found
 * another form the parser read wrongly. Deriving the list from the table
 * removes the second copy instead of testing it.
 *
 * Usage:
 *   node scripts/run-mutation.mjs            # every scored package
 *   node scripts/run-mutation.mjs core api   # a subset, by short or scoped name
 */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

import { PACKAGE_TIER } from './check-mutation-gates.mjs';

/** Scoped names for the requested subset, or all scored packages. */
export function selectPackages(argv, tierTable = PACKAGE_TIER) {
  const all = Object.keys(tierTable);
  if (argv.length === 0) return all;

  const wanted = argv.map((name) => (name.startsWith('@') ? name : `@kiwa-lab/${name}`));
  const unknown = wanted.filter((name) => !all.includes(name));
  if (unknown.length > 0) {
    throw new Error(
      `not scored by the mutation gate: ${unknown.join(', ')}\nknown: ${all.join(', ')}`,
    );
  }
  return wanted;
}

/** The pnpm argv this driver runs. Exported so a check can read it without spawning. */
export function pnpmArgs(packages) {
  return [...packages.flatMap((name) => ['-F', name]), '--no-bail', 'run', 'test:mutation'];
}

// `file://${process.argv[1]}` fails for any checkout path that needs URL
// encoding — a directory with a space compares `…/kiwa review/…` against
// `…/kiwa%20review/…` — and the script then exits 0 having run nothing (#1955).
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  let packages;
  try {
    packages = selectPackages(process.argv.slice(2));
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exit(2);
  }

  // `--no-bail` keeps every package running so one red package does not hide the
  // rest; the gate reads all the reports afterwards.
  const result = spawnSync('pnpm', pnpmArgs(packages), { stdio: 'inherit' });
  if (result.error) {
    process.stderr.write(`failed to start pnpm: ${result.error.message}\n`);
    process.exit(1);
  }
  process.exit(result.status ?? 1);
}
