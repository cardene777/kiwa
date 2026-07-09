import { describe, expect, it } from 'vitest';
import { generateLeanSpec } from '../src/generator.js';
import type { OrchestratorSpec } from '../src/types.js';

const TXN_SPEC: OrchestratorSpec = {
  moduleName: 'TransactionOrchestrator',
  namespace: 'Transaction',
  states: ['beginning', 'active', 'savepoint-nested', 'committing', 'aborted'],
  events: [
    'begin-completed',
    'query-executed',
    'savepoint-created',
    'savepoint-released',
    'commit-requested',
    'commit-succeeded',
    'rollback-requested',
    'timeout',
  ],
  transitions: [
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
  ],
};

describe('generateLeanSpec — transaction-orchestrator round-trip', () => {
  it('T-LEAN-001 emits 5-state inductive type', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('inductive State where');
    expect(out.source).toContain('  | Beginning : State');
    expect(out.source).toContain('  | Active : State');
    expect(out.source).toContain('  | SavepointNested : State');
    expect(out.source).toContain('  | Committing : State');
    expect(out.source).toContain('  | Aborted : State');
  });

  it('T-LEAN-002 emits 8-event inductive type', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('inductive Event where');
    expect(out.source).toContain('  | BeginCompleted : Event');
    expect(out.source).toContain('  | QueryExecuted : Event');
    expect(out.source).toContain('  | SavepointCreated : Event');
    expect(out.source).toContain('  | Timeout : Event');
  });

  it('T-LEAN-003 emits dispatch function with valid transitions', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('def dispatch : State → Event → State');
    expect(out.source).toContain('| .Beginning, .BeginCompleted => .Active');
    expect(out.source).toContain('| .Active, .CommitRequested => .Committing');
    expect(out.source).toContain('| .Committing, .Timeout => .Aborted');
  });

  it('T-LEAN-004 falls through to identity for invalid transitions', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('| s, _ => s -- invalid transition');
  });

  it('T-LEAN-005 emits totality theorem', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain(
      'theorem dispatch_total (s : State) (e : Event) : ∃ s\', dispatch s e = s\'',
    );
    expect(out.source).toContain('exact ⟨dispatch s e, rfl⟩');
  });

  it('T-LEAN-006 wraps output in the namespace', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.source).toContain('namespace Transaction');
    expect(out.source).toContain('end Transaction');
  });

  it('T-LEAN-007 reports 40 cells and correct valid/invalid split', () => {
    const out = generateLeanSpec(TXN_SPEC);
    expect(out.meta.stateCount).toBe(5);
    expect(out.meta.eventCount).toBe(8);
    expect(out.meta.cellCount).toBe(40);
    expect(out.meta.validTransitionCount).toBe(14);
    expect(out.meta.invalidTransitionCount).toBe(26);
  });

  it('T-LEAN-008 rejects unknown state / event references', () => {
    const badSpec: OrchestratorSpec = {
      ...TXN_SPEC,
      transitions: [{ from: 'beginning', event: 'begin-completed', to: 'unknown-state' }],
    };
    expect(() => generateLeanSpec(badSpec)).toThrow(/unknown state.*transition\.to/);
  });

  it('T-LEAN-009 rejects duplicate (state, event) pairs', () => {
    const dupSpec: OrchestratorSpec = {
      ...TXN_SPEC,
      transitions: [
        { from: 'beginning', event: 'begin-completed', to: 'active' },
        { from: 'beginning', event: 'begin-completed', to: 'aborted' },
      ],
    };
    expect(() => generateLeanSpec(dupSpec)).toThrow(/duplicate transition/);
  });
});
