/**
 * The transition table, resolved from a spec.
 *
 * Both the Lean generator and the conformance check need to know what the table
 * says about every cell. Reading the spec twice, in two places, is how the two
 * readings drift: one learns about a new policy and the other does not. They read
 * it here.
 */

import { isInvalid, type OrchestratorSpec, type Transition } from './types.js';

/** `null` marks a rejected cell; a string is the target state. */
export type Table = ReadonlyMap<string, string | null>;

export const cellKey = (state: string, event: string): string => `${state}::${event}`;

/** How many undeclared cells to name before saying "and N more". */
const MAX_REPORTED_CELLS = 8;

export class SpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpecError';
  }
}

/**
 * Read the table a spec declares, applying its `unspecified` policy.
 *
 * `origin` names the caller in the errors, since a spec rejected by
 * `generateLeanSpec` and a spec rejected by `checkConformance` are rejected for
 * the same reasons and the reader wants to know which one is speaking.
 */
export function resolveTable(spec: OrchestratorSpec, origin: string): Table {
  const { states, events, transitions, unspecified = 'error' } = spec;

  if (states.length === 0) throw new SpecError(`${origin}: at least one state is required`);
  if (events.length === 0) throw new SpecError(`${origin}: at least one event is required`);

  const table = declared(states, events, transitions, origin);
  const undeclared = findUndeclared(states, events, table);
  if (undeclared.length > 0) {
    if (unspecified === 'error') throw undeclaredError(undeclared, origin);
    for (const cell of undeclared) table.set(cell, null);
  }
  return table;
}

/** States from which no event leads anywhere. */
export function terminalStates(spec: OrchestratorSpec, table: Table): string[] {
  return spec.states.filter((state) =>
    spec.events.every((event) => table.get(cellKey(state, event)) === null),
  );
}

/**
 * States that accept events and never leave, because every valid cell loops back.
 * Not terminal, since they answer events, and not escapable either.
 */
export function sinkStates(spec: OrchestratorSpec, table: Table): string[] {
  const terminal = terminalStates(spec, table);
  return spec.states.filter(
    (state) =>
      !terminal.includes(state) &&
      spec.events.every((event) => {
        const target = table.get(cellKey(state, event));
        return target === null || target === undefined || target === state;
      }),
  );
}

function declared(
  states: readonly string[],
  events: readonly string[],
  transitions: readonly Transition[],
  origin: string,
): Map<string, string | null> {
  const table = new Map<string, string | null>();
  for (const t of transitions) {
    if (!states.includes(t.from)) {
      throw new SpecError(`${origin}: unknown state in transition.from: ${t.from}`);
    }
    if (!events.includes(t.event)) {
      throw new SpecError(`${origin}: unknown event in transition.event: ${t.event}`);
    }
    const key = cellKey(t.from, t.event);
    if (table.has(key)) {
      throw new SpecError(`${origin}: duplicate transition ${key}`);
    }
    if (isInvalid(t)) {
      table.set(key, null);
      continue;
    }
    if (!states.includes(t.to)) {
      throw new SpecError(`${origin}: unknown state in transition.to: ${t.to}`);
    }
    table.set(key, t.to);
  }
  return table;
}

function findUndeclared(
  states: readonly string[],
  events: readonly string[],
  table: Table,
): string[] {
  const missing: string[] = [];
  for (const state of states) {
    for (const event of events) {
      const key = cellKey(state, event);
      if (!table.has(key)) missing.push(key);
    }
  }
  return missing;
}

/**
 * Undeclared cells are named, because "the table is incomplete" is not actionable
 * and "beginning + query-executed is undecided" is.
 */
function undeclaredError(undeclared: readonly string[], origin: string): SpecError {
  const shown = undeclared
    .slice(0, MAX_REPORTED_CELLS)
    .map((cell) => `  ${cell.replace('::', ' + ')}`)
    .join('\n');
  const rest =
    undeclared.length > MAX_REPORTED_CELLS
      ? `\n  ...and ${undeclared.length - MAX_REPORTED_CELLS} more`
      : '';
  return new SpecError(
    `${origin}: ${undeclared.length} (state, event) cell(s) are undeclared:\n${shown}${rest}\n\n` +
      'Give each a target, or mark it { invalid: true }. Pass `unspecified: "invalid"` ' +
      'to reject every unmentioned cell instead.',
  );
}
