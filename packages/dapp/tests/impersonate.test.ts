import { describe, expect, it, vi } from 'vitest';
import type { Address, PublicClient } from 'viem';
import { impersonateAccount, setBalance, stopImpersonateAccount } from '../src/impersonate.js';

const ADDR = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as Address;

function makeClient(): {
  client: PublicClient;
  calls: Array<{ method: string; params: unknown[] }>;
} {
  const calls: Array<{ method: string; params: unknown[] }> = [];
  const request = vi.fn(async (args: { method: string; params: unknown[] }) => {
    calls.push(args);
    return undefined;
  });
  return { client: { request } as unknown as PublicClient, calls };
}

describe('impersonateAccount', () => {
  it('T-IMP-001 calls anvil_impersonateAccount with address', async () => {
    const { client, calls } = makeClient();
    await impersonateAccount(client, ADDR);
    expect(calls[0]?.method).toBe('anvil_impersonateAccount');
    expect(calls[0]?.params).toEqual([ADDR]);
  });

  it('T-IMP-002 single call only', async () => {
    const { client, calls } = makeClient();
    await impersonateAccount(client, ADDR);
    expect(calls.length).toBe(1);
  });
});

describe('stopImpersonateAccount', () => {
  it('T-IMP-003 calls anvil_stopImpersonatingAccount', async () => {
    const { client, calls } = makeClient();
    await stopImpersonateAccount(client, ADDR);
    expect(calls[0]?.method).toBe('anvil_stopImpersonatingAccount');
    expect(calls[0]?.params).toEqual([ADDR]);
  });
});

describe('setBalance', () => {
  it('T-IMP-004 calls anvil_setBalance with hex-encoded wei', async () => {
    const { client, calls } = makeClient();
    await setBalance(client, ADDR, 1000n);
    expect(calls[0]?.method).toBe('anvil_setBalance');
    expect(calls[0]?.params).toEqual([ADDR, '0x3e8']);
  });

  it('T-IMP-005 zero balance encoded as 0x0', async () => {
    const { client, calls } = makeClient();
    await setBalance(client, ADDR, 0n);
    expect(calls[0]?.params).toEqual([ADDR, '0x0']);
  });

  it('T-IMP-006 large bigint encoded correctly', async () => {
    const { client, calls } = makeClient();
    const oneEth = 10n ** 18n;
    await setBalance(client, ADDR, oneEth);
    expect(calls[0]?.params).toEqual([ADDR, `0x${oneEth.toString(16)}`]);
  });
});
