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
 * The implementation's age is the later of two things.
 *
 * | source | what it catches |
 * |---|---|
 * | commit time of the last change under `src/` | committed work, immune to checkout churn |
 * | mtime of files git reports dirty under `src/` | edits not committed yet |
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
 * A package with no `src/` has no implementation to have changed; its artefact
 * is never stale.
 */
import { existsSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

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
 * When the implementation under `srcRel` last changed, in ms.
 *
 * @param {object} args
 * @param {string} args.repoRoot
 * @param {string} args.srcRel `src/` relative to `repoRoot`, with `/` separators.
 * @param {object} [io] injection seam for the tests.
 * @returns {{ at: number, source: 'git' | 'mtime' | 'absent' | 'unknown' }}
 */
export function implementationChangedAt({ repoRoot, srcRel }, io = {}) {
  const exists = io.existsSync ?? existsSync;
  const stat = io.statSync ?? statSync;
  const srcAbs = join(repoRoot, srcRel);

  if (!exists(srcAbs)) return { at: 0, source: 'absent' };

  const commitOut = git(['log', '-1', '--format=%ct', '--', srcRel], repoRoot, io.execFileSync);
  const statusOut = git(
    ['status', '--porcelain', '-z', '--', srcRel],
    repoRoot,
    io.execFileSync,
    { trim: false },
  );

  // Both commands have to answer. One of them failing means this is not a
  // repository (or git is gone), and a half-git answer is smaller than the
  // truth — exactly the direction that reads as "fresh".
  if (commitOut === null || statusOut === null) {
    const scanned = newestMtimeMs(srcAbs, io);
    return scanned === null ? { at: 0, source: 'unknown' } : { at: scanned, source: 'mtime' };
  }

  const committedAt = commitOut === '' ? 0 : Number(commitOut) * 1000;
  let dirtyAt = 0;
  for (const rel of parseDirtyPaths(statusOut)) {
    try {
      const { mtimeMs } = stat(join(repoRoot, rel));
      if (mtimeMs > dirtyAt) dirtyAt = mtimeMs;
    } catch {
      // A deleted file has no mtime. The deletion itself is not evidence the
      // artefact is stale — the commit that removes it will be.
    }
  }

  if (!Number.isFinite(committedAt)) {
    const scanned = newestMtimeMs(srcAbs, io);
    return scanned === null ? { at: 0, source: 'unknown' } : { at: scanned, source: 'mtime' };
  }

  // Never committed and not dirty: git knows nothing about this path, so its
  // silence is not evidence of freshness.
  if (committedAt === 0 && dirtyAt === 0) {
    const scanned = newestMtimeMs(srcAbs, io);
    return scanned === null ? { at: 0, source: 'unknown' } : { at: scanned, source: 'mtime' };
  }

  return { at: Math.max(committedAt, dirtyAt), source: 'git' };
}

/**
 * Whether `artifactRel` still describes the implementation under `srcRel`.
 *
 * Equal timestamps count as fresh. A tie cannot be ordered, and filesystems
 * with one-second granularity produce them for work that is genuinely in
 * order; failing on a tie would block correct runs to catch a window no real
 * workflow occupies (generating either artefact takes seconds to minutes).
 *
 * @returns {{ state: 'missing' | 'fresh' | 'stale' | 'unknown', artifactAt?: number, changedAt?: number, source?: string }}
 */
export function checkArtifactFreshness({ repoRoot, srcRel, artifactRel }, io = {}) {
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

  const changed = implementationChangedAt({ repoRoot, srcRel }, io);
  if (changed.source === 'unknown') {
    return { state: 'unknown', reason: `cannot determine when ${srcRel} last changed` };
  }
  if (changed.source === 'absent') return { state: 'fresh', artifactAt, changedAt: 0, source: 'absent' };

  return {
    state: artifactAt >= changed.at ? 'fresh' : 'stale',
    artifactAt,
    changedAt: changed.at,
    source: changed.source,
  };
}

/** One line telling the reader what to run. */
export function staleMessage({ pkg, artifactRel, regenerateCommand, result }) {
  const when = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
  if (result.state === 'unknown') {
    return `${pkg}: cannot tell whether ${artifactRel} is current (${result.reason}). Re-run \`${regenerateCommand}\`.`;
  }
  return (
    `${pkg}: ${artifactRel} predates the implementation ` +
    `(artefact ${when(result.artifactAt)}, src changed ${when(result.changedAt)} via ${result.source}). ` +
    `Re-run \`${regenerateCommand}\`.`
  );
}
