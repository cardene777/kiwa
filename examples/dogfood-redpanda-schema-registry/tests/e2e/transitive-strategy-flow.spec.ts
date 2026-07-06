/**
 * Playwright e2e — transitive evolution + subject strategy flow (v1.31-3).
 *
 * A single BrowserContext drives the transitive evolution + subject strategy
 * routes end-to-end. Assertions cover the AC axis "5 compatibility mode" +
 * "subject strategy (TopicNameStrategy + RecordNameStrategy +
 * TopicRecordNameStrategy)".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('transitive evolution + subject strategy — v2 flow', () => {
  test.skip(
    !playwrightBrowsersInstalled(),
    'Playwright browsers not installed — run `pnpm playwright install chromium`',
  );

  let servers: { close: () => Promise<void> }[] = [];
  let contexts: BrowserContext[] = [];

  test.beforeEach(() => {
    servers = [];
    contexts = [];
  });

  test.afterEach(async () => {
    for (const ctx of contexts) await ctx.close();
    for (const s of servers) await s.close();
  });

  test('BACKWARD_TRANSITIVE walker rejects the transitive-only break', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const transitive = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/evolution-transitive`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          subject: string;
          versionsAccepted: number;
          transitiveMode: string;
          rejectedTransitiveOnly: boolean;
          chainVerdicts: readonly { from: number; to: number; compatible: boolean }[];
        };
      };
    }, origin);

    expect(transitive.ok).toBe(true);
    expect(transitive.result.subject).toBe('users-trans-value');
    expect(transitive.result.versionsAccepted).toBe(3);
    expect(transitive.result.transitiveMode).toBe('BACKWARD_TRANSITIVE');
    expect(transitive.result.rejectedTransitiveOnly).toBe(true);
    expect(transitive.result.chainVerdicts).toHaveLength(3);

    await browser.close();
  });

  test('3 subject strategies resolve distinct subjects + roundtrip register', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const strategies = await page.evaluate(async (base: string) => {
      const r = await fetch(`${base}/subject-strategies`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      });
      return (await r.json()) as {
        ok: boolean;
        result: {
          probed: readonly {
            strategy: string;
            derivedSubject: string;
            registered: boolean;
            latestVersion: number;
          }[];
        };
      };
    }, origin);

    expect(strategies.ok).toBe(true);
    expect(strategies.result.probed).toHaveLength(3);
    // Every strategy registered v1 successfully.
    for (const entry of strategies.result.probed) {
      expect(entry.registered).toBe(true);
      expect(entry.latestVersion).toBe(1);
    }
    // Each strategy resolves to a distinct subject.
    const subjects = new Set(strategies.result.probed.map((e) => e.derivedSubject));
    expect(subjects.size).toBe(3);

    await browser.close();
  });
});
