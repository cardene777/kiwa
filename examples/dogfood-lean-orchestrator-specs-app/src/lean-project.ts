/**
 * What the Lake project under `specs/` consists of.
 *
 * The `.lean` files are generated and also checked in. Checking them in lets a
 * reviewer read the machine, and `lake build` prove it, without running any
 * TypeScript. It is also what lets them drift: edit a spec, forget to regenerate,
 * and the file on disk describes yesterday's machine.
 *
 * `renderLeanProject` says what the files should contain. Writing them is
 * `scripts/generate-lean-project.ts`, and only that. `tests/lean-project.test.ts`
 * compares the two.
 */

import { generateLakeProject, generateLeanSpec } from '@kiwa-lab/lean';
import { ALL_SPECS } from './orchestrator-specs.js';

/** Where the project lives, relative to this package. */
export const SPECS_DIR = 'specs';

/** The Lake package name. It is written into `lakefile.lean`. */
export const PACKAGE_NAME = 'kiwa-specs';

/** The library, the directory beneath `specs/`, and the root module. */
export const ROOT_NAMESPACE = 'KiwaSpecs';

/**
 * Pinned, so the proof a reviewer reads is the proof `lake build` produces.
 * `packages/lean` checks the generated source against v4.12.0 through v4.31.0;
 * this names the one this project builds with.
 */
export const LEAN_TOOLCHAIN = 'leanprover/lean4:v4.15.0';

/** Every file of the project, keyed by its path under `specs/`. */
export function renderLeanProject(): Record<string, string> {
  const lake = generateLakeProject({
    packageName: PACKAGE_NAME,
    rootNamespace: ROOT_NAMESPACE,
    leanToolchain: LEAN_TOOLCHAIN,
    modules: ALL_SPECS.map((spec) => spec.moduleName),
  });

  const files: Record<string, string> = { ...lake.files };
  for (const spec of ALL_SPECS) {
    const { path, source } = generateLeanSpec(spec);
    files[`${ROOT_NAMESPACE}/${path}`] = source;
  }
  return files;
}
