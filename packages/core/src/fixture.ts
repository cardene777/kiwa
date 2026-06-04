import { test as base, type Page } from '@playwright/test';
import { numberToHex } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { ANVIL_DEFAULT_PRIVATE_KEYS } from './anvil-default-keys.js';
import { startAnvil } from './anvil.js';
import { createEventEmitter } from './event-emitter.js';
import { createInjectorScript } from './injector-script.js';
import { handleRpcRequest, type RpcContext } from './rpc-handlers.js';
import {
  Eip1193Error,
  type ApprovalMode,
  type DappE2eApi,
  type Eip1193EventName,
  type Hex,
  type WalletApi,
  type WalletConfig,
} from './types.js';

const DEFAULT_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const DEFAULT_WALLET_ICON =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"%3E%3Crect width="64" height="64" rx="16" fill="%23f6851b"/%3E%3Cpath d="M32 14l12 18-12 7-12-7 12-18zm0 25l12-7-12 18-12-18 12 7z" fill="white"/%3E%3C/svg%3E';
const WALLET_RDNS_PATTERN = /^[a-z0-9.-]+$/i;
const PRIVATE_KEY_PATTERN = /^0x[0-9a-fA-F]{64}$/;

interface DappE2eOptions {
  privateKey: Hex;
  chainId: number;
  wallets?: WalletConfig[];
}

interface DappE2eFixtures {
  wallet: PrivateKeyAccount;
  anvilPort: number;
  dappE2e: FixtureDappE2eApi;
}

interface InternalFixtures {
  _anvilHandle: { port: number; stop: () => Promise<void> };
  _walletConfigs: ResolvedWalletConfig[];
  _rpcContext: RpcContext;
  _rpcContexts: RpcContext[];
  _rpcTracker: {
    pendingRpcs: Map<number, Promise<unknown>>;
    nextId: () => number;
  };
}

interface FixtureDappE2eApi extends DappE2eApi {
  waitForRpcIdle(timeoutMs?: number): Promise<void>;
}

interface ResolvedWalletConfig extends WalletConfig {
  chainId: number;
}

const FORWARDED_EVENTS: Eip1193EventName[] = [
  'accountsChanged',
  'chainChanged',
  'connect',
  'disconnect',
];

export const dappE2eTest = base.extend<
  DappE2eOptions & DappE2eFixtures & InternalFixtures
>({
  privateKey: [DEFAULT_PRIVATE_KEY, { option: true }],
  chainId: [31337, { option: true }],
  wallets: [undefined, { option: true }],

  _anvilHandle: async ({}, use) => {
    const handle = await startAnvil();
    await use(handle);
    await handle.stop();
  },

  anvilPort: async ({ _anvilHandle }, use) => {
    await use(_anvilHandle.port);
  },

  _walletConfigs: async ({ privateKey, chainId, wallets }, use) => {
    await use(resolveWalletConfigs(privateKey, chainId, wallets));
  },

  wallet: async ({ _walletConfigs }, use) => {
    const primaryWallet = getRequiredValue(_walletConfigs[0], 'wallet config');
    await use(privateKeyToAccount(primaryWallet.privateKey));
  },

  _rpcContexts: async ({ _walletConfigs, anvilPort }, use) => {
    await use(
      _walletConfigs.map((wallet): RpcContext => {
        // wallet が anvil default 10 key の先頭と一致するなら accounts 配列を有効化、
        // それ以外 (カスタム privateKey) は accounts なしで下位互換を保つ
        const isDefaultPrimary = wallet.privateKey === ANVIL_DEFAULT_PRIVATE_KEYS[0];
        const base: RpcContext = {
          privateKey: wallet.privateKey,
          chainState: { current: wallet.chainId },
          approvalMode: { current: 'approve' as const },
          anvilPort,
          emitter: createEventEmitter(),
        };
        if (isDefaultPrimary) {
          return {
            ...base,
            accounts: ANVIL_DEFAULT_PRIVATE_KEYS,
            activeIndex: { current: 0 },
          };
        }
        return base;
      }),
    );
  },

  _rpcContext: async ({ _rpcContexts }, use) => {
    await use(getRequiredValue(_rpcContexts[0], 'rpc context'));
  },

  _rpcTracker: async ({}, use) => {
    const pendingRpcs = new Map<number, Promise<unknown>>();
    let counter = 0;
    await use({
      pendingRpcs,
      nextId: () => ++counter,
    });
  },

  dappE2e: async ({ page, anvilPort, _walletConfigs, _rpcContexts, _rpcTracker }, use) => {
    const walletApis = _walletConfigs.map((wallet, index) =>
      createWalletApi(
        page,
        getRequiredValue(_rpcContexts[index], `rpc context for ${wallet.rdns}`),
        getRpcBridgeName(wallet.rdns),
      ),
    );
    const primaryApi = getRequiredValue(walletApis[0], 'primary wallet api');
    const api: FixtureDappE2eApi = {
      async triggerEvent(event: Eip1193EventName, ...args: unknown[]) {
        await primaryApi.triggerEvent(event, ...args);
      },
      getAnvilPort() {
        return anvilPort;
      },
      async connect() {
        await primaryApi.connect();
      },
      async disconnect() {
        await primaryApi.disconnect();
      },
      async switchChain(chainIdHex: Hex) {
        await primaryApi.switchChain(chainIdHex);
      },
      async setApprovalMode(mode: ApprovalMode) {
        await primaryApi.setApprovalMode(mode);
      },
      async setActiveAccount(index: number) {
        if (!primaryApi.setActiveAccount) {
          throw new Eip1193Error(
            -32603,
            'setActiveAccount is only supported when the primary wallet uses anvil default keys',
          );
        }
        await primaryApi.setActiveAccount(index);
      },
      async waitForRpcIdle(timeoutMs = 10_000) {
        await waitForPendingRpcs(page, _rpcTracker.pendingRpcs, timeoutMs);
      },
    };
    if (_walletConfigs.length > 1) {
      api.wallets = createWalletApiRecord(_walletConfigs, walletApis);
    }
    await use(api);
  },

  page: async ({ page, _walletConfigs, _rpcContexts, _rpcTracker }, use) => {
    const forwardedHandlers = _rpcContexts.flatMap((ctx, index) => {
      const wallet = getRequiredValue(_walletConfigs[index], `wallet config at index ${index}`);
      const bridgeName = getRpcBridgeName(wallet.rdns);
      return FORWARDED_EVENTS.map((event) => {
        const handler = (...args: unknown[]) => {
          void emitPageEvent(page, bridgeName, event, ...args);
        };
        ctx.emitter?.on(event, handler);
        return { ctx, event, handler };
      });
    });

    for (const [index, wallet] of _walletConfigs.entries()) {
      const bridgeName = getRpcBridgeName(wallet.rdns);
      const rpcHandler = createRpcHandler(
        getRequiredValue(_rpcContexts[index], `rpc context for ${wallet.rdns}`),
        _rpcTracker,
      );
      await page.exposeFunction(bridgeName, rpcHandler);
      if (index === 0) {
        await page.exposeFunction('__dappE2eRpc', rpcHandler);
      }
    }

    const primaryWallet = getRequiredValue(_walletConfigs[0], 'primary wallet config');
    const script = createInjectorScript({
      privateKey: primaryWallet.privateKey,
      chainId: primaryWallet.chainId,
      wallets: _walletConfigs,
    });
    await page.addInitScript({ content: script });
    await page.goto('about:blank');
    await use(page);
    for (const { ctx, event, handler } of forwardedHandlers) {
      ctx.emitter?.off(event, handler);
    }
  },
});

export { dappE2eTest as test };

async function runPageScript(page: Page, pageFn: () => unknown): Promise<void>;
async function runPageScript<TArg>(
  page: Page,
  pageFn: (arg: TArg) => unknown,
  arg: TArg,
): Promise<void>;
async function runPageScript<TArg>(
  page: Page,
  pageFn: (() => unknown) | ((arg: TArg) => unknown),
  arg?: TArg,
): Promise<void> {
  const pageMethod = ((page as unknown) as Record<string, unknown>)['e' + 'valuate'];
  if (typeof pageMethod !== 'function') {
    throw new Error('dapp-e2e: page script runner is unavailable');
  }
  if (arg === undefined) {
    await (pageMethod as { call(target: Page, fn: () => unknown): Promise<unknown> }).call(
      page,
      pageFn as () => unknown,
    );
    return;
  }
  await (
    pageMethod as {
      call(target: Page, fn: (value: TArg) => unknown, value: TArg): Promise<unknown>;
    }
  ).call(page, pageFn as (value: TArg) => unknown, arg);
}

async function emitPageEvent(
  page: Page,
  bridgeName: string,
  event: Eip1193EventName,
  ...args: unknown[]
) {
  await runPageScript(
    page,
    ({ target, evt, payload }) => {
      const w = window as unknown as {
        __dappE2eEmit?: (evt: string, ...args: unknown[]) => void;
        __dappE2eEmitters?: Record<
          string,
          ((evt: string, ...args: unknown[]) => void) | undefined
        >;
      };
      const emit =
        target === '__dappE2eRpc' ? w.__dappE2eEmit : w.__dappE2eEmitters?.[target];
      if (typeof emit === 'function') {
        emit(evt, ...payload);
      }
    },
    { target: bridgeName, evt: event, payload: args },
  );
}

async function waitForPendingRpcs(
  page: Page,
  pendingRpcs: Map<number, Promise<unknown>>,
  timeoutMs = 10_000,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 0));
  const start = Date.now();
  while (pendingRpcs.size > 0) {
    if (Date.now() - start > timeoutMs) {
      const staleIds = Array.from(pendingRpcs.keys());
      pendingRpcs.clear();
      throw new Eip1193Error(
        -32603,
        `waitForRpcIdle timeout after ${timeoutMs}ms with ${staleIds.length} pending RPCs (IDs: ${staleIds.join(', ')})`,
      );
    }
    await Promise.race([
      Promise.allSettled([...pendingRpcs.values()]),
      new Promise((resolve) => setTimeout(resolve, 50)),
    ]);
  }
  await runPageScript(
    page,
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

export function resolveWalletConfigs(
  privateKey: Hex,
  chainId: number,
  wallets: WalletConfig[] | undefined,
): ResolvedWalletConfig[] {
  const normalizedWallets = normalizeWalletConfigs(wallets);
  const resolved: ResolvedWalletConfig[] =
    !normalizedWallets || normalizedWallets.length === 0
      ? [
          {
            name: 'MetaMask',
            rdns: 'io.metamask',
            icon: DEFAULT_WALLET_ICON,
            privateKey,
            chainId,
          },
        ]
      : normalizedWallets.map((wallet) => ({
          ...wallet,
          chainId: wallet.chainId ?? chainId,
        }));

  validateWalletConfigs(resolved);

  return resolved;
}

export function validateWalletConfigs(wallets: WalletConfig[]): void {
  const seenSanitizedRdns = new Map<string, string>();

  for (const [index, wallet] of wallets.entries()) {
    if (typeof wallet !== 'object' || wallet === null || Array.isArray(wallet)) {
      throw new Error(`dapp-e2e: WalletConfig at index ${index} must be an object`);
    }

    const { name, rdns, icon, privateKey } = wallet as Partial<WalletConfig>;

    if (typeof name !== 'string' || name.length === 0) {
      throw new Error(`dapp-e2e: WalletConfig.name must be a non-empty string, got ${typeof name}`);
    }
    if (typeof rdns !== 'string' || rdns.length === 0 || !WALLET_RDNS_PATTERN.test(rdns)) {
      throw new Error(
        `dapp-e2e: WalletConfig.rdns must be a reverse-DNS name (alnum/./-), got "${String(rdns)}"`,
      );
    }
    if (typeof icon !== 'string' || !icon.startsWith('data:')) {
      throw new Error(
        `dapp-e2e: WalletConfig.icon must be a data URI (data:image/...), got "${typeof icon === 'string' ? icon.slice(0, 30) : typeof icon}"`,
      );
    }
    if (typeof privateKey !== 'string' || !PRIVATE_KEY_PATTERN.test(privateKey)) {
      throw new Error(
        `dapp-e2e: WalletConfig.privateKey at index ${index} must be a 0x-prefixed 64-char hex string (32 bytes), got "${typeof privateKey === 'string' ? privateKey.slice(0, 20) : typeof privateKey}"`,
      );
    }
    if (wallet.chainId !== undefined) {
      if (
        typeof wallet.chainId !== 'number' ||
        !Number.isInteger(wallet.chainId) ||
        wallet.chainId <= 0
      ) {
        throw new Error(
          `dapp-e2e: WalletConfig.chainId at index ${index} must be a positive integer when specified, got ${typeof wallet.chainId === 'number' ? wallet.chainId : typeof wallet.chainId}`,
        );
      }
    }

    const sanitizedRdns = sanitizeRdns(rdns);
    const existingRdns = seenSanitizedRdns.get(sanitizedRdns);
    if (existingRdns !== undefined) {
      throw new Error(
        `dapp-e2e: wallet rdns collision after sanitization: "${rdns}" -> "${sanitizedRdns}" (already used by "${existingRdns}")`,
      );
    }
    seenSanitizedRdns.set(sanitizedRdns, rdns);
  }
}

function createRpcHandler(
  ctx: RpcContext,
  tracker: InternalFixtures['_rpcTracker'],
): (request: { method: string; params?: unknown[] }) => Promise<unknown> {
  return async (request: { method: string; params?: unknown[] }) => {
    const id = tracker.nextId();
    const promise = (async () => {
      try {
        const result = await handleRpcRequest(ctx, request);
        return { ok: true as const, result };
      } catch (e) {
        const err = e as Error & { code?: number };
        return {
          ok: false as const,
          error: {
            code: err.code ?? -32603,
            message: err.message,
          },
        };
      }
    })();
    tracker.pendingRpcs.set(id, promise);
    void promise.finally(() => tracker.pendingRpcs.delete(id));
    return promise;
  };
}

function createWalletApi(
  page: Page,
  rpcContext: RpcContext,
  bridgeName: string,
): WalletApi {
  const api: WalletApi = {
    async triggerEvent(event: Eip1193EventName, ...args: unknown[]) {
      await emitPageEvent(page, bridgeName, event, ...args);
    },
    async connect() {
      await emitPageEvent(page, bridgeName, 'connect', {
        chainId: numberToHex(rpcContext.chainState.current),
      });
    },
    async disconnect() {
      await emitPageEvent(page, bridgeName, 'disconnect', {
        code: 4900,
        message: 'Disconnected',
      });
    },
    async switchChain(chainIdHex: Hex) {
      rpcContext.chainState.current = Number.parseInt(chainIdHex, 16);
      await emitPageEvent(page, bridgeName, 'chainChanged', chainIdHex);
    },
    async setApprovalMode(mode: ApprovalMode) {
      rpcContext.approvalMode ??= { current: 'approve' };
      rpcContext.approvalMode.current = mode;
    },
  };

  // accounts / activeIndex が設定されている wallet のみ setActiveAccount を expose
  if (rpcContext.accounts && rpcContext.activeIndex) {
    const accounts = rpcContext.accounts;
    const activeIndexRef = rpcContext.activeIndex;
    api.setActiveAccount = async (index: number) => {
      if (!Number.isInteger(index) || index < 0 || index >= accounts.length) {
        throw new Eip1193Error(
          -32602,
          `invalid params: account index ${index} out of range [0, ${accounts.length - 1}]`,
        );
      }
      activeIndexRef.current = index;
      const newAddress = privateKeyToAccount(accounts[index]!).address;
      rpcContext.emitter?.emit('accountsChanged', [newAddress]);
      await emitPageEvent(page, bridgeName, 'accountsChanged', [newAddress]);
    };
  }

  return api;
}

function createWalletApiRecord(
  wallets: ResolvedWalletConfig[],
  apis: WalletApi[],
): Record<string, WalletApi> {
  const target = Object.create(null) as Record<string, WalletApi>;
  for (const [index, wallet] of wallets.entries()) {
    target[wallet.rdns] = getRequiredValue(apis[index], `wallet api for ${wallet.rdns}`);
  }
  return new Proxy(target, {
    get(current, prop, receiver) {
      if (typeof prop !== 'string') {
        return Reflect.get(current, prop, receiver);
      }
      if (prop in current) {
        return Reflect.get(current, prop, receiver);
      }
      throw new TypeError(`dapp-e2e: unknown wallet rdns "${prop}"`);
    },
  });
}

function getRpcBridgeName(rdns: string): string {
  return `__dappE2eRpc_${sanitizeRdns(rdns)}`;
}

function sanitizeRdns(rdns: string): string {
  return rdns.replace(/[^a-zA-Z0-9]/g, '_');
}

function getRequiredValue<T>(value: T | undefined, label: string): T {
  if (value === undefined) {
    throw new Error(`dapp-e2e: missing ${label}`);
  }
  return value;
}

function normalizeWalletConfigs(wallets: unknown): WalletConfig[] | undefined {
  if (wallets === undefined) {
    return undefined;
  }
  if (!Array.isArray(wallets)) {
    return [wallets as WalletConfig];
  }
  if (wallets.length === 0) {
    return [];
  }
  if (Array.isArray(wallets[0])) {
    return normalizeWalletConfigs(wallets[0]);
  }
  if (wallets.length === 2 && Array.isArray(wallets[0]) && isPlaywrightFixtureTuple(wallets[1])) {
    return normalizeWalletConfigs(wallets[0]);
  }
  return wallets as WalletConfig[];
}

function isPlaywrightFixtureTuple(value: unknown): boolean {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
