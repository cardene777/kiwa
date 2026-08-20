/**
 * Playwright e2e for the WebTransport stream room — a real browser (2 tabs)
 * drives the same stream + reset handlers the Nuxt 3 runtime mounts in
 * production. The UI is not rendered as a full Vue component here — the
 * test pumps JSON through the ad-hoc HTTP server + asserts on the response
 * shape, which mirrors how a real client SDK would drive the same routes.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - Two BrowserContext tabs each open a session and the mock records both
 *    as distinct sessions.
 *  - A uni stream write returns a decoded byte length end to end.
 *  - A bi stream write records the backpressure flag observable off the
 *    response shape.
 *  - migrateConnection succeeds mid-session without dropping stream state.
 *
 * When Playwright browsers are not installed the tests skip with a clear
 * reason so `pnpm test:e2e` still passes on hosts without the browser
 * cache.
 */

import { chromium, expect, test, type BrowserContext } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { createStreamHandler, validateStreamRequest } from '../../server/api/stream.post.js';
import { createResetHandler, validateResetRequest } from '../../server/api/reset.post.js';
import type { WebTransportStreamAdapter } from '../../src/adapters/interface.js';

/**
 * Boot a tiny Node HTTP server that dispatches `/api/stream` and
 * `/api/reset` to the given adapter. Chosen over `nuxt dev` because (a) it
 * avoids the Nuxt startup cost and (b) it lets Playwright drive a stable
 * origin per test.
 */
async function bootAdapterServer(adapter: WebTransportStreamAdapter): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const stream = createStreamHandler({ adapter });
  const reset = createResetHandler({ adapter });
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
    if (url.pathname === '/api/stream' && nodeReq.method === 'POST') {
      const validated = validateStreamRequest(payload);
      if (!validated.ok) {
        nodeRes.statusCode = 400;
        nodeRes.end(JSON.stringify({ ok: false, errorKind: validated.errorKind }));
        return;
      }
      try {
        const res = await stream(validated.value);
        nodeRes.setHeader('content-type', 'application/json');
        nodeRes.end(JSON.stringify(res));
      } catch (err) {
        nodeRes.statusCode = 500;
        nodeRes.end(
          JSON.stringify({ ok: false, errorKind: (err as Error).message }),
        );
      }
      return;
    }
    if (url.pathname === '/api/reset' && nodeReq.method === 'POST') {
      const validated = validateResetRequest(payload);
      if (!validated.ok) {
        nodeRes.statusCode = 400;
        nodeRes.end(JSON.stringify({ ok: false, errorKind: validated.errorKind }));
        return;
      }
      try {
        const res = await reset(validated.value);
        nodeRes.setHeader('content-type', 'application/json');
        nodeRes.end(JSON.stringify(res));
      } catch (err) {
        nodeRes.statusCode = 500;
        nodeRes.end(
          JSON.stringify({ ok: false, errorKind: (err as Error).message }),
        );
      }
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

test.describe('WebTransport stream room — multi-tab', () => {
  withPlaywrightSkip(
    'T-E2E-001 two tabs open distinct sessions + write uni + write bi + migrate through the same handlers',
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
          // ページを test 内 server と同じ origin に置く。 `about:blank` は null origin で、
          // そこからの `fetch` は cross-origin になる。 `content-type: application/json` を
          // 付けるため preflight が要るが、この server は CORS も `OPTIONS` も持たない
          // (実測 = `about:blank` から送出 `TypeError: Failed to fetch`、同一 origin で 200)。
          //
          // server 側に検証用の CORS を足す案は採らない。 本番に無い振る舞いを
          // test のためだけに持ち込むことになる。 この test が見たいのは
          // 「2 つのタブが別々の接続を張る」 ことで、origin の違いは主題ではない。
          await Promise.all([pageA.goto(`${origin}/`), pageB.goto(`${origin}/`)]);

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

          const openA = await postJson(pageA, '/api/stream', {
            kind: 'open-session',
            sessionId: 'tab-a',
            url: 'https://origin.example/wt',
          });
          const openB = await postJson(pageB, '/api/stream', {
            kind: 'open-session',
            sessionId: 'tab-b',
            url: 'https://origin.example/wt',
          });
          expect(openA.json.ok).toBe(true);
          expect(openB.json.ok).toBe(true);

          const uniA = await postJson(pageA, '/api/stream', {
            kind: 'open-uni-stream',
            sessionId: 'tab-a',
          });
          expect(uniA.json.streamId).toMatch(/^uni-/);
          const writeA = await postJson(pageA, '/api/stream', {
            kind: 'write-stream',
            sessionId: 'tab-a',
            streamId: uniA.json.streamId,
            dataBase64: Buffer.from('hello uni').toString('base64'),
          });
          expect(writeA.json.byteLength).toBe(9);

          const biB = await postJson(pageB, '/api/stream', {
            kind: 'open-bi-stream',
            sessionId: 'tab-b',
            windowSize: 8,
          });
          const writeB = await postJson(pageB, '/api/stream', {
            kind: 'write-stream',
            sessionId: 'tab-b',
            streamId: biB.json.streamId,
            dataBase64: Buffer.from(new Uint8Array(32)).toString('base64'),
          });
          expect(writeB.json.backpressure).toBe(true);

          const migrateA = await postJson(pageA, '/api/reset', {
            kind: 'migrate-connection',
            sessionId: 'tab-a',
          });
          expect(migrateA.json.validated).toBe(true);
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
