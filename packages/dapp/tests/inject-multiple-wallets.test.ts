import { describe, expect, it, vi } from 'vitest';
import type { Browser } from '@playwright/test';
import { injectMultipleWallets } from '../src/inject-multiple-wallets.js';
import type { Hex } from '../src/types.js';

const PK1: Hex =
  '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const PK2: Hex =
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d';

interface MockPage {
  goto: ReturnType<typeof vi.fn>;
}

interface MockContext {
  addInitScript: ReturnType<typeof vi.fn>;
  newPage: ReturnType<typeof vi.fn>;
  close: ReturnType<typeof vi.fn>;
}

function createMockBrowser(): {
  browser: Browser;
  contexts: MockContext[];
  pages: MockPage[];
} {
  const contexts: MockContext[] = [];
  const pages: MockPage[] = [];
  const browser = {
    newContext: vi.fn().mockImplementation(async () => {
      const page: MockPage = {
        goto: vi.fn().mockResolvedValue(undefined),
      };
      const ctx: MockContext = {
        addInitScript: vi.fn().mockResolvedValue(undefined),
        newPage: vi.fn().mockResolvedValue(page),
        close: vi.fn().mockResolvedValue(undefined),
      };
      contexts.push(ctx);
      pages.push(page);
      return ctx;
    }),
  } as unknown as Browser;
  return { browser, contexts, pages };
}

describe('injectMultipleWallets', () => {
  it('T-IMW-001 1 entry で context / page / close を返す', async () => {
    const { browser, contexts, pages } = createMockBrowser();

    const result = await injectMultipleWallets(browser, {
      alice: { privateKey: PK1 },
    });

    expect(result.alice).toBeDefined();
    expect(result.alice.context).toBe(contexts[0]);
    expect(result.alice.page).toBe(pages[0]);
    expect(typeof result.alice.close).toBe('function');
    // default chain 31337 with injector script が addInitScript される
    expect(contexts[0]!.addInitScript).toHaveBeenCalledTimes(1);
    // baseUrl 未指定 → about:blank
    expect(pages[0]!.goto).toHaveBeenCalledWith('about:blank');
  });

  it('T-IMW-002 2 entry で 2 context が spawn される', async () => {
    const { browser, contexts, pages } = createMockBrowser();

    await injectMultipleWallets(browser, {
      alice: { privateKey: PK1, chainId: 8453 },
      bob: { privateKey: PK2, chainId: 137 },
    });

    expect(contexts).toHaveLength(2);
    expect(pages).toHaveLength(2);
    for (const ctx of contexts) {
      expect(ctx.addInitScript).toHaveBeenCalledTimes(1);
    }
  });

  it('T-IMW-003 defaultChainId option 経路が entry.chainId 未指定時に走る', async () => {
    const { browser, contexts } = createMockBrowser();

    await injectMultipleWallets(
      browser,
      { alice: { privateKey: PK1 } },
      { defaultChainId: 42161 },
    );

    // script 生成に成功して addInitScript まで到達している (defaultChainId branch カバー)
    expect(contexts[0]!.addInitScript).toHaveBeenCalledTimes(1);
    const script = (contexts[0]!.addInitScript.mock.calls[0]?.[0] as { content: string }).content;
    expect(script).toContain('window.ethereum');
  });

  it('T-IMW-004 baseUrl 指定時は page.goto(baseUrl) で開く', async () => {
    const { browser, pages } = createMockBrowser();

    await injectMultipleWallets(
      browser,
      { alice: { privateKey: PK1 } },
      { baseUrl: 'http://127.0.0.1:3000/foo' },
    );

    expect(pages[0]!.goto).toHaveBeenCalledWith('http://127.0.0.1:3000/foo');
  });

  it('T-IMW-005 wallets 指定は entry ごとに script に反映される', async () => {
    const { browser, contexts } = createMockBrowser();

    await injectMultipleWallets(browser, {
      alice: {
        privateKey: PK1,
        wallets: [
          { name: 'MetaMask', rdns: 'io.metamask', icon: 'data:,', privateKey: PK1 },
          { name: 'Rabby', rdns: 'io.rabby', icon: 'data:,', privateKey: PK2 },
        ],
      },
    });

    const script = (contexts[0]!.addInitScript.mock.calls[0]?.[0] as { content: string }).content;
    expect(script).toContain('io.metamask');
    expect(script).toContain('io.rabby');
  });

  it('T-IMW-006 result.close() で当該 context.close() が呼ばれる', async () => {
    const { browser, contexts } = createMockBrowser();

    const result = await injectMultipleWallets(browser, {
      alice: { privateKey: PK1 },
    });

    await result.alice.close();
    expect(contexts[0]!.close).toHaveBeenCalledTimes(1);
  });

  it('T-IMW-007 途中で addInitScript が throw したら既存 context を全て close して throw を伝播する', async () => {
    const contexts: MockContext[] = [];
    let callCount = 0;
    const browser = {
      newContext: vi.fn().mockImplementation(async () => {
        callCount += 1;
        const ctx: MockContext = {
          addInitScript:
            callCount === 2
              ? vi.fn().mockRejectedValue(new Error('injection blew up'))
              : vi.fn().mockResolvedValue(undefined),
          newPage: vi.fn().mockResolvedValue({
            goto: vi.fn().mockResolvedValue(undefined),
          }),
          close: vi.fn().mockResolvedValue(undefined),
        };
        contexts.push(ctx);
        return ctx;
      }),
    } as unknown as Browser;

    await expect(
      injectMultipleWallets(browser, {
        alice: { privateKey: PK1 },
        bob: { privateKey: PK2 },
      }),
    ).rejects.toThrow(/injection blew up/);

    // 2 個目まで作られ、 両方 close される
    expect(contexts).toHaveLength(2);
    expect(contexts[0]!.close).toHaveBeenCalledTimes(1);
    expect(contexts[1]!.close).toHaveBeenCalledTimes(1);
  });

  it('T-IMW-008 0 entry でも空 record を返す', async () => {
    const { browser } = createMockBrowser();

    const result = await injectMultipleWallets(browser, {});

    expect(result).toEqual({});
    expect(browser.newContext).not.toHaveBeenCalled();
  });
});
