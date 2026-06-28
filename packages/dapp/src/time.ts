import type { PublicClient } from 'viem';

function request(client: PublicClient, method: string, params: unknown[]): Promise<unknown> {
  return (
    client.request as unknown as (args: {
      method: string;
      params: unknown[];
    }) => Promise<unknown>
  )({ method, params });
}

export async function increaseTime(
  client: PublicClient,
  seconds: number | bigint,
): Promise<void> {
  await request(client, 'evm_increaseTime', [Number(seconds)]);
  await request(client, 'evm_mine', []);
}

export async function mineBlock(client: PublicClient, count: number = 1): Promise<void> {
  for (let i = 0; i < count; i += 1) {
    await request(client, 'evm_mine', []);
  }
}

export async function setNextBlockTimestamp(
  client: PublicClient,
  ts: number | bigint,
): Promise<void> {
  await request(client, 'evm_setNextBlockTimestamp', [Number(ts)]);
}
