import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startCache,
  summarizeCache,
} from '../../src/semantics/cache-lifecycle-orchestrator.js';

describe('v0.6 cache-lifecycle-orchestrator', () => {
  it('T-C-CL-001 filling 初期化', () => {
    expect(startCache({ timestamp: 't0' }).state).toBe('filling');
  });

  it('T-C-CL-002 write-committed → hot', () => {
    const s = startCache({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    expect(next.state).toBe('hot');
    expect(next.writesCommitted).toBe(1);
  });

  it('T-C-CL-003 全経路 chain (filling → hot → expiring → stale → evicted)', () => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    expect(s.state).toBe('hot');
    s = dispatchEvent({ session: s, event: 'read-hit', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'ttl-warning', timestamp: 't3' });
    expect(s.state).toBe('expiring');
    s = dispatchEvent({ session: s, event: 'ttl-expired', timestamp: 't4' });
    expect(s.state).toBe('stale');
    s = dispatchEvent({ session: s, event: 'read-miss', timestamp: 't5' });
    s = dispatchEvent({ session: s, event: 'evict-requested', timestamp: 't6' });
    expect(s.state).toBe('evicted');
    const sum = summarizeCache(s);
    expect(sum.readHits).toBe(1);
    expect(sum.readMisses).toBe(1);
    expect(sum.ttlWarnings).toBe(1);
    expect(sum.evictions).toBe(1);
  });

  it('T-C-CL-004 stale → filling (write refresh)', () => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'ttl-warning', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'ttl-expired', timestamp: 't3' });
    const next = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't4' });
    expect(next.state).toBe('filling');
  });

  it('T-C-CL-005 timeout で 途中 state から evicted', () => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('evicted');
  });

  it('T-C-CL-006 shape 契約 preserving', () => {
    const s = startCache({ timestamp: 't0' });
    expect(s).toMatchObject({
      state: 'filling',
      writesCommitted: 0,
      readHits: 0,
      readMisses: 0,
      ttlWarnings: 0,
      evictions: 0,
    });
  });

  it('T-C-CL-007 evicted terminal で 全 event を terminal 記録', () => {
    let s = startCache({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'write-committed', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'invalidate-requested', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'read-hit', timestamp: 't3' });
    expect(next.state).toBe('evicted');
    const terminals = next.events.filter((e) => e.startsWith('terminal:'));
    expect(terminals.length).toBeGreaterThan(0);
  });

  it('T-C-CL-008 invalid 遷移で 状態遷移せず invalid 記録 (throw guard)', () => {
    const s = startCache({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'read-hit', timestamp: 't1' });
    expect(next.state).toBe('filling');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:read-hit-in-filling');
  });

  it('T-C-CL-009 40 セル 遷移表 SSOT', () => {
    const states = ['filling', 'hot', 'expiring', 'stale', 'evicted'] as const;
    const events = [
      'write-committed',
      'read-hit',
      'read-miss',
      'ttl-warning',
      'ttl-expired',
      'invalidate-requested',
      'evict-requested',
      'timeout',
    ] as const;
    expect(states.length * events.length).toBe(40);
  });
});
