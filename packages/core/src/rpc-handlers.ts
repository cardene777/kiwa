import {
  decodeFunctionData,
  encodeFunctionData,
  hashMessage,
  hashTypedData,
  hexToBigInt,
  numberToHex,
  parseAbi,
  type Hex as ViemHex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { z } from 'zod';
import { verifyEip1271Signature } from './eip1271.js';
import { sendTransaction } from './tx.js';
import {
  type Address,
  type ApprovalMode,
  type ApprovalPolicy,
  type ChainConfig,
  type ContractAccountRpcConfig,
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
  approvalPolicy?: { current: ApprovalPolicy };
  anvilPort?: number;
  emitter?: DappE2eEventEmitter;
  /**
   * 登録済 chain の registry。
   * `wallet_switchEthereumChain` が参照し、未登録 chainId は EIP-1193 code 4902 で reject する。
   * 未指定 (undefined) の場合は registry チェック自体が無効化される (下位互換、従来挙動)。
   */
  chainRegistry?: { current: ChainConfig[] };
  contractAccount?: ContractAccountRpcConfig;
}

export const DEFAULT_CONTRACT_ACCOUNT_EXECUTE_ABI = [
  'function execute(address target, uint256 value, bytes data) returns (bytes)',
] as const;

const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

const Eip712DomainSchema = z.object({
  name: z.string().optional(),
  version: z.string().optional(),
  chainId: z.union([z.number(), z.string()]).optional(),
  verifyingContract: z.string().optional(),
  salt: z.string().optional(),
});

const Eip712TypedDataSchema = z.object({
  types: z.record(
    z.string(),
    z.array(
      z.object({
        name: z.string(),
        type: z.string(),
      }),
    ),
  ),
  primaryType: z.string(),
  domain: Eip712DomainSchema,
  message: z.record(z.string(), z.unknown()),
});

type ParsedEip712TypedData = z.output<typeof Eip712TypedDataSchema>;
type NormalizedEip712TypedData = {
  domain: {
    name?: string;
    version?: string;
    chainId?: number;
    verifyingContract?: Hex;
    salt?: Hex;
  };
  types: Record<string, ReadonlyArray<{ name: string; type: string }>>;
  primaryType: string;
  message: Record<string, unknown>;
};

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

export function resolveActiveAddress(ctx: RpcContext): Address {
  if (ctx.contractAccount) {
    return ctx.contractAccount.address;
  }
  return privateKeyToAccount(resolveActivePrivateKey(ctx)).address;
}

function resolveRegistryAnvilPort(ctx: RpcContext): number | undefined {
  const registry = ctx.chainRegistry?.current;
  if (!registry) return undefined;

  const activeChainHex = numberToHex(ctx.chainState.current).toLowerCase();
  const chain = registry.find((entry) => entry.chainId.toLowerCase() === activeChainHex);
  const rpcUrl = chain?.rpcUrls?.find((value) => typeof value === 'string');
  if (!rpcUrl) return undefined;

  try {
    const parsed = new URL(rpcUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return undefined;
    if (parsed.hostname !== '127.0.0.1' && parsed.hostname !== 'localhost') return undefined;
    const port = Number.parseInt(parsed.port, 10);
    return Number.isInteger(port) && port > 0 ? port : undefined;
  } catch {
    return undefined;
  }
}

function resolveAnvilPort(ctx: RpcContext): number | undefined {
  return resolveRegistryAnvilPort(ctx) ?? ctx.anvilPort;
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
  const activeAddress = resolveActiveAddress(ctx);
  const params = (request.params ?? []) as unknown[];

  switch (request.method) {
    case 'eth_requestAccounts':
    case 'eth_accounts': {
      if (ctx.contractAccount) {
        return [ctx.contractAccount.address];
      }
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
      if (typeof address !== 'string' || address.toLowerCase() !== activeAddress.toLowerCase()) {
        throw new Eip1193Error(
          4100,
          `unauthorized: requested address ${address} does not match active account ${activeAddress}`,
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
      const signature = await account.signMessage({ message: msgInput });
      if (ctx.contractAccount) {
        await assertValidContractAccountSignature(ctx, {
          signature,
          messageHash: hashMessage(msgInput),
        });
      }
      return signature;
    }

    case 'eth_signTypedData_v4': {
      assertApproved(ctx);
      const [signerAddress, typedDataJson] = params as [Hex, string];
      assertAuthorizedAddress('requested signer', signerAddress, activeAddress);
      const typedData = parseEip712TypedDataJson(typedDataJson);
      const signature = await account.signTypedData(typedData);
      if (ctx.contractAccount) {
        await assertValidContractAccountSignature(ctx, {
          signature,
          messageHash: hashTypedData(typedData),
        });
      }
      return signature;
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
      const anvilPort = resolveAnvilPort(ctx);
      if (anvilPort !== undefined) {
        void verifyAnvilChainId(anvilPort, ctx.chainState.current);
      }
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
      const anvilPort = resolveAnvilPort(ctx);
      if (!anvilPort) {
        throw new Eip1193Error(
          -32603,
          `RPC method '${request.method}' requires anvilPort in RpcContext (not provided for live anvil tests)`,
        );
      }
      const txParams = (params[0] ?? {}) as Record<string, unknown>;
      assertApprovedTransaction(ctx, txParams);
      const from = txParams.from;
      if (typeof from === 'string') {
        assertAuthorizedAddress('from', from as Hex, activeAddress);
      }
      if (ctx.contractAccount) {
        return sendContractAccountTransaction(ctx, txParams, anvilPort);
      }
      return sendTransaction(
        {
          privateKey: resolveActivePrivateKey(ctx),
          chainId: ctx.chainState.current,
          anvilPort,
        },
        normalizeTxParams(txParams),
      );
    }

    default:
      return proxyToAnvil(ctx, request.method, params);
  }
}

async function assertValidContractAccountSignature(
  ctx: RpcContext,
  args: { signature: Hex; messageHash: Hex },
): Promise<void> {
  const contractAccount = ctx.contractAccount;
  if (!contractAccount) {
    return;
  }

  const anvilPort = resolveAnvilPort(ctx);
  if (!anvilPort) {
    throw new Eip1193Error(
      -32603,
      'contract account signing requires anvilPort in RpcContext to verify EIP-1271',
    );
  }

  const verified = await verifyEip1271Signature({
    publicClient: {
      call: async ({ to, data }) => {
        const result = await anvilProxy(anvilPort, 'eth_call', [
          { to, data },
          'latest',
        ]);
        return {
          data: typeof result === 'string' ? (result as ViemHex) : undefined,
        };
      },
    },
    contractAddress: contractAccount.address,
    messageHash: args.messageHash,
    signature: args.signature,
  });

  if (!verified) {
    throw new Eip1193Error(-32000, 'EIP-1271 verification failed');
  }
}

async function sendContractAccountTransaction(
  ctx: RpcContext,
  txParams: Record<string, unknown>,
  anvilPort: number,
): Promise<Hex> {
  const contractAccount = ctx.contractAccount;
  if (!contractAccount) {
    throw new Eip1193Error(-32603, 'internal: missing contract account config');
  }
  if (typeof txParams.to !== 'string') {
    throw new Eip1193Error(
      -32602,
      'invalid params: eth_sendTransaction for contract accounts requires a target address in `to`',
    );
  }

  let executeData: Hex;
  const executeValue = normalizeTransactionValue(txParams.value) ?? 0n;
  const executeGas = normalizeTransactionGas(txParams.gas);
  try {
    executeData = encodeFunctionData({
      abi: parseAbi(contractAccount.executeAbi),
      functionName: 'execute',
      args: [
        txParams.to as Address,
        executeValue,
        typeof txParams.data === 'string' ? (txParams.data as Hex) : '0x',
      ],
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Eip1193Error(-32603, `contract account execute encoding failed: ${message}`);
  }

  return sendTransaction(
    {
      privateKey: resolveActivePrivateKey(ctx),
      chainId: ctx.chainState.current,
      anvilPort,
    },
    {
      to: contractAccount.address,
      data: executeData,
      ...(executeGas !== undefined ? { gas: executeGas } : {}),
    },
  );
}

function assertApproved(ctx: RpcContext): void {
  const mode = getApprovalPolicy(ctx).default;
  if (mode === 'reject') {
    throw new Eip1193Error(4001, 'User rejected the request.');
  }
}

function assertApprovedTransaction(ctx: RpcContext, txParams: Record<string, unknown>): void {
  const approval = parseErc20ApproveTransaction(txParams);
  const policy = getApprovalPolicy(ctx);

  if (!approval) {
    assertApproved(ctx);
    return;
  }

  const tokenPolicy = policy.perToken?.[approval.tokenAddress.toLowerCase() as Hex];
  const mode = tokenPolicy?.mode ?? policy.default;
  if (mode === 'reject') {
    throw new Eip1193Error(
      4001,
      `User rejected the request for ERC20 approve on token ${approval.tokenAddress}.`,
    );
  }
  if (
    tokenPolicy?.limit !== undefined &&
    tokenPolicy.limit > 0n &&
    approval.amount > tokenPolicy.limit
  ) {
    throw new Eip1193Error(
      4001,
      `User rejected the request: approve amount ${approval.amount} exceeds limit ${tokenPolicy.limit} for token ${approval.tokenAddress}.`,
    );
  }
}

function getApprovalPolicy(ctx: RpcContext): ApprovalPolicy {
  if (ctx.approvalPolicy) {
    return ctx.approvalPolicy.current;
  }
  return { default: ctx.approvalMode?.current ?? 'approve' };
}

function parseErc20ApproveTransaction(
  txParams: Record<string, unknown>,
): { tokenAddress: Hex; spender: Hex; amount: bigint } | null {
  if (typeof txParams.to !== 'string' || typeof txParams.data !== 'string') {
    return null;
  }
  const data = txParams.data as Hex;
  if (!data.toLowerCase().startsWith('0x095ea7b3')) {
    return null;
  }
  try {
    const decoded = decodeFunctionData({
      abi: ERC20_APPROVE_ABI,
      data,
    });
    if (decoded.functionName !== 'approve') {
      return null;
    }
    const [spender, amount] = decoded.args;
    if (typeof spender !== 'string' || typeof amount !== 'bigint') {
      return null;
    }
    return {
      tokenAddress: txParams.to as Hex,
      spender: spender as Hex,
      amount,
    };
  } catch {
    return null;
  }
}

function normalizeTxParams(p: Record<string, unknown>): SendTxParams {
  const out: SendTxParams = {};
  if (typeof p.to === 'string') out.to = p.to as Hex;
  if (typeof p.from === 'string') out.from = p.from as Hex;
  if (typeof p.data === 'string') out.data = p.data as Hex;
  const value = normalizeTransactionValue(p.value);
  if (value !== undefined) out.value = value;
  const gas = normalizeTransactionGas(p.gas);
  if (gas !== undefined) out.gas = gas;
  return out;
}

function normalizeTransactionValue(value: unknown): bigint | undefined {
  if (typeof value === 'string') return hexToBigInt(value as Hex);
  if (typeof value === 'bigint') return value;
  return undefined;
}

function normalizeTransactionGas(value: unknown): bigint | undefined {
  if (typeof value === 'string') return hexToBigInt(value as Hex);
  if (typeof value === 'bigint') return value;
  return undefined;
}

export function parseEip712TypedDataJson(typedDataJson: string): NormalizedEip712TypedData {
  let parsed: unknown;
  try {
    parsed = JSON.parse(typedDataJson);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    throw new Eip1193Error(-32700, `parse error: ${message}`);
  }

  const result = Eip712TypedDataSchema.safeParse(parsed);
  if (!result.success) {
    const issue = result.error.issues[0];
    const detail =
      issue?.path.length && issue.path[0] !== undefined
        ? `${String(issue.path[0])}: ${issue.message}`
        : issue?.message ?? 'invalid EIP-712 typed data';
    throw new Eip1193Error(-32602, `invalid params: ${detail}`);
  }

  const filteredTypes = Object.fromEntries(
    Object.entries(result.data.types).filter(([name]) => name !== 'EIP712Domain'),
  );

  return {
    domain: normalizeEip712Domain(result.data.domain),
    types: filteredTypes,
    primaryType: result.data.primaryType,
    message: result.data.message,
  };
}

export async function verifyAnvilChainId(
  anvilPort: number,
  expectedChainId: number,
): Promise<void> {
  try {
    const res = await fetch(`http://127.0.0.1:${anvilPort}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'eth_chainId',
        params: [],
      }),
    });
    if (!res.ok) return;
    const json = (await res.json()) as { result?: string };
    const actual = json.result ? Number.parseInt(json.result, 16) : Number.NaN;
    if (Number.isFinite(actual) && actual !== expectedChainId) {
      console.warn(
        `[dapp-e2e] wallet_switchEthereumChain to ${expectedChainId} but anvil reports ${actual}`,
      );
    }
  } catch {
    // anvil unreachable; ignore
  }
}

function normalizeEip712Domain(
  domain: ParsedEip712TypedData['domain'],
): NormalizedEip712TypedData['domain'] {
  return {
    ...(domain.name !== undefined ? { name: domain.name } : {}),
    ...(domain.version !== undefined ? { version: domain.version } : {}),
    ...(domain.chainId !== undefined
      ? { chainId: normalizeEip712ChainId(domain.chainId) }
      : {}),
    ...(domain.verifyingContract !== undefined
      ? { verifyingContract: normalizeEip712Hex(domain.verifyingContract, 'domain.verifyingContract') }
      : {}),
    ...(domain.salt !== undefined
      ? { salt: normalizeEip712Hex(domain.salt, 'domain.salt') }
      : {}),
  };
}

function normalizeEip712ChainId(value: string | number): number {
  if (typeof value === 'number') {
    return value;
  }
  const radix = value.startsWith('0x') ? 16 : 10;
  const parsed = Number.parseInt(value, radix);
  if (!Number.isFinite(parsed)) {
    throw new Eip1193Error(-32602, `invalid params: domain.chainId must be numeric, got ${value}`);
  }
  return parsed;
}

function normalizeEip712Hex(value: string, field: string): Hex {
  if (!/^0x[0-9a-fA-F]*$/.test(value)) {
    throw new Eip1193Error(-32602, `invalid params: ${field} must be a 0x-prefixed hex string`);
  }
  return value as Hex;
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
  const anvilPort = resolveAnvilPort(ctx);
  if (!anvilPort) {
    throw new Eip1193Error(
      -32603,
      `RPC method '${method}' requires anvilPort in RpcContext (not provided for live anvil tests)`,
    );
  }
  return anvilProxy(anvilPort, method, params);
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
