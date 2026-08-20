/**
 * Playwright e2e for the plan + drift + policy IaC observability flow —
 * a real Chromium browser drives the same plan / drift / policy handlers
 * the runtime mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server +
 * asserts on the response shape, which mirrors how a client would drive
 * the same routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a `terraform plan` capture ceremony
 *    end to end (plan axis).
 *  - A drift-detection sweep across expected + actual resource lists
 *    captures the drift axis end to end.
 *  - An OPA policy evaluation + team cost attribution flow captures the
 *    policy axis end to end.
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

test.describe('observability-iac-drift-app e2e — Chromium drives the plan + drift + policy ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('T-E2E-001 plan capture + drift detect + policy evaluate + cost attribute end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Plan ceremony — start + capture.
      const startPlanRes = await page.request.post(`${running.baseUrl}/plan`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-plan',
          workspace: 'prod',
          target: 'prometheus',
        },
      });
      expect(startPlanRes.status()).toBe(200);
      const startPlanBody = await startPlanRes.json();
      expect(startPlanBody).toMatchObject({
        ok: true,
        kind: 'start',
        workspace: 'prod',
      });

      const captureRes = await page.request.post(`${running.baseUrl}/plan`, {
        data: {
          kind: 'capture',
          sessionId: 'e2e-plan',
          changes: [
            { address: 'aws_instance.web[0]', action: 'create' },
            { address: 'aws_instance.web[1]', action: 'update' },
            { address: 'aws_instance.old', action: 'delete' },
          ],
        },
      });
      expect(captureRes.status()).toBe(200);
      const captureBody = await captureRes.json();
      expect(captureBody).toMatchObject({
        ok: true,
        kind: 'capture',
        changeCount: 3,
        additions: 1,
        modifications: 1,
        deletions: 1,
      });

      // Drift ceremony — start + detect.
      const startDriftRes = await page.request.post(`${running.baseUrl}/drift`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-drift',
          workspace: 'prod',
          target: 'prometheus',
        },
      });
      expect(startDriftRes.status()).toBe(200);

      const detectRes = await page.request.post(`${running.baseUrl}/drift`, {
        data: {
          kind: 'detect',
          sessionId: 'e2e-drift',
          expected: ['aws_instance.a', 'aws_instance.b', 'aws_instance.c'],
          actual: ['aws_instance.a', 'aws_instance.rogue'],
        },
      });
      expect(detectRes.status()).toBe(200);
      const detectBody = await detectRes.json();
      expect(detectBody).toMatchObject({
        ok: true,
        kind: 'detect',
        driftCount: 3,
        hasDrift: true,
      });

      // Drift in-sync — 0 drift, hasDrift=false.
      const startDrift2Res = await page.request.post(`${running.baseUrl}/drift`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-drift-sync',
          workspace: 'prod',
          target: 'prometheus',
        },
      });
      expect(startDrift2Res.status()).toBe(200);
      const detectSyncRes = await page.request.post(`${running.baseUrl}/drift`, {
        data: {
          kind: 'detect',
          sessionId: 'e2e-drift-sync',
          expected: ['a', 'b'],
          actual: ['a', 'b'],
        },
      });
      expect(detectSyncRes.status()).toBe(200);
      const detectSyncBody = await detectSyncRes.json();
      expect(detectSyncBody).toMatchObject({
        ok: true,
        kind: 'detect',
        driftCount: 0,
        hasDrift: false,
      });

      // Policy ceremony — start + evaluate + attribute.
      const startPolicyRes = await page.request.post(`${running.baseUrl}/policy`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-policy',
          workspace: 'prod',
          target: 'prometheus',
        },
      });
      expect(startPolicyRes.status()).toBe(200);

      const evaluateRes = await page.request.post(`${running.baseUrl}/policy`, {
        data: {
          kind: 'evaluate',
          sessionId: 'e2e-policy',
          results: [
            { policyId: 'no-public-s3', passed: true, violationCount: 0 },
            { policyId: 'require-tags', passed: false, violationCount: 2 },
          ],
        },
      });
      expect(evaluateRes.status()).toBe(200);
      const evaluateBody = await evaluateRes.json();
      expect(evaluateBody).toMatchObject({
        ok: true,
        kind: 'evaluate',
        policyCount: 2,
        passed: 1,
        failed: 1,
        totalViolations: 2,
      });

      const attributeRes = await page.request.post(`${running.baseUrl}/policy`, {
        data: {
          kind: 'attribute',
          sessionId: 'e2e-policy',
          attributions: [
            { team: 'platform', monthlyCostUsd: 1500 },
            { team: 'growth', monthlyCostUsd: 800 },
          ],
        },
      });
      expect(attributeRes.status()).toBe(200);
      const attributeBody = await attributeRes.json();
      expect(attributeBody).toMatchObject({
        ok: true,
        kind: 'attribute',
        teamCount: 2,
        totalMonthlyCostUsd: 2300,
      });

      // Session cleanup — close all three surfaces.
      await page.request.post(`${running.baseUrl}/plan`, {
        data: { kind: 'close', sessionId: 'e2e-plan' },
      });
      await page.request.post(`${running.baseUrl}/drift`, {
        data: { kind: 'close', sessionId: 'e2e-drift' },
      });
      await page.request.post(`${running.baseUrl}/policy`, {
        data: { kind: 'close', sessionId: 'e2e-policy' },
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
