/**
 * Minimal Lake project scaffolding for @kiwa-lab/lean generated specs.
 *
 * A Lake project is Lean 4's package manager output; it consists of a
 * `lakefile.lean` + `lean-toolchain` + `Main.lean` root module.
 */

export interface LakeProjectConfig {
  /** Package name (kebab-case), becomes the Lake package name */
  packageName: string;
  /** Root Lean namespace (PascalCase), becomes the top-level namespace */
  rootNamespace: string;
  /** Lean toolchain version — pinned so specs are reproducible */
  leanToolchain?: string;
}

export interface LakeProjectFiles {
  files: Record<string, string>;
}

const DEFAULT_TOOLCHAIN = 'leanprover/lean4:v4.15.0';

export function generateLakeProject(config: LakeProjectConfig): LakeProjectFiles {
  const { packageName, rootNamespace, leanToolchain = DEFAULT_TOOLCHAIN } = config;

  const lakefile = `import Lake
open Lake DSL

package «${packageName}» where
  -- No extra options; specs are pure and require no dependencies.

lean_lib «${rootNamespace}» where
  -- Add generated spec modules under ${rootNamespace}/ to include them.
`;

  const toolchain = `${leanToolchain}\n`;

  const rootModule = `-- Root module for ${rootNamespace}.
-- Import generated specs here to expose them at the top level.
`;

  return {
    files: {
      'lakefile.lean': lakefile,
      'lean-toolchain': toolchain,
      [`${rootNamespace}.lean`]: rootModule,
    },
  };
}
