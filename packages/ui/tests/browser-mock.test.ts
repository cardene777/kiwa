/// <reference types="vitest/globals" />
import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';

/**
 * CAR-1529 段階 4 = browser adapter (packages/ui/src/browser.ts) の未 cover 分岐を
 * mock playwright + mock react-dom で cover する。 既存 tests/browser.test.tsx は
 * real chromium 起動系で正常経路のみ、 本 test は error / branch / stop 経路担当。
 * pattern SSOT = svelte / angular / qwik 段階 1-3 と同じ vi.doMock 経路。
 */

function makeFakePage() {
  return {
    setContent: vi.fn(async () => undefined),
    close: vi.fn(async () => undefined),
    getByTestId: vi.fn(() => ({})),
    getByRole: vi.fn(() => ({})),
    getByText: vi.fn(() => ({})),
    evaluate: vi.fn(async () => ({} as unknown)),
    click: vi.fn(async () => undefined),
    screenshot: vi.fn(async () => Buffer.from('')),
    content: vi.fn(async () => ''),
  };
}

describe('setupBrowserComponentEnv (mocked branches)', () => {
  afterEach(() => {
    vi.doUnmock('@playwright/test');
    vi.doUnmock('playwright');
    vi.doUnmock('react-dom/server');
    vi.resetModules();
  });

  it('T-BRW-M-001 playwright 両 fallback 失敗で friendly error', async () => {
    vi.resetModules();
    vi.doMock('@playwright/test', () => {
      throw new Error('not installed');
    });
    vi.doMock('playwright', () => {
      throw new Error('not installed');
    });
    const fresh = await import('../src/browser.js');
    await expect(
      fresh.setupBrowserComponentEnv({ ui: createElement('div', null, 'hi') }),
    ).rejects.toThrow(/@playwright\/test.*playwright/);
  });

  it('T-BRW-M-002 playwright fallback (@playwright/test fail → playwright import 成功)', async () => {
    vi.resetModules();
    const page = makeFakePage();
    const context = { newPage: vi.fn(async () => page), close: vi.fn(async () => undefined) };
    const browser = { newContext: vi.fn(async () => context), close: vi.fn(async () => undefined) };
    const chromium = { launch: vi.fn(async () => browser) };
    vi.doMock('@playwright/test', () => {
      throw new Error('not installed');
    });
    vi.doMock('playwright', () => ({ chromium }));

    const fresh = await import('../src/browser.js');
    const env = await fresh.setupBrowserComponentEnv({
      ui: createElement('div', null, 'hi'),
    });

    expect(env.mode).toBe('live');
    expect(env.kind).toBe('browser');
    expect(env.browser).toBe('chromium');
    expect(chromium.launch).toHaveBeenCalledWith({ headless: true });
  });

  it('T-BRW-M-003 engine 不明 (未サポート browser name) で throw', async () => {
    vi.resetModules();
    // @playwright/test は成功するが chromium 属性のみ、 firefox は undefined = throw
    vi.doMock('@playwright/test', () => ({
      chromium: { launch: vi.fn() },
      firefox: undefined,
      webkit: undefined,
    }));

    const fresh = await import('../src/browser.js');
    await expect(
      fresh.setupBrowserComponentEnv({
        ui: createElement('div', null, 'hi'),
        browser: 'firefox',
      }),
    ).rejects.toThrow(/playwright engine "firefox" not available/);
  });

  it('T-BRW-M-004 custom template branch で {{children}} 置換', async () => {
    vi.resetModules();
    const page = makeFakePage();
    const context = { newPage: vi.fn(async () => page), close: vi.fn(async () => undefined) };
    const browser = { newContext: vi.fn(async () => context), close: vi.fn(async () => undefined) };
    const chromium = { launch: vi.fn(async () => browser) };
    vi.doMock('@playwright/test', () => ({ chromium }));

    const fresh = await import('../src/browser.js');
    const env = await fresh.setupBrowserComponentEnv({
      ui: createElement('span', null, 'child'),
      template: '<html><body><main>{{children}}</main></body></html>',
      headless: false,
    });

    // setContent が custom template + rendered markup で呼ばれる
    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining('<main>'),
      expect.objectContaining({ waitUntil: 'domcontentloaded' }),
    );
    expect(page.setContent).toHaveBeenCalledWith(
      expect.stringContaining('<span>child</span>'),
      expect.anything(),
    );
    // headless: false branch も verify
    expect(chromium.launch).toHaveBeenCalledWith({ headless: false });
    expect(env.markup).toContain('<span>child</span>');
  });

  it('T-BRW-M-005 stop() は page/context/browser 順次 close', async () => {
    vi.resetModules();
    const page = makeFakePage();
    const context = { newPage: vi.fn(async () => page), close: vi.fn(async () => undefined) };
    const browser = { newContext: vi.fn(async () => context), close: vi.fn(async () => undefined) };
    const chromium = { launch: vi.fn(async () => browser) };
    vi.doMock('@playwright/test', () => ({ chromium }));

    const fresh = await import('../src/browser.js');
    const env = await fresh.setupBrowserComponentEnv({
      ui: createElement('div', null, 'hi'),
    });

    await env.stop();
    expect(page.close).toHaveBeenCalledTimes(1);
    expect(context.close).toHaveBeenCalledTimes(1);
    expect(browser.close).toHaveBeenCalledTimes(1);
  });
});
