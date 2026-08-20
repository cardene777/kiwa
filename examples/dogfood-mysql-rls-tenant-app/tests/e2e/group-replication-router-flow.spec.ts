/**
 * Playwright e2e — group replication + router split flow (v1.32-3).
 *
 * Drives the /group-replication + /binlog-advance + /router-split routes
 * end-to-end. Assertions cover the AC axis "MySQL 8 group replication +
 * Router R/W split + binlog advance".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('group replication + router split — advanced db semantics', () => {
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

  test('T-E2E-001 group replication + binlog + router split routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const group = await fetch(`${base}/group-replication`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const groupBody = (await group.json()) as {
        ok: boolean;
        result: {
          groupName: string;
          primaryId: string;
          peakMemberCount: number;
          conflictCount: number;
          finalState: string;
        };
      };
      const binlog = await fetch(`${base}/binlog-advance`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const binlogBody = (await binlog.json()) as {
        ok: boolean;
        result: {
          serverId: string;
          binlogPosition: number;
          format: string;
          gtidCount: number;
          gapDetected: boolean;
        };
      };
      const router = await fetch(`${base}/router-split`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const routerBody = (await router.json()) as {
        ok: boolean;
        result: {
          poolId: string;
          readHits: number;
          writeHits: number;
          warmedConnections: number;
          finalState: string;
        };
      };
      return { groupBody, binlogBody, routerBody };
    }, origin);

    expect(combined.groupBody.ok).toBe(true);
    expect(combined.groupBody.result.finalState).toBe('member-left');
    expect(combined.groupBody.result.primaryId).toBe('mysql-node-1');
    expect(combined.groupBody.result.peakMemberCount).toBe(2);
    expect(combined.groupBody.result.conflictCount).toBe(1);

    expect(combined.binlogBody.ok).toBe(true);
    expect(combined.binlogBody.result.format).toBe('ROW');
    expect(combined.binlogBody.result.gapDetected).toBe(true);
    expect(combined.binlogBody.result.gtidCount).toBe(2);
    expect(combined.binlogBody.result.binlogPosition).toBeGreaterThan(0);

    expect(combined.routerBody.ok).toBe(true);
    expect(combined.routerBody.result.finalState).toBe('metrics-exported');
    expect(combined.routerBody.result.readHits + combined.routerBody.result.writeHits).toBeGreaterThan(0);
    expect(combined.routerBody.result.warmedConnections).toBeGreaterThan(0);

    await browser.close();
  });
});
