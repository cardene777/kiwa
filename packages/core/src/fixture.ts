import { test as base, type Page } from '@playwright/test';
import { numberToHex } from 'viem';
import { privateKeyToAccount, type PrivateKeyAccount } from 'viem/accounts';
import { startAnvil } from './anvil.js';
import { createEventEmitter } from './event-emitter.js';
import { createInjectorScript } from './injector-script.js';
import { handleRpcRequest, type RpcContext } from './rpc-handlers.js';
import type { DappE2eApi, Eip1193EventName, Hex } from './types.js';

const DEFAULT_PRIVATE_KEY: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

interface DappE2eOptions {
  privateKey: Hex;
  chainId: number;
}

interface DappE2eFixtures {
  wallet: PrivateKeyAccount;
  anvilPort: number;
  dappE2e: DappE2eApi;
}

interface InternalFixtures {
  _anvilHandle: { port: number; stop: () => Promise<void> };
  _rpcContext: RpcContext;
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

  dappE2e: async ({ page, anvilPort, _rpcContext }, use) => {
    const api: DappE2eApi = {
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
    };
    await use(api);
  },

  page: async ({ page, privateKey, chainId, _rpcContext }, use) => {
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
        try {
          return await handleRpcRequest(ctx, request);
        } catch (e) {
          if (e instanceof Error) {
            const err = e as Error & { code?: number };
            throw Object.assign(new Error(err.message), { code: err.code });
          }
          throw e;
        }
      },
    );
    const script = createInjectorScript({ privateKey, chainId });
    await page.addInitScript({ content: script });
    const originalSetContent = page.setContent.bind(page);
    const originalClick = page.click.bind(page);
    (page as typeof page & {
      setContent: typeof page.setContent;
      click: typeof page.click;
    }).setContent = async (html, options) => {
      await originalSetContent(html, options);
      await page.addScriptTag({ content: script });
    };
    (page as typeof page & {
      setContent: typeof page.setContent;
      click: typeof page.click;
    }).click = async (selector, options) => {
      await originalClick(selector, options);
      await page.waitForFunction(
        () =>
          typeof window === 'undefined' ||
          ((window as typeof window & {
            __dappE2ePendingRpcCount?: number;
          }).__dappE2ePendingRpcCount ?? 0) === 0,
        undefined,
        { timeout: 10_000 },
      );
    };
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
