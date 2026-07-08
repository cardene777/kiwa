/**
 * v2.5-3 docs 補強 — tutorial 132 code snippet 検証。
 * 51 milestone 連続 snippet validation streak = v1.23 → v2.5。
 * depth-5 pattern 6 例目発生 = systematic law CONFIRMED。
 */
import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startPipeline,
} from '../src/semantics/pipeline-orchestrator.js';

describe('tutorial 132 — Step 1 pipeline 初期化', () => {
  it('startPipeline で producing 初期化', () => {
    const s = startPipeline({ timestamp: 't0' });
    expect(s.state).toBe('producing');
  });
});

describe('tutorial 132 — Step 2 producing → consuming chain', () => {
  it('produce + consume で state 遷移', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't2' });
    expect(s.state).toBe('consuming');
    expect(s.messagesConsumed).toBe(1);
  });
});

describe('tutorial 132 — Step 3 rebalance chain', () => {
  it('rebalance-triggered → completed で consuming 復帰', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't1' });
    expect(s.state).toBe('rebalancing');
    s = dispatchEvent({ session: s, event: 'rebalance-completed', timestamp: 't2' });
    expect(s.state).toBe('consuming');
    expect(s.rebalancesExecuted).toBe(1);
  });
});

describe('tutorial 132 — Step 4 DLQ chain', () => {
  it('consume-failed で dlq-active 遷移', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'consume-failed', timestamp: 't2' });
    expect(s.state).toBe('dlq-active');
    expect(s.dlqMessagesCount).toBe(1);
  });
});
