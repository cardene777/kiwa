import { createWalletClient, defineChain, hexToBigInt, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Eip1193Error, type Hex, type SendTxParams, type TxBroadcastCtx } from './types.js';

function defineAnvil(chainId: number, port: number) {
  return defineChain({
    id: chainId,
    name: 'Anvil',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: {
      default: { http: [`http://127.0.0.1:${port}`] },
    },
  });
}

export async function sendTransaction(
  ctx: TxBroadcastCtx,
  params: SendTxParams,
): Promise<Hex> {
  const account = privateKeyToAccount(ctx.privateKey);
  const chain = defineAnvil(ctx.chainId, ctx.anvilPort);
  const client = createWalletClient({
    chain,
    transport: http(`http://127.0.0.1:${ctx.anvilPort}`),
    account,
  });

  const value =
    typeof params.value === 'string'
      ? hexToBigInt(params.value as Hex)
      : params.value;
  const gas =
    typeof params.gas === 'string'
      ? hexToBigInt(params.gas as Hex)
      : params.gas;

  try {
    const hash = await client.sendTransaction({
      to: params.to ?? null,
      value,
      data: params.data,
      gas,
    } as never);
    return hash;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Eip1193Error(3, `transaction rejected: ${message}`);
  }
}
