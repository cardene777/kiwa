/**
 * Playwright e2e — emit fidelity flow (v1.32-4).
 *
 * Drives the /emit-fidelity + /metrics + /traces routes end-to-end.
 * Assertions cover the AC axis "release gate 13 axis all PASS" trace
 * feed — the mock trace produced here is what feeds the v1.32-6 publish
 * release-smoke harness.
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('emit fidelity — trace feed for release gate 13 axis', () => {
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

  test('emit-fidelity + metrics + traces routes return the full mock surface', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      // Drive the 5-op surface then emit fidelity + read metrics + traces.
      await fetch(`${base}/wal-full-journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      await fetch(`${base}/fts5-full-journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      await fetch(`${base}/edge-roundtrip`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      await fetch(`${base}/testcontainers-probe`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const emit = await fetch(`${base}/emit-fidelity`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const emitBody = (await emit.json()) as { ok: boolean };
      const metrics = await fetch(`${base}/metrics`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const metricsBody = (await metrics.json()) as {
        ok: boolean;
        result: {
          walJourneySteps: number;
          fts5JourneySteps: number;
          edgeInvocations: number;
          testcontainersProbes: number;
          latencySamplesMs: number[];
        };
      };
      const traces = await fetch(`${base}/traces`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      const tracesBody = (await traces.json()) as {
        ok: boolean;
        result: { op: string; ok: boolean }[];
      };
      return { emitBody, metricsBody, tracesBody };
    }, origin);

    expect(combined.emitBody.ok).toBe(true);
    expect(combined.metricsBody.result.walJourneySteps).toBe(4);
    expect(combined.metricsBody.result.fts5JourneySteps).toBe(4);
    expect(combined.metricsBody.result.edgeInvocations).toBeGreaterThan(0);
    expect(combined.metricsBody.result.testcontainersProbes).toBe(1);
    expect(combined.metricsBody.result.latencySamplesMs.length).toBe(5);
    expect(combined.tracesBody.result.length).toBe(5);
    for (const t of combined.tracesBody.result) {
      expect(t.ok).toBe(true);
    }

    await browser.close();
  });
});
