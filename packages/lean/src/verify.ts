import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { generateLakeProject } from './lake.js';
import type { LeanSpecOutput } from './types.js';

export type VerifyStatus =
  | 'ok'
  | 'lean-not-installed'
  | 'skipped-by-env'
  | 'verification-failed';

export interface VerifyOptions {
  /** Root namespace under which specs will be organized. Default: `KiwaSpecs`. */
  rootNamespace?: string;
  /** Lake package name for the scratch project. Default: `kiwa-lean-verify`. */
  packageName?: string;
  /**
   * Custom Lean toolchain to pin. Overrides `generateLakeProject` default.
   * Ignored when Lean is not installed.
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
 * The scratch project is always cleaned up (best effort) on return.
 */
export function verifyLeanSpec(
  specs: readonly LeanSpecOutput[],
  opts: VerifyOptions = {},
): VerifyResult {
  const {
    rootNamespace = 'KiwaSpecs',
    packageName = 'kiwa-lean-verify',
    leanToolchain,
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
    const lake = generateLakeProject(
      leanToolchain !== undefined
        ? { packageName, rootNamespace, leanToolchain }
        : { packageName, rootNamespace },
    );
    for (const [relPath, content] of Object.entries(lake.files)) {
      const abs = resolve(rootDir, relPath);
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content, 'utf-8');
    }
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
