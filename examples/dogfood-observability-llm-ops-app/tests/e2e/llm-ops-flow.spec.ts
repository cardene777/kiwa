/**
 * Playwright e2e for the token + prompt + budget LLM observability
 * flow — a real Chromium browser drives the same tokens / prompts /
 * budget handlers the runtime mounts in production. The page UI is not
 * rendered as full React here — the test pumps JSON through the ad-hoc
 * HTTP server + asserts on the response shape, which mirrors how a
 * client would drive the same routes when the app is embedded in a
 * larger runtime.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - A Chromium BrowserContext drives an OTel GenAI stable token
 *    counting ceremony end to end (token axis).
 *  - A prompt log + hallucination flag sweep across faithfulness /
 *    relevance / toxicity signals captures the prompt axis end to end.
 *  - A monthly USD spend vs limit check captures the budget axis end
 *    to end.
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

test.describe('observability-llm-ops-app e2e — Chromium drives the token + prompt + budget ceremony', () => {
  test.skip(
    !browserAvailable(),
    'Chromium binary not installed — run `pnpm exec playwright install chromium`',
  );

  test('T-E2E-001 token count + prompt log + hallucination flag + budget check end to end', async () => {
    const adapter = makeMockAdapter({ latencyMs: 0 });
    const running = await startNextServer({ adapter });
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ baseURL: running.baseUrl });
    const page = await context.newPage();

    try {
      // Token ceremony — start + count.
      const startTokenRes = await page.request.post(`${running.baseUrl}/tokens`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-token',
          serviceName: 'llm-gateway',
          target: 'prometheus',
        },
      });
      expect(startTokenRes.status()).toBe(200);
      const startTokenBody = await startTokenRes.json();
      expect(startTokenBody).toMatchObject({
        ok: true,
        kind: 'start',
        serviceName: 'llm-gateway',
      });

      const countRes = await page.request.post(`${running.baseUrl}/tokens`, {
        data: {
          kind: 'count',
          sessionId: 'e2e-token',
          usage: {
            model: 'gpt-4o',
            promptTokens: 1200,
            completionTokens: 480,
          },
        },
      });
      expect(countRes.status()).toBe(200);
      const countBody = await countRes.json();
      expect(countBody).toMatchObject({
        ok: true,
        kind: 'count',
        model: 'gpt-4o',
        promptTokens: 1200,
        completionTokens: 480,
        totalTokens: 1680,
      });

      // Prompt ceremony — start + log + flag.
      const startPromptRes = await page.request.post(`${running.baseUrl}/prompts`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-prompt',
          serviceName: 'chat-api',
          target: 'prometheus',
        },
      });
      expect(startPromptRes.status()).toBe(200);

      const logRes = await page.request.post(`${running.baseUrl}/prompts`, {
        data: {
          kind: 'log',
          sessionId: 'e2e-prompt',
          prompt: {
            requestId: 'req-e2e-1',
            system: 'You are a helpful assistant.',
            user: 'What is the capital of France?',
            redacted: false,
          },
        },
      });
      expect(logRes.status()).toBe(200);
      const logBody = await logRes.json();
      expect(logBody).toMatchObject({
        ok: true,
        kind: 'log',
        requestId: 'req-e2e-1',
        redacted: false,
      });

      const flagRes = await page.request.post(`${running.baseUrl}/prompts`, {
        data: {
          kind: 'flag',
          sessionId: 'e2e-prompt',
          signals: [
            { metric: 'faithfulness', score: 0.4, threshold: 0.7 },
            { metric: 'relevance', score: 0.9, threshold: 0.5 },
            { metric: 'toxicity', score: 0.8, threshold: 0.5 },
          ],
        },
      });
      expect(flagRes.status()).toBe(200);
      const flagBody = await flagRes.json();
      expect(flagBody).toMatchObject({
        ok: true,
        kind: 'flag',
        signalCount: 3,
        flaggedCount: 2,
        anyFlagged: true,
      });

      // Budget ceremony — start + check.
      const startBudgetRes = await page.request.post(`${running.baseUrl}/budget`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-budget',
          serviceName: 'llm-gateway',
          target: 'prometheus',
        },
      });
      expect(startBudgetRes.status()).toBe(200);

      const checkRes = await page.request.post(`${running.baseUrl}/budget`, {
        data: {
          kind: 'check',
          sessionId: 'e2e-budget',
          spentUsd: 450,
          limitUsd: 1000,
        },
      });
      expect(checkRes.status()).toBe(200);
      const checkBody = await checkRes.json();
      expect(checkBody).toMatchObject({
        ok: true,
        kind: 'check',
        spentUsd: 450,
        limitUsd: 1000,
        exhausted: false,
      });

      // Budget exhaustion — over limit reports exhausted=true.
      const startBudget2Res = await page.request.post(`${running.baseUrl}/budget`, {
        data: {
          kind: 'start',
          sessionId: 'e2e-budget-over',
          serviceName: 'llm-gateway',
          target: 'prometheus',
        },
      });
      expect(startBudget2Res.status()).toBe(200);
      const checkOverRes = await page.request.post(`${running.baseUrl}/budget`, {
        data: {
          kind: 'check',
          sessionId: 'e2e-budget-over',
          spentUsd: 1200,
          limitUsd: 1000,
        },
      });
      expect(checkOverRes.status()).toBe(200);
      const checkOverBody = await checkOverRes.json();
      expect(checkOverBody).toMatchObject({
        ok: true,
        kind: 'check',
        exhausted: true,
      });

      // Session cleanup — close all three surfaces.
      await page.request.post(`${running.baseUrl}/tokens`, {
        data: { kind: 'close', sessionId: 'e2e-token' },
      });
      await page.request.post(`${running.baseUrl}/prompts`, {
        data: { kind: 'close', sessionId: 'e2e-prompt' },
      });
      await page.request.post(`${running.baseUrl}/budget`, {
        data: { kind: 'close', sessionId: 'e2e-budget' },
      });
    } finally {
      await context.close();
      await browser.close();
      await running.close();
    }
  });
});
