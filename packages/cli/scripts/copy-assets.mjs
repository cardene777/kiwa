#!/usr/bin/env node
/**
 * Copy what the published package needs beside its build output.
 *
 * `files` in `package.json` is `["dist", ...]`, so anything outside `dist` is
 * absent from the tarball. Templates were already handled this way; the signal
 * table has the same problem and a worse symptom, because `--detect` fails on
 * every published install rather than at scaffold time.
 *
 * Written as a script rather than an inline `node -e` because the source paths
 * are relative to the repository, not to whatever directory the build runs in.
 */

import { copyFileSync, cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = resolve(HERE, '..');

/** Climb to the repository root by looking for the table itself. */
function repoRoot() {
  let dir = PACKAGE_ROOT;
  for (let up = 0; up < 6; up += 1) {
    if (existsSync(join(dir, 'docs', 'stack-signals.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error('docs/stack-signals.json not found above the cli package');
}

cpSync(join(PACKAGE_ROOT, 'src/templates'), join(PACKAGE_ROOT, 'dist/templates'), {
  recursive: true,
});

copyFileSync(
  join(repoRoot(), 'docs', 'stack-signals.json'),
  join(PACKAGE_ROOT, 'dist', 'stack-signals.json'),
);
