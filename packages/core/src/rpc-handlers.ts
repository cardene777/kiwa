import { hexToBigInt, numberToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import {
  Eip1193Error,
  type DappE2eEventEmitter,
  type Eip1193Request,
  type Hex,
  type SendTxParams,
} from './types.js';

export interface RpcContext {
  privateKey: Hex;
  chainState: { current: number };
  anvilPort?: number;
  emitter?: DappE2eEventEmitter;
}

const BLOCKED_METHODS = new Set([
  'eth_subscribe',
  'eth_unsubscribe',
  'wallet_requestPermissions',
  'wallet_getPermissions',
  'eth_sign',
]);

export async function handleRpcRequest(
  ctx: RpcContext,
  request: Eip1193Request,
): Promise<unknown> {
  if (BLOCKED_METHODS.has(request.method)) {
    throw new Eip1193Error(4200, `method not supported: ${request.method}`);
  }

  const account = privateKeyToAccount(ctx.privateKey);
  const params = (request.params ?? []) as unknown[];

  switch (request.method) {
    case 'eth_requestAccounts':
    case 'eth_accounts':
      return [account.address];

    case 'eth_chainId':
      return numberToHex(ctx.chainState.current);

    case 'net_version':
      return String(ctx.chainState.current);

    case 'personal_sign': {
      const [message, address] = params as [string, Hex];
      assertAuthorizedAddress('requested address', address, account.address);
      const msgInput =
        typeof message === 'string' && message.startsWith('0x')
          ? { raw: message as Hex }
          : message;
      return account.signMessage({ message: msgInput });
    }

    case 'eth_signTypedData_v4': {
      const [signerAddress, typedDataJson] = params as [Hex, string];
      assertAuthorizedAddress('requested signer', signerAddress, account.address);
      const typedData = JSON.parse(typedDataJson) as {
        domain?: Record<string, unknown>;
        types: Record<string, unknown>;
        primaryType: string;
        message: Record<string, unknown>;
      };
      const filteredTypes = { ...typedData.types };
      delete filteredTypes.EIP712Domain;
      return (account.signTypedData as (...args: any[]) => Promise<Hex>)({
        domain: typedData.domain,
        types: filteredTypes,
        primaryType: typedData.primaryType,
        message: typedData.message,
      });
    }

    case 'wallet_switchEthereumChain': {
      const chainIdHex = getRequiredChainIdHex(params[0]);
      ctx.chainState.current = parseChainIdHex(chainIdHex);
      ctx.emitter?.emit('chainChanged', chainIdHex);
      return null;
    }

    case 'wallet_addEthereumChain': {
      const chainIdHex = getRequiredChainIdHex(params[0]);
      ctx.chainState.current = parseChainIdHex(chainIdHex);
      ctx.emitter?.emit('chainChanged', chainIdHex);
      return null;
    }

    case 'eth_sendTransaction': {
      if (!ctx.anvilPort) {
        throw new Eip1193Error(
          -32603,
          `RPC method '${request.method}' requires anvilPort in RpcContext (not provided for live anvil tests)`,
        );
      }
      const { sendTransaction } = await import('./tx.js');
      const txParams = (params[0] ?? {}) as Record<string, unknown>;
      const from = txParams.from;
      if (typeof from === 'string') {
        assertAuthorizedAddress('from', from as Hex, account.address);
      }
      return sendTransaction(
        {
          privateKey: ctx.privateKey,
          chainId: ctx.chainState.current,
          anvilPort: ctx.anvilPort,
        },
        normalizeTxParams(txParams),
      );
    }

    default:
      return proxyToAnvil(ctx, request.method, params);
  }
}

function normalizeTxParams(p: Record<string, unknown>): SendTxParams {
  const out: SendTxParams = {};
  if (typeof p.to === 'string') out.to = p.to as Hex;
  if (typeof p.from === 'string') out.from = p.from as Hex;
  if (typeof p.data === 'string') out.data = p.data as Hex;
  if (typeof p.value === 'string') out.value = hexToBigInt(p.value as Hex);
  if (typeof p.value === 'bigint') out.value = p.value;
  if (typeof p.gas === 'string') out.gas = hexToBigInt(p.gas as Hex);
  if (typeof p.gas === 'bigint') out.gas = p.gas;
  return out;
}

async function anvilProxy(port: number, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(`http://127.0.0.1:${port}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const json = (await res.json()) as {
    result?: unknown;
    error?: { code: number; message: string };
  };
  if (json.error) throw new Eip1193Error(json.error.code, json.error.message);
  return json.result;
}

async function proxyToAnvil(
  ctx: RpcContext,
  method: string,
  params: unknown[],
): Promise<unknown> {
  if (!ctx.anvilPort) {
    throw new Eip1193Error(
      -32603,
      `RPC method '${method}' requires anvilPort in RpcContext (not provided for live anvil tests)`,
    );
  }
  return anvilProxy(ctx.anvilPort, method, params);
}

function assertAuthorizedAddress(
  label: string,
  requestedAddress: Hex,
  activeAddress: Hex,
) {
  if (
    typeof requestedAddress !== 'string' ||
    requestedAddress.toLowerCase() !== activeAddress.toLowerCase()
  ) {
    throw new Eip1193Error(
      4100,
      `unauthorized: ${label} ${requestedAddress} does not match active account ${activeAddress}`,
    );
  }
}

function getRequiredChainIdHex(param: unknown): Hex {
  if (
    typeof param !== 'object' ||
    param === null ||
    typeof (param as { chainId?: unknown }).chainId !== 'string'
  ) {
    throw new Eip1193Error(-32602, 'invalid params: chainId is required');
  }
  const chainIdHex = (param as { chainId: string }).chainId;
  if (!/^0x[0-9a-fA-F]+$/.test(chainIdHex)) {
    throw new Eip1193Error(-32602, `invalid params: invalid chainId ${chainIdHex}`);
  }
  return chainIdHex as Hex;
}

function parseChainIdHex(chainIdHex: Hex): number {
  return Number.parseInt(chainIdHex, 16);
}

export { BLOCKED_METHODS };
