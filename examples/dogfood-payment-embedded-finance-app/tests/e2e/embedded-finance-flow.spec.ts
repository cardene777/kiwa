/**
 * Playwright e2e for the treasury + card + kyc embedded finance flow —
 * a real Chromium browser drives the same treasury / card / kyc handlers
 * the runtime mounts in production. The page UI is not rendered as full
 * React here — the test pumps JSON through the ad-hoc HTTP server +
 * asserts on the response shape, which mirrors how a client would drive
 * the same routes when the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a BaaS openAccount + fundAccount +
 *    transferFunds ceremony end to end (treasury axis).
 *  - A card issue + activate + spend flow captures the card axis end to
 *    end.
 *  - A KYC individual + KYB business + aggregate threshold flow captures
 *    the kyc axis end to end.
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

test.describe('payment-embedded-finance-app e2e — Chromium drives the treasury + card + kyc ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('treasury open + fund + transfer + card issue + activate + spend + kyc verify + threshold end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Treasury ceremony — open + fund + transfer.
      await adapter.startTreasury({ sessionId: 'e2e-t', provider: 'stripe-treasury' });

      const openRes = await page.request.post(`${running.baseUrl}/treasury`, {
        data: {
          kind: 'open',
          sessionId: 'e2e-t',
          accountId: 'acct_alice',
          customerId: 'cus_alice',
          currency: 'usd',
        },
      });
      expect(openRes.status()).toBe(200);
      const openBody = await openRes.json();
      expect(openBody).toMatchObject({ ok: true, kind: 'open', accountId: 'acct_alice' });

      await page.request.post(`${running.baseUrl}/treasury`, {
        data: {
          kind: 'open',
          sessionId: 'e2e-t',
          accountId: 'acct_bob',
          customerId: 'cus_bob',
          currency: 'usd',
        },
      });

      const fundRes = await page.request.post(`${running.baseUrl}/treasury`, {
        data: {
          kind: 'fund',
          sessionId: 'e2e-t',
          accountId: 'acct_alice',
          amountCents: 500_000,
          currency: 'usd',
        },
      });
      expect(fundRes.status()).toBe(200);
      const fundBody = await fundRes.json();
      expect(fundBody).toMatchObject({ ok: true, kind: 'fund', balanceCents: 500_000 });

      const transferRes = await page.request.post(`${running.baseUrl}/treasury`, {
        data: {
          kind: 'transfer',
          sessionId: 'e2e-t',
          fromAccountId: 'acct_alice',
          toAccountId: 'acct_bob',
          amountCents: 200_000,
          currency: 'usd',
        },
      });
      expect(transferRes.status()).toBe(200);
      const transferBody = await transferRes.json();
      expect(transferBody).toMatchObject({
        ok: true,
        kind: 'transfer',
        succeeded: true,
      });

      // Card ceremony — issue + activate + spend.
      await adapter.startCard({ sessionId: 'e2e-c', accountId: 'acct_alice' });

      const issueRes = await page.request.post(`${running.baseUrl}/card`, {
        data: {
          kind: 'issue',
          sessionId: 'e2e-c',
          cardId: 'card_alice_1',
          type: 'virtual',
          last4: '4242',
        },
      });
      expect(issueRes.status()).toBe(200);
      const issueBody = await issueRes.json();
      expect(issueBody).toMatchObject({
        ok: true,
        kind: 'issue',
        status: 'inactive',
      });

      const activateRes = await page.request.post(`${running.baseUrl}/card`, {
        data: {
          kind: 'activate',
          sessionId: 'e2e-c',
          cardId: 'card_alice_1',
        },
      });
      expect(activateRes.status()).toBe(200);
      const activateBody = await activateRes.json();
      expect(activateBody).toMatchObject({
        ok: true,
        kind: 'activate',
        status: 'active',
      });

      const spendApproveRes = await page.request.post(`${running.baseUrl}/card`, {
        data: {
          kind: 'spend',
          sessionId: 'e2e-c',
          cardId: 'card_alice_1',
          amountCents: 4_500,
          currency: 'usd',
          availableBalanceCents: 10_000,
        },
      });
      expect(spendApproveRes.status()).toBe(200);
      const spendApproveBody = await spendApproveRes.json();
      expect(spendApproveBody).toMatchObject({
        ok: true,
        kind: 'spend',
        approved: true,
      });

      // Spend decline — insufficient funds.
      const spendDeclineRes = await page.request.post(`${running.baseUrl}/card`, {
        data: {
          kind: 'spend',
          sessionId: 'e2e-c',
          cardId: 'card_alice_1',
          amountCents: 20_000,
          currency: 'usd',
          availableBalanceCents: 1_000,
        },
      });
      expect(spendDeclineRes.status()).toBe(200);
      const spendDeclineBody = await spendDeclineRes.json();
      expect(spendDeclineBody).toMatchObject({
        ok: true,
        kind: 'spend',
        approved: false,
        reason: 'insufficient_funds',
      });

      // KYC ceremony — individual + business + threshold.
      await adapter.startKyc({
        sessionId: 'e2e-k',
        customerId: 'cus_alice',
        provider: 'persona',
      });

      const individualRes = await page.request.post(`${running.baseUrl}/kyc`, {
        data: {
          kind: 'individual',
          sessionId: 'e2e-k',
          score: 85,
          minScore: 60,
        },
      });
      expect(individualRes.status()).toBe(200);
      const individualBody = await individualRes.json();
      expect(individualBody).toMatchObject({
        ok: true,
        kind: 'individual',
        passed: true,
      });

      const businessRes = await page.request.post(`${running.baseUrl}/kyc`, {
        data: {
          kind: 'business',
          sessionId: 'e2e-k',
          businessId: 'biz_kiwa',
          registryOk: true,
        },
      });
      expect(businessRes.status()).toBe(200);
      const businessBody = await businessRes.json();
      expect(businessBody).toMatchObject({
        ok: true,
        kind: 'business',
        passed: true,
      });

      const thresholdRes = await page.request.post(`${running.baseUrl}/kyc`, {
        data: {
          kind: 'threshold',
          sessionId: 'e2e-k',
          aggregateScore: 88,
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
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
