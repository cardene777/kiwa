/**
 * Shared fixture for the Playwright e2e specs (v1.32-2) — spins up a small
 * Node HTTP server that mounts the mock adapter's 9-op surface behind JSON
 * endpoints. The specs drive `fetch` calls from a real BrowserContext + assert
 * on the JSON responses; no UI is rendered because the Postgres dogfood is a
 * headless surface.
 */

import { createServer, type Server } from 'node:http';
import { existsSync } from 'node:fs';
import type { AddressInfo } from 'node:net';
import { makeMockAdapter } from '../../src/adapters/mock.js';
import { sampleOrderRow } from '../../src/adapters/interface.js';
import type { PostgresCdcOutboxAdapter } from '../../src/adapters/interface.js';

const MAX_BODY_BYTES = 64 * 1024;

type RouteHandler = (
  adapter: PostgresCdcOutboxAdapter,
  body: unknown,
) => Promise<unknown>;

const ROUTES: Readonly<Record<string, RouteHandler>> = {
  '/outbox': async (adapter, body) => {
    const orders = ((body as { orders?: unknown }).orders ?? []) as readonly {
      orderId?: string;
      region?: 'us' | 'eu' | 'apac';
      total?: number;
    }[];
    const normalized = orders.map((o) => sampleOrderRow(o));
    return adapter.driveOutbox(normalized);
  },
  '/cdc-pickup': async (adapter, body) => {
    const orders = ((body as { orders?: unknown }).orders ?? []) as readonly {
      orderId?: string;
      region?: 'us' | 'eu' | 'apac';
      total?: number;
    }[];
    const ackBatchSize = ((body as { ackBatchSize?: unknown }).ackBatchSize ?? 4) as number;
    const normalized = orders.map((o) => sampleOrderRow(o));
    return adapter.driveCdcPickup({ orders: normalized, ackBatchSize });
  },
  '/replication': async (adapter) =>
    adapter.driveReplication({
      writes: [{ bytes: 128 }, { bytes: 256 }],
      laggedReplicaId: 'replica-a',
      laggedAppliedLsn: 100,
      failoverReason: 'e2e',
      promoteReplicaId: 'replica-b',
    }),
  '/at-least-once': async (adapter, body) => {
    const orders = ((body as { orders?: unknown }).orders ?? []) as readonly {
      orderId?: string;
      region?: 'us' | 'eu' | 'apac';
    }[];
    const dupes = ((body as { duplicateOrders?: unknown }).duplicateOrders ??
      []) as readonly {
      orderId?: string;
      region?: 'us' | 'eu' | 'apac';
    }[];
    return adapter.driveAtLeastOnce({
      orders: orders.map((o) => sampleOrderRow(o)),
      duplicateOrders: dupes.map((o) => sampleOrderRow(o)),
    });
  },
  '/emit-fidelity': async (adapter) => {
    await adapter.emitFidelity();
    return { ok: true };
  },
  '/logical-replication': async (adapter) => adapter.driveLogicalReplicationAdvanced(),
  '/slot-advance': async (adapter) => adapter.driveSlotAdvance(),
  '/pgvector': async (adapter) => adapter.drivePgvector(),
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
  readonly adapter: PostgresCdcOutboxAdapter;
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
        '<!doctype html><html><head><title>postgres-cdc-outbox</title></head><body></body></html>',
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
