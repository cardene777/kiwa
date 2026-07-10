/**
 * The Lean spec and the running code are supposed to be driven by one table.
 *
 * That was written down — "同 SSOT = TypeScript impl と Lean spec は 同じ 5 state /
 * 8 event / 40 cell definition を共有" — and nothing checked it. Either side
 * could change a cell and every test would still pass.
 *
 * This walks all 40 cells of each machine, in the real implementation, and
 * compares them with the spec the Lean file is generated from. 200 cells across
 * five machines.
 */

import { execFileSync } from 'node:child_process';
import { describe, expect, it } from 'vitest';
import {
  checkConformance,
  checkLeanTable,
  checkLeanTableAsync,
  formatConformance,
  type Observation,
} from '@kiwa-lab/lean';
import { semantics as authSemantics } from '@kiwa-lab/auth';
import { dispatchCacheEvent, startCache } from '@kiwa-lab/cache';
import { dispatchCliEvent, startCli } from '@kiwa-lab/cli-test';
import { dispatchTransactionEvent, startTransaction } from '@kiwa-lab/orm';
import { dispatchJobEvent, startJob } from '@kiwa-lab/queue';
import {
  CACHE_SPEC,
  CLI_SPEC,
  JOB_SPEC,
  SESSION_SPEC,
  TRANSACTION_SPEC,
} from '../src/orchestrator-specs.js';

const TIMESTAMP = '2026-01-01T00:00:00Z';

/**
 * Every implementation has the same shape: a session object carrying `state` and
 * an `events` log, and a reducer over it. A refused event leaves the state alone
 * and appends a marker — `invalid:` in a non-terminal state, `terminal:` in one
 * that accepts nothing. Reading the marker is how this test learns the
 * implementation refused, and it is the only thing here that knows how these
 * implementations are written.
 */
interface Session {
  state: string;
  events: string[];
}

function observer<S extends Session>(
  start: (input: { timestamp: string }) => S,
  dispatch: (input: { session: S; event: never; timestamp: string }) => S,
): (state: string, event: string) => Observation {
  return (state, event) => {
    const session = { ...start({ timestamp: TIMESTAMP }), state } as S;
    const before = session.events.length;
    const next = dispatch({ session, event: event as never, timestamp: TIMESTAMP });
    const appended = next.events.slice(before);
    const refused = appended.some((e) => e.startsWith('invalid:') || e.startsWith('terminal:'));

    return refused ? { kind: 'rejected' } : { kind: 'to', state: next.state };
  };
}

const MACHINES = [
  {
    spec: TRANSACTION_SPEC,
    observe: observer(startTransaction, dispatchTransactionEvent),
    valid: 14,
  },
  {
    spec: SESSION_SPEC,
    observe: observer(authSemantics.startSession, authSemantics.dispatchSessionEvent),
    valid: 12,
  },
  { spec: CACHE_SPEC, observe: observer(startCache, dispatchCacheEvent), valid: 15 },
  { spec: JOB_SPEC, observe: observer(startJob, dispatchJobEvent), valid: 10 },
  { spec: CLI_SPEC, observe: observer(startCli, dispatchCliEvent), valid: 12 },
] as const;

describe('the implementation and the Lean spec are driven by one table', () => {
  it.each(MACHINES.map((m) => [m.spec.namespace, m] as const))(
    '%s: all 40 cells agree',
    (_name, machine) => {
      const report = checkConformance(machine.spec, machine.observe);

      // The message carries every disagreeing cell, so a failure says which.
      expect(formatConformance(machine.spec, report)).toContain('cells agree');
      expect(report.ok).toBe(true);
      expect(report.checked).toBe(40);
    },
  );

  it.each(MACHINES.map((m) => [m.spec.namespace, m] as const))(
    '%s: the valid transitions are the ones the spec counts',
    (_name, machine) => {
      const report = checkConformance(machine.spec, machine.observe);

      expect(report.agreedTransitions).toBe(machine.valid);
      expect(report.agreedRejections).toBe(40 - machine.valid);
    },
  );

  it('200 cells across the five machines, and none of them drift', () => {
    const reports = MACHINES.map((m) => checkConformance(m.spec, m.observe));
    const checked = reports.reduce((sum, r) => sum + r.checked, 0);
    const disagreements = reports.flatMap((r) => r.disagreements);

    expect(checked).toBe(200);
    expect(disagreements).toEqual([]);
  });

  it('a spec that has drifted from its implementation is caught', () => {
    // The check must be able to fail, or it is decoration. Move one cell of the
    // transaction table and the implementation stops agreeing with it.
    const drifted = {
      ...TRANSACTION_SPEC,
      transitions: TRANSACTION_SPEC.transitions.map((t) =>
        t.from === 'active' && t.event === 'commit-requested' ? { ...t, to: 'aborted' } : t,
      ),
    };

    const report = checkConformance(drifted, MACHINES[0].observe);

    expect(report.ok).toBe(false);
    expect(report.disagreements).toHaveLength(1);
    expect(report.disagreements[0]).toMatchObject({
      state: 'active',
      event: 'commit-requested',
      kind: 'different-target',
      spec: 'aborted',
      impl: 'committing',
    });
  });

  it('an implementation that accepts a rejected event is caught', () => {
    // The half a happy-path test never reaches: the machine takes an event the
    // spec says can never arrive.
    const permissive = (state: string, event: string): Observation =>
      state === 'aborted' ? { kind: 'to', state: 'active' } : MACHINES[0].observe(state, event);

    const report = checkConformance(TRANSACTION_SPEC, permissive);

    expect(report.ok).toBe(false);
    expect(report.disagreements.every((d) => d.kind === 'impl-accepts')).toBe(true);
    expect(report.disagreements).toHaveLength(8);
  });
});

function leanInstalled(): boolean {
  try {
    execFileSync('lean', ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Three things are supposed to agree: the spec, the implementation, and the Lean
 * file. The tests above tie the first two together. The third edge goes through
 * the generator, and the theorems cannot check it — they are derived from the
 * same table, so a cell rendered to the wrong target produces a file that
 * compiles and proves everything it claims.
 *
 * `checkLeanTable` makes Lean print the table it computes and compares it with
 * the spec, closing the triangle.
 */
describe.skipIf(!leanInstalled())('the Lean file holds the table the spec describes', () => {
  it.each(MACHINES.map((m) => [m.spec.namespace, m.spec] as const))(
    '%s: Lean computes the same 40 cells',
    (_name, spec) => {
      const report = checkLeanTable(spec);

      expect(report.status).toBe('ok');
      expect(report.disagreements).toEqual([]);
      expect(report.checked).toBe(40);
    },
    120_000,
  );

  it('the spec, the implementation, and the Lean file all agree, on 200 cells', async () => {
    // Five Lean processes, started together. Through `checkLeanTable` these run
    // one after another — a synchronous call gives no other option — and the same
    // five machines take about four times as long.
    const againstLean = await Promise.all(MACHINES.map(({ spec }) => checkLeanTableAsync(spec)));

    for (const [i, { spec, observe }] of MACHINES.entries()) {
      const againstCode = checkConformance(spec, observe);

      expect(formatConformance(spec, againstCode)).toContain('cells agree');
      expect(againstLean[i]?.status).toBe('ok');
      expect(againstLean[i]?.ok).toBe(true);
    }
  }, 300_000);

  it('the async check answers what the sync one answers, on every machine', async () => {
    // The reason to trust the concurrent run above.
    for (const { spec } of MACHINES) {
      const sync = checkLeanTable(spec);
      const async = await checkLeanTableAsync(spec);

      expect(async.status).toBe(sync.status);
      expect(async.ok).toBe(sync.ok);
      expect(async.checked).toBe(sync.checked);
      expect(async.disagreements).toEqual(sync.disagreements);
    }
  }, 300_000);
});
