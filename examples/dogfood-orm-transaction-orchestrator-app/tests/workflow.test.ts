import { describe, expect, it } from 'vitest';
import {
  bootTransaction,
  extractRollbackRate,
  pipeTransactionEvents,
  renderTransactionDashboard,
  traceSavepointDepth,
} from '../src/workflow.js';

describe('dogfood-orm-transaction-orchestrator-app (v2.8-2)', () => {
  it('Pattern 1: bootTransaction', () => {
    expect(bootTransaction({ timestamp: 't0' }).state).toBe('beginning');
  });

  it('Pattern 2: pipeTransactionEvents 全経路 (begin → query → savepoint → release → commit)', () => {
    let s = bootTransaction({ timestamp: 't0' });
    s = pipeTransactionEvents({
      session: s,
      events: [
        { event: 'begin-completed', timestamp: 't1' },
        { event: 'query-executed', timestamp: 't2' },
        { event: 'savepoint-created', timestamp: 't3' },
        { event: 'query-executed', timestamp: 't4' },
        { event: 'savepoint-released', timestamp: 't5' },
        { event: 'commit-requested', timestamp: 't6' },
        { event: 'commit-succeeded', timestamp: 't7' },
      ],
    });
    expect(s.state).toBe('committing');
    expect(s.commitsSucceeded).toBe(1);
  });

  it('Pattern 3: renderTransactionDashboard', () => {
    const s = bootTransaction({ timestamp: 't0' });
    expect(renderTransactionDashboard(s).currentState).toBe('beginning');
  });

  it('Pattern 4: extractRollbackRate', () => {
    let s = bootTransaction({ timestamp: 't0' });
    s = pipeTransactionEvents({
      session: s,
      events: [{ event: 'rollback-requested', timestamp: 't1' }],
    });
    expect(extractRollbackRate(s).rate).toBe(1);
  });

  it('Pattern 5: traceSavepointDepth (nested savepoint depth trace)', () => {
    let s = bootTransaction({ timestamp: 't0' });
    s = pipeTransactionEvents({
      session: s,
      events: [
        { event: 'begin-completed', timestamp: 't1' },
        { event: 'savepoint-created', timestamp: 't2' },
      ],
    });
    expect(traceSavepointDepth(s).depth).toBe(1);
    s = pipeTransactionEvents({
      session: s,
      events: [{ event: 'savepoint-released', timestamp: 't3' }],
    });
    expect(traceSavepointDepth(s).depth).toBe(0);
  });

  it('5 pattern 統合 (backend systems layer initial dogfood)', () => {
    let s = bootTransaction({ timestamp: 't0' });
    s = pipeTransactionEvents({
      session: s,
      events: [
        { event: 'begin-completed', timestamp: 't1' },
        { event: 'query-executed', timestamp: 't2' },
        { event: 'timeout', timestamp: 't3' },
      ],
    });
    expect(s.state).toBe('aborted');
    expect(s.queriesExecuted).toBe(1);
  });
});
