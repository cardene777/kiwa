/**
 * fidelity test — createRustAppEnv (kiwa mock) が reference impl と同じ挙動を示す。
 * 5 case で route registry / axum invoke / actix invoke / tower trace / rocket invoke の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import {
  createRustAppEnv,
  invokeAxumHandler,
  invokeActixHandler,
  captureTowerMiddleware,
  invokeRocketRoute,
} from '../../src/index.js';

function referenceRouter() {
  const routes: Array<{ method: string; path: string }> = [];
  return {
    add(route: { method: string; path: string }) {
      routes.push(route);
    },
    match(method: string, path: string) {
      return routes.find((r) => r.method === method && r.path === path);
    },
    listCount() {
      return routes.length;
    },
  };
}

describe('rust-lib fidelity vs reference impl', () => {
  it('route registry addRoute / matchRoute = reference impl と一致', async () => {
    const mock = createRustAppEnv({ framework: 'axum' });
    const real = referenceRouter();
    const result = await assertFidelity({
      mockFn: async (path: string) => {
        mock.addRoute({ method: 'GET', path, handler: async () => null });
        return Boolean(mock.matchRoute('GET', path));
      },
      realFn: async (path: string) => {
        real.add({ method: 'GET', path });
        return Boolean(real.match('GET', path));
      },
      cases: [{ name: 'add + match', args: ['/api/x'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('invokeAxumHandler status 200 = handler return value を body に配置', async () => {
    const res = await invokeAxumHandler({
      handler: async () => ({ ok: true, id: 1 }),
      method: 'GET',
      path: '/x',
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true, id: 1 });
    expect(res.method).toBe('GET');
  });

  it('invokeActixHandler extractors field を保持', async () => {
    const res = await invokeActixHandler({
      handler: async () => ({ ok: true }),
      method: 'POST',
      path: '/api/create',
      extractors: { path: { id: 42 }, json: { name: 'kiwa' } },
    });
    expect(res.extractors).toEqual({ path: { id: 42 }, json: { name: 'kiwa' } });
    expect(res.status).toBe(200);
  });

  it('captureTowerMiddleware entered / exited = middleware 数と一致', async () => {
    const mw1 = async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
    const mw2 = async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
    const trace = await captureTowerMiddleware({
      middleware: [mw1, mw2],
      request: { method: 'GET', path: '/x', headers: {} },
      handler: async () => ({ status: 200, body: 'ok' }),
    });
    expect(trace.entered.length).toBe(2);
    expect(trace.exited.length).toBe(2);
    expect(trace.response?.status).toBe(200);
  });

  it('invokeRocketRoute guards が record に保持', async () => {
    const res = await invokeRocketRoute({
      route: async () => 'ok',
      method: 'GET',
      path: '/protected',
      guards: ['ApiKey', 'RateLimit'],
    });
    expect(res.guardsPassed).toEqual(['ApiKey', 'RateLimit']);
    expect(res.status).toBe(200);
  });
});
