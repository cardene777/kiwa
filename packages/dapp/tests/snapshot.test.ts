import { describe, expect, it, vi } from 'vitest';
import type { Hex, PublicClient } from 'viem';
import { revertChain, snapshotChain } from '../src/snapshot.js';

function makeClient(returns: unknown[]): {
  client: PublicClient;
  calls: Array<{ method: string; params: unknown[] }>;
} {
  let idx = 0;
  const calls: Array<{ method: string; params: unknown[] }> = [];
  const request = vi.fn(async (args: { method: string; params: unknown[] }) => {
    calls.push(args);
    return returns[idx++];
  });
  return { client: { request } as unknown as PublicClient, calls };
}

describe('snapshotChain', () => {
  it('T-SNAP-001 calls evm_snapshot and returns snapshot id', async () => {
    const { client, calls } = makeClient(['0x1']);
    const id = await snapshotChain(client);
    expect(calls[0]?.method).toBe('evm_snapshot');
    expect(id).toBe('0x1');
  });

  it('T-SNAP-002 returns hex-typed snapshot id', async () => {
    const { client } = makeClient(['0xabc']);
    const id = await snapshotChain(client);
    expect(id).toBe('0xabc');
  });

  it('T-SNAP-003 calls with empty params', async () => {
    const { client, calls } = makeClient(['0x0']);
    await snapshotChain(client);
    expect(calls[0]?.params).toEqual([]);
  });
});

describe('revertChain', () => {
  it('T-SNAP-004 calls evm_revert and returns true on success', async () => {
    const { client, calls } = makeClient([true]);
    const ok = await revertChain(client, '0x1' as Hex);
    expect(calls[0]?.method).toBe('evm_revert');
    expect(calls[0]?.params).toEqual(['0x1']);
    expect(ok).toBe(true);
  });

  it('T-SNAP-005 returns false when revert fails', async () => {
    const { client } = makeClient([false]);
    const ok = await revertChain(client, '0xfeed' as Hex);
    expect(ok).toBe(false);
  });

  it('T-SNAP-006 passes snapshot id verbatim', async () => {
    const { client, calls } = makeClient([true]);
    await revertChain(client, '0xdeadbeef' as Hex);
    expect(calls[0]?.params).toEqual(['0xdeadbeef']);
  });
});
