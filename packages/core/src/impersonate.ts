import type { Address, PublicClient } from 'viem';

function request(client: PublicClient, method: string, params: unknown[]): Promise<unknown> {
  return (
    client.request as unknown as (args: {
      method: string;
      params: unknown[];
    }) => Promise<unknown>
  )({ method, params });
}

export async function impersonateAccount(client: PublicClient, address: Address): Promise<void> {
  await request(client, 'anvil_impersonateAccount', [address]);
}

export async function stopImpersonateAccount(
  client: PublicClient,
  address: Address,
): Promise<void> {
  await request(client, 'anvil_stopImpersonatingAccount', [address]);
}

export async function setBalance(
  client: PublicClient,
  address: Address,
  wei: bigint,
): Promise<void> {
  await request(client, 'anvil_setBalance', [address, `0x${wei.toString(16)}`]);
}
