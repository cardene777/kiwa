/**
 * Tiny HTTP server that mounts the supply-chain / reproducible /
 * attestation / sc-orchestrator handlers directly. The Playwright e2e
 * spec spawns this server so Chromium can drive the full SLSA supply
 * chain ceremony from a real browser origin, without paying the Next.js
 * dev-server startup cost.
 *
 * The server is deliberately minimal — routes are looked up by exact
 * path, bodies are JSON, and responses mirror the plain-object shape
 * the mock and real adapters produce so downstream fidelity assertions
 * stay adapter-agnostic.
 */

import { createServer, type Server } from 'node:http';
import { AddressInfo } from 'node:net';
import {
  handleSupplyChainRequest,
  validateSupplyChainRequest,
} from '../app/supply-chain/route.js';
import {
  handleReproducibleRequest,
  validateReproducibleRequest,
} from '../app/reproducible/route.js';
import {
  handleAttestationRequest,
  validateAttestationRequest,
} from '../app/attestation/route.js';
import {
  handleScOrchestratorRequest,
  validateScOrchestratorRequest,
} from '../app/sc-orchestrator/route.js';
import type { SecurityAdapter } from '../adapters/interface.js';

export interface StartNextServerOptions {
  adapter: SecurityAdapter;
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
  '/supply-chain': 'supply-chain',
  '/reproducible': 'reproducible',
  '/attestation': 'attestation',
  '/sc-orchestrator': 'sc-orchestrator',
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
  adapter: SecurityAdapter,
  body: unknown,
): Promise<unknown> {
  if (route === 'supply-chain') {
    const parsed = validateSupplyChainRequest(body);
    if (!parsed.ok) {
      return { ok: false, errorKind: parsed.errorKind };
    }
    return handleSupplyChainRequest(adapter, parsed.value);
  }
  if (route === 'reproducible') {
    const parsed = validateReproducibleRequest(body);
    if (!parsed.ok) {
      return { ok: false, errorKind: parsed.errorKind };
    }
    return handleReproducibleRequest(adapter, parsed.value);
  }
  if (route === 'attestation') {
    const parsed = validateAttestationRequest(body);
    if (!parsed.ok) {
      return { ok: false, errorKind: parsed.errorKind };
    }
    return handleAttestationRequest(adapter, parsed.value);
  }
  const parsed = validateScOrchestratorRequest(body);
  if (!parsed.ok) {
    return { ok: false, errorKind: parsed.errorKind };
  }
  return handleScOrchestratorRequest(adapter, parsed.value);
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
