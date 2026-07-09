import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import type { LeanSpecOutput } from './types.js';

export type VerifyStatus =
  | 'ok'
  | 'lean-not-installed'
  | 'skipped-by-env'
  | 'verification-failed';

/** Matches `generateLakeProject`, so a scratch check pins what a project pins. */
const DEFAULT_TOOLCHAIN = 'leanprover/lean4:v4.15.0';

export interface VerifyOptions {
  /** Root namespace under which specs will be organized. Default: `KiwaSpecs`. */
  rootNamespace?: string;
  /**
   * Lean toolchain to pin, written to `lean-toolchain` beside the specs.
   *
   * `elan`, which is how Lean is normally installed, reads that file from the
   * working directory and runs the version it names. Nothing else pins anything:
   * without it a machine checks the specs with whatever Lean it happens to have.
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
  /**
   * Working directory root for the scratch Lake project. Default: OS tmpdir.
   */
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

const DEFAULT_TIMEOUT_MS = 60_000;

function detectLeanBinary(explicit?: string): string | null {
  const bin = explicit ?? 'lean';
  try {
    execFileSync(bin, ['--version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    return bin;
  } catch {
    return null;
  }
}

/**
 * Verify one or more generated Lean specs by materializing them into a
 * scratch Lake project and elaborating each file with Lean.
 *
 * Behavior:
 * - If Lean is not installed (or `leanBin` is not on PATH), returns
 *   `{ status: 'lean-not-installed' }` without throwing.
 * - If `opts.skip === true` or `KIWA_LEAN_SKIP_VERIFY=1`, returns
 *   `{ status: 'skipped-by-env' }`.
 * - Otherwise runs `lean <file>` for each spec. Any non-zero exit surfaces as
 *   `{ status: 'verification-failed', stderr }`. Success returns
 *   `{ status: 'ok', verifiedFiles }`.
 *
 * Lean is invoked with the file as its only argument. It has no `--check` flag:
 * elaborating a file *is* checking it, and a failed proof or a non-exhaustive
 * match is a non-zero exit. Passing an unrecognized flag makes every file fail
 * identically, which reads as "the spec is wrong" when it means "the command
 * was wrong".
 *
 * No Lake project is written. Building one and then never calling `lake` is what
 * this used to do, and the lakefile it wrote had no effect on anything. The one
 * file that does have an effect is `lean-toolchain`, which `elan` reads from the
 * working directory to choose the Lean it runs. Generated specs import nothing,
 * so they need no build system to be checked.
 *
 * The scratch directory is always cleaned up (best effort) on return.
 */
export function verifyLeanSpec(
  specs: readonly LeanSpecOutput[],
  opts: VerifyOptions = {},
): VerifyResult {
  const {
    rootNamespace = 'KiwaSpecs',
    leanToolchain = DEFAULT_TOOLCHAIN,
    skip,
    leanBin,
    workDir,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = opts;

  if (specs.length === 0) {
    throw new Error('verifyLeanSpec: at least one spec is required');
  }

  if (skip === true || process.env.KIWA_LEAN_SKIP_VERIFY === '1') {
    return {
      status: 'skipped-by-env',
      verifiedFiles: specs.map((s) => `${rootNamespace}/${s.path}`),
      reason: skip === true ? 'opts.skip=true' : 'KIWA_LEAN_SKIP_VERIFY=1',
    };
  }

  const resolvedBin = detectLeanBinary(leanBin);
  if (!resolvedBin) {
    return {
      status: 'lean-not-installed',
      verifiedFiles: [],
      reason: `Lean toolchain not found (tried ${leanBin ?? 'lean'} --version)`,
    };
  }

  const rootDir = mkdtempSync(join(workDir ?? tmpdir(), 'kiwa-lean-'));
  const verifiedFiles: string[] = [];
  try {
    writeFileSync(resolve(rootDir, 'lean-toolchain'), `${leanToolchain}\n`, 'utf-8');
    for (const spec of specs) {
      const relPath = `${rootNamespace}/${spec.path}`;
      const abs = resolve(rootDir, relPath);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, spec.source, 'utf-8');
      verifiedFiles.push(relPath);
    }

    for (const relPath of verifiedFiles) {
      const abs = resolve(rootDir, relPath);
      try {
        execFileSync(resolvedBin, [abs], {
          cwd: rootDir,
          stdio: ['ignore', 'pipe', 'pipe'],
          timeout: timeoutMs,
        });
      } catch (err) {
        const e = err as NodeJS.ErrnoException & { stderr?: Buffer; stdout?: Buffer };
        const stdout = e.stdout?.toString('utf-8') ?? '';
        const stderr = e.stderr?.toString('utf-8') ?? '';
        // Prefer whichever stream carried a message; fall back to the thrown
        // error, which is what speaks when Lean was killed by the timeout.
        const spoke = [stdout, stderr].map((s) => s.trim()).filter((s) => s !== '');
        return {
          status: 'verification-failed',
          diagnostics: spoke.length > 0 ? spoke.join('\n') : String(err),
          stdout,
          stderr,
          verifiedFiles,
        };
      }
    }

    return {
      status: 'ok',
      verifiedFiles,
    };
  } finally {
    try {
      rmSync(rootDir, { recursive: true, force: true });
    } catch {
      // best-effort cleanup; ignore
    }
  }
}
