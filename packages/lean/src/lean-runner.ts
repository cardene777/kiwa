/**
 * Running Lean over a file in a scratch directory.
 *
 * Both `verifyLeanSpec` and `extractLeanTable` need the same three things: find
 * Lean, write a file where it can be reached, run it. Written twice, the two
 * would learn different things about the toolchain — that Lean reports on stdout,
 * that only `lean-toolchain` pins a version — and one would forget.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

export const DEFAULT_TIMEOUT_MS = 60_000;

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
    return /^Lean \(version /.test(version.trim()) ? bin : null;
  } catch {
    return null;
  }
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
  const { leanToolchain, leanBin, workDir, timeoutMs = DEFAULT_TIMEOUT_MS } = opts;

  const bin = detectLeanBinary(leanBin);
  if (bin === null) return 'lean-not-installed';

  const rootDir = mkdtempSync(join(workDir ?? tmpdir(), 'kiwa-lean-'));
  const filePath = resolve(rootDir, 'Specs.lean');
  try {
    if (leanToolchain !== undefined) {
      writeFileSync(resolve(rootDir, 'lean-toolchain'), `${leanToolchain}\n`, 'utf-8');
    }
    writeFileSync(filePath, source, 'utf-8');

    try {
      const stdout = execFileSync(bin, [...args, filePath], {
        cwd: rootDir,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: timeoutMs,
      });
      return { ok: true, timedOut: false, stdout, stderr: '', diagnostics: '', filePath };
    } catch (err) {
      const e = err as NodeJS.ErrnoException & {
        stderr?: Buffer;
        stdout?: Buffer;
        signal?: string;
      };
      const stdout = e.stdout?.toString('utf-8') ?? '';
      const stderr = e.stderr?.toString('utf-8') ?? '';
      // Node kills the child on timeout, so `code` is ETIMEDOUT or the signal is
      // the one it sent. Either way Lean never said anything about the spec.
      const timedOut = e.code === 'ETIMEDOUT' || e.signal === 'SIGTERM';
      const spoke = [stdout, stderr].map((s) => s.trim()).filter((s) => s !== '');
      return {
        ok: false,
        timedOut,
        stdout,
        stderr,
        diagnostics: timedOut
          ? `Lean did not finish within ${timeoutMs}ms. Raise timeoutMs, or split the machine: ` +
            'Lean elaborates a theorem per state, so its cost grows with the state count.'
          : spoke.length > 0
            ? spoke.join('\n')
            : String(err),
        filePath,
      };
    }
  } finally {
    try {
      rmSync(rootDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup; ignore
    }
  }
}
