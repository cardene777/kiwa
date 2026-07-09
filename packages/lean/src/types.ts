/**
 * @kiwa-lab/lean v0.1 = Lean 4 spec generator for lifecycle-orchestrator state machines.
 *
 * Converts kiwa's depth-5 pattern SSOT (5 state + 8 event + 40-cell transition) to
 * Lean 4 inductive type + total dispatch function + coverage theorem.
 *
 * Enables formal verification-driven testing alongside runtime testing:
 * - Lean spec = specification-level SSOT with type-level totality proof
 * - TypeScript impl = runtime behavior with vitest testing
 * - Both share the same 5 state + 8 event + 40-cell definition
 */

export interface OrchestratorSpec {
  /** Snake-case module name, becomes the Lean file basename */
  moduleName: string;
  /** Human-readable orchestrator name for the Lean namespace */
  namespace: string;
  /** 5 state SSOT — each maps to a Lean inductive constructor */
  states: readonly string[];
  /** 8 event SSOT — each maps to a Lean inductive constructor */
  events: readonly string[];
  /**
   * 40-cell transition table SSOT — each (state, event) pair defines the
   * result state (may equal current state for self-loop / stay).
   * Omit a pair to mark the transition as `invalid` (falls through to the
   * generated `invalidTransition` case in Lean).
   */
  transitions: ReadonlyArray<{
    from: string;
    event: string;
    to: string;
  }>;
}

export interface LeanSpecOutput {
  /** Lean 4 source content (single file) */
  source: string;
  /** Suggested file path relative to the Lake project root */
  path: string;
  /** Metadata for downstream tooling */
  meta: {
    stateCount: number;
    eventCount: number;
    cellCount: number;
    validTransitionCount: number;
    invalidTransitionCount: number;
  };
}
