/**
 * Shared fixture for the Playwright e2e specs (v1.31-4) — spins up a small
 * Node HTTP server that mounts the mock adapter's 9-op surface behind JSON
 * endpoints. The specs drive `fetch` calls from a real BrowserContext + assert
 * on the JSON responses; no UI is rendered because the NATS dogfood is a
 * headless surface.
 */

import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import {
  makeMockAdapter,
  sampleOrderEvent,
  sampleUserProfile,
} from '../../src/adapters/mock.js';
import type { NatsJetStreamAdapter } from '../../src/adapters/interface.js';

const MAX_BODY_BYTES = 64 * 1024;

/**
 * Route table for the ad-hoc HTTP server. Each entry maps a POST path onto
 * an adapter op — the request body is decoded to JSON + passed as the op
 * argument, the return value is serialized to the response.
 */
type RouteHandler = (
  adapter: NatsJetStreamAdapter,
  body: unknown,
) => Promise<unknown>;

const ROUTES: Readonly<Record<string, RouteHandler>> = {
  '/jetstream': async (adapter, body) => {
    const events = ((body as { events?: unknown }).events ?? []) as readonly {
      orderId?: string;
      currency?: 'USD' | 'JPY' | 'EUR';
    }[];
    const normalized = events.map((e) => sampleOrderEvent(e));
    return adapter.driveJetStream(normalized);
  },
  '/kv': async (adapter, body) => {
    const profiles = ((body as { profiles?: unknown }).profiles ?? []) as readonly {
      userId?: string;
      displayName?: string;
      region?: string;
    }[];
    const normalized = profiles.map((p) => sampleUserProfile(p));
    return adapter.driveKV(normalized);
  },
  '/object': async (adapter) => adapter.driveObject(),
  '/routing': async (adapter) => adapter.driveRouting(),
  '/emit-fidelity': async (adapter) => {
    await adapter.emitFidelity();
    return { ok: true };
  },
  '/durable': async (adapter) => adapter.driveJetStreamDurable(),
  '/kv-revision': async (adapter) => adapter.driveKvRevision(),
  '/object-chunking': async (adapter) => adapter.driveObjectChunking(),
  '/testcontainers-probe': async (adapter) => adapter.driveTestcontainersProbe(),
  '/metrics': async (adapter) => adapter.metrics(),
  '/traces': async (adapter) => adapter.traces(),
  '/reset': async (adapter) => {
    await adapter.reset();
    return { ok: true };
  },
};

export interface AdapterServerHandle {
  readonly origin: string;
  readonly close: () => Promise<void>;
  readonly adapter: NatsJetStreamAdapter;
}

/**
 * Boot the JSON HTTP server backed by a fresh mock adapter. The server
 * listens on an ephemeral port bound to `127.0.0.1`.
 */
export async function bootAdapterServer(): Promise<AdapterServerHandle> {
  const adapter = makeMockAdapter();

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
    const handler = ROUTES[url.pathname];
    if (!handler || nodeReq.method !== 'POST') {
      nodeRes.setHeader('content-type', 'text/html');
      nodeRes.end(
        '<!doctype html><html><head><title>nats-jetstream</title></head><body></body></html>',
      );
      return;
    }
    try {
      const result = await handler(adapter, payload);
      nodeRes.setHeader('content-type', 'application/json');
      nodeRes.end(JSON.stringify({ ok: true, result }));
    } catch (err) {
      nodeRes.statusCode = 500;
      nodeRes.end(
        JSON.stringify({
          ok: false,
          errorKind: err instanceof Error ? err.message : 'unknown',
        }),
      );
    }
  });

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', () => resolve()));
  const addr = server.address() as AddressInfo;
  const origin = `http://127.0.0.1:${addr.port}`;
  return {
    origin,
    adapter,
    close: async () => {
      await new Promise<void>((resolve) => server.close(() => resolve()));
    },
  };
}

/**
 * Detect whether the Playwright browser cache is populated. Missing cache =>
 * the specs skip so `pnpm test:e2e` still passes on fresh clones.
 */
export function playwrightBrowsersInstalled(): boolean {
  const home = process.env['HOME'] ?? '';
  const macCache = `${home}/Library/Caches/ms-playwright`;
  const linuxCache = `${home}/.cache/ms-playwright`;
  const winCache = `${home}/AppData/Local/ms-playwright`;
  return existsSync(macCache) || existsSync(linuxCache) || existsSync(winCache);
}
