/**
 * Playwright e2e — durable consumer + KV revision flow (v1.31-4).
 *
 * Drives the /durable + /kv-revision + /object-chunking routes end-to-end
 * against the ad-hoc HTTP server. Assertions cover the AC axis "JetStream
 * durable + KV + Object Store full journey".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('durable + kv revision + object chunking — full journey', () => {
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

  test('durable + kv revision + object chunking routes drive together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const durable = await fetch(`${base}/durable`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const durableBody = (await durable.json()) as {
        ok: boolean;
        result: {
          durableName: string;
          published: number;
          quarantined: number;
          backoffRedeliveries: number;
        };
      };
      const kv = await fetch(`${base}/kv-revision`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const kvBody = (await kv.json()) as {
        ok: boolean;
        result: {
          revisions: readonly { operation: string; revision: number }[];
          deleteTombstoneObserved: boolean;
          watchEventCount: number;
        };
      };
      const chunking = await fetch(`${base}/object-chunking`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const chunkingBody = (await chunking.json()) as {
        ok: boolean;
        result: {
          chunkCount: number;
          compression: string;
          reassembledMatches: boolean;
        };
      };
      return { durableBody, kvBody, chunkingBody };
    }, origin);

    expect(combined.durableBody.ok).toBe(true);
    expect(combined.durableBody.result.published).toBe(4);
    expect(combined.durableBody.result.backoffRedeliveries).toBeGreaterThanOrEqual(1);
    expect(combined.durableBody.result.quarantined).toBeGreaterThanOrEqual(1);

    expect(combined.kvBody.ok).toBe(true);
    expect(combined.kvBody.result.revisions).toHaveLength(5);
    expect(combined.kvBody.result.deleteTombstoneObserved).toBe(true);
    expect(combined.kvBody.result.watchEventCount).toBe(5);

    expect(combined.chunkingBody.ok).toBe(true);
    expect(combined.chunkingBody.result.chunkCount).toBeGreaterThanOrEqual(4);
    expect(combined.chunkingBody.result.compression).toBe('lz4');
    expect(combined.chunkingBody.result.reassembledMatches).toBe(true);

    await browser.close();
  });
});
