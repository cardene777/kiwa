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

import { describe, expect, it } from 'vitest';
import { checkConformance, formatConformance, type Observation } from '@kiwa-lab/lean';
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
