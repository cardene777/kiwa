/**
 * Invariant 1 — release script filter symmetry.
 *
 * The lesson v1.14 payment + v1.25 perf-harness + v1.27 quality-metrics +
 * v1.28 realtime each rediscovered independently: an npm package must appear
 * in **both** the `pnpm -F {name} build` step **and** the
 * `pnpm publish --filter {name}` step of `scripts.release`. One-half entries
 * silently drop the package from either the build output or the publish
 * upload — the release completes green, but the registry never receives the
 * new artefact.
 *
 * `checkReleaseScriptFilter` reads the raw release script text and asserts
 * both halves contain each publishable package. It is pure — no filesystem
 * access, no side effects. Callers supply the release script and the
 * publishable package list from wherever they source them (root
 * `package.json`, `pnpm-workspace.yaml` scan, etc.).
 */
import type {
  PublishablePackage,
  ReleaseScriptFilterEntry,
  ReleaseScriptFilterResult,
} from './types.js';

/**
 * Check that every publishable package appears in **both** halves
 * (`-F {name}` build + `--filter {name}` publish) of the release script.
 *
 * @param releaseScript raw `scripts.release` string from root `package.json`
 * @param publishable   list of `@scope/pkg` names + optional dirs
 */
export function checkReleaseScriptFilter(
  releaseScript: string,
  publishable: PublishablePackage[],
): ReleaseScriptFilterResult {
  const entries: ReleaseScriptFilterEntry[] = publishable.map((pkg) => {
    // Word-boundary + literal package name avoids substring hits
    // (e.g. `@kiwa-test/ai` vs `@kiwa-test/ai-llm`).
    const buildFilterPresent = releaseScript.includes(`-F ${pkg.name}`);
    const publishFilterPresent = releaseScript.includes(`--filter ${pkg.name}`);
    const ok = buildFilterPresent && publishFilterPresent;
    const partial =
      (buildFilterPresent && !publishFilterPresent) ||
      (!buildFilterPresent && publishFilterPresent);
    return {
      name: pkg.name,
      buildFilterPresent,
      publishFilterPresent,
      ok,
      partial,
    };
  });

  const missingBuildFilter = entries
    .filter((e) => !e.buildFilterPresent)
    .map((e) => e.name);
  const missingPublishFilter = entries
    .filter((e) => !e.publishFilterPresent)
    .map((e) => e.name);

  return {
    ok: entries.every((e) => e.ok),
    entries,
    missingBuildFilter,
    missingPublishFilter,
  };
}
