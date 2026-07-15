/**
 * skill test — rust-lib skill が主要 5 API を全て公開している + framework 別動作 の
 * assertion を skill-test primitive 経由で行う。
 */
import { describe, expect, it } from 'vitest';
import {
  createRustAppEnv,
  invokeAxumHandler,
  invokeActixHandler,
  captureTowerMiddleware,
  invokeRocketRoute,
} from '../../src/index.js';

describe('rust-lib skill assertions', () => {
  it('createRustAppEnv を 4 framework (axum/actix-web/tower-http/rocket) 全てで instantiate 可能', () => {
    for (const framework of ['axum', 'actix-web', 'tower-http', 'rocket'] as const) {
      const env = createRustAppEnv({ framework });
      expect(env.framework).toBe(framework);
      expect(env.routes).toEqual([]);
    }
  });

  it('invokeAxumHandler が async handler の結果を body に配置', async () => {
    const res = await invokeAxumHandler({
      handler: async () => ({ result: 'value' }),
      method: 'POST',
      path: '/api/create',
      body: { name: 'kiwa' },
    });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ result: 'value' });
    expect(res.durationMs).toBeGreaterThanOrEqual(0);
  });

  it('invokeActixHandler が extractors + method + path を保持', async () => {
    const res = await invokeActixHandler({
      handler: async () => 'plain response',
      method: 'PUT',
      path: '/api/update/42',
    });
    expect(res.body).toBe('plain response');
    expect(res.method).toBe('PUT');
  });

  it('captureTowerMiddleware が単一 middleware でも配列でも動作', async () => {
    const single = async (req: { method: string; path: string; headers: Record<string, string> }, next: (r: typeof req) => Promise<{ status: number; body: unknown }>) => next(req);
    const trace = await captureTowerMiddleware({
      middleware: single,
      request: { method: 'GET', path: '/x', headers: {} },
    });
    expect(trace.entered.length).toBe(1);
    expect(trace.request.method).toBe('GET');
  });

  it('invokeRocketRoute の error path が 500 + reason を返す', async () => {
    const res = await invokeRocketRoute({
      route: async () => { throw new Error('validation failed'); },
      method: 'POST',
      path: '/create',
    });
    expect(res.status).toBe(500);
    expect(res.reason).toBe('validation failed');
  });
});
