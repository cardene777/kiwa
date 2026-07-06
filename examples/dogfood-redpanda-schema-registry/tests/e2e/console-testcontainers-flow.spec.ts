/**
 * Playwright e2e — Console admin + testcontainers probe flow (v1.31-3).
 *
 * A single BrowserContext drives the Console admin + testcontainers probe
 * routes end-to-end. Assertions cover the AC axis "Redpanda Console API
 * integration" + "Redpanda v23+ testcontainers".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('console admin + testcontainers probe — real driver env-gate', () => {
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

  test('console admin walks 4 endpoints + reports healthOk + subjectsSeen', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const admin = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/console-admin`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          baseUrl: string;
          endpoints: readonly { path: string; status: number; ok: boolean }[];
          healthOk: boolean;
          subjectsSeen: number;
          schemaByIdReachable: boolean;
        };
      };
    }, origin);

    expect(admin.ok).toBe(true);
    expect(admin.result.healthOk).toBe(true);
    expect(admin.result.subjectsSeen).toBeGreaterThan(0);
    expect(admin.result.schemaByIdReachable).toBe(true);
    // 4 endpoints hit — /api/subjects + /api/config/... + /api/schemas/ids/1 + /api/health.
    expect(admin.result.endpoints).toHaveLength(4);
    const paths = admin.result.endpoints.map((e) => e.path);
    expect(paths).toContain('/api/subjects');
    expect(paths).toContain('/api/health');

    await browser.close();
  });

  test('testcontainers probe reports mock endpoints + reachable=true', async () => {
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
          bootstrap: string;
          consoleUrl: string;
          schemaRegistryUrl: string;
          redpandaImage: string;
          consoleImage: string;
          reachable: boolean;
        };
      };
    }, origin);

    expect(probe.ok).toBe(true);
    expect(probe.result.reachable).toBe(true);
    expect(probe.result.bootstrap).toContain('redpanda-mock');
    expect(probe.result.consoleUrl).toContain('redpanda-console-mock');
    expect(probe.result.redpandaImage).toContain('redpandadata/redpanda');
    expect(probe.result.consoleImage).toContain('redpandadata/console');

    await browser.close();
  });
});
