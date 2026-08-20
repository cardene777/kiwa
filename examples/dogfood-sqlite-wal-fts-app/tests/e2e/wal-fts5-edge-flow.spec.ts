/**
 * Playwright e2e — WAL + FTS5 + edge deployment flow (v1.32-4).
 *
 * Drives the /wal-full-journey + /fts5-full-journey + /edge-roundtrip routes
 * end-to-end. Assertions cover the AC axes "SQLite WAL mode + FTS5 full
 * journey" + "Bun edge deployment".
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { bootAdapterServer, playwrightBrowsersInstalled } from './fixture.js';

test.describe('WAL + FTS5 + edge — SQLite dogfood core flow', () => {
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

  test('T-E2E-001 wal + fts5 + edge routes drive the full 3-flow surface together', async () => {
    const { origin, close } = await bootAdapterServer();
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const combined = await page.evaluate(async (base: string) => {
      const wal = await fetch(`${base}/wal-full-journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          thresholdBytes: 1024,
          walSizeBytes: 4096,
          checkpointMode: 'TRUNCATE',
          regionBytes: 16384,
        }),
      });
      const walBody = (await wal.json()) as {
        ok: boolean;
        result: {
          finalJournalMode: 'WAL';
          checkpointCount: number;
          walSizeBytes: number;
          sharedMemoryBytes: number;
          finalState: string;
        };
      };
      const fts5 = await fetch(`${base}/fts5-full-journey`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      const fts5Body = (await fts5.json()) as {
        ok: boolean;
        result: {
          tableName: string;
          tokenizer: 'unicode61' | 'porter' | 'trigram';
          tokenCount: number;
          matchRank: number;
          finalState: string;
        };
      };
      const edge = await fetch(`${base}/edge-roundtrip`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ region: 'iad', runtime: 'bun', requests: 6 }),
      });
      const edgeBody = (await edge.json()) as {
        ok: boolean;
        result: {
          region: string;
          runtime: 'bun' | 'node' | 'workerd';
          coldStartMs: number;
          warmMeanMs: number;
          requestsHandled: number;
        };
      };
      return { walBody, fts5Body, edgeBody };
    }, origin);

    // WAL invariants — the full journey ends at shared-memory-mapped, the
    // journal is WAL, the checkpoint count > 0, and the TRUNCATE mode
    // wraps the WAL size back to 0.
    expect(combined.walBody.ok).toBe(true);
    expect(combined.walBody.result.finalJournalMode).toBe('WAL');
    expect(combined.walBody.result.finalState).toBe('shared-memory-mapped');
    expect(combined.walBody.result.checkpointCount).toBeGreaterThan(0);
    expect(combined.walBody.result.walSizeBytes).toBe(0);

    // FTS5 invariants — full journey ends at vocab-inspected, tokenizer
    // recorded, token count > 0.
    expect(combined.fts5Body.ok).toBe(true);
    expect(combined.fts5Body.result.finalState).toBe('vocab-inspected');
    expect(combined.fts5Body.result.tokenizer).toBe('unicode61');
    expect(combined.fts5Body.result.tokenCount).toBeGreaterThan(0);

    // Edge invariants — Bun cold start is small (< 10 ms), warm mean is
    // sub-millisecond, requestsHandled matches input.
    expect(combined.edgeBody.ok).toBe(true);
    expect(combined.edgeBody.result.runtime).toBe('bun');
    expect(combined.edgeBody.result.coldStartMs).toBeLessThan(10);
    expect(combined.edgeBody.result.warmMeanMs).toBeLessThan(1);
    expect(combined.edgeBody.result.requestsHandled).toBe(6);

    await browser.close();
  });
});
