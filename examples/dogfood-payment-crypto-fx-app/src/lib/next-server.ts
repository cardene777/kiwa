/**
 * Tiny HTTP server that mounts the invoice / fx handlers directly. The
 * Playwright e2e specs spawn this server so Chromium can drive the full
 * crypto invoice + on-chain confirmation + gas abstraction + wallet
 * link + FX rate lock + settlement ceremony from a real browser origin,
 * without paying the Next.js dev-server startup cost.
 *
 * The server is deliberately minimal — routes are looked up by exact path,
 * bodies are JSON, and responses mirror the plain-object shape the mock
 * and real adapters produce so downstream fidelity assertions stay
 * adapter-agnostic.
 */

import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import {
  handleInvoiceRequest,
  validateInvoiceRequest,
} from '../app/invoice/route.js';
import {
  handleFxRequest,
  validateFxRequest,
} from '../app/fx/route.js';
import type { PaymentAdapter } from '../adapters/interface.js';

export interface StartNextServerOptions {
  adapter: PaymentAdapter;
  /** Explicit port; 0 (default) asks the kernel for an ephemeral port. */
  port?: number;
  /** Log body-parse or dispatch errors — off by default so specs stay quiet. */
  logErrors?: boolean;
}

export interface RunningNextServer {
  server: Server;
  baseUrl: string;
  close(): Promise<void>;
}

const ROUTE_MAP = {
  '/invoice': 'invoice',
  '/fx': 'fx',
} as const;

type RouteName = (typeof ROUTE_MAP)[keyof typeof ROUTE_MAP];

export async function startNextServer(
  opts: StartNextServerOptions,
): Promise<RunningNextServer> {
  const server = createServer(async (req, res) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'method_not_allowed' }));
      return;
    }
    const url = req.url ?? '';
    const route = matchRoute(url);
    if (!route) {
      res.statusCode = 404;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'route_not_found' }));
      return;
    }

    let body: unknown;
    try {
      body = await readJson(req);
    } catch (err) {
      if (opts.logErrors) {
        // eslint-disable-next-line no-console
        console.error(
          `[next-server] body parse failed: ${(err as Error).message}`,
        );
      }
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'body_parse_failed' }));
      return;
    }

    try {
      const responseBody = await dispatch(route, opts.adapter, body);
      res.statusCode = 200;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(responseBody));
    } catch (err) {
      if (opts.logErrors) {
        // eslint-disable-next-line no-console
        console.error(
          `[next-server] dispatch failed: ${(err as Error).message}`,
        );
      }
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ ok: false, errorKind: 'dispatch_failed' }));
    }
  });

  await new Promise<void>((resolve) => {
    server.listen(opts.port ?? 0, '127.0.0.1', () => resolve());
  });

  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  return {
    server,
    baseUrl,
    close: () =>
      new Promise<void>((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
  };
}

function matchRoute(url: string): RouteName | null {
  for (const [prefix, route] of Object.entries(ROUTE_MAP)) {
    if (url === prefix || url.startsWith(`${prefix}?`)) {
      return route;
    }
  }
  return null;
}

async function dispatch(
  route: RouteName,
  adapter: PaymentAdapter,
  body: unknown,
): Promise<unknown> {
  if (route === 'invoice') {
    const parsed = validateInvoiceRequest(body);
    if (!parsed.ok) {
      return { ok: false, errorKind: parsed.errorKind };
    }
    return handleInvoiceRequest(adapter, parsed.value);
  }
  const parsed = validateFxRequest(body);
  if (!parsed.ok) {
    return { ok: false, errorKind: parsed.errorKind };
  }
  return handleFxRequest(adapter, parsed.value);
}

async function readJson(
  req: import('node:http').IncomingMessage,
): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(chunk as Buffer);
  }
  const raw = Buffer.concat(chunks).toString('utf-8');
  if (raw.length === 0) return {};
  return JSON.parse(raw);
}
