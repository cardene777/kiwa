import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startQuery,
  summarizeQuery,
} from '../../src/semantics/query-orchestrator.js';

describe('v2.1 startQuery', () => {
  it('T-SR-QO-001 parsing 初期化', () => {
    const s = startQuery({ timestamp: 't0' });
    expect(s.state).toBe('parsing');
    expect(s.parseAttempts).toBe(1);
  });
});

describe('v2.1 dispatchEvent — parsing 状態', () => {
  it('T-SR-QO-002 parse-succeeded → searching', () => {
    const s = startQuery({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    expect(next.state).toBe('searching');
  });

  it('T-SR-QO-003 parse-failed → completed', () => {
    const s = startQuery({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'parse-failed', timestamp: 't1' });
    expect(next.state).toBe('completed');
  });

  it('T-SR-QO-004 query-timeout で timeoutCount +1', () => {
    const s = startQuery({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'query-timeout', timestamp: 't1' });
    expect(next.state).toBe('completed');
    expect(next.timeoutCount).toBe(1);
  });
});

describe('v2.1 dispatchEvent — searching → reranking → facet chain', () => {
  it('T-SR-QO-005 search-completed → reranking', () => {
    let s = startQuery({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'search-completed', timestamp: 't2' });
    expect(next.state).toBe('reranking');
    expect(next.searchExecutions).toBe(1);
  });

  it('T-SR-QO-006 rerank-completed → facet-aggregating', () => {
    let s = startQuery({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'search-completed', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'rerank-completed', timestamp: 't3' });
    expect(next.state).toBe('facet-aggregating');
    expect(next.rerankExecutions).toBe(1);
  });

  it('T-SR-QO-007 facet-computed → completed', () => {
    let s = startQuery({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'search-completed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'rerank-completed', timestamp: 't3' });
    const next = dispatchEvent({ session: s, event: 'facet-computed', timestamp: 't4' });
    expect(next.state).toBe('completed');
    expect(next.facetsComputed).toBe(1);
  });
});

describe('v2.1 統合 workflow', () => {
  it('T-SR-QO-008 全経路 chain', () => {
    let s = startQuery({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'search-completed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'rerank-completed', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'facet-computed', timestamp: 't4' });
    expect(s.state).toBe('completed');
    const sum = summarizeQuery(s);
    expect(sum.searchExecutions).toBe(1);
    expect(sum.rerankExecutions).toBe(1);
    expect(sum.facetsComputed).toBe(1);
  });

  it('T-SR-QO-009 query-canceled で 即 completed', () => {
    let s = startQuery({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'query-canceled', timestamp: 't2' });
    expect(s.state).toBe('completed');
  });
});

describe('v2.1 shape 契約 preserving', () => {
  it('T-SR-QO-010 既存 semantics 触っていない', async () => {
    const mod = await import('../../src/semantics/index.js');
    expect(typeof mod.startQuery).toBe('function');
    expect(typeof mod.dispatchQueryEvent).toBe('function');
    expect(typeof mod.summarizeQuery).toBe('function');
  });
});
