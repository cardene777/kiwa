/**
 * Playwright e2e — logical replication + slot advance + pgvector flow (v1.32-2).
 *
 * Drives the /logical-replication + /slot-advance + /pgvector routes end-to-end
 * against the ad-hoc HTTP server. Assertions cover the AC axes "Postgres 16
 * logical replication + slot advance + pgvector real driver full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('logical-replication + slot-advance + pgvector — full journey', () => {
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

  test('T-E2E-001 logical-replication + slot-advance + pgvector routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const logical = await fetch(`${base}/logical-replication`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const logicalBody = (await logical.json()) as {
        ok: boolean;
        result: {
          finalState: string;
          confirmedFlushLsn: number;
          cascadedSubscribers: number;
        };
      };
      const slot = await fetch(`${base}/slot-advance`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const slotBody = (await slot.json()) as {
        ok: boolean;
        result: { advancedLsn: number; recycledBytes: number; dropped: boolean };
      };
      const pgvec = await fetch(`${base}/pgvector`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const pgvecBody = (await pgvec.json()) as {
        ok: boolean;
        result: {
          indexKind: string;
          searchCount: number;
          bothSearchesRecorded: boolean;
          computedDistance: number;
        };
      };
      return { logicalBody, slotBody, pgvecBody };
    }, origin);

    expect(combined.logicalBody.ok).toBe(true);
    expect(combined.logicalBody.result.finalState).toBe('cascade-synced');
    expect(combined.logicalBody.result.cascadedSubscribers).toBeGreaterThanOrEqual(1);

    expect(combined.slotBody.ok).toBe(true);
    expect(combined.slotBody.result.dropped).toBe(true);
    expect(combined.slotBody.result.recycledBytes).toBeGreaterThan(0);

    expect(combined.pgvecBody.ok).toBe(true);
    expect(combined.pgvecBody.result.indexKind).toBe('ivfflat');
    expect(combined.pgvecBody.result.bothSearchesRecorded).toBe(true);
    expect(combined.pgvecBody.result.searchCount).toBeGreaterThanOrEqual(2);

    await browser.close();
  });
});
