/**
 * Run the generated artifacts against several Lean toolchains at once.
 *
 * Everything else here checks against whichever Lean is installed. That answers
 * "does it work on this machine", not "does it work on the machines other people
 * have". Lean rewords its diagnostics and changes its tactics between releases,
 * so a generator that emits proofs is exposed to both.
 *
 * Opt in by naming the versions, since each one is a separate toolchain download:
 *
 *   KIWA_LEAN_TOOLCHAINS=v4.12.0,v4.31.0 pnpm test
 *
 * Install them first with `elan toolchain install leanprover/lean4:<version>`.
 * Skipped otherwise, and a skip is not a pass.
 */

import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateLeanSpec } from '../src/generator.js';
import type { OrchestratorSpec } from '../src/types.js';

function elanInstalled(): boolean {
  try {
    execFileSync('elan', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const VERSIONS = (process.env.KIWA_LEAN_TOOLCHAINS ?? '')
  .split(',')
  .map((v) => v.trim())
  .filter((v) => v !== '');

const RUN = VERSIONS.length > 0 && elanInstalled();

const SESSION: OrchestratorSpec = {
  moduleName: 'SessionOrchestrator',
  namespace: 'Session',
  states: ['init', 'authed', 'expired'],
  events: ['auth-succeeded', 'session-expired', 'timeout'],
  unspecified: 'invalid',
  initial: 'init',
  terminal: ['expired'],
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'timeout', to: 'expired' },
  ],
};

interface Run {
  status: number;
  output: string;
}

/** Elaborate a source string with one named toolchain. */
function elaborate(version: string, source: string): Run {
  const dir = mkdtempSync(join(tmpdir(), 'kiwa-lean-versions-'));
  try {
    const file = resolve(dir, 'Spec.lean');
    writeFileSync(file, source, 'utf-8');
    execFileSync('elan', ['run', `leanprover/lean4:${version}`, 'lean', file], {
      cwd: dir,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 300_000,
    });
    return { status: 0, output: '' };
  } catch (err) {
    const e = err as { status?: number; stdout?: Buffer; stderr?: Buffer };
    return {
      status: e.status ?? -1,
      output: `${e.stdout?.toString('utf-8') ?? ''}${e.stderr?.toString('utf-8') ?? ''}`,
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const good = (): string => generateLeanSpec(SESSION).source;

/** Remove one cell, so the match is no longer exhaustive. */
const missingCell = (): string =>
  good()
    .split('\n')
    .filter((line) => !(line.includes('.Authed,') && line.includes('.Timeout')))
    .join('\n');

/** Give the terminal state a way out, so its absorbing theorem is false. */
const falsifiedAbsorbing = (): string =>
  good().replace(/(\| \.Expired,\s+\.Timeout\s+=> )\.invalid/, '$1.to .Init');

/** Point a reachability witness at a path that does not lead there. */
const falsifiedReachable = (): string =>
  good().replace(
    'theorem authed_reachable : steps .Init [.AuthSucceeded] = .to .Authed := rfl',
    'theorem authed_reachable : steps .Init [.Timeout] = .to .Authed := rfl',
  );

describe.skipIf(!RUN)('the generated spec means the same thing to every Lean', () => {
  it.each(VERSIONS)('T-LEAN-200 %s accepts a complete table', (version) => {
    expect(elaborate(version, good()).status).toBe(0);
  });

  it.each(VERSIONS)('T-LEAN-201 %s rejects a missing cell, and names it', (version) => {
    const result = elaborate(version, missingCell());
    expect(result.status).not.toBe(0);
    // The prose moved from `missing cases` to `Missing cases` in v4.23. The
    // constructors it echoes did not move.
    expect(result.output).toMatch(/missing cases/i);
    expect(result.output).toContain('State.Authed, Event.Timeout');
  });

  it.each(VERSIONS)('T-LEAN-202 %s rejects a false absorbing theorem', (version) => {
    const result = elaborate(version, falsifiedAbsorbing());
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('dispatch State.Expired Event.Timeout');
    expect(result.output).toContain('Step.invalid');
  });

  it.each(VERSIONS)('T-LEAN-203 %s rejects a false reachability witness', (version) => {
    const result = elaborate(version, falsifiedReachable());
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('steps State.Init [Event.Timeout]');
    expect(result.output).toContain('Step.to State.Authed');
  });
});
