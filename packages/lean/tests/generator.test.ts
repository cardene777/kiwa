import { describe, expect, it } from 'vitest';
import { generateLeanSpec } from '../src/generator.js';
import type { OrchestratorSpec, Transition } from '../src/types.js';

const STATES = ['beginning', 'active', 'savepoint-nested', 'committing', 'aborted'];
const EVENTS = [
  'begin-completed',
  'query-executed',
  'savepoint-created',
  'savepoint-released',
  'commit-requested',
  'commit-succeeded',
  'rollback-requested',
  'timeout',
];

const VALID: Transition[] = [
  { from: 'beginning', event: 'begin-completed', to: 'active' },
  { from: 'beginning', event: 'rollback-requested', to: 'aborted' },
  { from: 'beginning', event: 'timeout', to: 'aborted' },
  { from: 'active', event: 'query-executed', to: 'active' },
  { from: 'active', event: 'savepoint-created', to: 'savepoint-nested' },
  { from: 'active', event: 'commit-requested', to: 'committing' },
  { from: 'active', event: 'rollback-requested', to: 'aborted' },
  { from: 'active', event: 'timeout', to: 'aborted' },
  { from: 'savepoint-nested', event: 'query-executed', to: 'savepoint-nested' },
  { from: 'savepoint-nested', event: 'savepoint-released', to: 'active' },
  { from: 'savepoint-nested', event: 'rollback-requested', to: 'aborted' },
  { from: 'savepoint-nested', event: 'timeout', to: 'aborted' },
  { from: 'committing', event: 'commit-succeeded', to: 'committing' },
  { from: 'committing', event: 'timeout', to: 'aborted' },
];

/** The 26 cells the transaction machine rejects, written out rather than assumed. */
function rejectedCells(): Transition[] {
  const declared = new Set(VALID.map((t) => `${t.from}::${t.event}`));
  const rejected: Transition[] = [];
  for (const from of STATES) {
    for (const event of EVENTS) {
      if (!declared.has(`${from}::${event}`)) rejected.push({ from, event, invalid: true });
    }
  }
  return rejected;
}

const TXN_SPEC: OrchestratorSpec = {
  moduleName: 'TransactionOrchestrator',
  namespace: 'Transaction',
  states: STATES,
  events: EVENTS,
  transitions: [...VALID, ...rejectedCells()],
};

/** The same machine, leaning on the policy instead of writing the rejections out. */
const TXN_SPEC_LOOSE: OrchestratorSpec = {
  ...TXN_SPEC,
  transitions: VALID,
  unspecified: 'invalid',
};

describe('generateLeanSpec — types and table', () => {
  it('T-LEAN-001 emits the state inductive type', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('inductive State where');
    expect(out.source).toContain('  | Beginning : State');
    expect(out.source).toContain('  | SavepointNested : State');
    expect(out.source).toContain('  | Aborted : State');
  });

  it('T-LEAN-002 emits the event inductive type', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('inductive Event where');
    expect(out.source).toContain('  | BeginCompleted : Event');
    expect(out.source).toContain('  | Timeout : Event');
  });

  it('T-LEAN-003 emits a Step type that separates a next state from a rejection', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('inductive Step where');
    expect(out.source).toContain('  | to : State → Step');
    expect(out.source).toContain('  | invalid : Step');
    expect(out.source).toContain('def dispatch : State → Event → Step');
  });

  it('T-LEAN-004 lists every cell, so Lean checks exhaustiveness rather than a theorem', () => {
    const out = generateLeanSpec(TXN_SPEC);
    const arms = out.source.split('\n').filter((line) => /^ {2}\| \./.test(line));
    expect(arms).toHaveLength(40);
    expect(out.source).not.toContain('| s, _ => s');
  });

  it('T-LEAN-005 a rejected cell is emitted as .invalid, not as a self-loop', () => {
    const out = generateLeanSpec(TXN_SPEC);
    const arm = out.source
      .split('\n')
      .find((line) => line.includes('.Beginning,') && line.includes('.QueryExecuted'));
    expect(arm).toBeDefined();
    expect(arm).toContain('=> .invalid');
  });

  it('T-LEAN-006 a deliberate self-loop stays a transition to itself', () => {
    const out = generateLeanSpec(TXN_SPEC);
    const arm = out.source
      .split('\n')
      .find((line) => line.includes('.Active,') && line.includes('.QueryExecuted'));
    expect(arm).toContain('=> .to .Active');
  });

  it('T-LEAN-007 wraps output in the namespace', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('namespace Transaction');
    expect(out.source).toContain('end Transaction');
  });

  it('T-LEAN-008 reports 40 cells, the valid/rejected split, and the terminal states', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.meta).toEqual({
      stateCount: 5,
      eventCount: 8,
      cellCount: 40,
      validTransitionCount: 14,
      invalidTransitionCount: 26,
      terminalStates: ['aborted'],
    });
  });
});

describe('generateLeanSpec — theorems that can fail', () => {
  it('T-LEAN-020 a terminal state gets an absorbing theorem', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain(
      'theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .invalid := by',
    );
  });

  it('T-LEAN-021 a non-terminal state gets a has-exit theorem with a witness', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('theorem beginning_has_exit : ∃ e s, dispatch .Beginning e = .to s');
    expect(out.source).toContain('⟨.BeginCompleted, .Active, rfl⟩');
  });

  it('T-LEAN-022 a terminal state gets no has-exit theorem, and the reverse', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).not.toContain('aborted_has_exit');
    expect(out.source).not.toContain('beginning_absorbing');
  });

  it('T-LEAN-023 theorem names are Lean identifiers, so hyphens become underscores', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('theorem savepoint_nested_has_exit');
    expect(out.source).not.toContain('savepoint-nested_has_exit');
  });

  it('T-LEAN-024 the old vacuous totality theorem is gone', () => {
    // `∃ s', dispatch s e = s'` is provable by rfl for any function, so it said
    // nothing about the table. It passed on a spec with zero transitions.
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).not.toContain('dispatch_total');
    expect(out.source).not.toContain('exact ⟨dispatch s e, rfl⟩');
  });

  it('T-LEAN-025 a machine with no valid transition is all-terminal', () => {
    const out = generateLeanSpec({
      moduleName: 'Dead',
      namespace: 'Dead',
      states: ['a', 'b'],
      events: ['e'],
      transitions: [],
      unspecified: 'invalid',
    });
    expect(out.meta.terminalStates).toEqual(['a', 'b']);
    expect(out.source).toContain('theorem a_absorbing');
    expect(out.source).toContain('theorem b_absorbing');
    expect(out.source).not.toContain('_has_exit');
  });
});

describe('generateLeanSpec — an undeclared cell is a cell nobody decided about', () => {
  it('T-LEAN-030 refuses a table with an undeclared cell, by default', () => {
    const spec: OrchestratorSpec = { ...TXN_SPEC, transitions: VALID };
    expect(() => generateLeanSpec(spec)).toThrow(/26 \(state, event\) cell\(s\) are undeclared/);
  });

  it('T-LEAN-031 names the undeclared cells rather than only counting them', () => {
    const spec: OrchestratorSpec = {
      moduleName: 'M',
      namespace: 'M',
      states: ['a', 'b'],
      events: ['e'],
      transitions: [{ from: 'a', event: 'e', to: 'b' }],
    };
    expect(() => generateLeanSpec(spec)).toThrow(/b \+ e/);
  });

  it('T-LEAN-032 stops naming cells after a handful, and says how many are left', () => {
    const spec: OrchestratorSpec = { ...TXN_SPEC, transitions: VALID };
    expect(() => generateLeanSpec(spec)).toThrow(/\.\.\.and 18 more/);
  });

  it('T-LEAN-033 the invalid policy accepts the same table and rejects those cells', () => {
    const loose = generateLeanSpec(TXN_SPEC_LOOSE);
    const explicit = generateLeanSpec(TXN_SPEC);
    expect(loose.source).toBe(explicit.source);
  });

  it('T-LEAN-034 a fully declared table needs no policy', () => {
    expect(() => generateLeanSpec(TXN_SPEC)).not.toThrow();
  });
});

describe('generateLeanSpec — input validation', () => {
  it('T-LEAN-040 rejects an unknown state in transition.to', () => {
    const spec: OrchestratorSpec = {
      ...TXN_SPEC,
      transitions: [{ from: 'beginning', event: 'begin-completed', to: 'nowhere' }],
      unspecified: 'invalid',
    };
    expect(() => generateLeanSpec(spec)).toThrow(/unknown state.*transition\.to/);
  });

  it('T-LEAN-041 rejects an unknown state in transition.from', () => {
    const spec: OrchestratorSpec = {
      ...TXN_SPEC,
      transitions: [{ from: 'nowhere', event: 'timeout', to: 'aborted' }],
      unspecified: 'invalid',
    };
    expect(() => generateLeanSpec(spec)).toThrow(/unknown state.*transition\.from/);
  });

  it('T-LEAN-042 rejects an unknown event', () => {
    const spec: OrchestratorSpec = {
      ...TXN_SPEC,
      transitions: [{ from: 'active', event: 'nothing-happened', to: 'aborted' }],
      unspecified: 'invalid',
    };
    expect(() => generateLeanSpec(spec)).toThrow(/unknown event/);
  });

  it('T-LEAN-043 rejects a duplicate cell, including a valid one shadowing a rejection', () => {
    const dup: OrchestratorSpec = {
      ...TXN_SPEC,
      transitions: [
        { from: 'beginning', event: 'begin-completed', to: 'active' },
        { from: 'beginning', event: 'begin-completed', invalid: true },
      ],
      unspecified: 'invalid',
    };
    expect(() => generateLeanSpec(dup)).toThrow(/duplicate transition/);
  });

  it('T-LEAN-044 rejects an empty state or event list', () => {
    const base = { moduleName: 'M', namespace: 'M', transitions: [] };
    expect(() => generateLeanSpec({ ...base, states: [], events: ['e'] })).toThrow(/at least one state/);
    expect(() => generateLeanSpec({ ...base, states: ['a'], events: [] })).toThrow(/at least one event/);
  });
});
