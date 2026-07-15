/**
 * skill test — go-lib skill が 5 主要 API (createGoAppEnv / invokeGinHandler /
 * invokeEchoHandler / invokeFiberHandler / captureChiRoute) を全て公開している + 4 framework
 * で invoke 動作することを assertion。
 */
import { describe, expect, it } from 'vitest';
import {
  createGoAppEnv,
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
  type GoFramework,
} from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

describe('go-lib skill assertions', () => {
  it('createGoAppEnv で 4 framework 全て env 生成可能', () => {
    for (const framework of ['gin', 'echo', 'fiber', 'chi'] as GoFramework[]) {
      const env = createGoAppEnv({ framework });
      expect(env.framework).toBe(framework);
      expect(env.listRoutes()).toEqual([]);
    }
  });

  it('invokeGinHandler が JSON + Status + Header + Param + Query の 5 primitive 全て支援', async () => {
    const r = await invokeGinHandler({
      handler: (c) => {
        c.Header('x-custom', 'v');
        const id = c.Param('id');
        const q = c.Query('q');
        c.JSON(200, { id, q });
      },
      req: { method: 'GET', path: '/x/1', params: { id: '1' }, query: { q: 'w' } },
    });
    expect(r.status).toBe(200);
    expect((r.body as { id: string; q: string })).toEqual({ id: '1', q: 'w' });
    expect(r.headers?.['x-custom']).toBe('v');
  });

  it('invokeEchoHandler で String + Response 経路が動作', async () => {
    const r = await invokeEchoHandler({
      handler: (c) => c.String(201, 'created'),
      req: { method: 'POST', path: '/x' },
    });
    expect(r.status).toBe(201);
    expect(r.body).toBe('created');
    expect(r.framework).toBe('echo');
  });

  it('invokeFiberHandler で Set + Body + Params が動作', async () => {
    const r = await invokeFiberHandler({
      handler: (c) => {
        c.Set('x-h', 'v');
        const body = c.Body();
        return c.Status(200).JSON({ echoed: body });
      },
      req: { method: 'POST', path: '/x', body: { n: 1 } },
    });
    expect(r.status).toBe(200);
    expect((r.body as { echoed: { n: number } })).toEqual({ echoed: { n: 1 } });
    expect(r.headers?.['x-h']).toBe('v');
  });

  it('captureChiRoute が unmatched 時に status 404 を返す', async () => {
    const app = createChiApp();
    app.addRoute('GET', '/x', async () => ({ status: 200 }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/nowhere' });
    expect(r.status).toBe(404);
    expect(r.matched).toBe(false);
  });
});
