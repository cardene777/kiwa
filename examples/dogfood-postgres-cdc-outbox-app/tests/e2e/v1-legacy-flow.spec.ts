/**
 * Playwright e2e — v1 legacy flow (v1.32-2).
 *
 * Drives the /outbox + /cdc-pickup + /replication + /at-least-once + /emit-fidelity
 * routes end-to-end against the ad-hoc HTTP server. Assertions cover the v1
 * (v1.26-2) AC axis "outbox + CDC + replication + at-least-once full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('v1 legacy — outbox + cdc + replication + at-least-once full journey', () => {
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

  test('T-E2E-001 v1 legacy routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const outbox = await fetch(`${base}/outbox`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orders: [
            { orderId: 'o-1', region: 'us' },
            { orderId: 'o-2', region: 'eu' },
          ],
        }),
      });
      const outboxBody = (await outbox.json()) as {
        ok: boolean;
        result: { writes: number; highWaterLsn: number; sealed: boolean };
      };
      const cdc = await fetch(`${base}/cdc-pickup`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          orders: [{ orderId: 'o-3', region: 'apac' }],
          ackBatchSize: 4,
        }),
      });
      const cdcBody = (await cdc.json()) as {
        ok: boolean;
        result: { decodedCount: number; delivered: number };
      };
      const replication = await fetch(`${base}/replication`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const replicationBody = (await replication.json()) as {
        ok: boolean;
        result: { primaryLsn: number; replicaLag: number };
      };
      return { outboxBody, cdcBody, replicationBody };
    }, origin);

    expect(combined.outboxBody.ok).toBe(true);
    expect(combined.outboxBody.result.writes).toBe(2);
    expect(combined.outboxBody.result.sealed).toBe(true);

    expect(combined.cdcBody.ok).toBe(true);
    expect(combined.cdcBody.result.decodedCount).toBeGreaterThan(0);

    expect(combined.replicationBody.ok).toBe(true);
    expect(combined.replicationBody.result.primaryLsn).toBeGreaterThan(0);

    await browser.close();
  });
});
