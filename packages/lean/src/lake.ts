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

export function generateLakeProject(config: LakeProjectConfig): LakeProjectFiles {
  const { packageName, rootNamespace, leanToolchain = DEFAULT_TOOLCHAIN, modules = [] } = config;

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
