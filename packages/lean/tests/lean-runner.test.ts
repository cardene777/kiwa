/**
 * What happens when Lean is not there, is not Lean, or does not finish.
 *
 * These are the paths a library takes on someone else's machine, and each one of
 * them used to end in a green check or in a verdict about a spec Lean never read.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { classifyFailure, detectLeanBinary } from '../src/lean-runner.js';
import { generateLeanSpec } from '../src/generator.js';
import { checkLeanTable } from '../src/extract.js';
import { UsageError } from '../src/errors.js';
import { verifyLeanSpec } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

function leanInstalled(): boolean {
  try {
    execFileSync('lean', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_LEAN = leanInstalled();

const SPEC: OrchestratorSpec = {
  moduleName: 'Probe',
  namespace: 'Probe',
  states: ['a', 'b'],
  events: ['e'],
  unspecified: 'invalid',
  transitions: [{ from: 'a', event: 'e', to: 'b' }],
};

const output = () => {
  const { source, path, meta } = generateLeanSpec(SPEC);
  return [{ source, path, meta }];
};

describe('a program that answers --version is not thereby Lean', () => {
  it('T-RUNNER-001 an executable that exits zero is refused', () => {
    // `/bin/echo --version` exits 0 and prints `--version`. Pointing leanBin at
    // it made every spec verify: the worst shape a pass can take.
    expect(detectLeanBinary('/bin/echo')).toBe(null);
  });

  it('T-RUNNER-002 a binary that is not there is refused', () => {
    expect(detectLeanBinary('/definitely/not/lean/xyz')).toBe(null);
  });

  it.skipIf(!HAS_LEAN)('T-RUNNER-003 Lean identifies itself, and is accepted', () => {
    expect(detectLeanBinary()).toBe('lean');
    expect(detectLeanBinary('lean')).toBe('lean');
  });

  it('T-RUNNER-004 verification with a fake Lean says the toolchain is missing', () => {
    const result = verifyLeanSpec(output(), { leanBin: '/bin/echo' });

    expect(result.status).toBe('lean-not-installed');
    expect(result.reason).toContain('Lean toolchain not found');
  });

  it('T-RUNNER-005 extraction with a fake Lean says the toolchain is missing', () => {
    const report = checkLeanTable(SPEC, { leanBin: '/bin/echo' });

    expect(report.status).toBe('lean-not-installed');
    expect(report.ok).toBe(false);
  });
});

describe.skipIf(!HAS_LEAN)('a timeout is not a verdict on the spec', () => {
  it('T-RUNNER-010 verification that runs out of time says so', () => {
    // It used to return `verification-failed` with `spawnSync lean ETIMEDOUT`,
    // sending the reader to look for a bug in a table Lean never finished.
    const result = verifyLeanSpec(output(), { timeoutMs: 1 });

    expect(result.status).toBe('timed-out');
    expect(result.status).not.toBe('verification-failed');
    expect(result.diagnostics).toContain('did not finish within 1ms');
    expect(result.diagnostics).toContain('theorem per state');
  });

  it('T-RUNNER-011 extraction that runs out of time says so', () => {
    const report = checkLeanTable(SPEC, { timeoutMs: 1 });

    expect(report.status).toBe('timed-out');
    expect(report.ok).toBe(false);
    expect(report.checked).toBe(0);
  });

  it('T-RUNNER-012 a real failure is still a real failure', () => {
    const good = generateLeanSpec(SPEC);
    const broken = [{ ...good, source: 'namespace Probe\ndef bad : Nat := "x"\nend Probe\n' }];

    const result = verifyLeanSpec(broken);

    expect(result.status).toBe('verification-failed');
    expect(result.diagnostics).not.toContain('did not finish');
  });

  it('T-RUNNER-013 a generous timeout leaves the verdict alone', () => {
    expect(verifyLeanSpec(output(), { timeoutMs: 120_000 }).status).toBe('ok');
  });
});

describe('why Lean stopped, when it did not finish', () => {
  // Node kills the child when the buffer fills, and killing it is also what a
  // timeout does — so `ENOBUFS` and `SIGTERM` arrive together. Reading the signal
  // first calls a full buffer a timeout, and sends the reader to raise the wrong
  // knob. Lean happens to finish writing before Node kills it, so this pair is
  // unreachable through Lean and reachable through any slower child.
  it('T-RUNNER-030 a full buffer is an overflow, even when the child was killed for it', () => {
    expect(classifyFailure({ code: 'ENOBUFS', signal: 'SIGTERM' })).toEqual({
      timedOut: false,
      overflowed: true,
    });
  });

  it('T-RUNNER-031 a full buffer after the child exits is still an overflow', () => {
    expect(classifyFailure({ code: 'ENOBUFS', signal: null })).toEqual({
      timedOut: false,
      overflowed: true,
    });
  });

  it('T-RUNNER-032 a timeout is a timeout', () => {
    expect(classifyFailure({ code: 'ETIMEDOUT', signal: 'SIGTERM' })).toEqual({
      timedOut: true,
      overflowed: false,
    });
  });

  it('T-RUNNER-033 a child killed by something else is treated as a timeout', () => {
    // It did not finish, and nothing was established. Which is what matters.
    expect(classifyFailure({ signal: 'SIGTERM' })).toEqual({ timedOut: true, overflowed: false });
  });

  it('T-RUNNER-034 an ordinary non-zero exit is neither', () => {
    expect(classifyFailure({ signal: null })).toEqual({ timedOut: false, overflowed: false });
  });
});

describe.skipIf(!HAS_LEAN)('the scratch directory', () => {
  it('T-RUNNER-020 a workDir that is not a directory is a usage error', () => {
    // `ENOENT: mkdtemp '/nope/kiwa-lean-'` names a path the caller never wrote,
    // and does not say which option produced it.
    expect(() => verifyLeanSpec(output(), { workDir: '/definitely/not/a/dir/xyz' })).toThrow(
      UsageError,
    );
    expect(() => checkLeanTable(SPEC, { workDir: '/definitely/not/a/dir/xyz' })).toThrow(
      /workDir "\/definitely\/not\/a\/dir\/xyz"/,
    );
  });

  it('T-RUNNER-021 nothing is left behind, on success or on failure', () => {
    // A directory of its own: the OS temp directory is shared with every other
    // test file running beside this one, and counting what is in it counts them.
    const workDir = mkdtempSync(join(tmpdir(), 'kiwa-lean-runner-test-'));
    try {
      verifyLeanSpec(output(), { workDir });
      verifyLeanSpec(output(), { workDir, timeoutMs: 1 });
      checkLeanTable(SPEC, { workDir });
      const broken = generateLeanSpec(SPEC);
      verifyLeanSpec([{ ...broken, source: 'namespace Probe\ndef bad : Nat := "x"\nend Probe\n' }], {
        workDir,
      });

      expect(readdirSync(workDir)).toEqual([]);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  });
});
