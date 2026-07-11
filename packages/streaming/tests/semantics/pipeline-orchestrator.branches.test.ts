import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startPipeline,
} from '../../src/semantics/pipeline-orchestrator.js';

// Follow-up test file for the switch/case tail branches in dispatchEvent that
// existing T-S-PO-* tests don't reach — consuming/rebalancing/dlq-active
// stop-requested transitions and invalid-event fallbacks per state.

describe('dispatchEvent — consuming state tail branches', () => {
  it('T-S-PO-B-001 consume-succeeded in consuming stays in consuming and increments count', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    expect(s.state).toBe('consuming');
    const next = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't2' });
    expect(next.state).toBe('consuming');
    expect(next.messagesConsumed).toBe(2);
  });

  it('T-S-PO-B-002 stop-requested from consuming → stopped', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    const stopped = dispatchEvent({ session: s, event: 'stop-requested', timestamp: 't2' });
    expect(stopped.state).toBe('stopped');
  });

  it('T-S-PO-B-003 invalid event in consuming appends invalid marker', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'rebalance-completed', timestamp: 't2' });
    expect(next.state).toBe('consuming');
    expect(next.events).toContain('invalid:rebalance-completed-in-consuming');
  });
});

describe('dispatchEvent — rebalancing state tail branches', () => {
  it('T-S-PO-B-004 stop-requested from rebalancing → stopped', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't1' });
    expect(s.state).toBe('rebalancing');
    const stopped = dispatchEvent({ session: s, event: 'stop-requested', timestamp: 't2' });
    expect(stopped.state).toBe('stopped');
  });

  it('T-S-PO-B-005 invalid event in rebalancing appends invalid marker', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't2' });
    expect(next.state).toBe('rebalancing');
    expect(next.events).toContain('invalid:produce-succeeded-in-rebalancing');
  });
});

describe('dispatchEvent — dlq-active state tail branches', () => {
  it('T-S-PO-B-006 stop-requested from dlq-active → stopped', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'dlq-message-added', timestamp: 't1' });
    expect(s.state).toBe('dlq-active');
    const stopped = dispatchEvent({ session: s, event: 'stop-requested', timestamp: 't2' });
    expect(stopped.state).toBe('stopped');
  });

  it('T-S-PO-B-007 invalid event in dlq-active appends invalid marker', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'dlq-message-added', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't2' });
    expect(next.state).toBe('dlq-active');
    expect(next.events).toContain('invalid:rebalance-triggered-in-dlq-active');
  });
});
