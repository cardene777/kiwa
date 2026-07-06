/**
 * Playwright e2e — register + evolution + compatibility flow (v1.31-3).
 *
 * A single BrowserContext drives the register, evolution, and compatibility
 * routes end-to-end against the ad-hoc HTTP server. Assertions cover the AC
 * axis "schema evolution full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('register + evolution + compatibility — full journey', () => {
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

  test('register + evolution + compatibility routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const register = await fetch(`${base}/register`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const registerBody = (await register.json()) as {
        ok: boolean;
        result: {
          subjects: readonly string[];
          registeredIds: readonly number[];
        };
      };
      const evolve = await fetch(`${base}/evolution`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const evolveBody = (await evolve.json()) as {
        ok: boolean;
        result: { subject: string; compatibleV2: boolean; rejectedIncompatible: boolean };
      };
      const compat = await fetch(`${base}/compat-modes`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const compatBody = (await compat.json()) as {
        ok: boolean;
        result: { probed: readonly { mode: string; compatible: boolean }[] };
      };
      return { registerBody, evolveBody, compatBody };
    }, origin);

    expect(combined.registerBody.ok).toBe(true);
    // 2 subjects (users-value + orders-value), 3 register ids (dedup).
    expect(combined.registerBody.result.subjects).toHaveLength(2);
    expect(combined.registerBody.result.registeredIds).toHaveLength(3);

    expect(combined.evolveBody.ok).toBe(true);
    expect(combined.evolveBody.result.compatibleV2).toBe(true);
    expect(combined.evolveBody.result.rejectedIncompatible).toBe(true);

    expect(combined.compatBody.ok).toBe(true);
    // 3 modes probed, all reject the BREAK variant.
    expect(combined.compatBody.result.probed).toHaveLength(3);
    for (const entry of combined.compatBody.result.probed) {
      expect(entry.compatible).toBe(false);
    }

    await browser.close();
  });

  test('publish flow records 2 records + 1 compatibility rejection', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const publish = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/publish`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          payloads: [
            { id: 'e2e-1', displayName: 'Alice', region: 'us' },
            { id: 'e2e-2', displayName: 'Bob', region: 'eu' },
          ],
        }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: { recordsPublished: number; rejectedByCompatibility: number };
      };
    }, origin);

    expect(publish.ok).toBe(true);
    expect(publish.result.recordsPublished).toBe(2);
    expect(publish.result.rejectedByCompatibility).toBe(1);

    await browser.close();
  });
});
