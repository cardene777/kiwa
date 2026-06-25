type BrowserName = 'chromium' | 'firefox' | 'webkit';

interface PlaywrightLike {
  chromium?: { launch: (opts?: unknown) => Promise<{ newContext: () => Promise<unknown>; close: () => Promise<void> }> };
  firefox?: { launch: (opts?: unknown) => Promise<{ newContext: () => Promise<unknown>; close: () => Promise<void> }> };
  webkit?: { launch: (opts?: unknown) => Promise<{ newContext: () => Promise<unknown>; close: () => Promise<void> }> };
}

export interface BrowserHandle {
  close: () => Promise<void>;
  newContext: () => Promise<BrowserContextHandle>;
}

export interface BrowserContextHandle {
  newPage: () => Promise<BrowserPageHandle>;
  close: () => Promise<void>;
}

export interface BrowserPageHandle {
  goto: (url: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<unknown>;
  setContent: (html: string, opts?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' }) => Promise<void>;
  getByTestId: (id: string) => BrowserLocator;
  getByRole: (role: string, opts?: { name?: string }) => BrowserLocator;
  getByText: (text: string) => BrowserLocator;
  fill: (selector: string, value: string) => Promise<void>;
  click: (selector: string) => Promise<void>;
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
  screenshot: (opts?: { path?: string }) => Promise<Buffer>;
  content: () => Promise<string>;
  url: () => string;
  close: () => Promise<void>;
}

export interface BrowserLocator {
  textContent: () => Promise<string | null>;
  click: () => Promise<void>;
  fill: (value: string) => Promise<void>;
  isVisible: () => Promise<boolean>;
  count: () => Promise<number>;
}

export async function loadPlaywright(): Promise<PlaywrightLike> {
  try {
    return (await import('@playwright/test')) as unknown as PlaywrightLike;
  } catch {
    try {
      const fallback = 'playwright';
      return (await import(/* @vite-ignore */ fallback)) as unknown as PlaywrightLike;
    } catch {
      throw new Error(
        'setupE2eEnv requires "@playwright/test" or "playwright". Run `pnpm add -D @playwright/test`.',
      );
    }
  }
}

export async function launchBrowser(
  name: BrowserName,
  opts: { headless: boolean },
): Promise<BrowserHandle> {
  const pw = await loadPlaywright();
  const engine = pw[name];
  if (!engine) {
    throw new Error(`setupE2eEnv: playwright engine "${name}" not available`);
  }
  return (await engine.launch({ headless: opts.headless })) as unknown as BrowserHandle;
}
