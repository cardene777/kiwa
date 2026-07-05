/**
 * Public shape for release-invariants — 3 invariant checkers packaged so
 * downstream monorepos can reuse the SSOT that kiwa v1.14 - v1.28 rediscovered
 * four times before landing as a first-class check in v1.29.
 */

/**
 * A publishable npm package descriptor. `name` is the `@scope/pkg` string as
 * it appears in `package.json`. `dir` is optional and only used for error
 * messages; the invariants themselves operate on names.
 */
export interface PublishablePackage {
  name: string;
  dir?: string;
}

/**
 * Per-package result of the `checkReleaseScriptFilter` invariant.
 */
export interface ReleaseScriptFilterEntry {
  name: string;
  buildFilterPresent: boolean;
  publishFilterPresent: boolean;
  /**
   * `true` iff **both** halves of the release script contain the package.
   * Half-only entries (`-F` without `--filter` or vice versa) are the exact
   * failure mode v1.14 payment + v1.25 perf-harness + v1.27 quality-metrics
   * + v1.28 realtime all hit; the SSOT calls it `partial: true`.
   */
  ok: boolean;
  partial: boolean;
}

/**
 * Aggregate result of the `checkReleaseScriptFilter` invariant.
 */
export interface ReleaseScriptFilterResult {
  ok: boolean;
  entries: ReleaseScriptFilterEntry[];
  missingBuildFilter: string[];
  missingPublishFilter: string[];
}

/**
 * Per-package result of the `checkProvenanceFlagAbsence` invariant.
 * `provenanceFlagPresent = true` means the release script contains a
 * `--provenance` flag next to a `pnpm publish`. `ok = true` means the flag
 * is **absent** — v1.14 removed provenance because it required OIDC federation
 * (npm CLI 10+) that is not stable inside pnpm monorepos.
 */
export interface ProvenanceFlagAbsenceResult {
  ok: boolean;
  provenanceFlagPresent: boolean;
  /**
   * Offending code excerpts (up to 3 matches) for the failure message.
   * Empty when `ok = true`.
   */
  excerpts: string[];
}

/**
 * Per-package result of the `checkGateScriptPackageCoverage` invariant.
 * `test:mutation` (and its downstream `gate:mutation` reader) must include
 * every publishable package the release publishes — otherwise the mutation
 * baseline drifts from what actually ships.
 */
export interface GateScriptPackageCoverageEntry {
  name: string;
  mutationFilterPresent: boolean;
}

export interface GateScriptPackageCoverageResult {
  ok: boolean;
  entries: GateScriptPackageCoverageEntry[];
  missingMutationFilter: string[];
}

/**
 * Aggregate SSOT — the shape v1.29's `docs/concepts/release-invariants.md`
 * pins as the 3-invariant release-gate ledger.
 */
export interface ReleaseInvariantsSummary {
  releaseScriptFilter: ReleaseScriptFilterResult;
  provenanceFlagAbsence: ProvenanceFlagAbsenceResult;
  gateScriptPackageCoverage: GateScriptPackageCoverageResult;
  ok: boolean;
}
