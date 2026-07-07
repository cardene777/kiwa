/**
 * Playwright e2e for the invoice + fx crypto/FX flow — a real Chromium
 * browser drives the same invoice / fx handlers the runtime mounts in
 * production. The page UI is not rendered as full React here — the test
 * pumps JSON through the ad-hoc HTTP server + asserts on the response
 * shape, which mirrors how a client would drive the same routes when
 * the app is embedded in a larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives a crypto createInvoice + confirmTx
 *    + abstractGas + linkWallet + status ceremony end to end (invoice
 *    axis).
 *  - A lockRate + initiateSettlement + completeSettlement + status flow
 *    captures the FX cross-border axis end to end.
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

test.describe('payment-crypto-fx-app e2e — Chromium drives the invoice + fx ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('invoice create + confirm + gas + wallet + fx lock + initiate + complete end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Invoice ceremony — create + confirm + gas + wallet + status.
      await adapter.startInvoice({
        sessionId: 'e2e-i',
        provider: 'coinbase-commerce',
      });

      const createRes = await page.request.post(`${running.baseUrl}/invoice`, {
        data: {
          kind: 'create',
          sessionId: 'e2e-i',
          invoiceId: 'inv_alice_1',
          customerId: 'cus_alice',
          amountCents: 100_00,
          currency: 'usd',
          chain: 'ethereum',
          token: 'USDC',
          requiredConfirmations: 3,
          gasAbstractionEnabled: true,
        },
      });
      expect(createRes.status()).toBe(200);
      const createBody = await createRes.json();
      expect(createBody).toMatchObject({
        ok: true,
        kind: 'create',
        invoiceId: 'inv_alice_1',
        chain: 'ethereum',
      });

      const confirmRes = await page.request.post(`${running.baseUrl}/invoice`, {
        data: {
          kind: 'confirm',
          sessionId: 'e2e-i',
          invoiceId: 'inv_alice_1',
          txHash: '0xe2e',
          confirmations: 3,
        },
      });
      expect(confirmRes.status()).toBe(200);
      const confirmBody = await confirmRes.json();
      expect(confirmBody).toMatchObject({
        ok: true,
        kind: 'confirm',
        state: 'confirmed',
      });

      const gasRes = await page.request.post(`${running.baseUrl}/invoice`, {
        data: {
          kind: 'gas',
          sessionId: 'e2e-i',
          invoiceId: 'inv_alice_1',
          paymasterAddress: '0xpaymaster',
          gasSubsidyCents: 250,
        },
      });
      expect(gasRes.status()).toBe(200);
      const gasBody = await gasRes.json();
      expect(gasBody).toMatchObject({
        ok: true,
        kind: 'gas',
        state: 'gas-abstracted',
      });

      const walletRes = await page.request.post(`${running.baseUrl}/invoice`, {
        data: {
          kind: 'wallet',
          sessionId: 'e2e-i',
          invoiceId: 'inv_alice_1',
          walletAddress: '0xwallet',
          signature: '0xsig'.padEnd(130, 'a'),
        },
      });
      expect(walletRes.status()).toBe(200);
      const walletBody = await walletRes.json();
      expect(walletBody).toMatchObject({
        ok: true,
        kind: 'wallet',
        state: 'wallet-linked',
      });

      const statusRes = await page.request.post(`${running.baseUrl}/invoice`, {
        data: {
          kind: 'status',
          sessionId: 'e2e-i',
          invoiceId: 'inv_alice_1',
        },
      });
      expect(statusRes.status()).toBe(200);
      const statusBody = await statusRes.json();
      expect(statusBody).toMatchObject({
        ok: true,
        kind: 'status',
        state: 'wallet-linked',
      });

      // FX ceremony — lock + initiate + complete + status.
      await adapter.startFx({ sessionId: 'e2e-f', provider: 'wise' });

      const lockRes = await page.request.post(`${running.baseUrl}/fx`, {
        data: {
          kind: 'lock',
          sessionId: 'e2e-f',
          transferId: 'tr_alice_1',
          customerId: 'cus_alice',
          fromCurrency: 'USD',
          toCurrency: 'EUR',
          rate: 0.92,
          quoteId: 'q_e2e',
          amountFromCents: 100_00,
        },
      });
      expect(lockRes.status()).toBe(200);
      const lockBody = await lockRes.json();
      expect(lockBody).toMatchObject({
        ok: true,
        kind: 'lock',
        state: 'rate-locked',
        amountToCents: 9_200,
      });

      const initRes = await page.request.post(`${running.baseUrl}/fx`, {
        data: {
          kind: 'initiate',
          sessionId: 'e2e-f',
          transferId: 'tr_alice_1',
          beneficiaryIban: 'DE89370400440532013000',
        },
      });
      expect(initRes.status()).toBe(200);
      const initBody = await initRes.json();
      expect(initBody).toMatchObject({
        ok: true,
        kind: 'initiate',
        state: 'settlement-initiated',
      });

      const compRes = await page.request.post(`${running.baseUrl}/fx`, {
        data: {
          kind: 'complete',
          sessionId: 'e2e-f',
          transferId: 'tr_alice_1',
          settlementRef: 'SWIFT-E2E',
        },
      });
      expect(compRes.status()).toBe(200);
      const compBody = await compRes.json();
      expect(compBody).toMatchObject({
        ok: true,
        kind: 'complete',
        state: 'settlement-completed',
        settledAmountCents: 9_200,
      });

      const fxStatusRes = await page.request.post(`${running.baseUrl}/fx`, {
        data: {
          kind: 'status',
          sessionId: 'e2e-f',
          transferId: 'tr_alice_1',
        },
      });
      expect(fxStatusRes.status()).toBe(200);
      const fxStatusBody = await fxStatusRes.json();
      expect(fxStatusBody).toMatchObject({
        ok: true,
        kind: 'status',
        state: 'settlement-completed',
        settledAmountCents: 9_200,
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
