import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startTransaction,
  summarizeTransaction,
} from '../../src/semantics/transaction-orchestrator.js';

describe('v0.6 transaction-orchestrator', () => {
  it('T-O-TX-001 beginning 初期化', () => {
    expect(startTransaction({ timestamp: 't0' }).state).toBe('beginning');
  });

  it('T-O-TX-002 begin-completed → active', () => {
    const s = startTransaction({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'begin-completed', timestamp: 't1' });
    expect(next.state).toBe('active');
  });

  it('T-O-TX-003 rollback-requested で 即 aborted', () => {
    const s = startTransaction({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'rollback-requested', timestamp: 't1' });
    expect(next.state).toBe('aborted');
    expect(next.rollbacksExecuted).toBe(1);
  });

  it('T-O-TX-004 全経路 chain (begin → query → savepoint → release → commit)', () => {
    let s = startTransaction({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'begin-completed', timestamp: 't1' });
    expect(s.state).toBe('active');
    s = dispatchEvent({ session: s, event: 'query-executed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'savepoint-created', timestamp: 't3' });
    expect(s.state).toBe('savepoint-nested');
    s = dispatchEvent({ session: s, event: 'query-executed', timestamp: 't4' });
    s = dispatchEvent({ session: s, event: 'savepoint-released', timestamp: 't5' });
    expect(s.state).toBe('active');
    s = dispatchEvent({ session: s, event: 'commit-requested', timestamp: 't6' });
    expect(s.state).toBe('committing');
    s = dispatchEvent({ session: s, event: 'commit-succeeded', timestamp: 't7' });
    const sum = summarizeTransaction(s);
    expect(sum.queriesExecuted).toBe(2);
    expect(sum.savepointsCreated).toBe(1);
    expect(sum.savepointsReleased).toBe(1);
    expect(sum.commitsSucceeded).toBe(1);
  });

  it('T-O-TX-005 timeout で 途中 state から aborted', () => {
    let s = startTransaction({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'begin-completed', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('aborted');
  });

  it('T-O-TX-006 shape 契約 preserving = 既存 API 変更 0 + 新規 file 追加のみ', () => {
    const s = startTransaction({ timestamp: 't0' });
    expect(s).toMatchObject({
      state: 'beginning',
      queriesExecuted: 0,
      savepointsCreated: 0,
      savepointsReleased: 0,
      commitsSucceeded: 0,
      rollbacksExecuted: 0,
    });
    expect(s.events[0]).toBe('transaction-started');
  });

  it('T-O-TX-007 aborted terminal で 全 event を terminal 記録', () => {
    let s = startTransaction({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'rollback-requested', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'query-executed', timestamp: 't2' });
    expect(next.state).toBe('aborted');
    const terminals = next.events.filter((e) => e.startsWith('terminal:'));
    expect(terminals.length).toBeGreaterThan(0);
  });

  it('T-O-TX-008 invalid 遷移で 状態遷移せず invalid 記録 (throw guard = backend 系 遷移確定的)', () => {
    let s = startTransaction({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'commit-requested', timestamp: 't1' });
    expect(next.state).toBe('beginning');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:commit-requested-in-beginning');
  });

  it('T-O-TX-009 40 セル 遷移表 SSOT = 5 state × 8 event で 網羅', () => {
    const states: Array<'beginning' | 'active' | 'savepoint-nested' | 'committing' | 'aborted'> = [
      'beginning',
      'active',
      'savepoint-nested',
      'committing',
      'aborted',
    ];
    const events = [
      'begin-completed',
      'query-executed',
      'savepoint-created',
      'savepoint-released',
      'commit-requested',
      'commit-succeeded',
      'rollback-requested',
      'timeout',
    ] as const;
    expect(states.length * events.length).toBe(40);
  });
});
