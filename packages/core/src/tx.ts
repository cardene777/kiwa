import {
  BaseError,
  HttpRequestError,
  InvalidParamsRpcError,
  createWalletClient,
  defineChain,
  hexToBigInt,
  http,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Eip1193Error, type Hex, type SendTxParams, type TxBroadcastCtx } from './types.js';

function walkCause(err: unknown, maxDepth = 10): unknown {
  const visited = new WeakSet<object>();
  let current: unknown = err;
  let depth = 0;

  while (
    current !== null &&
    typeof current === 'object' &&
    !visited.has(current) &&
    depth < maxDepth
  ) {
    visited.add(current);
    if ('cause' in current && (current as { cause?: unknown }).cause) {
      current = (current as { cause: unknown }).cause;
      depth += 1;
      continue;
    }
    break;
  }

  return current;
}

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

function hasTransportFailure(error: unknown): boolean {
  let current: unknown = error;

  while (current !== null && typeof current === 'object') {
    if (current instanceof HttpRequestError) {
      return true;
    }

    const candidate = current as {
      cause?: unknown;
      code?: unknown;
      message?: unknown;
      shortMessage?: unknown;
    };
    const details = [candidate.shortMessage, candidate.message, candidate.code]
      .filter((value): value is string => typeof value === 'string')
      .join(' ');

    if (/HTTP request failed|fetch failed|ECONNREFUSED|network|connect/i.test(details)) {
      return true;
    }

    const next = walkCause(current);
    if (next === current) {
      break;
    }
    current = next;
  }

  return false;
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
    if (e instanceof BaseError) {
      if (hasTransportFailure(e)) {
        throw new Eip1193Error(
          -32603,
          `transaction transport error: ${e.shortMessage ?? e.message}`,
        );
      }
      const root = walkCause(e);
      if (root instanceof InvalidParamsRpcError) {
        throw new Eip1193Error(
          -32602,
          `transaction invalid params: ${e.shortMessage ?? e.message}`,
        );
      }
      throw new Eip1193Error(3, `transaction rejected: ${e.shortMessage ?? e.message}`);
    }
    const message = e instanceof Error ? e.message : String(e);
    if (/fetch failed|ECONNREFUSED|network|connect/i.test(message)) {
      throw new Eip1193Error(-32603, `transaction transport error: ${message}`);
    }
    throw new Eip1193Error(3, `transaction rejected: ${message}`);
  }
}
