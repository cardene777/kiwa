// Public entry point of @kiwa-lab/cli. The executable lives in bin.ts; this file
// exposes the same CLI as a callable function so that embedders can drive it and
// so that scripts/sync-library-api-reference.mjs can extract the API contract for
// docs/libraries/foundation/cli/reference.md.
export {
  createDefaultDeps,
  runCli,
  takeFlagValue,
  USAGE,
  type RunCliDeps,
  type SpecToTestSummary,
} from './runCli.js';
