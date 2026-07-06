/**
 * Playwright e2e — producer flow (v1.31-2).
 *
 * A single BrowserContext drives the idempotent producer + raw-protocol +
 * ISR/HW routes end-to-end against the ad-hoc HTTP server. Assertions cover
 * the AC axis "Kafka raw protocol full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('producer flow — idempotent + raw protocol + ISR advance', () => {
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

  test('idempotent producer + raw protocol drive together and record 2 ok trace entries', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const producer = await fetch(`${base}/producer`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          events: [
            { orderId: 'e2e-1', region: 'us', total: 10 },
            { orderId: 'e2e-2', region: 'eu', total: 20 },
            { orderId: 'e2e-3', region: 'apac', total: 30 },
          ],
        }),
      });
      const producerBody = (await producer.json()) as {
        ok: boolean;
        result: { recordsSent: number; duplicateRetries: number };
      };
      const raw = await fetch(`${base}/raw-protocol`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const rawBody = (await raw.json()) as {
        ok: boolean;
        result: { initialEpoch: number; fencedEpoch: number; txnStates: readonly string[] };
      };
      return { producerBody, rawBody };
    }, origin);

    expect(combined.producerBody.ok).toBe(true);
    expect(combined.producerBody.result.recordsSent).toBe(3);
    // The producer flow re-sends order 0 with the same sequence — the mock
    // records exactly 1 duplicate retry.
    expect(combined.producerBody.result.duplicateRetries).toBe(1);

    expect(combined.rawBody.ok).toBe(true);
    expect(combined.rawBody.result.fencedEpoch).toBe(1);
    expect(combined.rawBody.result.txnStates[combined.rawBody.result.txnStates.length - 1]).toBe(
      'Empty',
    );

    await browser.close();
  });

  test('ISR + high-watermark advances past the target offset once 3 brokers join', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const advance = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/isr-hw`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: 'orders', partition: 0, targetOffset: 25 }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: { isrSize: number; highWatermark: number; advanced: boolean };
      };
    }, origin);

    expect(advance.ok).toBe(true);
    expect(advance.result.isrSize).toBe(3);
    expect(advance.result.highWatermark).toBe(25);
    expect(advance.result.advanced).toBe(true);

    await browser.close();
  });
});
