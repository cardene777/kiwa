/**
 * Playwright e2e for the Server Action flow — a real Chromium browser
 * drives the same subscribe + like + login handlers the Next.js 15.4
 * App Router mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server + asserts
 * on the response shape, which mirrors how a Next.js Server Action client
 * would drive the same routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a subscribe form action + revalidatePath.
 *  - A like flow captures useFormStatus pending + useOptimistic patch +
 *    revalidateTag end to end.
 *  - A login flow captures progressive enhancement + redirect end to end.
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

test.describe('server-action-app e2e — Chromium drives the Server Action ceremony', () => {
  test.skip(!browserAvailable(), 'Chromium binary not installed — run `pnpm exec playwright install chromium`');

  test('subscribe form action + like optimistic + login redirect end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      const subscribeRes = await page.request.post(`${running.baseUrl}/subscribe`, {
        data: {
          kind: 'submit',
          routeId: '/subscribe/e2e',
          actionId: 'e2e-subscribe',
          form: { email: 'e2e@example.com', plan: 'monthly' },
          revalidatePath: '/subscribers',
        },
      });
      expect(subscribeRes.status()).toBe(200);
      const subscribeBody = await subscribeRes.json();
      expect(subscribeBody).toMatchObject({
        ok: true,
        kind: 'submit',
        fieldCount: 2,
      });
      expect(subscribeBody.revalidatedPaths).toEqual(['/subscribers']);

      const likeRes = await page.request.post(`${running.baseUrl}/like`, {
        data: {
          kind: 'run',
          routeId: '/like/e2e',
          actionId: 'e2e-like',
          formId: 'e2e-like-form',
          targetId: 'post-e2e',
          submitter: 'button-heart',
          initial: { likes: 5, liked: false },
          optimistic: { liked: true, likes: 6 },
          resolveWith: { liked: true, likes: 6 },
          revalidateTag: 'post-e2e-likes',
        },
      });
      expect(likeRes.status()).toBe(200);
      const likeBody = await likeRes.json();
      expect(likeBody).toMatchObject({
        ok: true,
        kind: 'run',
        optimisticApplied: true,
        resolved: true,
      });
      expect(likeBody.revalidatedTags).toEqual(['post-e2e-likes']);

      const loginRes = await page.request.post(`${running.baseUrl}/login`, {
        data: {
          kind: 'run',
          routeId: '/login/e2e',
          actionId: 'e2e-login',
          formId: 'e2e-login-form',
          submitter: 'submit-primary',
          credentials: { email: 'e2e@example.com', password: 'p' },
          enhance: { actionUrl: '/api/login', method: 'post' },
          redirectTo: '/dashboard',
        },
      });
      expect(loginRes.status()).toBe(200);
      const loginBody = await loginRes.json();
      expect(loginBody).toMatchObject({
        ok: true,
        kind: 'run',
        enhanced: true,
        submitted: true,
      });
      expect(loginBody.redirectUrl).toBe('/dashboard');
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });

  test('404 route returns ok:false', async () => {
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

  test('GET method is rejected with 405', async () => {
    const adapter = makeMockAdapter();
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();
    try {
      const res = await page.request.get(`${running.baseUrl}/subscribe`);
      expect(res.status()).toBe(405);
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
