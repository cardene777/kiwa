/**
 * @kiwa-lab/lean — Lean 4 spec generator for lifecycle-orchestrator state machines.
 *
 * A state machine is written once as an `OrchestratorSpec` and compiled to Lean 4,
 * where the transition table becomes a total function and Lean's own exhaustiveness
 * checker is what establishes that no cell is missing.
 *
 * Two layers drive the same table:
 * - the Lean spec proves properties of the table before any code runs
 * - the TypeScript implementation runs it
 */

/** A cell that moves the machine from `from` to `to` when `event` arrives. */
export interface ValidTransition {
  from: string;
  event: string;
  /** May equal `from`: a self-loop is a decision, not an omission. */
  to: string;
}

/**
 * A cell the machine rejects.
 *
 * This is distinct from a self-loop. `{ from: 'active', event: 'query', to: 'active' }`
 * says the event is expected and changes nothing; `{ from: 'active', event: 'commit',
 * invalid: true }` says the event must never arrive in this state. Collapsing the two
 * hides the second one, which is the bug the machine exists to surface.
 */
export interface InvalidTransition {
  from: string;
  event: string;
  invalid: true;
}

export type Transition = ValidTransition | InvalidTransition;

export function isInvalid(t: Transition): t is InvalidTransition {
  return (t as InvalidTransition).invalid === true;
}

/**
 * What to do with a `(state, event)` cell the spec never mentions.
 *
 * `error` — refuse to generate, and name the cells. The default. An unmentioned
 * cell is a cell nobody decided about, and the whole point of writing the table
 * down is to have decided.
 *
 * `invalid` — treat it as rejected. Choose this when the table is large and most
 * of it is rejection, and say so out loud by passing the option.
 */
export type UnspecifiedPolicy = 'error' | 'invalid';

export interface OrchestratorSpec {
  /** Snake-case module name, becomes the Lean file basename. */
  moduleName: string;
  /** Human-readable orchestrator name for the Lean namespace. */
  namespace: string;
  /** Each state maps to a Lean inductive constructor. */
  states: readonly string[];
  /** Each event maps to a Lean inductive constructor. */
  events: readonly string[];
  /**
   * The transition table. Every `(state, event)` cell must appear, either as a
   * target or as an explicit rejection, unless `unspecified` says otherwise.
   */
  transitions: readonly Transition[];
  /** How to treat cells the table never mentions. Default: `error`. */
  unspecified?: UnspecifiedPolicy;
}

export interface LeanSpecOutput {
  /** Lean 4 source content (single file). */
  source: string;
  /** Suggested file path relative to the Lake project root. */
  path: string;
  /** Metadata for downstream tooling. */
  meta: {
    stateCount: number;
    eventCount: number;
    cellCount: number;
    validTransitionCount: number;
    invalidTransitionCount: number;
    /** States from which no event leads anywhere. Each gets an absorbing theorem. */
    terminalStates: readonly string[];
  };
}
