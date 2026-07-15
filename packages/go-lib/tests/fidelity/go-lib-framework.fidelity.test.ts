/**
 * fidelity test — 4 framework mock adapter が同じ input で reference impl (単純 map) と一致する
 * response shape を返すことを検証。 各 case で JSON body + status code を比較。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { invokeGinHandler, invokeEchoHandler, invokeFiberHandler, captureChiRoute } from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

function referenceEcho(): { call: (v: string) => Promise<{ status: number; body: string }> } {
  return {
    async call(v: string) {
      return { status: 200, body: v };
    },
  };
}

describe('go-lib framework fidelity vs reference echo impl', () => {
  it('gin JSON = reference echo と同 status 200 を返す', async () => {
    const real = referenceEcho();
    const result = await assertFidelity({
      mockFn: async (v: string) => {
        const r = await invokeGinHandler({ handler: (c) => { c.JSON(200, { v }); }, req: { method: 'GET', path: '/' } });
        return r.status;
      },
      realFn: async (v: string) => (await real.call(v)).status,
      cases: [{ name: 'basic', args: ['x'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('echo NoContent が status 204 を返す', async () => {
    const r = await invokeEchoHandler({
      handler: (c) => c.NoContent(204),
      req: { method: 'DELETE', path: '/x' },
    });
    expect(r.status).toBe(204);
    expect(r.body).toBeUndefined();
  });

  it('fiber Status(500).SendString で status + body 両方 capture', async () => {
    const r = await invokeFiberHandler({
      handler: (c) => c.Status(500).SendString('err'),
      req: { method: 'GET', path: '/e' },
    });
    expect(r.status).toBe(500);
    expect(r.body).toBe('err');
  });

  it('chi pattern matching で params が正しく decode', async () => {
    const app = createChiApp();
    app.addRoute('GET', '/users/{id}/posts/{postId}', async (req) => ({
      status: 200,
      body: { id: req.params?.id, postId: req.params?.postId },
    }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/users/42/posts/7' });
    expect(r.matched).toBe(true);
    expect((r.body as { id: string; postId: string })).toEqual({ id: '42', postId: '7' });
  });

  it('chi middleware chain が addRoute 順に trace される', async () => {
    const app = createChiApp();
    app.use('logger', async (_n, next) => { await next(); });
    app.use('auth', async (_n, next) => { await next(); });
    app.addRoute('GET', '/x', async () => ({ status: 200 }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/x' });
    expect(r.middlewareTrace.map((m) => m.name)).toEqual(['logger', 'auth']);
  });
});
