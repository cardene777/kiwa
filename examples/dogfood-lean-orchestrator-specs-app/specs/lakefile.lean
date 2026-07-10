import Lake
open Lake DSL

package «kiwa-specs» where
  -- No extra options; specs are pure and require no dependencies.

@[default_target]
lean_lib «KiwaSpecs» where
  globs := #[.andSubmodules `KiwaSpecs]
