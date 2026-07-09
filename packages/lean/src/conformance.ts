/**
 * Check that an implementation agrees with the spec, cell by cell.
 *
 * The Lean spec and the running code are supposed to be driven by one table.
 * That was written down and nothing checked it: either side could change a cell
 * and no test would notice, which is the shape of gap this package exists to
 * close.
 *
 * This walks all `states × events` cells, asks the implementation what it does
 * with each one, and reports where the two disagree. It knows nothing about how
 * an implementation is written — the caller supplies a function that puts the
 * machine in a state, feeds it an event, and says where it landed.
 */

import { UsageError } from './errors.js';
import { cellKey, resolveTable } from './table.js';
import type { OrchestratorSpec } from './types.js';

/** What an implementation did with one cell. */
export type Observation =
  | { kind: 'to'; state: string }
  | { kind: 'rejected' };

/**
 * Put the machine in `state`, feed it `event`, and say what happened.
 *
 * Return `{ kind: 'rejected' }` when the implementation refuses the event, by
 * whatever means it refuses: throwing, returning a marker, leaving the state
 * untouched and logging. Deciding what counts as a refusal is the caller's, since
 * only they know what their code does when it disagrees with its input.
 */
export type Observe = (state: string, event: string) => Observation;

export type DisagreementKind =
  /** The spec names a target; the implementation refused the event. */
  | 'impl-rejects'
  /** The spec refuses the event; the implementation took it somewhere. */
  | 'impl-accepts'
  /** Both accept, and they land in different states. */
  | 'different-target'
  /** The implementation landed somewhere the spec has never heard of. */
  | 'unknown-state';

export interface Disagreement {
  state: string;
  event: string;
  kind: DisagreementKind;
  /** The target the spec names, or `null` when it refuses the cell. */
  spec: string | null;
  /** Where the implementation landed, or `null` when it refused. */
  impl: string | null;
  /** One sentence, in the terms the caller uses. */
  message: string;
}

export interface ConformanceReport {
  ok: boolean;
  /** Cells examined: `states × events`. */
  checked: number;
  /** Cells where both move the machine to the same state. */
  agreedTransitions: number;
  /** Cells both refuse. */
  agreedRejections: number;
  disagreements: readonly Disagreement[];
}

/**
 * Compare an implementation against a spec.
 *
 * Every cell is asked about, including the ones the spec refuses: an
 * implementation that quietly accepts an event the spec calls impossible is the
 * more dangerous half of the disagreement, and it is the half a test written from
 * the spec's happy path never reaches.
 */
export function checkConformance(spec: OrchestratorSpec, observe: Observe): ConformanceReport {
  const table = resolveTable(spec, 'checkConformance');
  const disagreements: Disagreement[] = [];
  let agreedTransitions = 0;
  let agreedRejections = 0;

  for (const state of spec.states) {
    for (const event of spec.events) {
      const expected = table.get(cellKey(state, event)) ?? null;
      const actual = asObservation(observe(state, event), state, event);

      if (actual.kind === 'rejected') {
        if (expected === null) agreedRejections += 1;
        else
          disagreements.push({
            state,
            event,
            kind: 'impl-rejects',
            spec: expected,
            impl: null,
            message: `${state} + ${event}: the spec goes to ${expected}, the implementation refuses the event`,
          });
        continue;
      }

      if (!spec.states.includes(actual.state)) {
        disagreements.push({
          state,
          event,
          kind: 'unknown-state',
          spec: expected,
          impl: actual.state,
          message: `${state} + ${event}: the implementation goes to ${actual.state}, which is not a state of this machine`,
        });
        continue;
      }

      if (expected === null) {
        disagreements.push({
          state,
          event,
          kind: 'impl-accepts',
          spec: null,
          impl: actual.state,
          message: `${state} + ${event}: the spec refuses the event, the implementation goes to ${actual.state}`,
        });
        continue;
      }

      if (actual.state !== expected) {
        disagreements.push({
          state,
          event,
          kind: 'different-target',
          spec: expected,
          impl: actual.state,
          message: `${state} + ${event}: the spec goes to ${expected}, the implementation goes to ${actual.state}`,
        });
        continue;
      }

      agreedTransitions += 1;
    }
  }

  return {
    ok: disagreements.length === 0,
    checked: spec.states.length * spec.events.length,
    agreedTransitions,
    agreedRejections,
    disagreements,
  };
}

/**
 * An observer that returns something other than an `Observation` is broken, and
 * the machine it was observing is not.
 *
 * Without this, `{ kind: 'to' }` with no state read as a state named `undefined`,
 * and every cell came back as `unknown-state`: a report blaming an implementation
 * for what the observer did. TypeScript says the shape; a caller who is not using
 * TypeScript gets the same answer, one call earlier.
 */
function asObservation(value: unknown, state: string, event: string): Observation {
  const where = `checkConformance: observing ${state} + ${event}`;
  if (value === null || typeof value !== 'object') {
    throw new UsageError(`${where}: the observer returned ${String(value)}, not an Observation`);
  }
  const observation = value as { kind?: unknown; state?: unknown };
  if (observation.kind === 'rejected') return { kind: 'rejected' };
  if (observation.kind === 'to') {
    if (typeof observation.state !== 'string') {
      throw new UsageError(`${where}: the observer returned { kind: 'to' } with no state`);
    }
    return { kind: 'to', state: observation.state };
  }
  throw new UsageError(
    `${where}: the observer returned kind ${JSON.stringify(observation.kind)}; ` +
      "expected 'to' or 'rejected'",
  );
}

/**
 * How many disagreements a failure message prints before it stops.
 *
 * A machine with twenty states and twenty events disagreeing everywhere prints
 * four hundred lines, and nobody reads the four hundredth. The full list is on
 * `report.disagreements`, which is what a program should be reading anyway.
 */
const MAX_REPORTED_DISAGREEMENTS = 20;

/** Render a report for a test failure message, one disagreement per line. */
export function formatConformance(spec: OrchestratorSpec, report: ConformanceReport): string {
  if (report.ok) {
    return `${spec.namespace}: ${report.checked} cells agree (${report.agreedTransitions} transitions, ${report.agreedRejections} rejections)`;
  }
  const shown = report.disagreements.slice(0, MAX_REPORTED_DISAGREEMENTS);
  const lines = shown.map((d) => `  ${d.message}`);
  const hidden = report.disagreements.length - shown.length;
  if (hidden > 0) lines.push(`  ...and ${hidden} more, in report.disagreements`);

  return `${spec.namespace}: ${report.disagreements.length} of ${report.checked} cells disagree\n${lines.join('\n')}`;
}
