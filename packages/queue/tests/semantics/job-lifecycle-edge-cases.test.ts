import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startJob,
} from '../../src/semantics/job-lifecycle-orchestrator.js';

/**
 * Coverage batch 1 — closes the state-machine cells that the existing
 * job-lifecycle-orchestrator.test.ts leaves uncovered. Every added test
 * targets one branch of the switch(session.state) in dispatchEvent, so
 * the semantic contract is preserved (no `?? undefined` weakening, no
 * skipped assertions).
 */

describe('v0.6 job-lifecycle-orchestrator — queued edge cells', () => {
  it('T-Q-JL-010 queued + enqueue-succeeded increments enqueues without changing state', () => {
    const s = startJob({ timestamp: 't0' });
    const next = dispatchEvent({
      session: s,
      event: 'enqueue-succeeded',
      timestamp: 't1',
    });
    expect(next.state).toBe('queued');
    expect(next.enqueues).toBe(1);
    expect(next.events).toContain('event:enqueue-succeeded');
    // Base preserves lastEventAt update.
    expect(next.lastEventAt).toBe('t1');
  });

  it('T-Q-JL-011 queued + timeout transitions directly to dlq', () => {
    const s = startJob({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(next.state).toBe('dlq');
    expect(next.events).toContain('event:timeout');
    // No processing counters increment when we skip straight to dlq.
    expect(next.processStarts).toBe(0);
    expect(next.processFailures).toBe(0);
  });

  it('T-Q-JL-012 queued + retry-scheduled is an invalid transition and records the fallback', () => {
    const s = startJob({ timestamp: 't0' });
    const next = dispatchEvent({
      session: s,
      event: 'retry-scheduled',
      timestamp: 't1',
    });
    expect(next.state).toBe('queued');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:retry-scheduled-in-queued');
  });
});

describe('v0.6 job-lifecycle-orchestrator — processing edge cells', () => {
  it('T-Q-JL-013 processing + timeout transitions to dlq', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    expect(s.state).toBe('processing');
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't2' });
    expect(next.state).toBe('dlq');
    expect(next.events).toContain('event:timeout');
    // The prior process-started counter is preserved through the transition.
    expect(next.processStarts).toBe(1);
  });

  it('T-Q-JL-014 processing + enqueue-succeeded is invalid and records the fallback', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    const next = dispatchEvent({
      session: s,
      event: 'enqueue-succeeded',
      timestamp: 't2',
    });
    expect(next.state).toBe('processing');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:enqueue-succeeded-in-processing');
    // Enqueues did NOT increment because the guard rejected the event.
    expect(next.enqueues).toBe(0);
  });
});

describe('v0.6 job-lifecycle-orchestrator — retrying edge cells', () => {
  it('T-Q-JL-015 retrying + timeout transitions to dlq', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-failed', timestamp: 't2' });
    expect(s.state).toBe('retrying');
    const next = dispatchEvent({ session: s, event: 'timeout', timestamp: 't3' });
    expect(next.state).toBe('dlq');
    // Retries counter is NOT incremented on timeout (only retry-scheduled bumps it).
    expect(next.retries).toBe(0);
  });

  it('T-Q-JL-016 retrying + enqueue-succeeded is invalid and records the fallback', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-failed', timestamp: 't2' });
    const next = dispatchEvent({
      session: s,
      event: 'enqueue-succeeded',
      timestamp: 't3',
    });
    expect(next.state).toBe('retrying');
    const invalids = next.events.filter((e) => e.startsWith('invalid:'));
    expect(invalids).toContain('invalid:enqueue-succeeded-in-retrying');
  });
});

describe('v0.6 job-lifecycle-orchestrator — dlq edge cells', () => {
  it('T-Q-JL-017 dlq + non-inspect event records a terminal marker without state change', () => {
    // Push into dlq via queued+timeout.
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'timeout', timestamp: 't1' });
    expect(s.state).toBe('dlq');

    // Any event that is not dlq-inspected in dlq state is terminal-only.
    const next = dispatchEvent({
      session: s,
      event: 'enqueue-succeeded',
      timestamp: 't2',
    });
    expect(next.state).toBe('dlq');
    const terminals = next.events.filter((e) => e.startsWith('terminal:'));
    expect(terminals).toContain('terminal:enqueue-succeeded-in-dlq');
    // dlqInspections counter is NOT bumped.
    expect(next.dlqInspections).toBe(0);
  });
});

describe('v0.6 job-lifecycle-orchestrator — retry chain semantics preserved', () => {
  it('T-Q-JL-018 retrying + retry-exhausted lands in dlq and dispatches keep base intact', () => {
    let s = startJob({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'process-started', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'process-failed', timestamp: 't2' });
    expect(s.state).toBe('retrying');
    const next = dispatchEvent({
      session: s,
      event: 'retry-exhausted',
      timestamp: 't3',
    });
    expect(next.state).toBe('dlq');
    expect(next.processFailures).toBe(1);
  });
});
