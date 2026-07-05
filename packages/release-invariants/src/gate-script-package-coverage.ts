/**
 * Invariant 3 — gate script package coverage.
 *
 * `scripts.test:mutation` (root `package.json`) must include every
 * publishable package. Otherwise the mutation baseline the release gate
 * reads drifts from what actually ships — a package can regress on mutation
 * kill-rate without the gate ever noticing, because the gate never asked
 * that package for a baseline.
 *
 * `checkGateScriptPackageCoverage` verifies each publishable package name is
 * present in the mutation gate script. Pure function; caller sources the
 * script text however it likes.
 */
import type {
  GateScriptPackageCoverageEntry,
  GateScriptPackageCoverageResult,
  PublishablePackage,
} from './types.js';

/**
 * Check that every publishable package appears in the mutation gate script
 * (typically `scripts.test:mutation`).
 *
 * @param mutationGateScript raw `scripts.test:mutation` string
 * @param publishable        list of `@scope/pkg` names
 */
export function checkGateScriptPackageCoverage(
  mutationGateScript: string,
  publishable: PublishablePackage[],
): GateScriptPackageCoverageResult {
  const entries: GateScriptPackageCoverageEntry[] = publishable.map((pkg) => ({
    name: pkg.name,
    mutationFilterPresent: mutationGateScript.includes(`-F ${pkg.name}`),
  }));

  const missingMutationFilter = entries
    .filter((e) => !e.mutationFilterPresent)
    .map((e) => e.name);

  return {
    ok: entries.every((e) => e.mutationFilterPresent),
    entries,
    missingMutationFilter,
  };
}
