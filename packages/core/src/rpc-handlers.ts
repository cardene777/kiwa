import { hexToBigInt, numberToHex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sendTransaction } from './tx.js';
import {
  type ApprovalMode,
  type ChainConfig,
  Eip1193Error,
  type DappE2eEventEmitter,
  type Eip1193Request,
  type Hex,
  type SendTxParams,
} from './types.js';

export interface RpcContext {
  privateKey: Hex;
  /**
   * setActiveAccount(index) で切替可能な複数 dev account の private key 配列。
   * 未指定の場合は `[privateKey]` 相当として扱い (下位互換)、activeIndex も常に 0 に固定。
   */
  accounts?: readonly Hex[];
  /**
   * accounts 配列内の active な index。setActiveAccount で更新される。
   * 範囲は `[0, accounts.length - 1]`、accounts 未指定なら 0 固定。
   */
  activeIndex?: { current: number };
  chainState: { current: number };
  approvalMode?: { current: ApprovalMode };
  anvilPort?: number;
  emitter?: DappE2eEventEmitter;
  /**
   * 登録済 chain の registry。
   * `wallet_switchEthereumChain` が参照し、未登録 chainId は EIP-1193 code 4902 で reject する。
   * 未指定 (undefined) の場合は registry チェック自体が無効化される (下位互換、従来挙動)。
   */
  chainRegistry?: { current: ChainConfig[] };
}

/**
 * 現在 active な private key を返す。accounts / activeIndex が設定されていればそこから解決、
 * なければ ctx.privateKey にフォールバックする (下位互換)。
 */
export function resolveActivePrivateKey(ctx: RpcContext): Hex {
  const accounts = ctx.accounts;
  const index = ctx.activeIndex?.current ?? 0;
  if (!accounts || accounts.length === 0) {
    return ctx.privateKey;
  }
  const key = accounts[index];
  if (!key) {
    throw new Eip1193Error(
      -32603,
      `internal: activeIndex ${index} out of bounds for accounts length ${accounts.length}`,
    );
  }
  return key;
}

const BLOCKED_METHODS = new Set([
  'eth_subscribe',
  'eth_unsubscribe',
  'wallet_requestPermissions',
  'wallet_getPermissions',
  'eth_sign',
]);

/**
 * Handle a single EIP-1193 JSON-RPC request from the injected provider.
 *
 * personal_sign accepts either:
 * - A 0x-prefixed even-length hex string (signed as raw bytes, MetaMask compatible)
 * - A plain UTF-8 string (signed with the \x19Ethereum Signed Message:\n prefix)
 *
 * Strings prefixed with 0x that contain non-hex characters or have odd length
 * are rejected with EIP-1193 code -32602 (invalid params).
 */
export async function handleRpcRequest(
  ctx: RpcContext,
  request: Eip1193Request,
): Promise<unknown> {
  if (BLOCKED_METHODS.has(request.method)) {
    throw new Eip1193Error(4200, `method not supported: ${request.method}`);
  }

  const account = privateKeyToAccount(resolveActivePrivateKey(ctx));
  const params = (request.params ?? []) as unknown[];

  switch (request.method) {
    case 'eth_requestAccounts':
    case 'eth_accounts': {
      // accounts 配列が設定されている場合は active を先頭に並べた全 account を返す
      // (MetaMask は active account を先頭に残りを後続に並べる挙動)
      const accounts = ctx.accounts;
      if (!accounts || accounts.length === 0) {
        return [account.address];
      }
      const index = ctx.activeIndex?.current ?? 0;
      const addresses = accounts.map((k) => privateKeyToAccount(k).address);
      const active = addresses[index];
      const rest = addresses.filter((_, i) => i !== index);
      return active ? [active, ...rest] : addresses;
    }

    case 'eth_chainId':
      return numberToHex(ctx.chainState.current);

    case 'net_version':
      return String(ctx.chainState.current);

    case 'personal_sign': {
      assertApproved(ctx);
      const [message, address] = params as [string, Hex];
      if (typeof address !== 'string' || address.toLowerCase() !== account.address.toLowerCase()) {
        throw new Eip1193Error(
          4100,
          `unauthorized: requested address ${address} does not match active account ${account.address}`,
        );
      }
      if (typeof message !== 'string') {
        throw new Eip1193Error(
          -32602,
          `invalid params: message must be a string, got ${typeof message}`,
        );
      }
      let msgInput: string | { raw: Hex };
      if (message.startsWith('0x')) {
        // hex string policy: must be even-length hex digits only (MetaMask compatible)
        if (message.length % 2 !== 0 || !/^0x[0-9a-fA-F]*$/.test(message)) {
          throw new Eip1193Error(
            -32602,
            `invalid params: message looks like hex but contains non-hex characters or odd length: ${message}`,
          );
        }
        msgInput = { raw: message as Hex };
      } else {
        msgInput = message;
      }
      return account.signMessage({ message: msgInput });
    }

    case 'eth_signTypedData_v4': {
      assertApproved(ctx);
      const [signerAddress, typedDataJson] = params as [Hex, string];
      assertAuthorizedAddress('requested signer', signerAddress, account.address);
      let typedData: {
        domain?: Record<string, unknown>;
        types: Record<string, unknown>;
        primaryType: string;
        message: Record<string, unknown>;
      };
      try {
        typedData = JSON.parse(typedDataJson) as {
          domain?: Record<string, unknown>;
          types: Record<string, unknown>;
          primaryType: string;
          message: Record<string, unknown>;
        };
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        throw new Eip1193Error(-32700, `parse error: ${message}`);
      }
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
      assertApproved(ctx);
      const chainIdHex = getRequiredChainIdHex(params[0]);
      // chainRegistry が設定されている場合のみ未登録 chain を 4902 で reject (EIP-3326)
      if (ctx.chainRegistry) {
        const registered = ctx.chainRegistry.current.some(
          (chain) => chain.chainId.toLowerCase() === chainIdHex.toLowerCase(),
        );
        if (!registered) {
          throw new Eip1193Error(
            4902,
            `Unrecognized Chain ID "${chainIdHex}". Try adding the chain via wallet_addEthereumChain first.`,
          );
        }
      }
      ctx.chainState.current = parseChainIdHex(chainIdHex);
      ctx.emitter?.emit('chainChanged', chainIdHex);
      return null;
    }

    case 'wallet_addEthereumChain': {
      const chainConfig = parseChainConfig(params[0]);
      // chainRegistry が設定されている場合は registry に追加 (既存と同 chainId は上書き)
      if (ctx.chainRegistry) {
        const existing = ctx.chainRegistry.current.findIndex(
          (c) => c.chainId.toLowerCase() === chainConfig.chainId.toLowerCase(),
        );
        if (existing >= 0) {
          ctx.chainRegistry.current[existing] = chainConfig;
        } else {
          ctx.chainRegistry.current.push(chainConfig);
        }
      }
      ctx.chainState.current = parseChainIdHex(chainConfig.chainId);
      ctx.emitter?.emit('chainChanged', chainConfig.chainId);
      return null;
    }

    case 'eth_sendTransaction': {
      assertApproved(ctx);
      if (!ctx.anvilPort) {
        throw new Eip1193Error(
          -32603,
          `RPC method '${request.method}' requires anvilPort in RpcContext (not provided for live anvil tests)`,
        );
      }
      const txParams = (params[0] ?? {}) as Record<string, unknown>;
      const from = txParams.from;
      if (typeof from === 'string') {
        assertAuthorizedAddress('from', from as Hex, account.address);
      }
      return sendTransaction(
        {
          privateKey: resolveActivePrivateKey(ctx),
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

function assertApproved(ctx: RpcContext): void {
  const mode = ctx.approvalMode?.current ?? 'approve';
  if (mode === 'reject') {
    throw new Eip1193Error(4001, 'User rejected the request.');
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
  let res: Response;
  try {
    res = await fetch(`http://127.0.0.1:${port}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    });
  } catch (e) {
    throw new Eip1193Error(
      -32603,
      `anvil RPC transport error: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (!res.ok) {
    throw new Eip1193Error(
      -32603,
      `anvil RPC non-200 response: ${res.status} ${res.statusText}`,
    );
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch (e) {
    throw new Eip1193Error(
      -32603,
      `anvil RPC non-JSON response: ${e instanceof Error ? e.message : String(e)}`,
    );
  }
  if (json === null || typeof json !== 'object' || Array.isArray(json)) {
    const shape =
      json === null ? 'null' : Array.isArray(json) ? 'array' : typeof json;
    throw new Eip1193Error(
      -32603,
      `anvil RPC invalid response shape: expected object, got ${shape}`,
    );
  }
  const parsed = json as {
    result?: unknown;
    error?: { code: number; message: string };
  };
  if (parsed.error) throw new Eip1193Error(parsed.error.code, parsed.error.message);
  return parsed.result;
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

function parseChainConfig(param: unknown): ChainConfig {
  if (typeof param !== 'object' || param === null) {
    throw new Eip1193Error(-32602, 'invalid params: chain config object is required');
  }
  const obj = param as Record<string, unknown>;
  const chainId = obj.chainId;
  if (typeof chainId !== 'string' || !/^0x[0-9a-fA-F]+$/.test(chainId)) {
    throw new Eip1193Error(
      -32602,
      `invalid params: chainId must be 0x-prefixed hex, got ${String(chainId)}`,
    );
  }
  const config: ChainConfig = { chainId: chainId as Hex };
  if (typeof obj.chainName === 'string') config.chainName = obj.chainName;
  if (Array.isArray(obj.rpcUrls)) {
    config.rpcUrls = obj.rpcUrls.filter((u): u is string => typeof u === 'string');
  }
  if (Array.isArray(obj.blockExplorerUrls)) {
    config.blockExplorerUrls = obj.blockExplorerUrls.filter((u): u is string => typeof u === 'string');
  }
  if (typeof obj.nativeCurrency === 'object' && obj.nativeCurrency !== null) {
    const nc = obj.nativeCurrency as Record<string, unknown>;
    if (
      typeof nc.name === 'string' &&
      typeof nc.symbol === 'string' &&
      typeof nc.decimals === 'number'
    ) {
      config.nativeCurrency = {
        name: nc.name,
        symbol: nc.symbol,
        decimals: nc.decimals,
      };
    }
  }
  return config;
}

export { BLOCKED_METHODS };
