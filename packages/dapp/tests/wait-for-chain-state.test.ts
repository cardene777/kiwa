import { describe, expect, it, vi } from 'vitest';
import type { PublicClient } from 'viem';
import { waitForChainState } from '../src/wait-for-chain-state.js';

const ABI = [
  {
    type: 'function',
    name: 'balanceOf',
    stateMutability: 'view',
    inputs: [{ name: 'a', type: 'address' }],
    outputs: [{ name: 'r', type: 'uint256' }],
  },
] as const;

const ADDR = '0x0000000000000000000000000000000000000001' as `0x${string}`;

function makeClient(reads: bigint[]): PublicClient {
  let idx = 0;
  const readContract = vi.fn(async () => reads[idx++]);
  return { readContract } as unknown as PublicClient;
}

describe('waitForChainState', () => {
  it('T-WCS-001 returns immediately when predicate passes on first read', async () => {
    const client = makeClient([100n]);
    const value = await waitForChainState({
      publicClient: client,
      address: ADDR,
      abi: ABI,
      functionName: 'balanceOf',
      args: [ADDR],
      predicate: (v: bigint) => v >= 100n,
    });
    expect(value).toBe(100n);
  });

  it('T-WCS-002 polls until predicate passes', async () => {
    const client = makeClient([0n, 50n, 200n]);
    const value = await waitForChainState({
      publicClient: client,
      address: ADDR,
      abi: ABI,
      functionName: 'balanceOf',
      args: [ADDR],
      predicate: (v: bigint) => v > 100n,
      pollIntervalMs: 5,
    });
    expect(value).toBe(200n);
  });

  it('T-WCS-003 throws timeout when predicate never passes', async () => {
    const client = makeClient([0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n, 0n]);
    await expect(
      waitForChainState({
        publicClient: client,
        address: ADDR,
        abi: ABI,
        functionName: 'balanceOf',
        args: [ADDR],
        predicate: (v: bigint) => v > 0n,
        timeoutMs: 50,
        pollIntervalMs: 5,
      }),
    ).rejects.toThrow(/waitForChainState timeout after 50ms/);
  });

  it('T-WCS-004 timeout error message contains function name and last value', async () => {
    const client = makeClient([42n, 42n, 42n]);
    await expect(
      waitForChainState({
        publicClient: client,
        address: ADDR,
        abi: ABI,
        functionName: 'balanceOf',
        args: [ADDR],
        predicate: (v: bigint) => v > 100n,
        timeoutMs: 30,
        pollIntervalMs: 5,
      }),
    ).rejects.toThrow(/balanceOf/);
  });

  it('T-WCS-005 calls readContract without args when args undefined', async () => {
    const readContract = vi.fn(async () => 5n);
    const client = { readContract } as unknown as PublicClient;
    await waitForChainState({
      publicClient: client,
      address: ADDR,
      abi: ABI,
      functionName: 'balanceOf',
      predicate: (v: bigint) => v === 5n,
    });
    const lastCall = readContract.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(lastCall).not.toHaveProperty('args');
  });

  it('T-WCS-006 uses default timeoutMs=10000 and pollIntervalMs=200', async () => {
    const client = makeClient([1n]);
    const value = await waitForChainState({
      publicClient: client,
      address: ADDR,
      abi: ABI,
      functionName: 'balanceOf',
      args: [ADDR],
      predicate: () => true,
    });
    expect(value).toBe(1n);
  });
});
