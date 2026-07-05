/**
 * Invariant 2 — provenance flag absence.
 *
 * v1.14 removed the `--provenance` flag from the release script after
 * discovering pnpm monorepo publish + npm CLI 10 provenance + OIDC federation
 * did not stabilise together. Every subsequent milestone rediscovered the
 * lesson — a well-meaning contributor re-adds `--provenance` next to
 * `pnpm publish`, npm CLI refuses to sign, the release script exits non-zero,
 * and the milestone stalls.
 *
 * `checkProvenanceFlagAbsence` scans the release script for the exact
 * `--provenance` token adjacent to a `pnpm publish` and reports whether the
 * flag has crept back in. It is pure — no filesystem, no side effects.
 */
import type { ProvenanceFlagAbsenceResult } from './types.js';

/**
 * Assert `--provenance` is absent from the release script. A match reports
 * `ok: false` with up to 3 excerpts around the offending flag.
 *
 * @param releaseScript raw `scripts.release` string
 */
export function checkProvenanceFlagAbsence(
  releaseScript: string,
): ProvenanceFlagAbsenceResult {
  const excerpts: string[] = [];
  // Simple substring scan — `--provenance` is not a legitimate substring of
  // any package name or command inside our release scripts.
  let cursor = 0;
  while (excerpts.length < 3) {
    const idx = releaseScript.indexOf('--provenance', cursor);
    if (idx === -1) break;
    const start = Math.max(0, idx - 40);
    const end = Math.min(releaseScript.length, idx + 40);
    excerpts.push(releaseScript.slice(start, end));
    cursor = idx + '--provenance'.length;
  }

  return {
    ok: excerpts.length === 0,
    provenanceFlagPresent: excerpts.length > 0,
    excerpts,
  };
}
