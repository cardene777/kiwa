/**
 * A Lake project that actually builds the specs put inside it.
 *
 * Lake is Lean 4's build system. A `lean_lib` that is not marked
 * `@[default_target]` is not among the targets `lake build` builds, so a project
 * without the attribute reports `Build completed successfully` while compiling
 * nothing. And a library whose root module imports no submodules leaves the spec
 * files on disk untouched, so a broken spec passes.
 *
 * Both were true of what this generated before. `lake build` on a project holding
 * a spec with a type error exited 0.
 */

import { SpecError } from './errors.js';

export interface LakeProjectConfig {
  /** Package name (kebab-case), becomes the Lake package name. */
  packageName: string;
  /** Root Lean namespace (PascalCase), becomes the library and its directory. */
  rootNamespace: string;
  /** Lean toolchain version — pinned so specs are reproducible. */
  leanToolchain?: string;
  /**
   * Module basenames placed under `<rootNamespace>/`, without the extension.
   *
   * The glob already brings them into the build, so this only decides whether
   * `import <rootNamespace>` alone reaches them. Naming them makes the root
   * module a table of contents rather than an empty file.
   */
  modules?: readonly string[];
}

export interface LakeProjectFiles {
  files: Record<string, string>;
}

const DEFAULT_TOOLCHAIN = 'leanprover/lean4:v4.15.0';

/** A Lake package name, which is written between guillemets and used as a path. */
const PACKAGE_NAME = /^[A-Za-z][A-Za-z0-9_-]*$/;
/** A Lean namespace, which also becomes a directory and a root module file. */
const ROOT_NAMESPACE = /^[A-Za-z_][A-Za-z0-9_]*$/;
/** A module basename beneath that directory. It may not climb out of it. */
const MODULE = /^[A-Za-z][A-Za-z0-9_]*$/;
/** A toolchain as `elan` names them. */
const TOOLCHAIN = /^[A-Za-z0-9_.\-/]+:[A-Za-z0-9_.\-]+$/;

export function generateLakeProject(config: LakeProjectConfig): LakeProjectFiles {
  const { packageName, rootNamespace, leanToolchain = DEFAULT_TOOLCHAIN, modules = [] } = config;

  // Every one of these lands in a file name or in Lean syntax. A namespace with a
  // space in it writes `My Space.lean` and then fails to parse; a module named
  // `../../x` writes an import that reaches outside the project.
  if (!PACKAGE_NAME.test(packageName)) {
    throw new SpecError(
      `generateLakeProject: packageName ${JSON.stringify(packageName)} must start with a letter ` +
        'and hold only letters, digits, hyphens and underscores',
    );
  }
  if (!ROOT_NAMESPACE.test(rootNamespace)) {
    throw new SpecError(
      `generateLakeProject: rootNamespace ${JSON.stringify(rootNamespace)} is not a Lean identifier`,
    );
  }
  if (!TOOLCHAIN.test(leanToolchain)) {
    throw new SpecError(
      `generateLakeProject: leanToolchain ${JSON.stringify(leanToolchain)} does not look like ` +
        'a toolchain, e.g. leanprover/lean4:v4.15.0',
    );
  }
  for (const module of modules) {
    if (!MODULE.test(module)) {
      throw new SpecError(
        `generateLakeProject: module ${JSON.stringify(module)} is not a module name; ` +
          'it becomes an import and a path beneath the library root',
      );
    }
  }
  const duplicates = modules.filter((m, i) => modules.indexOf(m) !== i);
  if (duplicates.length > 0) {
    throw new SpecError(
      `generateLakeProject: module ${[...new Set(duplicates)].join(', ')} is listed twice`,
    );
  }

  // `@[default_target]` puts the library among what `lake build` builds; without
  // it the build succeeds having built nothing. The glob collects the root module
  // and every spec beneath it, so a spec is checked whether or not it is imported.
  const lakefile = `import Lake
open Lake DSL

package «${packageName}» where
  -- No extra options; specs are pure and require no dependencies.

@[default_target]
lean_lib «${rootNamespace}» where
  globs := #[.andSubmodules \`${rootNamespace}]
`;

  const toolchain = `${leanToolchain}\n`;

  const imports = modules.map((module) => `import ${rootNamespace}.${module}`).join('\n');
  const rootModule =
    modules.length === 0
      ? `-- Root module for ${rootNamespace}.
-- Specs under ${rootNamespace}/ are built by the glob in lakefile.lean, whether
-- or not they are imported here.
`
      : `-- Root module for ${rootNamespace}. Generated; do not edit by hand.
${imports}
`;

  return {
    files: {
      'lakefile.lean': lakefile,
      'lean-toolchain': toolchain,
      [`${rootNamespace}.lean`]: rootModule,
    },
  };
}
