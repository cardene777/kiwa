/**
 * Write the Lake project under `specs/`. The only thing that writes there.
 *
 * What the files contain is `src/lean-project.ts`, which is pure and is what the
 * test reads. This does the one side effect.
 */

import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { ROOT_NAMESPACE, SPECS_DIR, renderLeanProject } from '../src/lean-project.js';

// Resolved from the working directory rather than from this file, which the build
// moves into `.vitest-dist/scripts`. `pnpm` runs scripts from the package root;
// check that it did, rather than writing a `specs/` somewhere else.
const packageRoot = process.cwd();
if (!existsSync(join(packageRoot, 'package.json'))) {
  throw new Error(`run this from the package root; ${packageRoot} holds no package.json`);
}
const root = resolve(packageRoot, SPECS_DIR);

// The library directory is rebuilt from nothing. A module dropped from
// `ALL_SPECS` would otherwise stay on disk, and the glob in `lakefile.lean`
// would keep building a spec that no longer belongs to the project.
rmSync(join(root, ROOT_NAMESPACE), { recursive: true, force: true });

const files = renderLeanProject();
for (const [rel, content] of Object.entries(files)) {
  const abs = join(root, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content, 'utf-8');
}

for (const rel of Object.keys(files).sort()) {
  process.stdout.write(`${SPECS_DIR}/${rel}\n`);
}
