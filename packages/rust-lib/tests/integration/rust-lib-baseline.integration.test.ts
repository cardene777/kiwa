/**
 * integration test — rust-lib domain の end-to-end workflow (env → route add → invoke →
 * middleware trace → guard verify) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createRustAppEnv,
  invokeAxumHandler,
  invokeActixHandler,
  captureTowerMiddleware,
  invokeRocketRoute,
} from '../../src/index.js';

describe('rust-lib integration — framework end-to-end workflow', () => {
  it('T-INT-R-001 axum env で route 3 個 register → 全 match', () => {
    const env = createRustAppEnv({ framework: 'axum' });
    env.addRoute({ method: 'GET', path: '/a', handler: async () => 1 });
    env.addRoute({ method: 'POST', path: '/b', handler: async () => 2 });
    env.addRoute({ method: 'DELETE', path: '/c', handler: async () => 3 });
    expect(env.matchRoute('GET', '/a')).toBeDefined();
    expect(env.matchRoute('POST', '/b')).toBeDefined();
    expect(env.matchRoute('DELETE', '/c')).toBeDefined();
    expect(env.listRoutes().length).toBe(3);
  });

  it('T-INT-R-002 tower middleware 3 段 chain で entered/exited 全 record', async () => {
    const mkMw = () => async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
    const trace = await captureTowerMiddleware({
      middleware: [mkMw(), mkMw(), mkMw()],
      request: { method: 'GET', path: '/x', headers: {} },
      handler: async () => ({ status: 200, body: 'ok' }),
    });
    expect(trace.entered).toEqual(['middleware-1', 'middleware-2', 'middleware-3']);
    expect(trace.exited).toEqual(['middleware-3', 'middleware-2', 'middleware-1']);
  });

  it('T-INT-R-003 actix handler で body を受け取り response return', async () => {
    const res = await invokeActixHandler<{ n: number }>({
      handler: async (req) => ({ doubled: (req?.n ?? 0) * 2 }),
      method: 'POST',
      path: '/double',
      body: { n: 21 },
    });
    expect(res.body).toEqual({ doubled: 42 });
  });

  it('T-INT-R-004 rocket route で guards passed 全 record', async () => {
    const res = await invokeRocketRoute({
      route: async () => 'protected content',
      method: 'GET',
      path: '/admin',
      guards: ['Auth', 'Admin', 'RateLimit'],
    });
    expect(res.guardsPassed).toEqual(['Auth', 'Admin', 'RateLimit']);
    expect(res.body).toBe('protected content');
  });

  it('T-INT-R-005 env.clear() で route registry が空になる', () => {
    const env = createRustAppEnv({ framework: 'actix-web' });
    env.addRoute({ method: 'GET', path: '/x', handler: async () => null });
    expect(env.listRoutes().length).toBe(1);
    env.clear();
    expect(env.listRoutes().length).toBe(0);
  });
});
