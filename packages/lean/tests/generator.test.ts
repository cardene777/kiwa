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
    // `escapes` matches on Step below, so count only the arms of `dispatch`.
    const body = out.source.split('def dispatch : State → Event → Step\n')[1]?.split('\n\n')[0] ?? '';
    const arms = body.split('\n').filter((line) => /^ {2}\| \./.test(line));
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

  it('T-LEAN-007 wraps output in the namespace, written so Lean reads it as a name', () => {
    // A namespace called `end` would close the block that opens it, and sixty-five
    // of eighty candidate keywords broke the file. Guillemets make any identifier
    // a name, which is what Lake has always done with its own.
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('namespace «Transaction»');
    expect(out.source).toContain('end «Transaction»');
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
      sinkStates: [],
    });
  });

  it('T-LEAN-009 emits escapes, which tells a self-loop from a move', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('def escapes (s : State) (e : Event) : Bool :=');
    expect(out.source).toContain("| .to s' => !(decide (s' = s))");
  });
});

describe('generateLeanSpec — theorems that can fail', () => {
  it('T-LEAN-020 a terminal state gets an absorbing theorem', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain(
      'theorem aborted_absorbing : ∀ e, dispatch .Aborted e = .invalid := by',
    );
  });

  it('T-LEAN-021 a state that can leave gets a can-leave theorem with a witness', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('theorem beginning_can_leave : ∃ e, escapes .Beginning e = true');
    expect(out.source).toContain('⟨.BeginCompleted, rfl⟩');
  });

  it('T-LEAN-022 a terminal state gets no can-leave theorem, and the reverse', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).not.toContain('aborted_can_leave');
    expect(out.source).not.toContain('beginning_absorbing');
  });

  it('T-LEAN-023 theorem names are Lean identifiers, so hyphens become underscores', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('theorem savepoint_nested_can_leave');
    expect(out.source).not.toContain('savepoint-nested_can_leave');
  });

  it('T-LEAN-026 the can-leave witness is an event that actually leaves, not a self-loop', () => {
    // `active + query-executed` stays in `active`. It must not be the witness.
    const out = generateLeanSpec(TXN_SPEC);

    const activeWitness = out.source.split('theorem active_can_leave')[1]?.split('\n')[1];
    expect(activeWitness).toBe('  ⟨.SavepointCreated, rfl⟩');
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
    expect(out.meta.sinkStates).toEqual([]);
    expect(out.source).toContain('theorem a_absorbing');
    expect(out.source).toContain('theorem b_absorbing');
    expect(out.source).not.toContain('_can_leave');
  });
});

describe('generateLeanSpec — a sink accepts events and never leaves', () => {
  // `dlq` takes `dlq-inspected` and stays in `dlq`. It is not terminal, because
  // it accepts an event, and nothing ever leaves it. A theorem asking only for a
  // valid event would call that a way out.
  const JOB: OrchestratorSpec = {
    moduleName: 'Job',
    namespace: 'Job',
    states: ['queued', 'processing', 'dlq', 'completed'],
    events: ['enqueue-succeeded', 'process-started', 'process-succeeded', 'dlq-inspected', 'timeout'],
    unspecified: 'invalid',
    transitions: [
      { from: 'queued', event: 'enqueue-succeeded', to: 'queued' },
      { from: 'queued', event: 'process-started', to: 'processing' },
      { from: 'queued', event: 'timeout', to: 'dlq' },
      { from: 'processing', event: 'process-succeeded', to: 'completed' },
      { from: 'processing', event: 'timeout', to: 'dlq' },
      { from: 'dlq', event: 'dlq-inspected', to: 'dlq' },
    ],
  };

  it('T-LEAN-070 a sink is neither terminal nor escapable', () => {
    const out = generateLeanSpec(JOB);
    expect(out.meta.terminalStates).toEqual(['completed']);
    expect(out.meta.sinkStates).toEqual(['dlq']);
  });

  it('T-LEAN-071 a sink gets a no-escape theorem rather than a can-leave one', () => {
    const out = generateLeanSpec(JOB);
    expect(out.source).toContain('theorem dlq_no_escape : ∀ e, escapes .Dlq e = false := by');
    expect(out.source).not.toContain('dlq_can_leave');
    expect(out.source).not.toContain('dlq_absorbing');
  });

  it('T-LEAN-072 a state with a self-loop and a real exit is not a sink', () => {
    const out = generateLeanSpec(JOB);
    expect(out.meta.sinkStates).not.toContain('queued');
    expect(out.source).toContain('theorem queued_can_leave');
  });

  it('T-LEAN-073 the witness for such a state is the event that leaves', () => {
    const out = generateLeanSpec(JOB);
    const witness = out.source.split('theorem queued_can_leave')[1]?.split('\n')[1];
    expect(witness).toContain('ProcessStarted');
    expect(witness).not.toContain('EnqueueSucceeded');
  });

  it('T-LEAN-074 an initial state that is a sink reaches nothing, and generation says so', () => {
    expect(() =>
      generateLeanSpec({
        moduleName: 'M',
        namespace: 'M',
        states: ['idle', 'other'],
        events: ['ping'],
        unspecified: 'invalid',
        initial: 'idle',
        transitions: [{ from: 'idle', event: 'ping', to: 'idle' }],
      }),
    ).toThrow(/1 state\(s\) cannot be reached from "idle"/);
  });

  it('T-LEAN-075 a one-state machine that loops on itself is a sink with nothing to reach', () => {
    const out = generateLeanSpec({
      moduleName: 'Solo',
      namespace: 'Solo',
      states: ['idle'],
      events: ['ping'],
      unspecified: 'invalid',
      initial: 'idle',
      transitions: [{ from: 'idle', event: 'ping', to: 'idle' }],
    });
    expect(out.meta.sinkStates).toEqual(['idle']);
    expect(out.meta.reachablePaths).toEqual({});
    expect(out.source).toContain('theorem idle_no_escape');
    expect(out.source).not.toContain('_reachable');
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

describe('generateLeanSpec — reachability, when an initial state is named', () => {
  const REACHABLE: OrchestratorSpec = {
    moduleName: 'M',
    namespace: 'M',
    states: ['init', 'authed', 'expired'],
    events: ['auth-succeeded', 'timeout'],
    unspecified: 'invalid',
    initial: 'init',
    transitions: [
      { from: 'init', event: 'auth-succeeded', to: 'authed' },
      { from: 'init', event: 'timeout', to: 'expired' },
      { from: 'authed', event: 'timeout', to: 'expired' },
    ],
  };

  it('T-LEAN-050 without an initial state, reachability is not checked and steps is absent', () => {
    const { initial: _initial, ...noInitial } = REACHABLE;
    const out = generateLeanSpec(noInitial);
    expect(out.source).not.toContain('def steps');
    expect(out.source).not.toContain('_reachable');
    expect(out.meta.reachablePaths).toBeUndefined();
  });

  it('T-LEAN-051 each other state gets a theorem carrying the path that reaches it', () => {
    const out = generateLeanSpec(REACHABLE);
    expect(out.source).toContain('def steps : State → List Event → Step');
    expect(out.source).toContain(
      'theorem authed_reachable : steps .Init [.AuthSucceeded] = .to .Authed := rfl',
    );
    expect(out.source).toContain(
      'theorem expired_reachable : steps .Init [.Timeout] = .to .Expired := rfl',
    );
  });

  it('T-LEAN-052 the initial state gets no reachability theorem of its own', () => {
    const out = generateLeanSpec(REACHABLE);
    expect(out.source).not.toContain('init_reachable');
  });

  it('T-LEAN-053 the path is the shortest one', () => {
    const out = generateLeanSpec(REACHABLE);
    // `expired` is reachable in one event, not via `authed`.
    expect(out.meta.reachablePaths).toEqual({
      authed: ['auth-succeeded'],
      expired: ['timeout'],
    });
  });

  it('T-LEAN-054 a state nothing reaches stops generation, and is named', () => {
    const withOrphan: OrchestratorSpec = {
      ...REACHABLE,
      states: [...REACHABLE.states, 'orphan'],
    };
    expect(() => generateLeanSpec(withOrphan)).toThrow(/1 state\(s\) cannot be reached from "init"/);
    expect(() => generateLeanSpec(withOrphan)).toThrow(/orphan/);
  });

  it('T-LEAN-055 rejects an unknown initial state', () => {
    expect(() => generateLeanSpec({ ...REACHABLE, initial: 'nowhere' })).toThrow(
      /unknown state in initial: nowhere/,
    );
  });

  it('T-LEAN-056 the search is breadth-first, so a shorter path wins over one found sooner', () => {
    // `x` is two events away through `a`, and three through `b` then `y`. A
    // depth-first search reaches it the long way first and keeps that path.
    const out = generateLeanSpec({
      moduleName: 'M',
      namespace: 'M',
      states: ['init', 'a', 'b', 'y', 'x'],
      events: ['e1', 'e2'],
      unspecified: 'invalid',
      initial: 'init',
      transitions: [
        { from: 'init', event: 'e1', to: 'a' },
        { from: 'init', event: 'e2', to: 'b' },
        { from: 'a', event: 'e1', to: 'x' },
        { from: 'b', event: 'e1', to: 'y' },
        { from: 'y', event: 'e1', to: 'x' },
      ],
    });

    expect(out.meta.reachablePaths?.x).toEqual(['e1', 'e1']);
    expect(out.source).toContain('theorem x_reachable : steps .Init [.E1, .E1] = .to .X := rfl');
  });
});

describe('generateLeanSpec — the declared terminal states are checked against the table', () => {
  const SPEC: OrchestratorSpec = {
    moduleName: 'M',
    namespace: 'M',
    states: ['init', 'done'],
    events: ['go', 'timeout'],
    unspecified: 'invalid',
    transitions: [{ from: 'init', event: 'go', to: 'done' }],
  };

  it('T-LEAN-060 an agreeing declaration passes', () => {
    expect(() => generateLeanSpec({ ...SPEC, terminal: ['done'] })).not.toThrow();
  });

  it('T-LEAN-061 a state declared terminal that has a way out stops generation', () => {
    expect(() => generateLeanSpec({ ...SPEC, terminal: ['init', 'done'] })).toThrow(
      /init is declared terminal but the table gives it a way out/,
    );
  });

  it('T-LEAN-062 a state with no way out that was not declared stops generation', () => {
    expect(() => generateLeanSpec({ ...SPEC, terminal: [] })).toThrow(
      /done has no way out but is not declared terminal/,
    );
  });

  it('T-LEAN-063 rejects an unknown terminal state', () => {
    expect(() => generateLeanSpec({ ...SPEC, terminal: ['ghost'] })).toThrow(
      /unknown state in terminal: ghost/,
    );
  });

  it('T-LEAN-064 without a declaration the table is taken at its word', () => {
    expect(() => generateLeanSpec(SPEC)).not.toThrow();
    expect(generateLeanSpec(SPEC).meta.terminalStates).toEqual(['done']);
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

  it('T-LEAN-045 emits one theorem per state, whichever of the three shapes applies', () => {
    // `generate()` は定理 block が空にならない前提で書かれている (#2195)。 その前提は
    // 「state 1 つにつき必ず 1 件」 が保つので、3 経路すべてを 1 つの spec で通して数える。
    //
    // 3 経路 = 終端 (`_absorbing`) / 非終端で脱出できない (`_no_escape`) / 脱出できる
    // (`_can_leave`)。 1 つでも push を落とすと state 数と定理数がずれて落ちる。
    const spec: OrchestratorSpec = {
      moduleName: 'M',
      namespace: 'M',
      states: ['start', 'stuck', 'done'],
      events: ['go', 'stay'],
      // 全 cell (3 state × 2 event) を宣言する = 未宣言があると generate 前の検査が落とす。
      transitions: [
        // start は go で抜けられる = `_can_leave`
        { from: 'start', event: 'go', to: 'stuck' },
        { from: 'start', event: 'stay', to: 'start' },
        // stuck は event を受けるが自分に戻るだけ = `_no_escape`
        { from: 'stuck', event: 'stay', to: 'stuck' },
        { from: 'stuck', event: 'go', to: 'stuck' },
        // done はどの event でも動かない = `_absorbing`
        { from: 'done', event: 'go', invalid: true },
        { from: 'done', event: 'stay', invalid: true },
      ],
    };
    const { source } = generateLeanSpec(spec);
    const theorems = source.match(/^theorem /gm) ?? [];
    expect(theorems.length, '定理の数が state の数と違う').toBe(spec.states.length);
    expect(source, 'can_leave の定理が無い').toContain('start_can_leave');
    expect(source, 'no_escape の定理が無い').toContain('stuck_no_escape');
    expect(source, 'absorbing の定理が無い').toContain('done_absorbing');
  });

  it('T-LEAN-044 rejects an empty state or event list', () => {
    const base = { moduleName: 'M', namespace: 'M', transitions: [] };
    expect(() => generateLeanSpec({ ...base, states: [], events: ['e'] })).toThrow(/at least one state/);
    expect(() => generateLeanSpec({ ...base, states: ['a'], events: [] })).toThrow(/at least one event/);
  });
});
