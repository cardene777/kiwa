#!/usr/bin/env node
/**
 * Regenerate the `generated` half of `docs/stack-signals.json`.
 *
 * Six packages name the libraries they test in `peerDependencies`. That list is
 * the declaration; this script copies it into the signal table so that adding a
 * peer without regenerating fails `--check` rather than silently leaving a
 * library undetectable.
 *
 * ## Why every peer becomes a signal
 *
 * Sorting peers into "the library under test" and "a tool used to test it"
 * needs a judgement this script cannot make: `testcontainers` is a tool for
 * `orm` and the subject of nothing, while `ioredis` is the subject for `cache`
 * and a tool for `job-queue`. An exclusion list would have to be maintained by
 * hand, which is the drift this file exists to remove.
 *
 * `strength` already carries the distinction. Every peer is emitted `weak`,
 * and `resolve` drops a weak detection once anything `exact` claims its group.
 * A peer that `docs/layers.json` names in `providers` is emitted `exact`,
 * because naming it there is the project's own statement that it is a subject.
 *
 * The cost of a wrong guess is one line of output, which `stack-signals.json`
 * says up front is the trade it accepts.
 *
 * Usage:
 *   node scripts/rebuild-stack-signals.mjs           rewrite the file
 *   node scripts/rebuild-stack-signals.mjs --check   exit 1 if it would change
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(HERE, '..');

/**
 * Packages whose `peerDependencies` name real libraries.
 *
 * The rest declare only `vitest` or nothing: their adapters mock the framework
 * rather than importing it, so there is nothing here to read. Those layers are
 * covered by the hand-written half of the table.
 */
const TRANSPARENT = ['auth', 'orm', 'cache', 'queue', 'ui', 'dapp'];

/** Present in every package as the runner, never as a subject. */
const RUNNER = 'vitest';

const read = (path) => JSON.parse(readFileSync(path, 'utf-8'));

/**
 * Compare a `providers` entry against a package name.
 *
 * They are written differently on purpose — `providers` names the provider
 * (`nextauth`, `clerk`) and the peer names the package (`next-auth`,
 * `@clerk/backend`). Reducing both to letters and digits lines up the pairs
 * that mean the same thing without hard-coding a table of aliases.
 *
 * A scoped package also matches on its scope alone, which is how `clerk`
 * reaches `@clerk/backend`.
 */
function normalise(name) {
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function providerForms(pkg) {
  const forms = [normalise(pkg)];
  const scoped = /^@([^/]+)\//.exec(pkg);
  if (scoped) forms.push(normalise(scoped[1]));
  return forms;
}

/** Which package directory holds `@kiwa-lab/{name}`. */
function packageDir(name) {
  const packages = join(REPO_ROOT, 'packages');
  for (const entry of readdirSync(packages, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const manifest = join(packages, entry.name, 'package.json');
    if (!existsSync(manifest)) continue;
    if (read(manifest).name === `@kiwa-lab/${name}`) return join(packages, entry.name);
  }
  return null;
}

function build() {
  const layers = read(join(REPO_ROOT, 'docs', 'layers.json')).layers;
  const signals = [];
  const skipped = [];

  for (const name of TRANSPARENT) {
    const dir = packageDir(name);
    if (!dir) {
      skipped.push(`${name}: no package under packages/`);
      continue;
    }
    // The layer this package backs. `consumer_skill` is the link, and a package
    // with no layer has nothing for a signal to point at.
    const owned = layers.filter((layer) => layer.consumer_skill === `kiwa-${name}`);
    if (!owned.length) {
      skipped.push(`${name}: no layer declares kiwa-${name} as its consumer`);
      continue;
    }
    const declared = new Set(owned.flatMap((layer) => layer.providers ?? []).map(normalise));
    const peers = Object.keys(read(join(dir, 'package.json')).peerDependencies ?? {})
      .filter((peer) => peer !== RUNNER)
      .sort();

    for (const peer of peers) {
      const exact = providerForms(peer).some((form) => declared.has(form));
      for (const layer of owned) {
        signals.push({
          match: peer,
          layer: layer.id,
          strength: exact ? 'exact' : 'weak',
          language: 'typescript',
        });
      }
    }
  }

  // Stable order so a regeneration that changes nothing produces no diff.
  signals.sort((a, b) => a.match.localeCompare(b.match) || a.layer.localeCompare(b.layer));
  return { signals, skipped };
}

const path = join(REPO_ROOT, 'docs', 'stack-signals.json');
const table = read(path);
const { signals, skipped } = build();

const next = { ...table, generated: { ...table.generated, signals } };
const rendered = `${JSON.stringify(next, null, 2)}\n`;
const current = readFileSync(path, 'utf-8');

if (process.argv.includes('--check')) {
  if (rendered !== current) {
    process.stderr.write(
      'docs/stack-signals.json is out of date. Run: node scripts/rebuild-stack-signals.mjs\n',
    );
    process.exit(1);
  }
  process.stdout.write(`generated signals up to date (${signals.length})\n`);
} else {
  writeFileSync(path, rendered, 'utf-8');
  process.stdout.write(`${signals.length} generated signals written\n`);
}

// Say what was left out. A package that silently produces nothing reads the
// same as one that produced nothing because it had nothing to say.
for (const line of skipped) process.stdout.write(`skipped ${line}\n`);
