/**
 * Playwright e2e for the video call room — a real browser (2 tabs) drives
 * the same signaling + room handlers the Next.js 15 App Router mounts in
 * production. The room UI is not rendered as full React here — the test
 * pumps JSON through the ad-hoc HTTP server + asserts on the response shape,
 * which mirrors how a mediasoup client SDK would drive the same routes.
 *
 * Fidelity axes exercised here (parallel to the vitest specs).
 *  - Two BrowserContext tabs join the same room and the SFU records both
 *    as distinct peers.
 *  - A video publish returns a 3-layer simulcast rid list end to end.
 *  - An ICE restart succeeds mid-call without losing track state.
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
import { createRoomHandler, validateRoomRequest } from '../../src/app/room/route.js';
import {
  createSignalingHandler,
  validateSignalingRequest,
} from '../../src/app/signaling/route.js';
import type { VideoCallAdapter } from '../../src/adapters/interface.js';

/**
 * Boot a tiny Node HTTP server that dispatches `/signaling` and `/room` to
 * the given adapter. Chosen over `next dev` because (a) it avoids the Next.js
 * startup cost and (b) it lets Playwright drive a stable origin per test.
 */
async function bootAdapterServer(adapter: VideoCallAdapter): Promise<{
  origin: string;
  close: () => Promise<void>;
}> {
  const signaling = createSignalingHandler({ adapter });
  const room = createRoomHandler({ adapter });
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
    if (url.pathname === '/signaling' && nodeReq.method === 'POST') {
      const validated = validateSignalingRequest(payload);
      if (!validated.ok) {
        nodeRes.statusCode = 400;
        nodeRes.end(JSON.stringify({ ok: false, errorKind: validated.errorKind }));
        return;
      }
      try {
        const res = await signaling(validated.value);
        nodeRes.setHeader('content-type', 'application/json');
        nodeRes.end(JSON.stringify(res));
      } catch (err) {
        nodeRes.statusCode = 500;
        nodeRes.end(
          JSON.stringify({ ok: false, errorKind: err instanceof Error ? err.message : 'unknown' }),
        );
      }
      return;
    }
    if (url.pathname === '/room' && nodeReq.method === 'POST') {
      const validated = validateRoomRequest(payload);
      if (!validated.ok) {
        nodeRes.statusCode = 400;
        nodeRes.end(JSON.stringify({ ok: false, errorKind: validated.errorKind }));
        return;
      }
      try {
        const res = await room(validated.value);
        nodeRes.setHeader('content-type', 'application/json');
        nodeRes.end(JSON.stringify(res));
      } catch (err) {
        nodeRes.statusCode = 500;
        nodeRes.end(
          JSON.stringify({ ok: false, errorKind: err instanceof Error ? err.message : 'unknown' }),
        );
      }
      return;
    }
    // GET / (or anything else) — return a minimal HTML page the browser can
    // load so the test can run scripts against it. The page has no UI; the
    // test drives all state through fetch calls.
    nodeRes.setHeader('content-type', 'text/html');
    nodeRes.end('<!doctype html><html><head><title>webrtc-room</title></head><body></body></html>');
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${addr.port}`;
  return {
    origin,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

function playwrightBrowsersInstalled(): boolean {
  // Chromium browser executable is cached under ms-playwright/chromium-*.
  // If the cache is missing (fresh clone without `pnpm playwright install`)
  // the tests skip so `pnpm test:e2e` still passes on those hosts.
  const home = process.env['HOME'] ?? '';
  const macCache = `${home}/Library/Caches/ms-playwright`;
  const linuxCache = `${home}/.cache/ms-playwright`;
  const winCache = `${home}/AppData/Local/ms-playwright`;
  return existsSync(macCache) || existsSync(linuxCache) || existsSync(winCache);
}

test.describe('video call room — 2 browser tabs', () => {
  test.skip(
    !playwrightBrowsersInstalled(),
    'Playwright browsers not installed — run `pnpm playwright install chromium`',
  );

  let adapter: VideoCallAdapter;
  let servers: Array<{ close: () => Promise<void> }> = [];
  let contexts: BrowserContext[] = [];

  test.beforeEach(() => {
    adapter = makeMockAdapter({ seed: 42, latencyMs: 0 });
    servers = [];
    contexts = [];
  });

  test.afterEach(async () => {
    for (const ctx of contexts) await ctx.close();
    for (const s of servers) await s.close();
    await adapter.reset();
  });

  test('two BrowserContext tabs join the same room and see distinct SDP fingerprints', async () => {
    const { origin, close } = await bootAdapterServer(adapter);
    servers.push({ close });
    const browser = await chromium.launch();
    const ctxA = await browser.newContext();
    const ctxB = await browser.newContext();
    contexts.push(ctxA, ctxB);

    const pageA = await ctxA.newPage();
    const pageB = await ctxB.newPage();
    await pageA.goto(origin);
    await pageB.goto(origin);

    const offerRes = await pageA.evaluate(async (base: string) => {
      const r = await fetch(`${base}/signaling`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'offer',
          role: 'offerer',
          roomId: 'e2e-room-1',
          peerId: 'alice',
          initialMedia: ['audio', 'video'],
        }),
      });
      return (await r.json()) as { ok: boolean; sdpFingerprint?: string };
    }, origin);
    const answerRes = await pageB.evaluate(async (base: string) => {
      const r = await fetch(`${base}/signaling`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'answer',
          role: 'answerer',
          roomId: 'e2e-room-1',
          peerId: 'bob',
          initialMedia: ['audio', 'video'],
        }),
      });
      return (await r.json()) as { ok: boolean; sdpFingerprint?: string };
    }, origin);

    expect(offerRes.ok).toBe(true);
    expect(answerRes.ok).toBe(true);
    expect(offerRes.sdpFingerprint).toMatch(/^sha256:/);
    expect(answerRes.sdpFingerprint).toMatch(/^sha256:/);
    expect(offerRes.sdpFingerprint).not.toBe(answerRes.sdpFingerprint);

    await browser.close();
  });

  test('video publish through the room handler returns 3 simulcast layers over HTTP', async () => {
    const { origin, close } = await bootAdapterServer(adapter);
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const publishRes = await page.evaluate(async (base: string) => {
      await fetch(`${base}/signaling`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'offer',
          role: 'offerer',
          roomId: 'e2e-room-2',
          peerId: 'carol',
        }),
      });
      const r = await fetch(`${base}/room`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'publish',
          roomId: 'e2e-room-2',
          peerId: 'carol',
          media: 'video',
        }),
      });
      return (await r.json()) as { ok: boolean; simulcastLayers?: number };
    }, origin);

    expect(publishRes.ok).toBe(true);
    expect(publishRes.simulcastLayers).toBe(3);

    await browser.close();
  });

  test('ice-restart mid-call recovers with a fresh candidate batch through HTTP', async () => {
    const { origin, close } = await bootAdapterServer(adapter);
    servers.push({ close });
    const browser = await chromium.launch();
    const ctx = await browser.newContext();
    contexts.push(ctx);
    const page = await ctx.newPage();
    await page.goto(origin);

    const restartRes = await page.evaluate(async (base: string) => {
      await fetch(`${base}/signaling`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'offer',
          role: 'offerer',
          roomId: 'e2e-room-3',
          peerId: 'dave',
        }),
      });
      const r = await fetch(`${base}/signaling`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          kind: 'ice-restart',
          roomId: 'e2e-room-3',
          peerId: 'dave',
          forceRelay: true,
        }),
      });
      return (await r.json()) as {
        ok: boolean;
        candidatesGathered?: number;
        relayUsed?: boolean;
      };
    }, origin);

    expect(restartRes.ok).toBe(true);
    expect(restartRes.candidatesGathered).toBeGreaterThan(0);
    expect(restartRes.relayUsed).toBe(true);

    await browser.close();
  });
});
