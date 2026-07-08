/**
 * v2.6-3 docs 補強 — tutorial 133 code snippet 検証。
 * 52 milestone 連続 snippet validation streak = v1.23 → v2.6。
 * depth-5 pattern 7 例目発生 = systematic law 継続強化。
 */
import { describe, expect, it } from 'vitest';
import { dispatchEvent, startQuery } from '../src/semantics/query-orchestrator.js';

describe('tutorial 133 — 完全 chain snippet', () => {
  it('parsing → searching → reranking → facet-aggregating → completed', () => {
    let s = startQuery({ timestamp: 't0' });
    expect(s.state).toBe('parsing');
    s = dispatchEvent({ session: s, event: 'parse-succeeded', timestamp: 't1' });
    expect(s.state).toBe('searching');
    s = dispatchEvent({ session: s, event: 'search-completed', timestamp: 't2' });
    expect(s.state).toBe('reranking');
    s = dispatchEvent({ session: s, event: 'rerank-completed', timestamp: 't3' });
    expect(s.state).toBe('facet-aggregating');
    s = dispatchEvent({ session: s, event: 'facet-computed', timestamp: 't4' });
    expect(s.state).toBe('completed');
  });
});
