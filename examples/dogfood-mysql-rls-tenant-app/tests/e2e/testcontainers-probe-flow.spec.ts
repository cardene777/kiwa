/**
 * Playwright e2e — testcontainers probe flow (v1.32-3).
 *
 * Drives the /testcontainers-probe route end-to-end against the ad-hoc HTTP
 * server. Assertions cover the AC axis "MySQL 8 + MySQL Router testcontainers
 * duck-typing probe".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('testcontainers probe — real driver env-gate', () => {
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

  test('T-E2E-001 testcontainers probe reports mock endpoints + reachable=true', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const probe = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/testcontainers-probe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          mysqlUrl: string;
          mysqlImage: string;
          routerImage: string;
          reachable: boolean;
        };
      };
    }, origin);

    expect(probe.ok).toBe(true);
    expect(probe.result.reachable).toBe(true);
    expect(probe.result.mysqlUrl).toContain('mysql-mock');
    expect(probe.result.mysqlImage).toContain('mysql:8');
    expect(probe.result.routerImage).toContain('mysql-router');

    await browser.close();
  });
});
