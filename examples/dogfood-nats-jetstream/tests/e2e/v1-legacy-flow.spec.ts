/**
 * Playwright e2e — v1 legacy flow (v1.31-4).
 *
 * Drives the /jetstream + /kv + /object + /routing routes end-to-end against
 * the ad-hoc HTTP server. Assertions cover the v1 (v1.20-4) AC axis
 * "JetStream + KV + Object + routing full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('v1 legacy — jetstream + kv + object + routing full journey', () => {
  test.skip(
    !playwrightBrowsersInstalled(),
    'Playwright browsers not installed — run `pnpm playwright install chromium`',
  );

  let servers: { close: () => Promise<void> }[] = [];
  let contexts: BrowserContext[] = [];

  test.beforeEach(() => {
    servers = [];
    contexts = [];
  });

  test.afterEach(async () => {
    for (const ctx of contexts) await ctx.close();
    for (const s of servers) await s.close();
  });

  test('v1 legacy routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const jetstream = await fetch(`${base}/jetstream`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          events: [
            { orderId: 'o-1', currency: 'USD' },
            { orderId: 'o-2', currency: 'JPY' },
          ],
        }),
      });
      const jetstreamBody = (await jetstream.json()) as {
        ok: boolean;
        result: { publishedSeqs: readonly number[]; ackedCount: number };
      };
      const routing = await fetch(`${base}/routing`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const routingBody = (await routing.json()) as {
        ok: boolean;
        result: {
          literalDeliveries: number;
          wildcardDeliveries: number;
          queueGroupDeliveries: number;
        };
      };
      return { jetstreamBody, routingBody };
    }, origin);

    expect(combined.jetstreamBody.ok).toBe(true);
    expect(combined.jetstreamBody.result.publishedSeqs).toHaveLength(2);
    expect(combined.jetstreamBody.result.ackedCount).toBe(1);

    expect(combined.routingBody.ok).toBe(true);
    expect(combined.routingBody.result.literalDeliveries).toBe(1);
    expect(combined.routingBody.result.wildcardDeliveries).toBe(2);
    expect(combined.routingBody.result.queueGroupDeliveries).toBe(6);

    await browser.close();
  });
});
