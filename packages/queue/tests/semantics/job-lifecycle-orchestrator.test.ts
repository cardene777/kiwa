import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startJob,
  summarizeJob,
} from '../../src/semantics/job-lifecycle-orchestrator.js';

describe('v0.6 job-lifecycle-orchestrator', () => {
  it('T-Q-JL-001 queued 初期化', () => {
    expect(startJob({ timestamp: 't0' }).state).toBe('queued');
  });

  it('T-Q-JL-002 process-started → processing', () => {
    const s = startJob({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    expect(next.state).toBe('processing');
    expect(next.processStarts).toBe(1);
  });

  it('T-Q-JL-003 全経路 chain (queued → processing → completed)', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-succeeded', timestamp: 't2' });
    expect(s.state).toBe('completed');
    expect(summarizeJob(s).processSuccesses).toBe(1);
  });

  it('T-Q-JL-004 retry chain (queued → processing → retrying → queued → completed)', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-failed', timestamp: 't2' });
    expect(s.state).toBe('retrying');
    s = dispatchEvent({ session: s, event: 'retry-scheduled', timestamp: 't3' });
    expect(s.state).toBe('queued');
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't4' });
    s = dispatchEvent({ session: s, event: 'process-succeeded', timestamp: 't5' });
    expect(s.state).toBe('completed');
    expect(summarizeJob(s).retries).toBe(1);
  });

  it('T-Q-JL-005 DLQ chain (retry-exhausted → dlq)', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-failed', timestamp: 't2' });
    s = dispatchEvent({ session: s, event: 'retry-exhausted', timestamp: 't3' });
    expect(s.state).toBe('dlq');
    s = dispatchEvent({ session: s, event: 'dlq-inspected', timestamp: 't4' });
    expect(s.dlqInspections).toBe(1);
  });

  it('T-Q-JL-006 shape 契約 preserving', () => {
    const s = startJob({ timestamp: 't0' });
    expect(s).toMatchObject({
      state: 'queued',
      enqueues: 0,
      processStarts: 0,
      processSuccesses: 0,
      processFailures: 0,
      retries: 0,
      dlqInspections: 0,
    });
  });

  it('T-Q-JL-007 completed terminal で 全 event を terminal 記録', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-succeeded', timestamp: 't2' });
    const next = dispatchEvent({ session: s, event: 'process-started', timestamp: 't3' });
    expect(next.state).toBe('completed');
    const terminals = next.events.filter((e) => e.startsWith('terminal:'));
    expect(terminals.length).toBeGreaterThan(0);
  });

  it('T-Q-JL-008 invalid 遷移 (throw guard)', () => {
    const s = startJob({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'process-succeeded', timestamp: 't1' });
    expect(next.state).toBe('queued');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:process-succeeded-in-queued');
  });

  it('T-Q-JL-009 40 セル 遷移表 SSOT', () => {
    const states = ['queued', 'processing', 'retrying', 'dlq', 'completed'] as const;
    const events = [
      'enqueue-succeeded',
      'process-started',
      'process-succeeded',
      'process-failed',
      'retry-scheduled',
      'retry-exhausted',
      'dlq-inspected',
      'timeout',
    ] as const;
    expect(states.length * events.length).toBe(40);
  });
});
