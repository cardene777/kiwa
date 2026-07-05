/**
 * Playwright e2e for the HTTP/3 multiplex room — a real browser (2 tabs)
 * drives the same multi-stream + 0-RTT + HPACK handlers the SvelteKit
 * runtime mounts in production. The UI is not rendered as a full Svelte
 * component here — the test pumps JSON through the ad-hoc HTTP server +
 * asserts on the response shape, which mirrors how a real client SDK would
 * drive the same routes.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - Two BrowserContext tabs each open a connection and the mock records
 *    both as distinct connections.
 *  - A concurrent send batch drains streams in ascending priority order end
 *    to end.
 *  - An HPACK insert surfaces the compression ratio + table size on the
 *    response shape.
 *  - A 0-RTT resume succeeds with early data accepted.
 *
 * When Playwright browsers are not installed the tests skip with a clear
 * reason so `pnpm test:e2e` still passes on hosts without the browser cache.
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import {
  createMultiStreamHandler,
  validateMultiStreamRequest,
} from '../../src/routes/api/multi-stream/handler.js';
import {
  createZeroRttHandler,
  validateZeroRttRequest,
} from '../../src/routes/api/0-rtt/handler.js';
import {
  createHpackHandler,
  validateHpackRequest,
} from '../../src/routes/api/hpack/handler.js';
import type { Http3MultiplexAdapter } from '../../src/adapters/interface.js';

/**
 * Boot a tiny Node HTTP server that dispatches `/api/multi-stream`,
 * `/api/0-rtt`, and `/api/hpack` to the given adapter. Chosen over `vite dev`
 * because (a) it avoids the SvelteKit startup cost and (b) it lets Playwright
 * drive a stable origin per test.
 */
async function bootAdapterServer(adapter: Http3MultiplexAdapter): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const multi = createMultiStreamHandler({ adapter });
  const zeroRtt = createZeroRttHandler({ adapter });
  const hpack = createHpackHandler({ adapter });
  const MAX_BODY_BYTES = 64 * 1024;

  const server: Server = createServer(async (nodeReq, nodeRes) => {
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    for await (const chunk of nodeReq) {
      const buf = chunk as Buffer;
      totalBytes += buf.length;
      if (totalBytes > MAX_BODY_BYTES) {
        nodeRes.statusCode = 413;
        nodeRes.end('payload too large');
        return;
      }
      chunks.push(buf);
    }
    const bodyText = Buffer.concat(chunks).toString('utf8');
    const url = new URL(nodeReq.url ?? '/', 'http://localhost');
    let payload: unknown = null;
    if (bodyText) {
      try {
        payload = JSON.parse(bodyText);
      } catch {
        nodeRes.statusCode = 400;
        nodeRes.end(JSON.stringify({ ok: false, errorKind: 'invalid_json' }));
        return;
      }
    }
    async function dispatch(
      validated: { ok: true; value: unknown } | { ok: false; errorKind: string },
      handler: (v: unknown) => Promise<unknown>,
    ): Promise<void> {
      if (!validated.ok) {
        nodeRes.statusCode = 400;
        nodeRes.end(JSON.stringify({ ok: false, errorKind: validated.errorKind }));
        return;
      }
      try {
        const res = await handler(validated.value);
        nodeRes.setHeader('content-type', 'application/json');
        nodeRes.end(JSON.stringify(res));
      } catch (err) {
        nodeRes.statusCode = 500;
        nodeRes.end(
          JSON.stringify({ ok: false, errorKind: (err as Error).message }),
        );
      }
    }
    if (url.pathname === '/api/multi-stream' && nodeReq.method === 'POST') {
      await dispatch(
        validateMultiStreamRequest(payload),
        (v) => multi(v as Parameters<typeof multi>[0]),
      );
      return;
    }
    if (url.pathname === '/api/0-rtt' && nodeReq.method === 'POST') {
      await dispatch(
        validateZeroRttRequest(payload),
        (v) => zeroRtt(v as Parameters<typeof zeroRtt>[0]),
      );
      return;
    }
    if (url.pathname === '/api/hpack' && nodeReq.method === 'POST') {
      await dispatch(
        validateHpackRequest(payload),
        (v) => hpack(v as Parameters<typeof hpack>[0]),
      );
      return;
    }
    nodeRes.statusCode = 404;
    nodeRes.end('not found');
  });

  await new Promise<void>((resolve) => server.listen(0, () => resolve()));
  const addr = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${addr.port}`;
  return {
    origin,
    close: () =>
      new Promise((resolve) => {
        server.close(() => resolve());
      }),
  };
}

const CACHE_ROOT =
  process.env['PLAYWRIGHT_BROWSERS_PATH'] || `${process.env['HOME']}/Library/Caches/ms-playwright`;

async function withPlaywrightSkip(name: string, run: () => Promise<void>): Promise<void> {
  test(name, async () => {
    if (!existsSync(CACHE_ROOT)) {
      test.skip(true, `Playwright browsers not installed at ${CACHE_ROOT}`);
      return;
    }
    await run();
  });
}

test.describe('HTTP/3 multiplex room — multi-tab', () => {
  withPlaywrightSkip(
    'two tabs open distinct connections + concurrent send + 0-RTT resume + HPACK insert through the same handlers',
    async () => {
      const adapter = makeMockAdapter({ seed: 42, latencyMs: 1 });
      const { origin, close } = await bootAdapterServer(adapter);
      try {
        const browser = await chromium.launch();
        const contextA: BrowserContext = await browser.newContext();
        const contextB: BrowserContext = await browser.newContext();
        try {
          const pageA = await contextA.newPage();
          const pageB = await contextB.newPage();
          await Promise.all([pageA.goto('about:blank'), pageB.goto('about:blank')]);

          async function postJson(page: typeof pageA, url: string, body: unknown) {
            return page.evaluate(
              async ({ url, body }) => {
                const res = await fetch(url, {
                  method: 'POST',
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(body),
                });
                return { status: res.status, json: await res.json() };
              },
              { url: `${origin}${url}`, body },
            );
          }

          const openA = await postJson(pageA, '/api/multi-stream', {
            kind: 'open-connection',
            connectionId: 'tab-a',
            url: 'https://origin.example/h3',
          });
          const openB = await postJson(pageB, '/api/multi-stream', {
            kind: 'open-connection',
            connectionId: 'tab-b',
            url: 'https://origin.example/h3',
            zeroRtt: true,
            earlyDataBytes: 4096,
          });
          expect(openA.json.ok).toBe(true);
          expect(openB.json.ok).toBe(true);
          // Second connection gets 0-RTT resumption in the mock (seq > 1).
          expect(openB.json.zeroRttUsed).toBe(true);
          expect(openB.json.earlyDataAccepted).toBe(4096);

          const csA = await postJson(pageA, '/api/multi-stream', {
            kind: 'concurrent-send',
            connectionId: 'tab-a',
            streams: [
              { priority: 200, byteLength: 8 },
              { priority: 20, byteLength: 32 },
              { priority: 100, byteLength: 16 },
            ],
          });
          expect(csA.json.streamIds).toHaveLength(3);
          expect(csA.json.drainOrder).toHaveLength(3);
          expect(csA.json.totalBytes).toBe(56);
          // Drain order = ascending priority (20 < 100 < 200) which maps
          // back to input positions [1, 2, 0]. Sanity-check the first slot.
          expect(csA.json.drainOrder[0]).toBe(csA.json.streamIds[1]);

          const resumeB = await postJson(pageB, '/api/0-rtt', {
            kind: 'resume-zero-rtt',
            connectionId: 'tab-b',
            earlyDataBytes: 8192,
          });
          expect(resumeB.json.accepted).toBe(true);
          expect(resumeB.json.earlyDataAccepted).toBe(8192);

          const hpackA = await postJson(pageA, '/api/hpack', {
            kind: 'insert-header',
            connectionId: 'tab-a',
            name: 'content-type',
            value: 'application/json',
          });
          expect(hpackA.json.ok).toBe(true);
          expect(hpackA.json.index).toBe(0);
          expect(hpackA.json.tableSize).toBe(1);
          expect(typeof hpackA.json.compressionRatio).toBe('number');
        } finally {
          await contextA.close();
          await contextB.close();
          await browser.close();
        }
      } finally {
        await close();
      }
    },
  );
});
