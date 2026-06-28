import { describe, expect, it, vi } from 'vitest';
import type { Address, PublicClient } from 'viem';
import { expectBalanceChange, expectEthBalanceChange } from '../src/balance-change.js';

const TOKEN = '0x1111111111111111111111111111111111111111' as Address;
const ACCOUNT = '0x2222222222222222222222222222222222222222' as Address;

function makeClient(reads: bigint[], balances: bigint[]): {
  client: PublicClient;
  readCalls: number;
  balanceCalls: number;
} {
  let readIdx = 0;
  let balIdx = 0;
  const readContract = vi.fn(async () => reads[readIdx++]);
  const getBalance = vi.fn(async () => balances[balIdx++]);
  return {
    client: { readContract, getBalance } as unknown as PublicClient,
    get readCalls() {
      return readContract.mock.calls.length;
    },
    get balanceCalls() {
      return getBalance.mock.calls.length;
    },
  };
}

describe('expectBalanceChange', () => {
  it('T-BC-001 PASS when delta matches', async () => {
    const { client } = makeClient([100n, 150n], []);
    let actionRan = false;
    await expectBalanceChange(client, TOKEN, ACCOUNT, 50n, async () => {
      actionRan = true;
    });
    expect(actionRan).toBe(true);
  });

  it('T-BC-002 throws when delta mismatches', async () => {
    const { client } = makeClient([100n, 100n], []);
    await expect(expectBalanceChange(client, TOKEN, ACCOUNT, 50n, async () => {})).rejects.toThrow();
  });

  it('T-BC-003 negative delta supported', async () => {
    const { client } = makeClient([100n, 50n], []);
    await expectBalanceChange(client, TOKEN, ACCOUNT, -50n, async () => {});
  });

  it('T-BC-004 reads before and after action', async () => {
    const c = makeClient([10n, 20n], []);
    await expectBalanceChange(c.client, TOKEN, ACCOUNT, 10n, async () => {});
    expect(c.readCalls).toBe(2);
  });

  it('T-BC-005 zero delta when no balance change', async () => {
    const { client } = makeClient([42n, 42n], []);
    await expectBalanceChange(client, TOKEN, ACCOUNT, 0n, async () => {});
  });
});

describe('expectEthBalanceChange', () => {
  it('T-BC-006 PASS when ETH delta matches', async () => {
    const { client } = makeClient([], [1000n, 1500n]);
    await expectEthBalanceChange(client, ACCOUNT, 500n, async () => {});
  });

  it('T-BC-007 throws when ETH delta mismatches', async () => {
    const { client } = makeClient([], [1000n, 1000n]);
    await expect(expectEthBalanceChange(client, ACCOUNT, 100n, async () => {})).rejects.toThrow();
  });

  it('T-BC-008 negative ETH delta', async () => {
    const { client } = makeClient([], [1000n, 500n]);
    await expectEthBalanceChange(client, ACCOUNT, -500n, async () => {});
  });

  it('T-BC-009 reads getBalance twice', async () => {
    const c = makeClient([], [1n, 2n]);
    await expectEthBalanceChange(c.client, ACCOUNT, 1n, async () => {});
    expect(c.balanceCalls).toBe(2);
  });

  it('T-BC-010 zero ETH delta when balance unchanged', async () => {
    const { client } = makeClient([], [777n, 777n]);
    await expectEthBalanceChange(client, ACCOUNT, 0n, async () => {});
  });
});
