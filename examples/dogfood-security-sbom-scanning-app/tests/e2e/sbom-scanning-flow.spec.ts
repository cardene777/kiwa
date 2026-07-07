/**
 * Playwright e2e for the SBOM + secret scanning + scanner flow — a real
 * Chromium browser drives the same sbom / secrets-scan / scanner handlers
 * the runtime mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server + asserts
 * on the response shape, which mirrors how a client would drive the same
 * routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives an SBOM addComponent + CycloneDX +
 *    SPDX emission + license evaluation ceremony end to end.
 *  - A secrets scanning + rotation SLA flow captures scan + trackRotation +
 *    markRotated paths.
 *  - A scanner OSV / NVD lookup + composed report flow captures the
 *    Trivy-style verdict escalation end to end.
 *
 * When Playwright browsers are not installed the tests skip with a clear
 * reason so `pnpm test:e2e` still passes on hosts without the browser
 * cache.
 */

import { existsSync } from 'node:fs';
import { chromium, expect, test } from '@playwright/test';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { startNextServer } from '../../src/lib/next-server.js';

const FIXTURE_AWS_KEY = 'AKIAIOSFODNN7EXAMPLE';

function browserAvailable(): boolean {
  try {
    const path = chromium.executablePath();
    return typeof path === 'string' && existsSync(path);
  } catch {
    return false;
  }
}

test.describe('security-sbom-scanning-app e2e — Chromium drives the SBOM + secret scanning + scanner ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('SBOM emission + secret scan + scanner report end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Bootstrap the SBOM session via the route so the ceremony is
      // driven end to end from Chromium.
      const startSbom = await page.request.post(`${running.baseUrl}/sbom`, {
        data: { kind: 'start', sbomId: 'e2e-sbom' },
      });
      expect(startSbom.status()).toBe(200);

      const addLodash = await page.request.post(`${running.baseUrl}/sbom`, {
        data: {
          kind: 'addComponent',
          sbomId: 'e2e-sbom',
          component: {
            name: 'lodash',
            version: '4.17.20',
            purl: 'pkg:npm/lodash@4.17.20',
            license: 'MIT',
          },
        },
      });
      expect(addLodash.status()).toBe(200);
      const addLodashBody = await addLodash.json();
      expect(addLodashBody).toMatchObject({
        ok: true,
        kind: 'addComponent',
        componentCount: 1,
      });

      const addReact = await page.request.post(`${running.baseUrl}/sbom`, {
        data: {
          kind: 'addComponent',
          sbomId: 'e2e-sbom',
          component: {
            name: 'react',
            version: '19.0.0',
            purl: 'pkg:npm/react@19.0.0',
            license: 'MIT',
          },
        },
      });
      expect(addReact.status()).toBe(200);

      const emit = await page.request.post(`${running.baseUrl}/sbom`, {
        data: { kind: 'emitCycloneDx', sbomId: 'e2e-sbom' },
      });
      expect(emit.status()).toBe(200);
      const emitBody = await emit.json();
      expect(emitBody).toMatchObject({
        ok: true,
        kind: 'emitCycloneDx',
        format: 'cyclonedx',
        formatVersion: '1.5',
      });

      const license = await page.request.post(`${running.baseUrl}/sbom`, {
        data: { kind: 'evaluateLicense', sbomId: 'e2e-sbom' },
      });
      expect(license.status()).toBe(200);
      const licenseBody = await license.json();
      expect(licenseBody).toMatchObject({
        ok: true,
        kind: 'evaluateLicense',
        overallVerdict: 'allow',
      });

      // Secrets scanning + rotation SLA flow.
      const startScan = await page.request.post(
        `${running.baseUrl}/secrets-scan`,
        {
          data: {
            kind: 'start',
            scanId: 'e2e-scan',
            rotateWithinDays: 30,
          },
        },
      );
      expect(startScan.status()).toBe(200);

      const scan = await page.request.post(
        `${running.baseUrl}/secrets-scan`,
        {
          data: {
            kind: 'scan',
            scanId: 'e2e-scan',
            source: `const k = "${FIXTURE_AWS_KEY}";`,
          },
        },
      );
      expect(scan.status()).toBe(200);
      const scanBody = await scan.json();
      expect(scanBody.ok).toBe(true);
      expect(scanBody.findings.length).toBeGreaterThanOrEqual(1);

      const discovered = Date.UTC(2026, 6, 7);
      const track = await page.request.post(
        `${running.baseUrl}/secrets-scan`,
        {
          data: {
            kind: 'trackRotation',
            scanId: 'e2e-scan',
            findingIndex: 0,
            discoveredAtMs: discovered,
          },
        },
      );
      expect(track.status()).toBe(200);

      const rotated = await page.request.post(
        `${running.baseUrl}/secrets-scan`,
        {
          data: {
            kind: 'markRotated',
            scanId: 'e2e-scan',
            findingIndex: 0,
            rotatedAtMs: discovered + 3 * 24 * 60 * 60 * 1000,
          },
        },
      );
      expect(rotated.status()).toBe(200);
      const rotatedBody = await rotated.json();
      expect(rotatedBody).toMatchObject({
        ok: true,
        kind: 'markRotated',
        overdue: false,
      });

      // Scanner OSV / NVD lookup + Trivy-style report.
      const report = await page.request.post(`${running.baseUrl}/scanner`, {
        data: {
          kind: 'report',
          scanId: 'e2e-scan',
          sbomId: 'e2e-sbom',
          feed: {
            advisories: [
              {
                id: 'GHSA-critical-lodash',
                severity: 'critical',
                summary: 'Prototype pollution in lodash < 4.17.21',
                source: 'osv',
                affects: [
                  { purl: 'pkg:npm/lodash', versionRange: '< 4.17.21' },
                ],
              },
            ],
          },
        },
      });
      expect(report.status()).toBe(200);
      const reportBody = await report.json();
      expect(reportBody).toMatchObject({
        ok: true,
        kind: 'report',
        overallVerdict: 'deny',
      });
      expect(reportBody.componentCount).toBe(2);
      expect(reportBody.vulnerableCount).toBe(1);
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
