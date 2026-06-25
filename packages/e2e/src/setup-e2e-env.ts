import { launchBrowser } from './browser-bridge.js';
import { startServer, type ApiHandlerSource, type NodeRequestHandler } from './http-server.js';
import type { E2eTestEnv, SetupE2eEnvOptions } from './types.js';

export async function setupE2eEnv(opts: SetupE2eEnvOptions = {}): Promise<E2eTestEnv> {
  let appSource: ApiHandlerSource | NodeRequestHandler | null = opts.app ?? null;
  if (!appSource && opts.staticHtml !== undefined) {
    const html = opts.staticHtml;
    appSource = {
      kind: 'fetch',
      handler: async () =>
        new Response(html, {
          status: 200,
          headers: { 'content-type': 'text/html; charset=utf-8' },
        }),
    };
  }
  if (!appSource) {
    throw new Error('setupE2eEnv: provide either { app } or { staticHtml }');
  }

  const server = await startServer(appSource);
  const browserName = opts.browser ?? 'chromium';
  const browser = await launchBrowser(browserName, { headless: opts.headless ?? true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const target = opts.initialPath ?? '/';
  const initialUrl = target.startsWith('http') ? target : `${server.baseUrl}${target.startsWith('/') ? target : `/${target}`}`;
  await page.goto(initialUrl, { waitUntil: 'domcontentloaded' });

  return {
    mode: 'live',
    baseUrl: server.baseUrl,
    page,
    browser: browserName,
    stop: async () => {
      await page.close();
      await context.close();
      await browser.close();
      await server.close();
    },
  };
}
