/**
 * Whether a gate's stored artefact still describes the current implementation.
 *
 * `check-coverage-gates.mjs` and `check-mutation-gates.mjs` both read a file a
 * previous run left on disk. Nothing regenerates it, so forgetting to re-run
 * `test:cov` / `test:mutation` leaves the gate reporting on code that is no
 * longer there. #2124 measured that gap: `core` scored 83.33 in the stored
 * artefact and 81.37 when re-measured, and the gate passed on the older value.
 *
 * ## Why not compare mtimes
 *
 * The obvious form — "is the artefact newer than the newest file under
 * `src/`?" — reads the wrong clock. A checkout rewrites every file whose
 * content differs between the two trees, so mtime tracks *when git last wrote
 * the file*, not when its content last changed.
 *
 * Measured on this repo, four packages failed that way while their sources
 * were untouched:
 *
 * | package | newest mtime under src/ | content last changed |
 * |---|---|---|
 * | `auth` | 2026-08-20 | 2026-07-01 |
 * | `cache` | 2026-08-20 | 2026-07-01 |
 * | `cli` | 2026-08-19 | 2026-08-11 |
 * | `orm` | 2026-08-21 09:15 | 2026-07-06 |
 *
 * A gate that fails four packages for doing nothing gets switched off, which
 * is worse than the hole it was meant to close.
 *
 * ## What is compared instead
 *
 * The report inputs' age is the later of two things.
 *
 * | source | what it catches |
 * |---|---|
 * | commit time of the last change to an input | committed work, immune to checkout churn |
 * | filesystem time of inputs git reports dirty | edits not committed yet |
 *
 * Both are needed. The commit time alone misses the ordinary case (edit, run
 * the gate, forget to re-measure); the dirty scan alone misses everything
 * already committed.
 *
 * ## When the answer cannot be worked out
 *
 * Falls back to the mtime scan when git cannot answer (not a repository, git
 * missing, the path never committed and not dirty). If that fails too the
 * result is `unknown`, and the caller fails closed — a gate that cannot tell
 * whether its input is current must not report a pass.
 *
 * A package that never had `src/` has no implementation to have changed. A
 * tracked `src/` that was removed is still a change and invalidates the report.
 *
 * ## What is deliberately not an input
 *
 * Only `src/` and `tests/` are compared. Configuration (`stryker.config.mjs`,
 * `tsconfig.vitest.json`, `package.json`) determines the report too, and both
 * were tried and removed after measuring what they do here.
 *
 * `package.json` holds every script the package has, so the commit that added
 * `--exclude` to `test` and `test:cov` marked 16 mutation reports stale — and
 * the mutation run does not go through either script.
 *
 * Configuration hits a second problem that no input can escape by tightening:
 * a squash merge stamps its commit with the merge time, while the work — and
 * the measuring — happened on the branch before it. `packages/api` shows the
 * shape: its report is 52 minutes older than the commit that changed its
 * `stryker.config.mjs`, and its file set matches that config exactly. The
 * report was produced from the very config it is accused of predating.
 *
 * `src/` and `tests/` carry the same skew, but there the answer is the one
 * this gate exists to give: after a merge that changes what is measured, the
 * numbers on `main` were taken somewhere else, and re-measuring is the point.
 * Configuration changes are rare and deliberate, and the person making one is
 * the person who knows whether it moves the score.
 *
 * Comparing content instead of time removes the skew entirely, and needs the
 * generator to record a fingerprint of its inputs. That is #2135.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';

/**
 * Newest mtime under `dir`, in ms. `null` when the walk cannot complete —
 * a partial answer would be smaller than the truth and read as "fresh".
 *
 * @param {string} dir
 * @param {{ readdirSync?: typeof readdirSync, statSync?: typeof statSync }} [io]
 * @returns {number | null}
 */
export function newestMtimeMs(dir, io = {}) {
  const readdir = io.readdirSync ?? readdirSync;
  const stat = io.statSync ?? statSync;
  let newest = 0;
  const walk = (current) => {
    for (const entry of readdir(current, { withFileTypes: true })) {
      const path = join(current, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile()) {
        const { mtimeMs } = stat(path);
        if (mtimeMs > newest) newest = mtimeMs;
      }
    }
  };
  try {
    walk(dir);
  } catch {
    return null;
  }
  return newest;
}

/** Newest mtime across report input files and directories. */
function newestInputMtimeMs(repoRoot, inputRels, io = {}) {
  const exists = io.existsSync ?? existsSync;
  const stat = io.statSync ?? statSync;
  let newest = 0;
  let found = false;
  for (const rel of inputRels) {
    const path = join(repoRoot, rel);
    if (!exists(path)) continue;
    found = true;
    let value;
    try {
      const entry = stat(path);
      value = entry.isFile() ? entry.mtimeMs : newestMtimeMs(path, io);
    } catch {
      return null;
    }
    if (value === null) return null;
    if (value > newest) newest = value;
  }
  return found ? newest : 0;
}

/**
 * Run git inside `cwd`, or `null` when git cannot answer.
 *
 * `trim` is opt-in. `git status --porcelain` puts two status columns before
 * the path, and the first is a space for an unstaged change — trimming eats it
 * and every path then reads three characters short. That silently produced an
 * empty dirty set, which is the "fresh" direction.
 */
function git(args, cwd, runner, { trim = true } = {}) {
  try {
    // stderr is discarded: the not-a-repository case is an expected answer here,
    // not a problem to report, and printing it would make every non-repo caller noisy.
    const out = (runner ?? execFileSync)('git', args, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return trim ? out.trim() : out;
  } catch {
    return null;
  }
}

/**
 * Paths git reports as dirty, from `--porcelain -z` output.
 *
 * `-z` is used rather than the default because the default quotes and escapes
 * paths that are not plain ASCII, and an escaped path does not `stat`.
 *
 * Rename and copy entries are followed by a second NUL-terminated field
 * holding the source path, with no status columns of its own. That field is
 * skipped: the file that exists on disk is the destination.
 */
export function parseDirtyPaths(porcelainZ) {
  const entries = porcelainZ.split('\0').filter((entry) => entry !== '');
  const paths = [];
  for (let i = 0; i < entries.length; i += 1) {
    const entry = entries[i];
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    paths.push(entry.slice(3));
    if (status[0] === 'R' || status[0] === 'C') i += 1;
  }
  return paths;
}

/**
 * Filesystem time of a dirty path, including removal and rename metadata.
 *
 * A deleted path cannot be statted, so walk up to the first surviving parent;
 * removing its directory entry updates that parent's metadata. `ctime` also
 * matters because rename and chmod can change tracked content without touching
 * the file's mtime.
 */
function dirtyChangedAt(path, repoRoot, stat) {
  let current = path;
  while (current !== repoRoot) {
    try {
      const { ctimeMs, mtimeMs } = stat(current);
      return Math.max(ctimeMs, mtimeMs);
    } catch {
      current = dirname(current);
    }
  }
  return 0;
}

/**
 * When the inputs that determine a report last changed, in ms.
 *
 * @param {object} args
 * @param {string} args.repoRoot
 * @param {string} args.srcRel primary `src/` relative to `repoRoot`.
 * @param {string[]} [args.inputRels] all files and directories that determine the report.
 * @param {object} [io] injection seam for the tests.
 * @returns {{ at: number, source: 'git' | 'mtime' | 'absent' | 'unknown' }}
 */
export function implementationChangedAt({ repoRoot, srcRel, inputRels = [srcRel] }, io = {}) {
  const exists = io.existsSync ?? existsSync;
  const stat = io.statSync ?? statSync;
  const inputsExist = inputRels.some((rel) => exists(join(repoRoot, rel)));

  const commitOut = git(['log', '-1', '--format=%ct', '--', ...inputRels], repoRoot, io.execFileSync);
  const statusOut = git(
    ['status', '--porcelain', '-z', '--', ...inputRels],
    repoRoot,
    io.execFileSync,
    { trim: false },
  );

  // Both commands have to answer. One of them failing means this is not a
  // repository (or git is gone), and a half-git answer is smaller than the
  // truth — exactly the direction that reads as "fresh".
  if (commitOut === null || statusOut === null) {
    if (!inputsExist) return { at: 0, source: 'absent' };
    const scanned = newestInputMtimeMs(repoRoot, inputRels, io);
    return scanned === null ? { at: 0, source: 'unknown' } : { at: scanned, source: 'mtime' };
  }

  const committedAt = commitOut === '' ? 0 : Number(commitOut) * 1000;
  let dirtyAt = 0;
  for (const rel of parseDirtyPaths(statusOut)) {
    const changedAt = dirtyChangedAt(join(repoRoot, rel), repoRoot, stat);
    if (changedAt > dirtyAt) dirtyAt = changedAt;
  }

  if (!Number.isFinite(committedAt)) {
    const scanned = newestInputMtimeMs(repoRoot, inputRels, io);
    return scanned === null ? { at: 0, source: 'unknown' } : { at: scanned, source: 'mtime' };
  }

  // Never committed and not dirty: git knows nothing about this path, so its
  // silence is not evidence of freshness.
  if (committedAt === 0 && dirtyAt === 0) {
    if (!inputsExist) return { at: 0, source: 'absent' };
    const scanned = newestInputMtimeMs(repoRoot, inputRels, io);
    return scanned === null ? { at: 0, source: 'unknown' } : { at: scanned, source: 'mtime' };
  }

  return { at: Math.max(committedAt, dirtyAt), source: 'git' };
}

/**
 * Whether `artifactRel` still describes its current inputs.
 *
 * Equal timestamps count as fresh. A tie cannot be ordered, and filesystems
 * with one-second granularity produce them for work that is genuinely in
 * order; failing on a tie would block correct runs to catch a window no real
 * workflow occupies (generating either artefact takes seconds to minutes).
 *
 * @returns {{ state: 'missing' | 'fresh' | 'stale' | 'unknown', artifactAt?: number, changedAt?: number, source?: string }}
 */
export function checkArtifactFreshness({ repoRoot, srcRel, artifactRel, inputRels = [srcRel] }, io = {}) {
  const exists = io.existsSync ?? existsSync;
  const stat = io.statSync ?? statSync;
  const artifactAbs = join(repoRoot, artifactRel);

  // Absent artefacts stay the caller's business. Both gates already report
  // them, and calling that "stale" would replace a precise message with a
  // vaguer one.
  if (!exists(artifactAbs)) return { state: 'missing' };

  let artifactAt;
  try {
    artifactAt = stat(artifactAbs).mtimeMs;
  } catch {
    return { state: 'unknown', reason: `cannot stat ${artifactRel}` };
  }

  const changed = implementationChangedAt({ repoRoot, srcRel, inputRels }, io);
  if (changed.source === 'unknown') {
    return { state: 'unknown', reason: 'cannot determine when the report inputs last changed' };
  }
  if (changed.source === 'absent') return { state: 'fresh', artifactAt, changedAt: 0, source: 'absent' };

  return {
    state: artifactAt >= changed.at ? 'fresh' : 'stale',
    artifactAt,
    changedAt: changed.at,
    source: changed.source,
  };
}

/**
 * One line telling the reader what to run.
 *
 * The package name is left out: both gates already prefix their failure lines
 * with it, and including it here printed it twice.
 */
export function staleMessage({ artifactRel, regenerateCommand, result }) {
  const when = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
  if (result.state === 'unknown') {
    return `cannot tell whether ${artifactRel} is current (${result.reason}). Re-run \`${regenerateCommand}\`.`;
  }
  return (
    `${artifactRel} predates the report inputs ` +
    `(artefact ${when(result.artifactAt)}, inputs changed ${when(result.changedAt)} via ${result.source}). ` +
    `Re-run \`${regenerateCommand}\`.`
  );
}
