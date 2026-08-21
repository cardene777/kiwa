/**
 * A content fingerprint for the inputs that produced a gate's artefact.
 *
 * #2125 compares timestamps, and two skews survive that comparison no matter
 * how the input set is tightened.
 *
 * | skew | what it does |
 * |---|---|
 * | squash merge | stamps the commit with the merge time, while the work — and the measuring — happened on the branch before it |
 * | checking out older content | moves the commit time backwards, so a newer artefact measured against different content reads as current |
 *
 * Measured on this repo: `packages/api`'s mutation report is 52 minutes older
 * than the commit that changed its `stryker.config.mjs`, and its file set
 * matches that config exactly. The report was produced from the very config it
 * was accused of predating.
 *
 * Comparing content removes both. If the fingerprint recorded beside an
 * artefact matches the one computed now, the artefact describes this content —
 * whenever either was written.
 *
 * ## How the fingerprint is built
 *
 * The working tree, hashed. `git ls-files --cached --others --exclude-standard`
 * lists the files that count — tracked ones plus new ones, with ignored output
 * (`coverage/`, `.vitest-dist/`) left out — and one `git hash-object
 * --stdin-paths` hashes them all in a single call.
 *
 * The digest covers the input paths themselves as well, so adding or removing
 * an input changes it even when no file did.
 *
 * **Not the HEAD tree.** Reading commits instead would change the digest when
 * identical content moves from uncommitted to committed, and every artefact
 * measured before that commit would read as stale — the gate would fire on
 * every commit rather than on every change.
 *
 * ## When git cannot answer
 *
 * Returns `null`. The caller falls back to the timestamp comparison, which is
 * what ran before this existed.
 */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readlinkSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

import { newestMtimeMs } from './artifact-freshness.mjs';


/** The only sidecar layout this module reads or writes. */
export const SIDECAR_SCHEMA_VERSION = 2;

/** File name placed next to an artefact. */
export const SIDECAR_BASENAME = 'inputs.sha';

function git(args, cwd, runner, input) {
  try {
    return (runner ?? execFileSync)('git', args, {
      cwd,
      encoding: 'utf8',
      ...(input === undefined
        ? { stdio: ['ignore', 'pipe', 'ignore'] }
        : { input, stdio: ['pipe', 'pipe', 'ignore'] }),
    });
  } catch {
    return null;
  }
}

/** Whether a directory entry exists, without following a symlink target. */
function pathEntryExists(path, io) {
  if (io.existsSync) return io.existsSync(path);
  try {
    (io.lstatSync ?? lstatSync)(path);
    return true;
  } catch {
    return false;
  }
}

function pathIsSymlink(path, io) {
  try {
    return (io.lstatSync ?? lstatSync)(path).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Fingerprint of `inputRels` as they stand in `repoRoot`.
 *
 * @param {object} args
 * @param {string} args.repoRoot
 * @param {string[]} args.inputRels repo-relative, `/` separated.
 * @param {object} [io] injection seam for the tests.
 * @returns {string | null} hex digest, or `null` when git cannot answer.
 */
/**
 * The input files git knows about, repo-relative.
 *
 * Ignored files stay out: `coverage/`, `.vitest-dist/` and the rest live under
 * the package too, and counting them would make every artefact invalidate
 * itself. `--cached` covers tracked files, `--others --exclude-standard`
 * covers new ones. A tracked file that was deleted still appears in
 * `--cached`; callers drop it, and its absence changes the digest because its
 * line goes.
 *
 * @returns {string[] | null} `null` when git cannot answer.
 */
function listInputPaths({ repoRoot, inputRels }, io = {}) {
  const listed = git(
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...inputRels],
    repoRoot,
    io.execFileSync,
  );
  if (listed === null) return null;
  return listed.split('\0').filter((entry) => entry !== '');
}

export function computeInputFingerprint({ repoRoot, inputRels }, io = {}) {
  const run = io.execFileSync;

  const paths = listInputPaths({ repoRoot, inputRels }, io);
  if (paths === null) return null;
  const present = paths.filter((rel) => pathEntryExists(join(repoRoot, rel), io));

  const lines = [`v${SIDECAR_SCHEMA_VERSION}`, `inputs\t${[...inputRels].sort().join(',')}`];

  if (present.length > 0) {
    // One spawn for the whole package. `--stdin-paths` keeps the argument list
    // short and hashes the **working tree** copy of each file, which is the
    // point: the digest has to describe what was measured, not how git happens
    // to be storing it. Hashing the HEAD tree instead would change the digest
    // when identical content moves from uncommitted to committed, and every
    // artefact measured before the commit would read as stale.
    // `--stdin-paths` is LF-delimited and has no NUL mode. Git permits LF in a
    // path, so putting such a name on stdin would split it into two names and
    // disable the content check for the whole package. Keep the one-spawn fast
    // path for ordinary names and pass only those exceptional paths as argv,
    // where `execFileSync` preserves them exactly.
    const symlinkPaths = new Set(
      present.filter((rel) => pathIsSymlink(join(repoRoot, rel), io)),
    );
    const stdinPaths = present.filter((rel) => !rel.includes('\n') && !symlinkPaths.has(rel));
    const hashesByPath = new Map();
    if (stdinPaths.length > 0) {
      const hashed = git(
        ['hash-object', '--stdin-paths'],
        repoRoot,
        run,
        stdinPaths.join('\n') + '\n',
      );
      if (hashed === null) return null;
      const hashes = hashed.split('\n').filter((entry) => entry !== '');
      if (hashes.length !== stdinPaths.length) return null;
      stdinPaths.forEach((rel, index) => hashesByPath.set(rel, hashes[index]));
    }

    for (const rel of present) {
      if (symlinkPaths.has(rel)) {
        let target;
        try {
          target = (io.readlinkSync ?? readlinkSync)(join(repoRoot, rel), 'utf8');
        } catch {
          return null;
        }
        hashesByPath.set(
          rel,
          createHash('sha256').update('symlink\0').update(target).digest('hex'),
        );
        continue;
      }
      if (!rel.includes('\n')) continue;
      const hashed = git(['hash-object', '--', rel], repoRoot, run);
      if (hashed === null) return null;
      const hashes = hashed.split('\n').filter((entry) => entry !== '');
      if (hashes.length !== 1) return null;
      hashesByPath.set(rel, hashes[0]);
    }

    // JSON escaping keeps tabs and line breaks inside a path from imitating
    // the separators between path/hash pairs in the digest input.
    const pairs = present
      .map((rel) => `${JSON.stringify(rel)}\t${hashesByPath.get(rel)}`)
      .sort();
    lines.push(...pairs);
  }

  return createHash('sha256').update(lines.join('\n')).digest('hex');
}

/** Where the sidecar for an artefact lives. */
export function sidecarPathFor(artifactAbs) {
  return join(dirname(artifactAbs), SIDECAR_BASENAME);
}

/** SHA-256 of the exact artefact bytes paired with a sidecar. */
function computeArtifactFingerprint(artifactAbs, io = {}) {
  try {
    const body = (io.readFileSync ?? readFileSync)(artifactAbs);
    return createHash('sha256').update(body).digest('hex');
  } catch {
    return null;
  }
}

/**
 * Whether the inputs still stand as the run's build left them.
 *
 * A sidecar is written after the run, so it describes the working tree *then*
 * — not the tree the numbers came from. Both generators compile into
 * `.vitest-dist` first and measure that copy, so a `src/` edit made while
 * Stryker is running (35 minutes for `dapp`) reaches the sidecar but not the
 * report. Nothing downstream can tell: the inputs and the artefact are both
 * unchanged between recording and checking, so the pair reads as `match` and
 * the gate scores the new code against the old run.
 *
 * The build is the instant the inputs were consumed. Both `test:cov` and
 * `test:mutation` delete `.vitest-dist` and recompile before measuring, so its
 * mtimes mark when the compiler last read `src/` and `tests/`. An input newer
 * than that did not reach the build, and no sidecar may claim it did.
 *
 * Measured across all 30 package build directories on this tree: the newest
 * input predates the build every time, and the build predates its artefact
 * every time (`core` compiled 15:52:05 and its coverage landed 15:53:18). The
 * check costs one `git ls-files` and one walk, both of which the recording
 * path already pays.
 *
 * @returns {string | null} why recording must not happen, or `null` when it may.
 */
function inputsChangedAfterBuild({ repoRoot, inputRels, buildDirAbs }, io = {}) {
  if (!buildDirAbs) return 'no build directory was given to compare the inputs against';

  const builtAt = newestMtimeMs(buildDirAbs, io);
  // `null` is an unreadable directory, `0` a directory holding no files. The
  // build is deleted and recompiled by every run that records, so neither
  // shape belongs to a run that just measured something.
  if (builtAt === null) return 'the build the run measured could not be read';
  if (builtAt === 0) return 'the build the run measured holds no files';

  const paths = listInputPaths({ repoRoot, inputRels }, io);
  if (paths === null) return 'git could not list the inputs';

  const stat = io.statSync ?? statSync;
  for (const rel of paths) {
    const abs = join(repoRoot, rel);
    // A path git lists but the tree no longer has is a deletion, which the
    // fingerprint already reflects by dropping its line.
    if (!pathEntryExists(abs, io)) continue;
    let mtimeMs;
    try {
      ({ mtimeMs } = stat(abs));
    } catch {
      // Listed, present, and still unreadable. Recording would assert a pairing
      // over a file whose age is unknown.
      return `${rel} could not be read to compare against the build`;
    }
    if (mtimeMs > builtAt) return `${rel} changed after the build the run measured`;
  }
  return null;
}

/**
 * Record the fingerprint of `inputRels` beside `artifactAbs`.
 *
 * Called by the generators once their run has succeeded. A run that fails must
 * not leave a sidecar: it would pair a fingerprint with an artefact from an
 * earlier run and make the stale one read as current.
 *
 * `buildDirAbs` is the compiled copy the run measured, and it is required. A
 * sidecar written without it would claim a pairing that nothing checked
 * (`inputsChangedAfterBuild`), and an optional argument is dropped silently by
 * whichever caller is added next.
 *
 * Recording is not a failure of the run. Every rejection here returns a reason
 * for the caller to report while still leaving with success, and the gate goes
 * on comparing timestamps as it did before #2135.
 *
 * @returns {{ ok: true, fingerprint: string } | { ok: false, reason: string }}
 */
export function recordArtifactInputs({ repoRoot, inputRels, artifactAbs, buildDirAbs }, io = {}) {
  // The sidecar identifies a pair, not just the inputs. Without the artefact
  // digest, replacing a successful run's report while leaving inputs.sha in
  // place makes the replacement look current.
  const artifactFingerprint = computeArtifactFingerprint(artifactAbs, io);
  if (artifactFingerprint === null) {
    return { ok: false, reason: 'the artefact could not be read' };
  }

  const drifted = inputsChangedAfterBuild({ repoRoot, inputRels, buildDirAbs }, io);
  if (drifted !== null) return { ok: false, reason: drifted };

  const fingerprint = computeInputFingerprint({ repoRoot, inputRels }, io);
  if (fingerprint === null) return { ok: false, reason: 'git could not describe the inputs' };

  const body = [
    `schema_version: ${SIDECAR_SCHEMA_VERSION}`,
    `fingerprint: ${fingerprint}`,
    `artifact_fingerprint: ${artifactFingerprint}`,
    `inputs: ${[...inputRels].sort().join(',')}`,
    `recorded_at: ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    '',
  ].join('\n');

  const path = sidecarPathFor(artifactAbs);
  try {
    (io.mkdirSync ?? mkdirSync)(dirname(path), { recursive: true });
    (io.writeFileSync ?? writeFileSync)(path, body);
  } catch (error) {
    // A read-only tree, a full disk, or a directory this user cannot write.
    // The documented failure shape is a returned reason: `recordForPackage`
    // reports it and the CLI still exits 0, and `runPackageMutation` warns and
    // still returns the run's own exit code. Throwing here escapes both and
    // turns "the sidecar could not be written" into "`test:cov` failed".
    return { ok: false, reason: `the sidecar could not be written (${error.message})` };
  }
  return { ok: true, fingerprint };
}

/**
 * Read the sidecar beside `artifactAbs`.
 *
 * @returns {{ state: 'absent' } | { state: 'unreadable', reason: string } | { state: 'ok', fingerprint: string, artifactFingerprint: string, inputs: string[] }}
 */
export function readArtifactInputs(artifactAbs, io = {}) {
  const path = sidecarPathFor(artifactAbs);
  if (!(io.existsSync ?? existsSync)(path)) return { state: 'absent' };

  let raw;
  try {
    raw = (io.readFileSync ?? readFileSync)(path, 'utf8');
  } catch {
    return { state: 'unreadable', reason: `cannot read ${SIDECAR_BASENAME}` };
  }

  const field = (name) => {
    const line = raw.split('\n').find((entry) => entry.startsWith(`${name}:`));
    return line === undefined ? null : line.slice(name.length + 1).trim();
  };

  // `Number(null)` is 0, and 0 is an integer — checking the parsed value alone
  // lets a sidecar with no version line through as version 0.
  const versionRaw = field('schema_version');
  const version = versionRaw === null ? Number.NaN : Number(versionRaw);
  if (!Number.isInteger(version)) {
    return { state: 'unreadable', reason: `${SIDECAR_BASENAME} has no usable schema_version` };
  }
  // Any version but this one is refused, in both directions.
  //
  // A newer writer may encode something this reader cannot check — the default
  // for a format a reader does not know
  // (`rules/quality.md § 永続する形式を変える修正の後始末`).
  //
  // An older one is refused because **the version names the digest algorithm**.
  // Comparing a digest from another algorithm produces a mismatch whose message
  // says the inputs changed, which is not what happened; the reader would send
  // someone to look for a change that is not there. Refusing says the sidecar
  // cannot be used, and the gate asks for a re-measure — which is the fix.
  //
  // So: **changing how the digest is built means bumping this version.** Leaving
  // it alone turns an algorithm change into a repo-wide "your inputs changed".
  if (version !== SIDECAR_SCHEMA_VERSION) {
    return {
      state: 'unreadable',
      reason: `${SIDECAR_BASENAME} is schema_version ${version}, and this reader writes ${SIDECAR_SCHEMA_VERSION} (the version names the digest algorithm, so digests are only comparable within one)`,
    };
  }

  const fingerprint = field('fingerprint');
  const artifactFingerprint = field('artifact_fingerprint');
  const inputs = field('inputs');
  if (!fingerprint || !artifactFingerprint || inputs === null) {
    return {
      state: 'unreadable',
      reason: `${SIDECAR_BASENAME} is missing fingerprint, artifact_fingerprint, or inputs`,
    };
  }
  return {
    state: 'ok',
    fingerprint,
    artifactFingerprint,
    inputs: inputs === '' ? [] : inputs.split(','),
  };
}

/**
 * Whether the artefact beside `artifactAbs` was measured against the content
 * that is there now.
 *
 * @returns {{ state: 'match' | 'mismatch' | 'absent' | 'unusable', reason?: string }}
 */
export function compareArtifactInputs({ repoRoot, inputRels, artifactAbs }, io = {}) {
  const recorded = readArtifactInputs(artifactAbs, io);
  if (recorded.state === 'absent') return { state: 'absent' };
  if (recorded.state === 'unreadable') return { state: 'unusable', reason: recorded.reason };

  // The recorded input set is part of what was measured. Comparing digests
  // alone would let a gate that now reads more inputs accept a fingerprint
  // taken over fewer.
  const wanted = [...inputRels].sort().join(',');
  if (recorded.inputs.join(',') !== wanted) {
    return {
      state: 'mismatch',
      reason: `recorded inputs (${recorded.inputs.join(',') || 'none'}) differ from the inputs this gate reads (${wanted})`,
    };
  }

  const current = computeInputFingerprint({ repoRoot, inputRels }, io);
  if (current === null) return { state: 'unusable', reason: 'git could not describe the inputs' };
  if (current !== recorded.fingerprint) {
    return { state: 'mismatch', reason: 'the inputs changed since the artefact was produced' };
  }

  const currentArtifact = computeArtifactFingerprint(artifactAbs, io);
  if (currentArtifact === null) {
    return { state: 'unusable', reason: 'the artefact could not be read' };
  }
  return currentArtifact === recorded.artifactFingerprint
    ? { state: 'match' }
    : { state: 'mismatch', reason: 'the artefact differs from the one paired with the inputs' };
}
