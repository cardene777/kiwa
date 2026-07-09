import {
  DEFAULT_TIMEOUT_MS,
  runLeanSource,
  type LeanRunOptions,
} from './lean-runner.js';
import { UsageError } from './errors.js';
import type { LeanSpecOutput } from './types.js';

export type VerifyStatus =
  | 'ok'
  | 'lean-not-installed'
  | 'skipped-by-env'
  | 'verification-failed'
  /** Lean was still working when `timeoutMs` ran out. Nothing was established. */
  | 'timed-out';

export interface VerifyOptions {
  /** Root namespace under which specs will be organized. Default: `KiwaSpecs`. */
  rootNamespace?: string;
  /**
   * Lean toolchain to pin, written to `lean-toolchain` beside the specs.
   *
   * `elan`, which is how Lean is normally installed, reads that file from the
   * working directory and runs the version it names — downloading it first if the
   * machine does not have it.
   *
   * Left unset, no such file is written and the machine's own Lean does the
   * checking. That is the default because pinning a version here makes a
   * contributor who already has a working Lean fetch a second one to check specs
   * that both would judge the same way. The generated source is verified against
   * v4.12.0 through v4.31.0, which all reject the same specs.
   *
   * Set it when a run has to be reproducible down to the compiler.
   */
  leanToolchain?: string;
  /**
   * When set to `true`, skips verification entirely and returns
   * `{ status: 'skipped-by-env' }`. Use in CI / offline environments where
   * Lean is unavailable but the caller wants a deterministic no-op result.
   * Also skipped when `process.env.KIWA_LEAN_SKIP_VERIFY === '1'`.
   */
  skip?: boolean;
  /**
   * Override for the Lean executable path. Default: `lean` on PATH.
   * Useful for testing / sandboxed environments.
   */
  leanBin?: string;
  /** Where the scratch directory is created. Default: the OS temp directory. */
  workDir?: string;
  /** Timeout for the Lean subprocess in ms. Default: 60_000. */
  timeoutMs?: number;
}

export interface VerifyResult {
  status: VerifyStatus;
  /**
   * What Lean said when it refused. Non-empty only when
   * `status === 'verification-failed'`.
   *
   * Lean writes its diagnostics to stdout, not stderr, so a caller reading
   * `stderr` alone learns that verification failed and nothing about why. This
   * field carries whichever stream spoke.
   */
  diagnostics?: string;
  /** stderr captured from Lean. Usually empty; Lean reports on stdout. */
  stderr?: string;
  /** stdout captured from Lean. Carries the errors when a proof fails. */
  stdout?: string;
  /** Namespaced paths of files that were verified. */
  verifiedFiles: string[];
  /** Optional reason for skip / not-installed status. */
  reason?: string;
}

/**
 * Verify one or more generated Lean specs by elaborating them with Lean.
 *
 * Behavior:
 * - If Lean is not installed (or `leanBin` is not on PATH), returns
 *   `{ status: 'lean-not-installed' }` without throwing.
 * - If `opts.skip === true` or `KIWA_LEAN_SKIP_VERIFY=1`, returns
 *   `{ status: 'skipped-by-env' }`.
 * - Otherwise writes the specs into one file and runs `lean` over it once. A
 *   non-zero exit surfaces as `{ status: 'verification-failed', diagnostics }`,
 *   with positions named after the spec they came from, and a run that outlives
 *   `timeoutMs` as `{ status: 'timed-out' }`. Success returns
 *   `{ status: 'ok', verifiedFiles }`.
 *
 * Lean is invoked with the file as its only argument. It has no `--check` flag,
 * and it refuses more than one file: elaborating a file *is* checking it, and a
 * failed proof or a non-exhaustive match is a non-zero exit. Passing an
 * unrecognized flag makes every file fail identically, which reads as "the spec
 * is wrong" when it means "the command was wrong".
 *
 * No Lake project is written. Building one and then never calling `lake` is what
 * this used to do, and the lakefile it wrote had no effect on anything. Generated
 * specs import nothing, so they need no build system to be checked. The one file
 * that would have an effect is `lean-toolchain`, and it is written only when
 * `leanToolchain` asks for it.
 *
 * The scratch directory is always cleaned up (best effort) on return.
 */
export function verifyLeanSpec(
  specs: readonly LeanSpecOutput[],
  opts: VerifyOptions = {},
): VerifyResult {
  const {
    rootNamespace = 'KiwaSpecs',
    leanToolchain,
    skip,
    leanBin,
    workDir,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = opts;

  if (specs.length === 0) {
    throw new UsageError('verifyLeanSpec: at least one spec is required');
  }
  // `verifiedFiles` is where a caller writes the specs, and what a Lake project
  // names its library. `../../etc` is a directory, not a namespace.
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(rootNamespace)) {
    throw new UsageError(
      `verifyLeanSpec: rootNamespace ${JSON.stringify(rootNamespace)} is not a Lean identifier`,
    );
  }

  const verifiedFiles = specs.map((s) => `${rootNamespace}/${s.path}`);
  // Before anything else, including the skip paths. A call that could never
  // check what it was handed is wrong whether or not this run does the checking.
  assertUniquePaths(verifiedFiles);

  if (skip === true || process.env.KIWA_LEAN_SKIP_VERIFY === '1') {
    return {
      status: 'skipped-by-env',
      verifiedFiles,
      reason: skip === true ? 'opts.skip=true' : 'KIWA_LEAN_SKIP_VERIFY=1',
    };
  }

  const { source, segments } = concatenate(specs, verifiedFiles);
  const runOpts: LeanRunOptions = { timeoutMs };
  if (leanToolchain !== undefined) runOpts.leanToolchain = leanToolchain;
  if (leanBin !== undefined) runOpts.leanBin = leanBin;
  if (workDir !== undefined) runOpts.workDir = workDir;

  const run = runLeanSource(source, [], runOpts);
  if (run === 'lean-not-installed') {
    return {
      status: 'lean-not-installed',
      verifiedFiles: [],
      reason: `Lean toolchain not found (tried ${leanBin ?? 'lean'} --version)`,
    };
  }

  if (!run.ok) {
    return {
      // A timeout is not a verdict on the spec. Calling it a failed verification
      // sends a caller looking for a bug in a table Lean never finished reading.
      status: run.timedOut ? 'timed-out' : 'verification-failed',
      diagnostics: attribute(run.diagnostics, run.filePath, segments),
      stdout: run.stdout,
      stderr: run.stderr,
      verifiedFiles,
    };
  }

  return { status: 'ok', verifiedFiles };
}

/** Where one spec sits inside the combined file. */
interface Segment {
  /** The path the caller knows this spec by. */
  path: string;
  /** 1-based line of the spec's first line within the combined file. */
  startLine: number;
  /** How many lines the spec occupies. */
  lineCount: number;
}

/**
 * Two specs used to be written to their own files, so two sharing a path meant
 * the first was overwritten before Lean read it. It was reported as verified
 * having never been checked, and a broken spec passed whenever a good one
 * followed it.
 */
function assertUniquePaths(paths: readonly string[]): void {
  const duplicates = paths.filter((path, i) => paths.indexOf(path) !== i);
  if (duplicates.length > 0) {
    throw new UsageError(
      `verifyLeanSpec: two specs share the path ${[...new Set(duplicates)].join(', ')}; ` +
        'each spec needs its own moduleName',
    );
  }
}

/**
 * Join every spec into one file, so Lean is started once rather than once per
 * spec. Startup dominates: five specs cost about 660ms apart and about 310ms
 * together, and the checking itself is the small part.
 *
 * Each generated spec opens and closes its own namespace and imports nothing, so
 * concatenating them changes nothing about what Lean checks. Two specs sharing a
 * namespace do collide, and Lean says so, naming the second one. That is the
 * right answer: they collide in a Lake project too, where the root module imports
 * both.
 */
function concatenate(
  specs: readonly LeanSpecOutput[],
  paths: readonly string[],
): { source: string; segments: Segment[] } {
  const segments: Segment[] = [];
  const chunks: string[] = [];
  let line = 1;
  for (const [i, spec] of specs.entries()) {
    const body = spec.source.endsWith('\n') ? spec.source : `${spec.source}\n`;
    const lineCount = body.split('\n').length - 1;
    segments.push({ path: paths[i] as string, startLine: line, lineCount });
    chunks.push(body);
    line += lineCount;
  }
  return { source: chunks.join(''), segments };
}

/**
 * Rewrite Lean's positions so they name the spec rather than the combined file.
 *
 * A caller who sees `/var/folders/.../Specs.lean:214:2` learns nothing: the file
 * is gone by the time they read the message, and the line belongs to a file they
 * never wrote. `KiwaSpecs/JobOrchestrator.lean:32:2` is the same information in
 * terms they have.
 */
function attribute(diagnostics: string, combinedPath: string, segments: readonly Segment[]): string {
  const escaped = combinedPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return diagnostics.replace(new RegExp(`${escaped}:(\\d+):(\\d+)`, 'g'), (whole, rawLine, column) => {
    const line = Number(rawLine);
    const segment = segments.find((s) => line >= s.startLine && line < s.startLine + s.lineCount);
    if (segment === undefined) return whole;
    return `${segment.path}:${line - segment.startLine + 1}:${column}`;
  });
}
