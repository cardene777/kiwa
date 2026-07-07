/**
 * Playwright e2e for the CSP + violation + security headers flow — a real
 * Chromium browser drives the same csp / violation / headers handlers the
 * Next.js 15.4 App Router mounts in production. The page UI is not
 * rendered as full React here — the test pumps JSON through the ad-hoc
 * HTTP server + asserts on the response shape, which mirrors how a
 * Next.js middleware / route handler client would drive the same routes
 * when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a CSP build with nonce + hash +
 *    strict-dynamic + trusted-types + report-to.
 *  - A violation reporting flow captures ingest + verdict + close end to
 *    end.
 *  - A headers bundle flow captures HSTS + Referrer + Permissions + XFO +
 *    XCTO end to end.
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

test.describe('security-csp-headers-app e2e — Chromium drives the CSP + violation + headers ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('CSP build + violation ingest + headers bundle end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      const cspRes = await page.request.post(`${running.baseUrl}/csp`, {
        data: {
          kind: 'build',
          routeId: '/e2e',
          policyId: 'e2e-csp',
          nonce: 'AAAAAAAAAAAAAAAAAAAAAA',
          hash: { algorithm: 'sha256', digest: 'YWJjZA==' },
          strictDynamic: true,
          trustedTypes: { policies: ['default'], requireForScript: true },
          reportOnly: false,
          reportGroup: 'csp-endpoint',
        },
      });
      expect(cspRes.status()).toBe(200);
      const cspBody = await cspRes.json();
      expect(cspBody).toMatchObject({ ok: true, kind: 'build' });
      expect(cspBody.headerValue).toContain("'strict-dynamic'");
      expect(cspBody.headerValue).toContain('trusted-types default');

      const violStartRes = await page.request.post(
        `${running.baseUrl}/violation`,
        {
          data: {
            kind: 'ingest',
            routeId: '/e2e',
            policyId: 'e2e-csp',
            reportId: 'e2e-report',
            directive: 'script-src',
            blockedUri: 'https://evil.example.com/x.js',
            disposition: 'enforce',
            verdict: 'deny',
            reason: 'blocklist',
          },
        },
      );
      expect(violStartRes.status()).toBe(200);
      const violStartBody = await violStartRes.json();
      expect(violStartBody).toMatchObject({
        ok: true,
        accepted: true,
        directive: 'script-src',
      });

      const violCloseRes = await page.request.post(
        `${running.baseUrl}/violation`,
        {
          data: {
            kind: 'close',
            routeId: '/e2e',
            policyId: 'e2e-csp',
            reportId: 'e2e-report',
          },
        },
      );
      expect(violCloseRes.status()).toBe(200);
      const violCloseBody = await violCloseRes.json();
      expect(violCloseBody).toMatchObject({ ok: true, kind: 'close' });

      const hdrRes = await page.request.post(`${running.baseUrl}/headers`, {
        data: {
          kind: 'build',
          routeId: '/e2e',
          bundleId: 'e2e-headers',
          hsts: {
            maxAgeSec: 31_536_000,
            includeSubDomains: true,
            preload: true,
          },
          referrerPolicy: 'strict-origin-when-cross-origin',
          permissionsPolicy: { geolocation: 'self', camera: 'none' },
          xFrame: 'DENY',
          xContentTypeOptions: true,
        },
      });
      expect(hdrRes.status()).toBe(200);
      const hdrBody = await hdrRes.json();
      expect(hdrBody).toMatchObject({ ok: true, validationOk: true });
      expect(hdrBody.headers['Strict-Transport-Security']).toContain('preload');
      expect(hdrBody.headers['X-Frame-Options']).toBe('DENY');
      expect(hdrBody.headers['X-Content-Type-Options']).toBe('nosniff');
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });

  test('route dispatcher returns 404 for unknown paths and 405 for GET', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      const missingRes = await page.request.post(`${running.baseUrl}/missing`, {
        data: {},
      });
      expect(missingRes.status()).toBe(404);
      const missingBody = await missingRes.json();
      expect(missingBody).toMatchObject({
        ok: false,
        errorKind: 'route_not_found',
      });

      const wrongMethodRes = await page.request.get(`${running.baseUrl}/csp`);
      expect(wrongMethodRes.status()).toBe(405);
      const wrongMethodBody = await wrongMethodRes.json();
      expect(wrongMethodBody).toMatchObject({
        ok: false,
        errorKind: 'method_not_allowed',
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
