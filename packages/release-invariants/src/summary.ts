/**
 * Aggregate SSOT — the shape v1.29's `docs/concepts/release-invariants.md`
 * pins as the 3-invariant release-gate ledger.
 */
import { checkGateScriptPackageCoverage } from './gate-script-package-coverage.js';
import { checkProvenanceFlagAbsence } from './provenance-flag-absence.js';
import { checkReleaseScriptFilter } from './release-script-filter.js';
import type { PublishablePackage, ReleaseInvariantsSummary } from './types.js';

export interface BuildReleaseInvariantsSummaryInput {
  releaseScript: string;
  mutationGateScript: string;
  publishable: PublishablePackage[];
}

/**
 * Build the 3-invariant summary in one shot. `ok` is the AND of every
 * invariant — a caller (usually a release-smoke suite) can short-circuit on
 * this single boolean.
 */
export function buildReleaseInvariantsSummary(
  input: BuildReleaseInvariantsSummaryInput,
): ReleaseInvariantsSummary {
  const releaseScriptFilter = checkReleaseScriptFilter(
    input.releaseScript,
    input.publishable,
  );
  const provenanceFlagAbsence = checkProvenanceFlagAbsence(input.releaseScript);
  const gateScriptPackageCoverage = checkGateScriptPackageCoverage(
    input.mutationGateScript,
    input.publishable,
  );

  return {
    releaseScriptFilter,
    provenanceFlagAbsence,
    gateScriptPackageCoverage,
    ok:
      releaseScriptFilter.ok &&
      provenanceFlagAbsence.ok &&
      gateScriptPackageCoverage.ok,
  };
}
