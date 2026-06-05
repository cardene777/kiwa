import type { Hex, PublicClient } from 'viem';

function request(client: PublicClient, method: string, params: unknown[]): Promise<unknown> {
  return (
    client.request as unknown as (args: {
      method: string;
      params: unknown[];
    }) => Promise<unknown>
  )({ method, params });
}

export async function snapshotChain(client: PublicClient): Promise<Hex> {
  return (await request(client, 'evm_snapshot', [])) as Hex;
}

export async function revertChain(client: PublicClient, snapshotId: Hex): Promise<boolean> {
  return (await request(client, 'evm_revert', [snapshotId])) as boolean;
}
