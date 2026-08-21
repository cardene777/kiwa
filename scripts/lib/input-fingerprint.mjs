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
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';


/** The only sidecar layout this module reads or writes. */
export const SIDECAR_SCHEMA_VERSION = 1;

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

/**
 * Fingerprint of `inputRels` as they stand in `repoRoot`.
 *
 * @param {object} args
 * @param {string} args.repoRoot
 * @param {string[]} args.inputRels repo-relative, `/` separated.
 * @param {object} [io] injection seam for the tests.
 * @returns {string | null} hex digest, or `null` when git cannot answer.
 */
export function computeInputFingerprint({ repoRoot, inputRels }, io = {}) {
  const run = io.execFileSync;

  // The file list comes from git so ignored files stay out: `coverage/`,
  // `.vitest-dist/` and the rest live under the package too, and hashing them
  // would make every artefact invalidate itself.
  //
  // `--cached` covers tracked files, `--others --exclude-standard` covers new
  // ones. A tracked file that was deleted still appears in `--cached`; it is
  // dropped below, and its absence changes the digest because its line goes.
  const listed = git(
    ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...inputRels],
    repoRoot,
    run,
  );
  if (listed === null) return null;

  const paths = listed.split('\0').filter((entry) => entry !== '');
  const present = paths.filter((rel) => (io.existsSync ?? existsSync)(join(repoRoot, rel)));

  const lines = [`v${SIDECAR_SCHEMA_VERSION}`, `inputs\t${[...inputRels].sort().join(',')}`];

  if (present.length > 0) {
    // One spawn for the whole package. `--stdin-paths` keeps the argument list
    // short and hashes the **working tree** copy of each file, which is the
    // point: the digest has to describe what was measured, not how git happens
    // to be storing it. Hashing the HEAD tree instead would change the digest
    // when identical content moves from uncommitted to committed, and every
    // artefact measured before the commit would read as stale.
    const hashed = git(['hash-object', '--stdin-paths'], repoRoot, run, present.join('\n') + '\n');
    if (hashed === null) return null;
    const hashes = hashed.split('\n').filter((entry) => entry !== '');
    if (hashes.length !== present.length) return null;

    const pairs = present.map((rel, index) => `${rel}\t${hashes[index]}`).sort();
    lines.push(...pairs);
  }

  return createHash('sha256').update(lines.join('\n')).digest('hex');
}

/** Where the sidecar for an artefact lives. */
export function sidecarPathFor(artifactAbs) {
  return join(dirname(artifactAbs), SIDECAR_BASENAME);
}

/**
 * Record the fingerprint of `inputRels` beside `artifactAbs`.
 *
 * Called by the generators once their run has succeeded. A run that fails must
 * not leave a sidecar: it would pair a fingerprint with an artefact from an
 * earlier run and make the stale one read as current.
 *
 * @returns {{ ok: true, fingerprint: string } | { ok: false, reason: string }}
 */
export function recordArtifactInputs({ repoRoot, inputRels, artifactAbs }, io = {}) {
  const fingerprint = computeInputFingerprint({ repoRoot, inputRels }, io);
  if (fingerprint === null) return { ok: false, reason: 'git could not describe the inputs' };

  const body = [
    `schema_version: ${SIDECAR_SCHEMA_VERSION}`,
    `fingerprint: ${fingerprint}`,
    `inputs: ${[...inputRels].sort().join(',')}`,
    `recorded_at: ${new Date().toISOString().replace(/\.\d{3}Z$/, 'Z')}`,
    '',
  ].join('\n');

  const path = sidecarPathFor(artifactAbs);
  (io.mkdirSync ?? mkdirSync)(dirname(path), { recursive: true });
  (io.writeFileSync ?? writeFileSync)(path, body);
  return { ok: true, fingerprint };
}

/**
 * Read the sidecar beside `artifactAbs`.
 *
 * @returns {{ state: 'absent' } | { state: 'unreadable', reason: string } | { state: 'ok', fingerprint: string, inputs: string[] }}
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
  // A newer writer may encode something this reader cannot check. Refusing is
  // the default for a format this reader does not know
  // (`rules/quality.md § 永続する形式を変える修正の後始末`).
  if (version > SIDECAR_SCHEMA_VERSION) {
    return {
      state: 'unreadable',
      reason: `${SIDECAR_BASENAME} is schema_version ${version}, newer than this reader (${SIDECAR_SCHEMA_VERSION})`,
    };
  }

  const fingerprint = field('fingerprint');
  const inputs = field('inputs');
  if (!fingerprint || inputs === null) {
    return { state: 'unreadable', reason: `${SIDECAR_BASENAME} is missing fingerprint or inputs` };
  }
  return { state: 'ok', fingerprint, inputs: inputs === '' ? [] : inputs.split(',') };
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
  return current === recorded.fingerprint
    ? { state: 'match' }
    : { state: 'mismatch', reason: 'the inputs changed since the artefact was produced' };
}
