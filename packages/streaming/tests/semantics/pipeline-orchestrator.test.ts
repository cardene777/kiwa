import { describe, expect, it } from 'vitest';
import {
  dispatchEvent,
  startPipeline,
  summarizePipeline,
  type PipelineSession,
} from '../../src/semantics/pipeline-orchestrator.js';

describe('v2.1 startPipeline — 初期化 SSOT', () => {
  it('T-S-PO-001 producing 初期化', () => {
    const s = startPipeline({ timestamp: 't0' });
    expect(s.state).toBe('producing');
    expect(s.messagesProduced).toBe(0);
    expect(s.dlqMessagesCount).toBe(0);
  });
});

describe('v2.1 dispatchEvent — producing 状態', () => {
  it('T-S-PO-002 produce-succeeded で messagesProduced +1', () => {
    const s = startPipeline({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't1' });
    expect(next.messagesProduced).toBe(1);
  });

  it('T-S-PO-003 consume-succeeded で consuming 遷移', () => {
    const s = startPipeline({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    expect(next.state).toBe('consuming');
  });

  it('T-S-PO-004 rebalance-triggered で rebalancing 遷移', () => {
    const s = startPipeline({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't1' });
    expect(next.state).toBe('rebalancing');
  });

  it('T-S-PO-005 dlq-message-added で dlq-active + dlqCount +1', () => {
    const s = startPipeline({ timestamp: 't0' });
    const next = dispatchEvent({ session: s, event: 'dlq-message-added', timestamp: 't1' });
    expect(next.state).toBe('dlq-active');
    expect(next.dlqMessagesCount).toBe(1);
  });
});

describe('v2.1 dispatchEvent — consuming 状態', () => {
  it('T-S-PO-006 consume-failed で dlq-active 遷移', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'consume-failed', timestamp: 't2' });
    expect(next.state).toBe('dlq-active');
  });

  it('T-S-PO-007 produce-succeeded で producing 復帰', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't2' });
    expect(next.state).toBe('producing');
    expect(next.messagesProduced).toBe(1);
  });
});

describe('v2.1 dispatchEvent — rebalancing 状態', () => {
  it('T-S-PO-008 rebalance-completed で consuming 遷移 + rebalancesExecuted +1', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'rebalance-completed', timestamp: 't2' });
    expect(next.state).toBe('consuming');
    expect(next.rebalancesExecuted).toBe(1);
  });
});

describe('v2.1 dispatchEvent — dlq-active 状態', () => {
  it('T-S-PO-009 consume-succeeded で consuming 復帰', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'dlq-message-added', timestamp: 't1' });
    const next = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't2' });
    expect(next.state).toBe('consuming');
  });

  it('T-S-PO-010 dlq-message-added 累積', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'dlq-message-added', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'dlq-message-added', timestamp: 't2' });
    expect(s.dlqMessagesCount).toBe(2);
  });
});

describe('v2.1 dispatchEvent — stopped terminal', () => {
  it('T-S-PO-011 stop-requested で stopped、 以降は terminal reject', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'stop-requested', timestamp: 't1' });
    expect(s.state).toBe('stopped');
    const next = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't2' });
    expect(next.events).toContain('terminal:produce-succeeded-in-stopped');
  });
});

describe('v2.1 summarizePipeline', () => {
  it('T-S-PO-012 valid + invalid + terminal count', () => {
    let s = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'rebalance-completed', timestamp: 't2' }); // invalid in producing
    s = dispatchEvent({ session: s, event: 'stop-requested', timestamp: 't3' });
    s = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't4' }); // terminal
    const sum = summarizePipeline(s);
    expect(sum.currentState).toBe('stopped');
    expect(sum.invalidEvents).toBe(1);
    expect(sum.terminalEvents).toBe(1);
  });
});

describe('v2.1 統合 workflow', () => {
  it('T-S-PO-013 producing → consuming → rebalancing → consuming complete chain', () => {
    let s: PipelineSession = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'produce-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't2' });
    expect(s.state).toBe('consuming');
    s = dispatchEvent({ session: s, event: 'rebalance-triggered', timestamp: 't3' });
    expect(s.state).toBe('rebalancing');
    s = dispatchEvent({ session: s, event: 'rebalance-completed', timestamp: 't4' });
    expect(s.state).toBe('consuming');
    expect(s.rebalancesExecuted).toBe(1);
  });

  it('T-S-PO-014 consume-failed → dlq-active → recovery chain', () => {
    let s: PipelineSession = startPipeline({ timestamp: 't0' });
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't1' });
    s = dispatchEvent({ session: s, event: 'consume-failed', timestamp: 't2' });
    expect(s.state).toBe('dlq-active');
    expect(s.dlqMessagesCount).toBe(1);
    s = dispatchEvent({ session: s, event: 'consume-succeeded', timestamp: 't3' });
    expect(s.state).toBe('consuming');
  });
});

describe('v2.1 shape 契約 preserving 絶対維持', () => {
  it('T-S-PO-015 既存 semantics 触っていない', async () => {
    const mod = await import('../../src/semantics/index.js');
    expect(typeof mod.startPipeline).toBe('function');
    expect(typeof mod.dispatchPipelineEvent).toBe('function');
    expect(typeof mod.summarizePipeline).toBe('function');
  });
});
