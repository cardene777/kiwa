import { expect } from '@playwright/test';
import { erc20Abi, type Address, type PublicClient } from 'viem';

export async function expectBalanceChange(
  client: PublicClient,
  token: Address,
  account: Address,
  delta: bigint,
  action: () => Promise<void>,
): Promise<void> {
  const before = (await client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account],
  })) as bigint;

  await action();

  const after = (await client.readContract({
    address: token,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [account],
  })) as bigint;

  expect(after - before).toBe(delta);
}

export async function expectEthBalanceChange(
  client: PublicClient,
  account: Address,
  delta: bigint,
  action: () => Promise<void>,
): Promise<void> {
  const before = await client.getBalance({ address: account });
  await action();
  const after = await client.getBalance({ address: account });
  expect(after - before).toBe(delta);
}
