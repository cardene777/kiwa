/**
 * Playwright e2e — idempotent + DLQ + Schema Registry flow (v1.31-2).
 *
 * Covers the v2 axes end-to-end from a real BrowserContext: idempotent
 * producer duplicate-drop, DLQ quarantine + replay, Schema Registry
 * BACKWARD-compat check, testcontainers probe (mock endpoints).
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('idempotent + DLQ + Schema Registry flow', () => {
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

  test('idempotent producer reports 1 duplicate retry on the mock-mode drive', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const producer = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/producer`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          events: [
            { orderId: 'dup-1', region: 'us', total: 1 },
            { orderId: 'dup-2', region: 'eu', total: 2 },
          ],
        }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: { recordsSent: number; duplicateRetries: number };
      };
    }, origin);

    expect(producer.ok).toBe(true);
    expect(producer.result.recordsSent).toBe(2);
    expect(producer.result.duplicateRetries).toBe(1);

    await browser.close();
  });

  test('DLQ quarantines poison messages and reports the DLQ topic name', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const dlq = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/dlq`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          payloads: [
            { orderId: 'ok-1', valid: true },
            { orderId: 'poison-1', valid: false },
            { orderId: 'poison-2', valid: false },
          ],
        }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          outcome: 'handled' | 'quarantined';
          quarantinedCount: number;
          dlqTopic: string;
        };
      };
    }, origin);

    expect(dlq.ok).toBe(true);
    expect(dlq.result.outcome).toBe('quarantined');
    expect(dlq.result.quarantinedCount).toBe(2);
    expect(dlq.result.dlqTopic).toBe('work.dlq');

    await browser.close();
  });

  test('Schema Registry BACKWARD-compat check passes for optional-add follow-up', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const schema = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/schema-registry`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ subject: 'e2e-orders-value', compatibility: 'BACKWARD' }),
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          compatible: boolean;
          registeredSchemaId: number;
          compatibility: string;
        };
      };
    }, origin);

    expect(schema.ok).toBe(true);
    expect(schema.result.compatible).toBe(true);
    expect(schema.result.registeredSchemaId).toBeGreaterThan(0);
    expect(schema.result.compatibility).toBe('BACKWARD');

    await browser.close();
  });

  test('testcontainers probe returns mock endpoints under KIWA_MODE=mock (default)', async () => {
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
          schemaRegistryUrl: string;
          kafkaImage: string;
          reachable: boolean;
        };
      };
    }, origin);

    expect(probe.ok).toBe(true);
    expect(probe.result.reachable).toBe(true);
    expect(probe.result.bootstrap).toContain('kafka-mock');
    expect(probe.result.schemaRegistryUrl).toContain('schema-registry-mock');
    expect(probe.result.kafkaImage).toContain('cp-kafka');

    await browser.close();
  });
});
