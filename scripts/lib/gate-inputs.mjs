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

/**
 * coverage gate が判定する package と、その dir。
 *
 * `check-coverage-gates.mjs` が持っていたものをここへ移した (#2181 r2-f2)。
 * 検査側が script を正規表現で読む形にしていたところ、**引用符を変えるだけで 1 件だけ
 * 静かに落ちる**取りこぼしがあった。 一覧を module として export し、gate も検査も
 * 同じ値を import すれば、その種の食い違いが起きない。
 */
export const COVERAGE_PKG_DIRS = {
  '@kiwa-lab/core': 'packages/core',
  '@kiwa-lab/api': 'packages/api',
  '@kiwa-lab/ui': 'packages/ui',
  '@kiwa-lab/data': 'packages/data',
  '@kiwa-lab/cli-test': 'packages/cli-test',
  '@kiwa-lab/observability': 'packages/observability',
  '@kiwa-lab/e2e': 'packages/e2e',
  '@kiwa-lab/cli': 'packages/cli',
  '@kiwa-lab/dapp': 'packages/dapp',
  '@kiwa-lab/a11y': 'packages/a11y',
  '@kiwa-lab/nextjs': 'packages/nextjs',
  '@kiwa-lab/edge': 'packages/edge',
  '@kiwa-lab/hono': 'packages/hono',
  '@kiwa-lab/auth': 'packages/auth',
  '@kiwa-lab/search': 'packages/search',
  '@kiwa-lab/security': 'packages/security',
  '@kiwa-lab/realtime': 'packages/realtime',
  '@kiwa-lab/cache': 'packages/cache',
  '@kiwa-lab/ai-llm': 'packages/ai-llm',
  '@kiwa-lab/component': 'packages/component',
  '@kiwa-lab/perf-harness': 'packages/perf-harness',
  '@kiwa-lab/quality-metrics': 'packages/quality-metrics',
  '@kiwa-lab/lean': 'packages/lean',
  '@kiwa-lab/queue': 'packages/queue',
  '@kiwa-lab/orm': 'packages/orm',
  '@kiwa-lab/skill-test': 'packages/skill-test',
};

/** 判定順。 `COVERAGE_PKG_DIRS` の key と同じ集合でなければならない。 */
export const COVERAGE_PACKAGES = [
  '@kiwa-lab/core',
  '@kiwa-lab/api',
  '@kiwa-lab/ui',
  '@kiwa-lab/data',
  '@kiwa-lab/cli-test',
  '@kiwa-lab/observability',
  '@kiwa-lab/e2e',
  '@kiwa-lab/cli',
  '@kiwa-lab/dapp',
  '@kiwa-lab/a11y',
  '@kiwa-lab/nextjs',
  '@kiwa-lab/edge',
  '@kiwa-lab/hono',
  '@kiwa-lab/auth',
  '@kiwa-lab/search',
  '@kiwa-lab/security',
  '@kiwa-lab/realtime',
  '@kiwa-lab/cache',
  '@kiwa-lab/ai-llm',
  '@kiwa-lab/component',
  '@kiwa-lab/perf-harness',
  '@kiwa-lab/quality-metrics',
  '@kiwa-lab/lean',
  '@kiwa-lab/queue',
  '@kiwa-lab/orm',
  '@kiwa-lab/skill-test',
];
