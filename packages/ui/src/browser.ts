import type { ReactElement } from 'react';

type BrowserName = 'chromium' | 'firefox' | 'webkit';

interface PlaywrightLike {
  chromium?: { launch: (opts?: unknown) => Promise<{ newContext: () => Promise<unknown>; close: () => Promise<void> }> };
  firefox?: { launch: (opts?: unknown) => Promise<{ newContext: () => Promise<unknown>; close: () => Promise<void> }> };
  webkit?: { launch: (opts?: unknown) => Promise<{ newContext: () => Promise<unknown>; close: () => Promise<void> }> };
}

interface BrowserHandle {
  close: () => Promise<void>;
  newContext: () => Promise<unknown>;
}

interface BrowserContextHandle {
  newPage: () => Promise<BrowserPageHandle>;
  close: () => Promise<void>;
}

export interface BrowserPageHandle {
  setContent: (html: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<void>;
  getByTestId: (id: string) => BrowserLocator;
  getByRole: (role: string, opts?: { name?: string }) => BrowserLocator;
  getByText: (text: string) => BrowserLocator;
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
  click: (selector: string) => Promise<void>;
  screenshot: (opts?: { path?: string }) => Promise<Buffer>;
  close: () => Promise<void>;
  content: () => Promise<string>;
}

export interface BrowserLocator {
  textContent: () => Promise<string | null>;
  click: () => Promise<void>;
  isVisible: () => Promise<boolean>;
  count: () => Promise<number>;
}

export interface SetupBrowserComponentEnvOptions {
  ui: ReactElement;
  /** which browser engine to launch (default chromium) */
  browser?: BrowserName;
  /** headless flag forwarded to playwright launch (default true) */
  headless?: boolean;
  /** optional HTML wrapper template (`{{children}}` is replaced with the rendered React markup) */
  template?: string;
}

export interface BrowserTestEnvUi {
  mode: 'live';
  kind: 'browser';
  browser: BrowserName;
  page: BrowserPageHandle;
  markup: string;
  stop: () => Promise<void>;
}

const DEFAULT_TEMPLATE = `<!doctype html>
<html lang="en">
  <head><meta charset="utf-8" /><title>kiwa ui browser env</title></head>
  <body><div id="kiwa-root">{{children}}</div></body>
</html>`;

async function loadPlaywright(): Promise<PlaywrightLike> {
  try {
    return (await import('@playwright/test')) as unknown as PlaywrightLike;
  } catch {
    try {
      // Use a computed specifier so vite/vitest doesn't try to statically resolve it
      // when "playwright" is not installed. "@playwright/test" path above is the primary.
      const fallback = 'playwright';
      return ((await import(/* @vite-ignore */ fallback)) as unknown) as PlaywrightLike;
    } catch {
      throw new Error(
        'setupComponentEnv({ mode: "browser" }) requires "@playwright/test" or "playwright". Run `pnpm add -D @playwright/test`.',
      );
    }
  }
}

async function loadReactRenderer(): Promise<{ renderToStaticMarkup: (el: ReactElement) => string }> {
  try {
    const mod = (await import('react-dom/server')) as unknown as {
      renderToStaticMarkup: (el: ReactElement) => string;
    };
    return { renderToStaticMarkup: mod.renderToStaticMarkup };
  } catch {
    throw new Error(
      'setupComponentEnv({ mode: "browser" }) requires "react-dom" to be installed.',
    );
  }
}

export async function setupBrowserComponentEnv(
  opts: SetupBrowserComponentEnvOptions,
): Promise<BrowserTestEnvUi> {
  const pw = await loadPlaywright();
  const browserName: BrowserName = opts.browser ?? 'chromium';
  const engine = pw[browserName];
  if (!engine) {
    throw new Error(`setupComponentEnv: playwright engine "${browserName}" not available`);
  }
  const renderer = await loadReactRenderer();
  const markup = renderer.renderToStaticMarkup(opts.ui);
  const html = (opts.template ?? DEFAULT_TEMPLATE).replace('{{children}}', markup);

  const browser = (await engine.launch({ headless: opts.headless ?? true })) as unknown as BrowserHandle;
  const context = (await browser.newContext()) as unknown as BrowserContextHandle;
  const page = (await context.newPage()) as unknown as BrowserPageHandle;
  await page.setContent(html, { waitUntil: 'domcontentloaded' });

  return {
    mode: 'live',
    kind: 'browser',
    browser: browserName,
    page,
    markup,
    stop: async () => {
      await page.close();
      await context.close();
      await browser.close();
    },
  };
}
