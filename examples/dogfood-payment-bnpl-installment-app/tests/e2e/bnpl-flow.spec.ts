/**
 * Playwright e2e for the plan + risk + collection BNPL flow — a real
 * Chromium browser drives the same plan / risk / collection handlers the
 * runtime mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server +
 * asserts on the response shape, which mirrors how a client would drive
 * the same routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a BNPL createPlan +
 *    scheduleInstallment ceremony end to end (plan axis).
 *  - A soft credit-check score + aggregate threshold flow captures the
 *    risk axis end to end.
 *  - A late fee + markPaid + settle + status flow captures the
 *    collection axis end to end.
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

test.describe('payment-bnpl-installment-app e2e — Chromium drives the plan + risk + collection ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('plan create + schedule + risk score + threshold + collection lateFee + markPaid + settle end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Plan ceremony — create + schedule 4 installments.
      await adapter.startPlan({ sessionId: 'e2e-p', provider: 'klarna' });

      const createRes = await page.request.post(`${running.baseUrl}/plan`, {
        data: {
          kind: 'create',
          sessionId: 'e2e-p',
          planId: 'plan_alice_1',
          customerId: 'cus_alice',
          totalCents: 40_000,
          currency: 'usd',
          installments: 4,
          lateFeeCents: 700,
        },
      });
      expect(createRes.status()).toBe(200);
      const createBody = await createRes.json();
      expect(createBody).toMatchObject({
        ok: true,
        kind: 'create',
        planId: 'plan_alice_1',
        installments: 4,
      });

      for (let i = 0; i < 4; i += 1) {
        const scheduleRes = await page.request.post(`${running.baseUrl}/plan`, {
          data: {
            kind: 'schedule',
            sessionId: 'e2e-p',
            planId: 'plan_alice_1',
          },
        });
        expect(scheduleRes.status()).toBe(200);
        const scheduleBody = await scheduleRes.json();
        expect(scheduleBody.ok).toBe(true);
        expect(scheduleBody.installmentIndex).toBe(i + 1);
      }

      // Risk ceremony — score + threshold.
      await adapter.startRisk({
        sessionId: 'e2e-r',
        planId: 'plan_alice_1',
        creditBureau: 'experian',
      });

      const scoreRes = await page.request.post(`${running.baseUrl}/risk`, {
        data: {
          kind: 'score',
          sessionId: 'e2e-r',
          planId: 'plan_alice_1',
          score: 78,
          minRequired: 50,
        },
      });
      expect(scoreRes.status()).toBe(200);
      const scoreBody = await scoreRes.json();
      expect(scoreBody).toMatchObject({
        ok: true,
        kind: 'score',
        passed: true,
      });

      const thresholdRes = await page.request.post(`${running.baseUrl}/risk`, {
        data: {
          kind: 'threshold',
          sessionId: 'e2e-r',
          planId: 'plan_alice_1',
          aggregateScore: 82,
          minRequired: 70,
        },
      });
      expect(thresholdRes.status()).toBe(200);
      const thresholdBody = await thresholdRes.json();
      expect(thresholdBody).toMatchObject({
        ok: true,
        kind: 'threshold',
        passed: true,
      });

      // Collection ceremony — lateFee + markPaid + settle + status.
      await adapter.startCollection({
        sessionId: 'e2e-c',
        planId: 'plan_alice_1',
      });

      const lateFeeRes = await page.request.post(
        `${running.baseUrl}/collection`,
        {
          data: {
            kind: 'lateFee',
            sessionId: 'e2e-c',
            planId: 'plan_alice_1',
            installmentIndex: 1,
          },
        },
      );
      expect(lateFeeRes.status()).toBe(200);
      const lateFeeBody = await lateFeeRes.json();
      expect(lateFeeBody).toMatchObject({
        ok: true,
        kind: 'lateFee',
        installmentIndex: 1,
      });

      const paidRes = await page.request.post(
        `${running.baseUrl}/collection`,
        {
          data: {
            kind: 'markPaid',
            sessionId: 'e2e-c',
            planId: 'plan_alice_1',
          },
        },
      );
      expect(paidRes.status()).toBe(200);
      const paidBody = await paidRes.json();
      expect(paidBody).toMatchObject({
        ok: true,
        kind: 'markPaid',
      });

      const settleRes = await page.request.post(
        `${running.baseUrl}/collection`,
        {
          data: {
            kind: 'settle',
            sessionId: 'e2e-c',
            planId: 'plan_alice_1',
          },
        },
      );
      expect(settleRes.status()).toBe(200);
      const settleBody = await settleRes.json();
      expect(settleBody).toMatchObject({
        ok: true,
        kind: 'settle',
        state: 'settled',
      });

      const statusRes = await page.request.post(
        `${running.baseUrl}/collection`,
        {
          data: {
            kind: 'status',
            sessionId: 'e2e-c',
            planId: 'plan_alice_1',
          },
        },
      );
      expect(statusRes.status()).toBe(200);
      const statusBody = await statusRes.json();
      expect(statusBody).toMatchObject({
        ok: true,
        kind: 'status',
        installmentsRemaining: 0,
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
