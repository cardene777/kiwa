import type { Browser, BrowserContext, Page } from '@playwright/test';
import { createInjectorScript } from './injector-script.js';
import type { Hex, WalletConfig } from './types.js';

export interface InjectMultipleWalletsEntry {
  privateKey: Hex;
  chainId?: number;
  wallets?: WalletConfig[];
}

export interface InjectMultipleWalletsResult {
  context: BrowserContext;
  page: Page;
  close: () => Promise<void>;
}

export interface InjectMultipleWalletsOptions {
  defaultChainId?: number;
  baseUrl?: string;
}

const DEFAULT_CHAIN_ID = 31_337;

export async function injectMultipleWallets<TName extends string>(
  browser: Browser,
  entries: Record<TName, InjectMultipleWalletsEntry>,
  options: InjectMultipleWalletsOptions = {},
): Promise<Record<TName, InjectMultipleWalletsResult>> {
  const defaultChainId = options.defaultChainId ?? DEFAULT_CHAIN_ID;
  const result = {} as Record<TName, InjectMultipleWalletsResult>;
  const created: Array<{ name: TName; context: BrowserContext }> = [];

  try {
    for (const [rawName, entry] of Object.entries(entries) as [
      TName,
      InjectMultipleWalletsEntry,
    ][]) {
      const chainId = entry.chainId ?? defaultChainId;
      const script = createInjectorScript(
        entry.wallets
          ? {
              privateKey: entry.privateKey,
              chainId,
              wallets: entry.wallets,
            }
          : {
              privateKey: entry.privateKey,
              chainId,
            },
      );

      const context = await browser.newContext();
      created.push({ name: rawName, context });
      await context.addInitScript({ content: script });

      const page = await context.newPage();
      if (options.baseUrl) {
        await page.goto(options.baseUrl);
      } else {
        await page.goto('about:blank');
      }

      result[rawName] = {
        context,
        page,
        close: async () => {
          await context.close();
        },
      };
    }
  } catch (error) {
    await Promise.allSettled(created.map(({ context }) => context.close()));
    throw error;
  }

  return result;
}
