import { test as base, type Page } from '@playwright/test';
import { numberToHex } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { startAnvil } from './anvil.js';
import { createEventEmitter } from './event-emitter.js';
import { createInjectorScript } from './injector-script.js';
import { handleRpcRequest, type RpcContext } from './rpc-handlers.js';
import { Eip1193Error, type DappE2eApi, type Eip1193EventName, type Hex } from './types.js';

const DEFAULT_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

interface DappE2eOptions {
  privateKey: Hex;
  chainId: number;
}

interface DappE2eFixtures {
  wallet: PrivateKeyAccount;
  anvilPort: number;
  dappE2e: FixtureDappE2eApi;
}

interface InternalFixtures {
  _anvilHandle: { port: number; stop: () => Promise<void> };
  _rpcContext: RpcContext;
  _rpcTracker: {
    pendingRpcs: Map<number, Promise<unknown>>;
    nextId: () => number;
  };
}

interface FixtureDappE2eApi extends DappE2eApi {
  waitForRpcIdle(timeoutMs?: number): Promise<void>;
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

  _anvilHandle: async ({}, use) => {
    const handle = await startAnvil();
    await use(handle);
    await handle.stop();
  },

  anvilPort: async ({ _anvilHandle }, use) => {
    await use(_anvilHandle.port);
  },

  wallet: async ({ privateKey }, use) => {
    await use(privateKeyToAccount(privateKey));
  },

  _rpcContext: async ({ privateKey, chainId, anvilPort }, use) => {
    await use({
      privateKey,
      chainState: { current: chainId },
      anvilPort,
      emitter: createEventEmitter(),
    });
  },

  _rpcTracker: async ({}, use) => {
    const pendingRpcs = new Map<number, Promise<unknown>>();
    let counter = 0;
    await use({
      pendingRpcs,
      nextId: () => ++counter,
    });
  },

  dappE2e: async ({ page, anvilPort, _rpcContext, _rpcTracker }, use) => {
    const api: FixtureDappE2eApi = {
      async triggerEvent(event: Eip1193EventName, ...args: unknown[]) {
        await emitPageEvent(page, event, ...args);
      },
      getAnvilPort() {
        return anvilPort;
      },
      async connect() {
        await emitPageEvent(page, 'connect', {
          chainId: numberToHex(_rpcContext.chainState.current),
        });
      },
      async disconnect() {
        await emitPageEvent(page, 'disconnect', {
          code: 4900,
          message: 'Disconnected',
        });
      },
      async switchChain(chainIdHex: Hex) {
        _rpcContext.chainState.current = Number.parseInt(chainIdHex, 16);
        await emitPageEvent(page, 'chainChanged', chainIdHex);
      },
      async waitForRpcIdle(timeoutMs = 10_000) {
        await waitForPendingRpcs(page, _rpcTracker.pendingRpcs, timeoutMs);
      },
    };
    await use(api);
  },

  page: async ({ page, privateKey, chainId, _rpcContext, _rpcTracker }, use) => {
    const ctx = _rpcContext;
    const forwardedHandlers = FORWARDED_EVENTS.map((event) => {
      const handler = (...args: unknown[]) => {
        void emitPageEvent(page, event, ...args);
      };
      ctx.emitter?.on(event, handler);
      return { event, handler };
    });
    await page.exposeFunction(
      '__dappE2eRpc',
      async (request: { method: string; params?: unknown[] }) => {
        const id = _rpcTracker.nextId();
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
        _rpcTracker.pendingRpcs.set(id, promise);
        void promise.finally(() => _rpcTracker.pendingRpcs.delete(id));
        return promise;
      },
    );
    const script = createInjectorScript({ privateKey, chainId });
    await page.addInitScript({ content: script });
    await page.goto('about:blank');
    await use(page);
    for (const { event, handler } of forwardedHandlers) {
      ctx.emitter?.off(event, handler);
    }
  },
});

export { dappE2eTest as test };

async function emitPageEvent(
  page: Page,
  event: Eip1193EventName,
  ...args: unknown[]
) {
  await page.evaluate(
    ({ evt, payload }) => {
      const w = window as unknown as {
        __dappE2eEmit?: (evt: string, ...args: unknown[]) => void;
      };
      if (typeof w.__dappE2eEmit === 'function') {
        w.__dappE2eEmit(evt, ...payload);
      }
    },
    { evt: event, payload: args },
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
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}
