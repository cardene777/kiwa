/**
 * Running Lean over a file in a scratch directory.
 *
 * Both `verifyLeanSpec` and `extractLeanTable` need the same three things: find
 * Lean, write a file where it can be reached, run it. Written twice, the two
 * would learn different things about the toolchain — that Lean reports on stdout,
 * that only `lean-toolchain` pins a version — and one would forget.
 */

import { execFile, execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { createManagedTempDir, type ManagedTempDir } from '@kiwa-lab/core';
import { UsageError } from './errors.js';

const execFileAsync = promisify(execFile);

export const DEFAULT_TIMEOUT_MS = 60_000;

/**
 * How much Lean may print before the buffer that holds it is full.
 *
 * Node's default is one megabyte, and `extractLeanTable` prints one line per cell:
 * about sixty-eight bytes, so fifteen thousand cells fill it. Past that,
 * `execFileSync` throws `ENOBUFS` and Lean's own answer is lost — a tool limit
 * arriving as a verdict on the spec, which is the confusion `timed-out` exists to
 * prevent.
 *
 * Sixty-four megabytes is a million cells, and it is a ceiling rather than an
 * allocation.
 */
const MAX_OUTPUT_BYTES = 64 * 1024 * 1024;

export interface LeanRunOptions {
  /**
   * Lean toolchain to pin, written to `lean-toolchain` beside the source.
   *
   * `elan` reads that file from the working directory and runs the version it
   * names, downloading it first if the machine does not have it. Left unset, the
   * machine's own Lean does the work.
   */
  leanToolchain?: string;
  /** Override for the Lean executable. Default: `lean` on PATH. */
  leanBin?: string;
  /** Where the scratch directory is created. Default: the OS temp directory. */
  workDir?: string;
  /** Timeout for the Lean subprocess in ms. Default: 60_000. */
  timeoutMs?: number;
  /**
   * How many bytes Lean may print before the rest is thrown away.
   *
   * Default: 64 MiB, about a million cells. A run that exceeds it reports
   * `output-too-large` rather than a verdict, since the answer existed and was
   * lost.
   */
  maxOutputBytes?: number;
}

/**
 * The Lean binary, or `null` when it is not there.
 *
 * A program that exits zero for `--version` is not thereby Lean. `/bin/echo`
 * does, and pointing `leanBin` at it made every spec verify — the worst shape a
 * pass can take, since nothing looked at anything. Lean says who it is:
 *
 *   Lean (version 4.15.0, arm64-apple-darwin23.6.0, commit ..., Release)
 */
export function detectLeanBinary(explicit?: string): string | null {
  const bin = explicit ?? 'lean';
  try {
    const version = execFileSync(bin, ['--version'], {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 10_000,
    });
    return isLean(version, bin);
  } catch {
    return null;
  }
}

/** The same question, asked without stopping the event loop. */
export async function detectLeanBinaryAsync(explicit?: string): Promise<string | null> {
  const bin = explicit ?? 'lean';
  try {
    const { stdout } = await execFileAsync(bin, ['--version'], {
      encoding: 'utf-8',
      timeout: 10_000,
    });
    return isLean(stdout, bin);
  } catch {
    return null;
  }
}

/** One place that knows what Lean's version banner looks like. */
function isLean(version: string, bin: string): string | null {
  return /^Lean \(version /.test(version.trim()) ? bin : null;
}

/**
 * What either runner throws, in the shape this reads it.
 *
 * `code` is a string for `execFileSync`, and for `execFile` it is the child's exit
 * status — a number — or one of Node's own `ERR_` names, or `null` when a signal
 * ended it.
 */
export interface SpawnFailure {
  code?: string | number | null | undefined;
  signal?: string | null | undefined;
}

/**
 * The two names Node has for a full buffer.
 *
 * `execFileSync` reports the errno it saw. `execFile` reports its own error code
 * and never mentions `ENOBUFS`. The same event, spelled twice, and a classifier
 * that knows one spelling calls the other a failed verification: the async path
 * reported `verification-failed` for an overflow until this line existed.
 */
const OVERFLOW_CODES: ReadonlySet<string> = new Set([
  'ENOBUFS',
  'ERR_CHILD_PROCESS_STDIO_MAXBUFFER',
]);

/**
 * Why Lean stopped, when it did not finish normally.
 *
 * Overflow is asked about first because it arrives with the evidence of a
 * timeout. Node kills the child when the buffer fills, and killing it is what a
 * timeout does: `SIGTERM` is what Node did, not what happened. Reading the signal
 * first calls a full buffer a timeout and sends the reader to raise the wrong
 * knob.
 *
 * A number in `code` is the child's exit status, which is neither.
 */
export function classifyFailure(error: SpawnFailure): {
  timedOut: boolean;
  overflowed: boolean;
} {
  if (typeof error.code === 'string' && OVERFLOW_CODES.has(error.code)) {
    return { timedOut: false, overflowed: true };
  }
  return {
    timedOut: error.code === 'ETIMEDOUT' || error.signal === 'SIGTERM',
    overflowed: false,
  };
}

export interface LeanRun {
  ok: boolean;
  /**
   * Lean was still working when `timeoutMs` ran out.
   *
   * A timeout is not a verdict. Reporting it as a failure says the spec is wrong
   * when nothing has been established about the spec at all, and on a large
   * machine — Lean's cost grows with the number of states, since each one carries
   * a theorem — that is the failure a caller meets first.
   */
  timedOut: boolean;
  /**
   * Lean printed more than the buffer holds, and the rest was thrown away.
   *
   * Like a timeout, this says nothing about the spec. Unlike a timeout, it says
   * the answer existed and was lost.
   */
  overflowed: boolean;
  stdout: string;
  stderr: string;
  /**
   * Whichever stream spoke, when Lean refused. Lean writes its diagnostics to
   * stdout, so a caller reading `stderr` alone learns that something failed and
   * nothing about what.
   */
  diagnostics: string;
  /** Where the source was written. Lean's positions name this path. */
  filePath: string;
}

/**
 * Write `source` to a scratch file and hand it to Lean.
 *
 * `args` decides what Lean does with it: nothing elaborates the file, which is
 * how a file is checked, and `--run` also executes its `main`. Lean has no
 * `--check` flag and refuses more than one file.
 *
 * The scratch directory is removed before returning, so `filePath` names a file
 * that no longer exists — it is there to rewrite the positions Lean printed.
 */
export function runLeanSource(
  source: string,
  args: readonly string[],
  opts: LeanRunOptions = {},
): LeanRun | 'lean-not-installed' {
  const bin = detectLeanBinary(opts.leanBin);
  if (bin === null) return 'lean-not-installed';

  const { rootDir, filePath } = createScratch(source, opts);
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxOutputBytes = MAX_OUTPUT_BYTES } = opts;
  try {
    const stdout = execFileSync(bin, [...args, filePath], {
      cwd: rootDir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: timeoutMs,
      maxBuffer: maxOutputBytes,
    });
    return succeeded(stdout, filePath);
  } catch (error) {
    return failed(error, filePath, timeoutMs, maxOutputBytes);
  } finally {
    removeScratch(rootDir);
  }
}

/**
 * The same run, awaited.
 *
 * `execFile` differs from `execFileSync` in what it puts on the error — a numeric
 * exit code where the sync form leaves `code` unset — and in nothing else that
 * matters here. Both set `ENOBUFS` with `SIGTERM` when the buffer fills, and both
 * let Lean write its diagnostics to stdout. `classifyFailure` and `failed` are the
 * same functions the sync path calls, so neither can learn a rule the other misses.
 */
export async function runLeanSourceAsync(
  source: string,
  args: readonly string[],
  opts: LeanRunOptions = {},
): Promise<LeanRun | 'lean-not-installed'> {
  const bin = await detectLeanBinaryAsync(opts.leanBin);
  if (bin === null) return 'lean-not-installed';

  const { rootDir, filePath } = createScratch(source, opts);
  const { timeoutMs = DEFAULT_TIMEOUT_MS, maxOutputBytes = MAX_OUTPUT_BYTES } = opts;
  try {
    const { stdout } = await execFileAsync(bin, [...args, filePath], {
      cwd: rootDir,
      encoding: 'utf-8',
      timeout: timeoutMs,
      maxBuffer: maxOutputBytes,
    });
    return succeeded(stdout, filePath);
  } catch (error) {
    return failed(error, filePath, timeoutMs, maxOutputBytes);
  } finally {
    removeScratch(rootDir);
  }
}

/** Scratch directories still held by a run, keyed by their path so teardown can find them. */
const scratchHandles = new Map<string, ManagedTempDir>();

/** A directory holding the source, and a `lean-toolchain` when one was asked for. */
function createScratch(source: string, opts: LeanRunOptions): { rootDir: string; filePath: string } {
  const { workDir, leanToolchain } = opts;
  let rootDir: string;
  try {
    // `exactOptionalPropertyTypes` の下では `root: undefined` を渡せない。 未指定は
    // key ごと落として core 側の既定 (`os.tmpdir()`) に委ねる。
    const managed = createManagedTempDir(
      workDir === undefined ? { label: 'lean' } : { label: 'lean', root: workDir },
    );
    rootDir = managed.path;
    scratchHandles.set(rootDir, managed);
  } catch (error) {
    // `ENOENT: mkdtemp '/nope/kiwa-lean-…'` names a path the caller never wrote
    // and does not say which option produced it.
    throw new UsageError(
      `workDir ${JSON.stringify(workDir)} is not a directory Lean's scratch files can be ` +
        `written to: ${(error as Error).message}`,
    );
  }
  const filePath = resolve(rootDir, 'Specs.lean');
  if (leanToolchain !== undefined) {
    writeFileSync(resolve(rootDir, 'lean-toolchain'), `${leanToolchain}\n`, 'utf-8');
  }
  writeFileSync(filePath, source, 'utf-8');
  return { rootDir, filePath };
}

function removeScratch(rootDir: string): void {
  const managed = scratchHandles.get(rootDir);
  scratchHandles.delete(rootDir);
  // `dispose` swallows its own failures; an unknown path means the run never got
  // as far as creating one.
  managed?.dispose();
}

function succeeded(stdout: string, filePath: string): LeanRun {
  return { ok: true, timedOut: false, overflowed: false, stdout, stderr: '', diagnostics: '', filePath };
}

/** What Lean's refusal means, whichever way it was run. */
function failed(
  error: unknown,
  filePath: string,
  timeoutMs: number,
  maxOutputBytes: number,
): LeanRun {
  const e = error as NodeJS.ErrnoException & {
    stderr?: Buffer | string;
    stdout?: Buffer | string;
    signal?: string;
  };
  const stdout = asText(e.stdout);
  const stderr = asText(e.stderr);
  const { timedOut, overflowed } = classifyFailure(e);
  const spoke = [stdout, stderr].map((s) => s.trim()).filter((s) => s !== '');
  return {
    ok: false,
    timedOut,
    overflowed,
    stdout,
    stderr,
    diagnostics: timedOut
      ? `Lean did not finish within ${timeoutMs}ms. Raise timeoutMs, or split the machine: ` +
        'Lean elaborates a theorem per state, so its cost grows with the state count.'
      : overflowed
        ? `Lean printed more than ${maxOutputBytes} bytes, and the rest was lost. ` +
          'Nothing was established about the spec: split the machine.'
        : spoke.length > 0
          ? spoke.join('\n')
          : String(error),
    filePath,
  };
}

/** `execFileSync` hands back Buffers; `execFile` with an encoding hands back strings. */
function asText(value: Buffer | string | undefined): string {
  if (value === undefined) return '';
  return typeof value === 'string' ? value : value.toString('utf-8');
}
