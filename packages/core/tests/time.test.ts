import { describe, expect, it, vi } from 'vitest';
import type { PublicClient } from 'viem';
import { increaseTime, mineBlock, setNextBlockTimestamp } from '../src/time.js';

function makeClient(): { client: PublicClient; calls: Array<{ method: string; params: unknown[] }> } {
  const calls: Array<{ method: string; params: unknown[] }> = [];
  const request = vi.fn(async (args: { method: string; params: unknown[] }) => {
    calls.push(args);
    return undefined;
  });
  return { client: { request } as unknown as PublicClient, calls };
}

describe('increaseTime', () => {
  it('T-TIME-001 calls evm_increaseTime then evm_mine', async () => {
    const { client, calls } = makeClient();
    await increaseTime(client, 100);
    expect(calls.length).toBe(2);
    expect(calls[0]?.method).toBe('evm_increaseTime');
    expect(calls[0]?.params).toEqual([100]);
    expect(calls[1]?.method).toBe('evm_mine');
  });

  it('T-TIME-002 accepts bigint and coerces to Number', async () => {
    const { client, calls } = makeClient();
    await increaseTime(client, 100n);
    expect(calls[0]?.params).toEqual([100]);
  });

  it('T-TIME-003 calls evm_mine with no params', async () => {
    const { client, calls } = makeClient();
    await increaseTime(client, 10);
    expect(calls[1]?.params).toEqual([]);
  });
});

describe('mineBlock', () => {
  it('T-TIME-004 mines 1 block by default', async () => {
    const { client, calls } = makeClient();
    await mineBlock(client);
    expect(calls.length).toBe(1);
    expect(calls[0]?.method).toBe('evm_mine');
  });

  it('T-TIME-005 mines N blocks', async () => {
    const { client, calls } = makeClient();
    await mineBlock(client, 5);
    expect(calls.length).toBe(5);
    expect(calls.every((c) => c.method === 'evm_mine')).toBe(true);
  });

  it('T-TIME-006 mineBlock(0) - no mining', async () => {
    const { client, calls } = makeClient();
    await mineBlock(client, 0);
    expect(calls.length).toBe(0);
  });

  it('T-TIME-007 params empty array for evm_mine', async () => {
    const { client, calls } = makeClient();
    await mineBlock(client, 2);
    expect(calls.every((c) => c.params.length === 0)).toBe(true);
  });
});

describe('setNextBlockTimestamp', () => {
  it('T-TIME-008 calls evm_setNextBlockTimestamp with number', async () => {
    const { client, calls } = makeClient();
    await setNextBlockTimestamp(client, 1700000000);
    expect(calls[0]?.method).toBe('evm_setNextBlockTimestamp');
    expect(calls[0]?.params).toEqual([1700000000]);
  });

  it('T-TIME-009 accepts bigint and coerces to Number', async () => {
    const { client, calls } = makeClient();
    await setNextBlockTimestamp(client, 1700000000n);
    expect(calls[0]?.params).toEqual([1700000000]);
  });

  it('T-TIME-010 calls only once (single rpc)', async () => {
    const { client, calls } = makeClient();
    await setNextBlockTimestamp(client, 1);
    expect(calls.length).toBe(1);
  });
});
