#!/usr/bin/env node
/**
 * Generate `docs/quality/mutation-thresholds.md § Current overrides` from
 * `PACKAGE_TIER`.
 *
 * The roster is the one place the docs state which packages carry a mutation
 * threshold override. #1973 showed what happens when such a fact is written by
 * hand in more than one place: the same claim went stale in six files, one per
 * review round, and each fix restated the *new* value so the next change would
 * stale them again.
 *
 * #1975 first guarded it with a parser that read the hand-written table and
 * compared it to `PACKAGE_TIER`. Seven review rounds each found another way a
 * hand-written table can disagree with itself — a `(none)` row beside real
 * rows, one package twice, a lying `tier` cell, a repeated column name, a
 * second section further down. The surface is unbounded because markdown is,
 * so the table is generated instead. A generated table cannot lie: this script
 * is the only writer and the check below fails on any hand edit.
 *
 * Usage:
 *   node scripts/sync-override-roster.mjs           # check, exit 1 on drift
 *   node scripts/sync-override-roster.mjs --write   # rewrite the block
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { isMainModule } from './lib/is-main-module.mjs';
import { PACKAGE_TIER, TIER_THRESHOLD } from './check-mutation-gates.mjs';

// `fileURLToPath`, not `.pathname`: a `file:` URL keeps percent-encoding, so a
// checkout under a directory with a space resolves to `…/kiwa%20review/…` and
// every path built from it misses. `scripts/lib/is-main-module.mjs` records the
// same trap.
const SCRIPT_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const DOC = resolve(SCRIPT_ROOT, 'docs/quality/mutation-thresholds.md');

export const BEGIN = '<!-- generated: override-roster -->';
export const END = '<!-- /generated: override-roster -->';

/**
 * The roster table for a `PACKAGE_TIER` map.
 *
 * `direction` is derived rather than stored: an override below its tier default
 * is looser, above is stricter. Storing it would be one more fact that can go
 * stale.
 */
export function rosterTable(packageTier, tierThreshold) {
  const rows = Object.entries(packageTier)
    .filter(([, entry]) => entry.override !== undefined)
    // Code-unit order, not `localeCompare`: this output is compared byte for
    // byte by the check, and locale-dependent ordering makes the same map
    // render differently on two machines.
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([scoped, entry]) => {
      const direction = entry.override < tierThreshold[entry.tier] ? 'looser' : 'stricter';
      const reason = entry.reason ?? '';
      return `| \`${scoped}\` | ${entry.tier} | ${entry.override} | ${direction} | ${reason} |`;
    });
  const body = rows.length > 0 ? rows : ['| (none) | — | — | — | — |'];
  return [
    '| package | tier | override | direction | reason |',
    '|---|---|---|---|---|',
    ...body,
  ].join('\n');
}

/**
 * Replace the generated block, or throw when the markers are missing or
 * malformed. A missing marker is a doc edit that removed the anchor, not a
 * reason to append a second table.
 */
export function replaceBlock(text, table) {
  const begin = text.indexOf(BEGIN);
  const end = text.indexOf(END);
  if (begin === -1 || end === -1) throw new Error(`markers not found in ${DOC}`);
  if (end < begin) throw new Error('end marker precedes begin marker');
  if (text.indexOf(BEGIN, begin + 1) !== -1 || text.indexOf(END, end + 1) !== -1) {
    throw new Error('markers appear more than once');
  }
  return `${text.slice(0, begin)}${BEGIN}\n${table}\n${text.slice(end)}`;
}

export function run({ write = false, docPath = DOC, log = console } = {}) {
  const text = readFileSync(docPath, 'utf8');
  const updated = replaceBlock(text, rosterTable(PACKAGE_TIER, TIER_THRESHOLD));
  if (text === updated) {
    log.log('Override roster is up to date.');
    return 0;
  }
  if (!write) {
    log.error('docs/quality/mutation-thresholds.md § Current overrides is out of date.');
    log.error('Run `node scripts/sync-override-roster.mjs --write` and commit the result.');
    return 1;
  }
  writeFileSync(docPath, updated);
  log.log('Synchronized the override roster.');
  return 0;
}

if (isMainModule(process.argv[1], import.meta.url)) {
  process.exitCode = run({ write: process.argv.includes('--write') });
}
