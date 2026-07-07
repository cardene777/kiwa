/**
 * Playwright e2e for the chaos + remediation + rca chaos + AIOps
 * observability flow — a real Chromium browser drives the same chaos /
 * remediation / rca handlers the runtime mounts in production. The
 * page UI is not rendered as full React here — the test pumps JSON
 * through the ad-hoc HTTP server + asserts on the response shape,
 * which mirrors how a client would drive the same routes when the app
 * is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a full fault injection +
 *    blast-radius + auto-rollback ceremony end to end (chaos axis).
 *  - A Chromium BrowserContext drives a full anomaly detection +
 *    runbook execution ceremony end to end (remediation axis).
 *  - A Chromium BrowserContext drives a full root cause analysis +
 *    alert correlation ceremony end to end (rca axis).
 *
 * When Playwright browsers are not installed the tests skip with a
 * clear reason so `pnpm test:e2e` still passes on hosts without the
 * browser cache.
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

test.describe('observability-chaos-aiops-app e2e — Chromium drives the chaos + remediation + rca ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('fault injection + rollback + anomaly + remediation + rca + correlation end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Chaos ceremony — start + inject + rollback.
      const startChaosRes = await page.request.post(`${running.baseUrl}/chaos`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-chaos',
          experimentId: 'exp-e2e',
          target: 'prometheus',
        },
      });
      expect(startChaosRes.status()).toBe(200);
      const startChaosBody = await startChaosRes.json();
      expect(startChaosBody).toMatchObject({
        ok: true,
        kind: 'start',
        experimentId: 'exp-e2e',
      });

      const injectRes = await page.request.post(`${running.baseUrl}/chaos`, {
        data: {
          kind: 'inject',
          sessionId: 'e2e-chaos',
          fault: { kind: 'network-latency', target: 'checkout-svc', durationSec: 60 },
        },
      });
      expect(injectRes.status()).toBe(200);
      const injectBody = await injectRes.json();
      expect(injectBody).toMatchObject({
        ok: true,
        kind: 'inject',
        faultKind: 'network-latency',
        faultTarget: 'checkout-svc',
        durationSec: 60,
      });

      const rollbackRes = await page.request.post(`${running.baseUrl}/chaos`, {
        data: {
          kind: 'rollback',
          sessionId: 'e2e-chaos',
          blastRadius: { affectedInstances: 3, totalInstances: 10 },
          rollback: { errorRate: 0.15, threshold: 0.1 },
        },
      });
      expect(rollbackRes.status()).toBe(200);
      const rollbackBody = await rollbackRes.json();
      expect(rollbackBody).toMatchObject({
        ok: true,
        kind: 'rollback',
        triggered: true,
        affectedInstances: 3,
      });

      // Chaos without rollback trigger — errorRate below threshold.
      const startChaos2Res = await page.request.post(`${running.baseUrl}/chaos`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-chaos-safe',
          experimentId: 'exp-e2e-safe',
          target: 'prometheus',
        },
      });
      expect(startChaos2Res.status()).toBe(200);
      await page.request.post(`${running.baseUrl}/chaos`, {
        data: {
          kind: 'inject',
          sessionId: 'e2e-chaos-safe',
          fault: { kind: 'cpu-stress', target: 'svc-a', durationSec: 30 },
        },
      });
      const rollbackSafeRes = await page.request.post(`${running.baseUrl}/chaos`, {
        data: {
          kind: 'rollback',
          sessionId: 'e2e-chaos-safe',
          blastRadius: { affectedInstances: 1, totalInstances: 10 },
          rollback: { errorRate: 0.05, threshold: 0.1 },
        },
      });
      expect(rollbackSafeRes.status()).toBe(200);
      const rollbackSafeBody = await rollbackSafeRes.json();
      expect(rollbackSafeBody).toMatchObject({
        ok: true,
        kind: 'rollback',
        triggered: false,
      });

      // Remediation ceremony — start + detect + execute.
      const startRemRes = await page.request.post(
        `${running.baseUrl}/remediation`,
        {
          data: {
            kind: 'start',
            sessionId: 'e2e-rem',
            clusterId: 'prod',
            target: 'prometheus',
          },
        },
      );
      expect(startRemRes.status()).toBe(200);

      const detectRes = await page.request.post(
        `${running.baseUrl}/remediation`,
        {
          data: {
            kind: 'detect',
            sessionId: 'e2e-rem',
            points: [
              { metric: 'cpu.load', value: 80, zScore: 4.2 },
              { metric: 'memory.rss', value: 60, zScore: 0.8 },
            ],
            zScoreThreshold: 3,
          },
        },
      );
      expect(detectRes.status()).toBe(200);
      const detectBody = await detectRes.json();
      expect(detectBody).toMatchObject({
        ok: true,
        kind: 'detect',
        anomalyCount: 1,
        hasAnomaly: true,
      });

      const executeRes = await page.request.post(
        `${running.baseUrl}/remediation`,
        {
          data: {
            kind: 'execute',
            sessionId: 'e2e-rem',
            actions: [
              { actionId: 'restart-pod', runbookId: 'rb-1', success: true },
              { actionId: 'scale-up', runbookId: 'rb-2', success: true },
              { actionId: 'notify-oncall', runbookId: 'rb-3', success: false },
            ],
          },
        },
      );
      expect(executeRes.status()).toBe(200);
      const executeBody = await executeRes.json();
      expect(executeBody).toMatchObject({
        ok: true,
        kind: 'execute',
        actionCount: 3,
        succeeded: 2,
        failed: 1,
        allSucceeded: false,
      });

      // RCA ceremony — start + analyze + correlate.
      const startRcaRes = await page.request.post(`${running.baseUrl}/rca`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-rca',
          clusterId: 'prod',
          target: 'prometheus',
        },
      });
      expect(startRcaRes.status()).toBe(200);

      const analyzeRes = await page.request.post(`${running.baseUrl}/rca`, {
        data: {
          kind: 'analyze',
          sessionId: 'e2e-rca',
          edges: [
            { from: 'gateway', to: 'api' },
            { from: 'api', to: 'db' },
          ],
          failedServices: ['gateway', 'api', 'db'],
        },
      });
      expect(analyzeRes.status()).toBe(200);
      const analyzeBody = await analyzeRes.json();
      expect(analyzeBody).toMatchObject({
        ok: true,
        kind: 'analyze',
        rootCause: 'gateway',
        failedCount: 3,
      });

      const correlateRes = await page.request.post(`${running.baseUrl}/rca`, {
        data: {
          kind: 'correlate',
          sessionId: 'e2e-rca',
          alerts: [
            { alertId: 'a1', service: 'gateway', firedAtMs: 1000 },
            { alertId: 'a2', service: 'api', firedAtMs: 1500 },
            { alertId: 'a3', service: 'db', firedAtMs: 2000 },
          ],
          windowMs: 5000,
        },
      });
      expect(correlateRes.status()).toBe(200);
      const correlateBody = await correlateRes.json();
      expect(correlateBody).toMatchObject({
        ok: true,
        kind: 'correlate',
        alertCount: 3,
        groupCount: 1,
      });

      // Session cleanup — close all three surfaces.
      await page.request.post(`${running.baseUrl}/chaos`, {
        data: { kind: 'close', sessionId: 'e2e-chaos' },
      });
      await page.request.post(`${running.baseUrl}/chaos`, {
        data: { kind: 'close', sessionId: 'e2e-chaos-safe' },
      });
      await page.request.post(`${running.baseUrl}/remediation`, {
        data: { kind: 'close', sessionId: 'e2e-rem' },
      });
      await page.request.post(`${running.baseUrl}/rca`, {
        data: { kind: 'close', sessionId: 'e2e-rca' },
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
