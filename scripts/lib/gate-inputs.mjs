/**
 * Which paths a gate's artefact depends on.
 *
 * One list, read by three callers: the two gates that check freshness and the
 * generator that records what it measured. The sidecar states which inputs it
 * covered and the gate refuses a fingerprint taken over a different set
 * (#2135), so a list that differs between writer and reader makes every
 * artefact read as stale.
 *
 * ## Why only these two
 *
 * `src/` and `tests/` are what the numbers are about. Configuration decides
 * them too — `stryker.config.mjs` picks the files to mutate,
 * `tsconfig.vitest.json` picks what compiles — and both were tried and taken
 * out again in #2125 after measuring what they do:
 *
 * - `package.json` holds every script the package has, so the commit that
 *   added `--exclude` to `test` and `test:cov` marked 16 mutation reports
 *   stale. The mutation run goes through `test:mutation`, which that commit
 *   did not touch.
 * - configuration was caught by the timestamp skew a squash merge produces.
 *   `packages/api`'s report is 52 minutes older than the commit that changed
 *   its `stryker.config.mjs`, and its file set matches that config exactly.
 *
 * The fingerprint added in #2135 removes that skew, so configuration can come
 * back — but only once every artefact carries a sidecar. Until then the gates
 * still fall back to timestamps for artefacts that do not, and widening the
 * list now would fail those on the old comparison. #2135 Phase 5 is where that
 * is decided; the note stays here because this is the list it would change.
 */

/** Suffixes under a package directory, in the order they are recorded. */
export const COVERAGE_INPUT_DIRS = ['src', 'tests'];

/** Mutation reads the same set today; kept separate so they can diverge. */
export const MUTATION_INPUT_DIRS = ['src', 'tests'];
