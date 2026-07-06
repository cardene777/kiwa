/**
 * Shared fixture for the Playwright e2e specs (v1.32-4) — spins up a small
 * Node HTTP server that mounts the mock adapter's 5-op surface behind JSON
 * endpoints. The specs drive `fetch` calls from a real BrowserContext + assert
 * on the JSON responses; no UI is rendered because the SQLite dogfood is a
 * headless surface (same pattern as v1.32-2 postgres + v1.32-3 mysql
 * dogfoods).
 */

import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import type { SqliteWalFtsAdapter } from '../../src/adapters/interface.js';

const MAX_BODY_BYTES = 64 * 1024;

type RouteHandler = (adapter: SqliteWalFtsAdapter, body: unknown) => Promise<unknown>;

const ROUTES: Readonly<Record<string, RouteHandler>> = {
  '/wal-full-journey': async (adapter, body) => {
    const parsed = body as {
      thresholdBytes?: number;
      walSizeBytes?: number;
      checkpointMode?: 'PASSIVE' | 'FULL' | 'RESTART' | 'TRUNCATE';
      regionBytes?: number;
    };
    return adapter.driveWalFullJourney(parsed ?? {});
  },
  '/fts5-full-journey': async (adapter, body) => {
    const parsed = body as {
      tableName?: string;
      columns?: readonly string[];
      tokenizer?: 'unicode61' | 'porter' | 'trigram';
      document?: string;
      query?: string;
      rank?: number;
      vocabTerm?: string;
      vocabOccurrences?: number;
    };
    return adapter.driveFts5FullJourney(parsed ?? {});
  },
  '/edge-roundtrip': async (adapter, body) => {
    const parsed = body as {
      region?: string;
      runtime?: 'bun' | 'node' | 'workerd';
      requests?: number;
    };
    return adapter.driveEdgeRoundtrip(parsed ?? {});
  },
  '/testcontainers-probe': async (adapter) => adapter.driveTestcontainersProbe(),
  '/emit-fidelity': async (adapter) => {
    await adapter.emitFidelity();
    return { ok: true };
  },
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
  readonly adapter: SqliteWalFtsAdapter;
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
        '<!doctype html><html><head><title>sqlite-wal-fts-app</title></head><body></body></html>',
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
