/**
 * Unit tests for the mock adapter — 4 reorg scenarios walked entirely
 * in-process against `MockChainState`. Each op mutates state, revert unwinds,
 * and the assertion catches the balance / log / nonce snapping back.
 */

import { describe, expect, it } from 'vitest';
import {
  makeMockAdapter,
  MockChainState,
  runAllScenarios,
} from '../../src/index.js';

const OWNER = '0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266';
const RECIPIENT = '0x70997970c51812dc3a010c7d01b50e0d17dc79c8';

describe('dogfood-dapp-e2e-reorg — mock adapter scenarios', () => {
  it('T-DR-MOCK-001 pendingTx observes dropped state after revert', async () => {
    const adapter = makeMockAdapter();
    const result = await adapter.pendingTx();
    expect(result.op).toBe('pendingTx');
    expect(result.after.txStatus).toBe('dropped');
    expect(result.after.balance).toBe(result.before.balance);
    expect(result.after.nonce).toBe(result.before.nonce);
  });

  it('T-DR-MOCK-002 confirmedTx rolls balance back to pre-transfer', async () => {
    const adapter = makeMockAdapter();
    const result = await adapter.confirmedTx();
    expect(result.op).toBe('confirmedTx');
    expect(result.after.balance).toBe(result.before.balance);
    expect(result.after.txStatus).toBe('dropped');
  });

  it('T-DR-MOCK-003 transferEvent removes all 3 emitted logs on revert', async () => {
    const adapter = makeMockAdapter();
    const result = await adapter.transferEvent();
    expect(result.op).toBe('transferEvent');
    expect(result.after.logCount).toBe(result.before.logCount);
  });

  it('T-DR-MOCK-004 nonceGap resends at the same nonce after revert', async () => {
    const adapter = makeMockAdapter();
    const result = await adapter.nonceGap();
    expect(result.op).toBe('nonceGap');
    // Re-send after revert advances nonce by exactly 1.
    expect(result.after.nonce).toBe(result.before.nonce + 1);
    expect(result.after.txStatus).toBe('confirmed');
  });

  it('T-DR-MOCK-005 runAllScenarios walks all 4 ops deterministically', async () => {
    const adapter = makeMockAdapter();
    const results = await runAllScenarios(adapter);
    expect(results).toHaveLength(4);
    expect(results.map((r) => r.op)).toEqual([
      'pendingTx',
      'confirmedTx',
      'transferEvent',
      'nonceGap',
    ]);
    const trace = adapter.traces();
    expect(trace).toHaveLength(4);
    for (const entry of trace) {
      expect(entry.ok).toBe(true);
    }
  });

  it('T-DR-MOCK-006 mock adapter records per-op latency samples', async () => {
    const adapter = makeMockAdapter();
    await runAllScenarios(adapter);
    const samples = adapter.metrics().latencySamplesMs;
    expect(samples).toHaveLength(4);
    for (const sample of samples) {
      expect(sample).toBeGreaterThanOrEqual(0);
    }
  });

  it('T-DR-MOCK-007 MockChainState snapshot / revert round-trip preserves balance', () => {
    const state = new MockChainState();
    const before = state.balanceOf(OWNER);
    const snap = state.snapshot();
    state.transferConfirmed(OWNER, RECIPIENT, 100n * 10n ** 18n);
    expect(state.balanceOf(OWNER)).toBe(before - 100n * 10n ** 18n);
    expect(state.revert(snap)).toBe(true);
    expect(state.balanceOf(OWNER)).toBe(before);
    expect(state.logCount()).toBe(0);
    expect(state.blockNumber).toBe(0);
  });

  it('T-DR-MOCK-008 MockChainState revert with invalid id returns false', () => {
    const state = new MockChainState();
    expect(state.revert(-1)).toBe(false);
    expect(state.revert(999)).toBe(false);
  });

  it('T-DR-MOCK-009 mempool submitPending increments after mining but not before revert', () => {
    const state = new MockChainState();
    const hash = state.submitPending(OWNER, RECIPIENT, 5n * 10n ** 18n);
    expect(state.isPending(hash)).toBe(true);
    expect(state.confirmTx(hash)).toBe(true);
    expect(state.isPending(hash)).toBe(false);
    expect(state.isConfirmed(hash)).toBe(true);
  });

  it('T-DR-MOCK-010 mock adapter mode is "mock"', () => {
    const adapter = makeMockAdapter();
    expect(adapter.mode).toBe('mock');
  });
});
