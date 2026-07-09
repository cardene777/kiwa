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
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { generateLeanSpec } from '../src/generator.js';
import { generateLakeProject } from '../src/lake.js';
import { verifyLeanSpec } from '../src/verify.js';
import type { OrchestratorSpec } from '../src/types.js';

function installed(bin: string): boolean {
  try {
    execFileSync(bin, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

const HAS_LEAN = installed('lean');
const HAS_LAKE = installed('lake');

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
  sinkStates: [],
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

  it('T-LEAN-103 the lean-toolchain file decides which Lean runs, so verify writes one', () => {
    // It is the only file the scratch directory needs. Naming a version that does
    // not exist must fail rather than fall back to whatever is installed; if it
    // passed, nothing would be pinning anything.
    const result = verifyLeanSpec([generateLeanSpec(SESSION)], {
      leanToolchain: 'leanprover/lean4:v0.0.0-does-not-exist',
    });

    expect(result.status).toBe('verification-failed');
    expect(result.diagnostics).toContain('no such release');
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

  it('T-LEAN-112 a falsified can-leave witness fails to prove', () => {
    // `authed + auth-succeeded` is rejected, so it escapes nowhere.
    const source = generateLeanSpec(SESSION).source.replace(
      'theorem authed_can_leave : ∃ e, escapes .Authed e = true :=\n  ⟨.SessionExpired, rfl⟩',
      'theorem authed_can_leave : ∃ e, escapes .Authed e = true :=\n  ⟨.AuthSucceeded, rfl⟩',
    );
    expect(source).toContain('⟨.AuthSucceeded, rfl⟩');

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

describe.skipIf(!HAS_LEAN)('Lean checks the sink theorems', () => {
  const JOB: OrchestratorSpec = {
    moduleName: 'JobOrchestrator',
    namespace: 'Job',
    states: ['queued', 'dlq', 'completed'],
    events: ['start', 'succeed', 'inspect', 'timeout'],
    unspecified: 'invalid',
    transitions: [
      { from: 'queued', event: 'start', to: 'queued' },
      { from: 'queued', event: 'succeed', to: 'completed' },
      { from: 'queued', event: 'timeout', to: 'dlq' },
      { from: 'dlq', event: 'inspect', to: 'dlq' },
    ],
  };

  it('T-LEAN-140 a spec with a sink verifies', () => {
    const out = generateLeanSpec(JOB);
    expect(out.meta.sinkStates).toEqual(['dlq']);
    expect(verifyLeanSpec([out]).status).toBe('ok');
  });

  it('T-LEAN-141 claiming a sink can leave fails to prove', () => {
    const source = generateLeanSpec(JOB).source.replace(
      'theorem dlq_no_escape : ∀ e, escapes .Dlq e = false := by\n  intro e; cases e <;> rfl',
      'theorem dlq_can_leave : ∃ e, escapes .Dlq e = true :=\n  ⟨.Inspect, rfl⟩',
    );
    expect(source).toContain('dlq_can_leave');

    const { ok, diagnostics } = checkSource(source);

    expect(ok).toBe(false);
    expect(diagnostics).toContain('type mismatch');
  });

  it('T-LEAN-142 claiming an escapable state is a sink fails to prove', () => {
    const source = generateLeanSpec(JOB).source.replace(
      /theorem queued_can_leave[\s\S]*?\n\n/,
      'theorem queued_no_escape : ∀ e, escapes .Queued e = false := by\n  intro e; cases e <;> rfl\n\n',
    );
    expect(source).toContain('queued_no_escape');

    const { ok, diagnostics } = checkSource(source);

    expect(ok).toBe(false);
    expect(diagnostics).toContain("tactic 'rfl' failed");
  });

  it('T-LEAN-144 a one-state sink verifies, though its steps definition goes unused', () => {
    const solo = generateLeanSpec({
      moduleName: 'SoloOrchestrator',
      namespace: 'Solo',
      states: ['idle'],
      events: ['ping'],
      unspecified: 'invalid',
      initial: 'idle',
      transitions: [{ from: 'idle', event: 'ping', to: 'idle' }],
    });
    expect(solo.source).toContain('def steps');
    expect(solo.source).not.toContain('_reachable');
    expect(verifyLeanSpec([solo]).status).toBe('ok');
  });

  it('T-LEAN-143 a self-loop does not escape, and Lean computes that', () => {
    const source = `${generateLeanSpec(JOB).source.replace(/\nend Job\n$/, '')}
theorem self_loop_does_not_escape : escapes .Queued .Start = false := rfl
theorem real_move_escapes : escapes .Queued .Succeed = true := rfl

end Job
`;
    expect(checkSource(source).ok).toBe(true);
  });
});

describe.skipIf(!HAS_LEAN)('Lean checks the reachability witnesses', () => {
  const REACHABLE: OrchestratorSpec = {
    ...SESSION,
    moduleName: 'ReachableOrchestrator',
    namespace: 'Reachable',
    initial: 'init',
  };

  it('T-LEAN-130 a spec with reachability theorems verifies', () => {
    const out = generateLeanSpec(REACHABLE);
    expect(out.source).toContain('_reachable');
    expect(verifyLeanSpec([out]).status).toBe('ok');
  });

  it('T-LEAN-131 a witness path that does not lead there fails to prove', () => {
    // `authed` is reached by AuthSucceeded. Claim Timeout gets there instead.
    const source = generateLeanSpec(REACHABLE).source.replace(
      'theorem authed_reachable : steps .Init [.AuthSucceeded] = .to .Authed := rfl',
      'theorem authed_reachable : steps .Init [.Timeout] = .to .Authed := rfl',
    );
    expect(source).toContain('steps .Init [.Timeout] = .to .Authed');

    const { ok, diagnostics } = checkSource(source);

    expect(ok).toBe(false);
    expect(diagnostics).toContain('error');
  });

  it('T-LEAN-132 a path through a rejected cell fails to prove', () => {
    // SessionExpired is rejected in Init, so no path may start with it.
    const source = generateLeanSpec(REACHABLE).source.replace(
      'theorem authed_reachable : steps .Init [.AuthSucceeded] = .to .Authed := rfl',
      'theorem authed_reachable : steps .Init [.SessionExpired, .AuthSucceeded] = .to .Authed := rfl',
    );
    expect(checkSource(source).ok).toBe(false);
  });
});

describe.skipIf(HAS_LEAN)('without a toolchain', () => {
  it('T-LEAN-120 verification reports lean-not-installed rather than passing', () => {
    const result = verifyLeanSpec([generateLeanSpec(SESSION)]);
    expect(result.status).toBe('lean-not-installed');
  });
});

/**
 * The Lake project is what a caller checks into a repository, so `lake build` is
 * the command that will run against it. It used to report success on a project
 * whose specs did not compile, because the library was not a default target and
 * nothing imported the specs.
 */
describe.skipIf(!HAS_LAKE)('the generated Lake project builds the specs inside it', () => {
  const BROKEN = 'namespace Broken\ndef bad : Nat := "not a number"\nend Broken\n';

  interface BuildResult {
    status: number;
    output: string;
  }

  /** Write a Lake project holding one spec module, then build it. */
  function buildProject(specSource: string, modules: readonly string[] = []): BuildResult {
    const root = mkdtempSync(join(tmpdir(), 'kiwa-lake-'));
    try {
      const lake = generateLakeProject({
        packageName: 'probe',
        rootNamespace: 'KiwaSpecs',
        modules,
      });
      for (const [rel, content] of Object.entries(lake.files)) {
        const abs = resolve(root, rel);
        mkdirSync(dirname(abs), { recursive: true });
        writeFileSync(abs, content, 'utf-8');
      }
      const specPath = resolve(root, 'KiwaSpecs/Spec.lean');
      mkdirSync(dirname(specPath), { recursive: true });
      writeFileSync(specPath, specSource, 'utf-8');

      const result = execFileSync('lake', ['build'], {
        cwd: root,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
        timeout: 240_000,
      });
      return { status: 0, output: result };
    } catch (err) {
      const e = err as { status?: number; stdout?: Buffer; stderr?: Buffer };
      return {
        status: e.status ?? -1,
        output: `${e.stdout?.toString('utf-8') ?? ''}${e.stderr?.toString('utf-8') ?? ''}`,
      };
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  }

  it('T-LEAN-150 a project holding a generated spec builds', () => {
    const spec = generateLeanSpec(SESSION);
    expect(buildProject(spec.source).status).toBe(0);
  });

  it('T-LEAN-151 a project holding a broken spec fails, even with nothing importing it', () => {
    const result = buildProject(BROKEN);
    expect(result.status).not.toBe(0);
    expect(result.output).toContain('Spec.lean');
    expect(result.output).toContain('error');
  });

  it('T-LEAN-152 a broken spec named in the root module also fails', () => {
    const result = buildProject(BROKEN, ['Spec']);
    expect(result.status).not.toBe(0);
  });

  it('T-LEAN-153 a spec with a missing cell fails the build, not just a direct lean call', () => {
    const source = generateLeanSpec(SESSION)
      .source.split('\n')
      .filter((line) => !(line.includes('.Authed,') && line.includes('.Timeout')))
      .join('\n');

    const result = buildProject(source);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain('missing cases');
  });
});
