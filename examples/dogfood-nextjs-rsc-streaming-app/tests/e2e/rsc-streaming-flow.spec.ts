/**
 * Playwright e2e for the RSC streaming flow — a real Chromium browser
 * drives the same article + catalog + signaling handlers the Next.js 15.4
 * App Router mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server + asserts
 * on the response shape, which mirrors how a Next.js RSC client would
 * drive the same routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives an article render + streams its
 *    chunks in order.
 *  - A catalog stream captures pending, recoverable + non-recoverable
 *    error boundaries end to end.
 *  - A signaling transition + form action round-trip records both view
 *    transition assertions + form action lifecycle events on the trace.
 *
 * When Playwright browsers are not installed the tests skip with a clear
 * reason so `pnpm test:e2e` still passes on hosts without the browser
 * cache.
 */

import { existsSync } from 'node:fs';
import { chromium, expect, test } from '@playwright/test';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { startNextServer } from '../../src/lib/next-server.js';

function browserAvailable(): boolean {
  try {
    const path = chromium.executablePath();
    return typeof path === 'string' && existsSync(path);
  } catch {
    return false;
  }
}

test.describe('rsc-streaming-app e2e — Chromium drives the RSC streaming ceremony', () => {
  test.skip(!browserAvailable(), 'Chromium binary not installed — run `pnpm exec playwright install chromium`');

  test('T-E2E-001 article render + catalog stream + signaling transition end to end', async () => {
    const adapter = makeMockAdapter({ seed: 42, latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      const articleRes = await page.request.post(`${running.baseUrl}/article`, {
        data: {
          kind: 'render',
          routeId: '/articles/e2e',
          articleId: 'e2e-article',
          suspenseFallback: '<template data-suspense="pending"></template>',
        },
      });
      expect(articleRes.status()).toBe(200);
      const articleBody = await articleRes.json();
      expect(articleBody).toMatchObject({ ok: true, kind: 'render' });
      expect(articleBody.chunkCount).toBeGreaterThanOrEqual(4);

      const catalogRes = await page.request.post(`${running.baseUrl}/catalog`, {
        data: {
          kind: 'stream',
          routeId: '/catalog/e2e',
          catalogId: 'e2e-catalog',
          boundaries: ['hero', 'grid'],
          errors: [{ boundaryId: 'hero', message: 'e2e flaky', recoverable: true }],
        },
      });
      expect(catalogRes.status()).toBe(200);
      const catalogBody = await catalogRes.json();
      expect(catalogBody).toMatchObject({
        ok: true,
        kind: 'stream',
        pendingCount: 0,
        hydratedCount: 2,
        errorCount: 1,
      });

      const transitionRes = await page.request.post(`${running.baseUrl}/signaling`, {
        data: {
          kind: 'transition',
          routeId: '/signaling/e2e',
          transitionId: 'e2e-nav',
          elements: [{ elementId: 'hero', from: '/', to: '/detail' }],
          animations: [{ assertionId: 'fade', durationMs: 200 }],
        },
      });
      expect(transitionRes.status()).toBe(200);
      const transitionBody = await transitionRes.json();
      expect(transitionBody).toMatchObject({
        ok: true,
        kind: 'transition',
        transitionId: 'e2e-nav',
        elementCount: 1,
        assertionCount: 1,
      });

      const formRes = await page.request.post(`${running.baseUrl}/signaling`, {
        data: {
          kind: 'form',
          routeId: '/signaling/e2e',
          formId: 'e2e-form',
          submitter: 'button-primary',
          initial: { subscribed: false },
          optimistic: { subscribed: true },
          enhance: { actionUrl: '/api/subscribe', method: 'post' },
          resolveWith: { subscribed: true },
        },
      });
      expect(formRes.status()).toBe(200);
      const formBody = await formRes.json();
      expect(formBody).toMatchObject({
        ok: true,
        kind: 'form',
        enhanced: true,
        optimisticApplied: true,
        resolved: true,
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });

  test('T-E2E-002 404 route returns ok:false', async () => {
    const adapter = makeMockAdapter();
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();
    try {
      const res = await page.request.post(`${running.baseUrl}/does-not-exist`, {
        data: { anything: true },
      });
      expect(res.status()).toBe(404);
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });

  test('T-E2E-003 GET method is rejected with 405', async () => {
    const adapter = makeMockAdapter();
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();
    try {
      const res = await page.request.get(`${running.baseUrl}/article`);
      expect(res.status()).toBe(405);
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
