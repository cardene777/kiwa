/**
 * The tests that run Lean.
 *
 * Everything else in this package checks the generated text against expectations
 * written by the same person who wrote the generator. These check it against
 * Lean, which does not care what anyone expected.
 *
 * They also check the negatives. A spec that verifies proves the generator emits
 * something Lean accepts; only a spec that *fails* to verify proves the theorems
 * carry information. `dispatch_total` passed on a table with no transitions at
 * all, which is why it was replaced.
 *
 * Skipped when no Lean toolchain is installed, so a contributor without one is
 * not blocked. A skipped check is reported as skipped, never as passed.
 */

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import { generateLeanSpec } from '../src/generator.js';
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

const SESSION: OrchestratorSpec = {
  moduleName: 'SessionOrchestrator',
  namespace: 'Session',
  states: ['init', 'authed', 'expired'],
  events: ['auth-succeeded', 'session-expired', 'timeout'],
  unspecified: 'invalid',
  transitions: [
    { from: 'init', event: 'auth-succeeded', to: 'authed' },
    { from: 'init', event: 'timeout', to: 'expired' },
    { from: 'authed', event: 'session-expired', to: 'expired' },
    { from: 'authed', event: 'timeout', to: 'expired' },
  ],
};

const PROBE_META = {
  stateCount: 0,
  eventCount: 0,
  cellCount: 0,
  validTransitionCount: 0,
  invalidTransitionCount: 0,
  terminalStates: [],
};

/** Feed Lean a source string directly, bypassing the spec type. */
function checkSource(source: string): { ok: boolean; diagnostics: string } {
  const result = verifyLeanSpec([{ source, path: 'Probe.lean', meta: PROBE_META }]);
  return { ok: result.status === 'ok', diagnostics: result.diagnostics ?? '' };
}

describe.skipIf(!HAS_LEAN)('the generated spec is accepted by Lean', () => {
  it('T-LEAN-100 a fully declared table verifies', () => {
    const result = verifyLeanSpec([generateLeanSpec(SESSION)]);
    expect(result.status).toBe('ok');
    expect(result.verifiedFiles).toEqual(['KiwaSpecs/SessionOrchestrator.lean']);
  });

  it('T-LEAN-101 several specs verify together', () => {
    const other: OrchestratorSpec = { ...SESSION, moduleName: 'Other', namespace: 'Other' };
    const result = verifyLeanSpec([generateLeanSpec(SESSION), generateLeanSpec(other)]);
    expect(result.status).toBe('ok');
    expect(result.verifiedFiles).toHaveLength(2);
  });

  it('T-LEAN-102 Lean is invoked as `lean <file>`, since it has no --check flag', () => {
    // The previous implementation passed --check, so Lean exited non-zero on
    // every file and reported a correct spec as a failing one.
    const out = execFileSync('lean', ['--help'], { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] });
    expect(out).not.toContain('--check');
  });
});

describe.skipIf(!HAS_LEAN)('Lean rejects what the theorems forbid', () => {
  it('T-LEAN-110 a missing cell fails, and Lean names it', () => {
    const source = generateLeanSpec(SESSION).source;
    const withoutCell = source
      .split('\n')
      .filter((line) => !(line.includes('.Authed,') && line.includes('.Timeout')))
      .join('\n');
    expect(withoutCell.split('\n')).toHaveLength(source.split('\n').length - 1);

    const { ok, diagnostics } = checkSource(withoutCell);

    expect(ok).toBe(false);
    expect(diagnostics).toContain('missing cases');
    expect(diagnostics).toContain('State.Authed, Event.Timeout');
  });

  it('T-LEAN-114 a failure carries what Lean said, not an empty string', () => {
    // Lean reports on stdout. Reading only stderr said "it failed" and nothing more.
    const source = generateLeanSpec(SESSION).source.replace('=> .to .Authed', '=> .invalid');
    const result = verifyLeanSpec([{ source, path: 'Probe.lean', meta: PROBE_META }]);

    expect(result.status).toBe('verification-failed');
    expect(result.diagnostics).not.toBe('');
    expect(result.diagnostics).toContain('error');
    expect(result.stderr).toBe('');
  });

  it('T-LEAN-111 a falsified absorbing theorem fails to prove', () => {
    // `expired` is terminal. Give it a way out without touching the theorem, and
    // the proof must stop being a proof.
    const source = generateLeanSpec(SESSION).source.replace(
      /(\| \.Expired,\s+\.Timeout\s+=> )\.invalid/,
      '$1.to .Init',
    );
    expect(source).toContain('=> .to .Init');

    const { ok, diagnostics } = checkSource(source);

    expect(ok).toBe(false);
    // Lean reports the goal it could not close rather than the theorem's name.
    expect(diagnostics).toContain("tactic 'rfl' failed");
    expect(diagnostics).toContain('dispatch State.Expired Event.Timeout');
    expect(diagnostics).toContain('Step.invalid');
  });

  it('T-LEAN-112 a falsified has-exit witness fails to prove', () => {
    const source = generateLeanSpec(SESSION).source.replace(
      '⟨.AuthSucceeded, .Authed, rfl⟩',
      '⟨.AuthSucceeded, .Expired, rfl⟩',
    );
    expect(source).toContain('⟨.AuthSucceeded, .Expired, rfl⟩');

    const { ok } = checkSource(source);

    expect(ok).toBe(false);
  });

  it('T-LEAN-113 the theorem the package used to emit proves nothing, and Lean agrees', () => {
    // Reconstructed here so the regression is visible: a machine with no
    // transitions at all satisfies `dispatch_total`.
    const vacuous = `namespace Vacuous
inductive State where
  | A : State
deriving DecidableEq, Repr

inductive Event where
  | E : Event
deriving DecidableEq, Repr

def dispatch : State → Event → State
  | s, _ => s

theorem dispatch_total (s : State) (e : Event) : ∃ s', dispatch s e = s' := by
  exact ⟨dispatch s e, rfl⟩

end Vacuous
`;
    expect(checkSource(vacuous).ok).toBe(true);
  });
});

describe.skipIf(HAS_LEAN)('without a toolchain', () => {
  it('T-LEAN-120 verification reports lean-not-installed rather than passing', () => {
    const result = verifyLeanSpec([generateLeanSpec(SESSION)]);
    expect(result.status).toBe('lean-not-installed');
  });
});
