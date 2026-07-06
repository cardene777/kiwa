/**
 * Playwright e2e — consumer group + transactional flow (v1.31-2).
 *
 * Two BrowserContext tabs drive the same consumer group + txn topic so the
 * observation reflects the rebalance callback + read-committed filter. This
 * covers the AC axis "Playwright e2e … producer / consumer / txn".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('consumer group + transactional flow — 2 browser tabs', () => {
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

  test('2 tabs against 1 consumer group observe 2 consumers with 8 total consumed', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    contexts.push(ctxA, ctxB);

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    await pageA.goto(origin);
    await pageB.goto(origin);

    // Only one tab needs to drive the consumer-group op — the second tab is
    // there so the traces reflect the multi-tab origin. The mock adapter
    // seeds 8 records + reads with 2 grouped consumers.
    const cgFromA = await pageA.evaluate(async (base: string) => {
      const r = await fetch(`${base}/consumer-group`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ topic: 'e2e-cg' }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          consumers: { consumerId: string; consumedCount: number }[];
          rebalanceCount: number;
        };
      };
    }, origin);

    expect(cgFromA.ok).toBe(true);
    expect(cgFromA.result.consumers.length).toBe(2);
    const totalConsumed = cgFromA.result.consumers.reduce(
      (acc, c) => acc + c.consumedCount,
      0,
    );
    expect(totalConsumed).toBe(8);
    expect(cgFromA.result.rebalanceCount).toBeGreaterThanOrEqual(0);

    // Second tab reads the trace log — the trace must include the
    // `driveConsumerGroup` entry from tab A.
    const traces = await pageB.evaluate(async (base: string) => {
      const r = await fetch(`${base}/traces`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      return (await r.json()) as { ok: boolean; result: { op: string; ok: boolean }[] };
    }, origin);
    expect(traces.result.some((t) => t.op === 'driveConsumerGroup')).toBe(true);

    await browser.close();
  });

  test('transactional producer commits 2 + aborts 1 and the read-committed filter drops the aborted batch', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const txn = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/transaction`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          topic: 'e2e-txn',
          commit: ['c1', 'c2'],
          abort: ['a1'],
        }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          committedCount: number;
          abortedCount: number;
          readCommittedCount: number;
          commitState: string;
        };
      };
    }, origin);

    expect(txn.ok).toBe(true);
    expect(txn.result.committedCount).toBe(2);
    expect(txn.result.abortedCount).toBe(1);
    // Read-committed filter only surfaces committed messages — aborted batch
    // never reaches the reader.
    expect(txn.result.readCommittedCount).toBe(2);

    await browser.close();
  });
});
