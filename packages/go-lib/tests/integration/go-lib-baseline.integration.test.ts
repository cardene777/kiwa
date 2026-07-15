/**
 * integration test — 4 framework の end-to-end workflow (route 追加 → handler 呼出 →
 * response + middleware trace 検証) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createGoAppEnv,
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
} from '../../src/index.js';
import { createChiApp } from '../../src/chi.js';

describe('go-lib integration — 4 framework request-response workflow', () => {
  it('T-INT-GL-001 gin で 3 route (GET/POST/DELETE) を連続 dispatch', async () => {
    const env = createGoAppEnv({ framework: 'gin' });
    env.addRoute({ method: 'GET', path: '/users', handlerName: 'list' });
    env.addRoute({ method: 'POST', path: '/users', handlerName: 'create' });
    env.addRoute({ method: 'DELETE', path: '/users/1', handlerName: 'delete' });

    const list = await invokeGinHandler({
      handler: (c) => { c.JSON(200, [{ id: 1 }]); },
      req: { method: 'GET', path: '/users' },
    });
    const create = await invokeGinHandler({
      handler: (c) => { c.JSON(201, { id: 2 }); },
      req: { method: 'POST', path: '/users', body: { name: 'x' } },
    });
    const del = await invokeGinHandler({
      handler: (c) => { c.status(204); },
      req: { method: 'DELETE', path: '/users/1' },
    });
    expect(list.status).toBe(200);
    expect(create.status).toBe(201);
    expect(del.status).toBe(204);
    expect(env.listRoutes().length).toBe(3);
  });

  it('T-INT-GL-002 echo handler error が result.handlerError に反映', async () => {
    const r = await invokeEchoHandler({
      handler: () => new Error('validation failed'),
      req: { method: 'POST', path: '/x' },
    });
    expect(r.handlerError).toBe('validation failed');
  });

  it('T-INT-GL-003 fiber SendStatus で body なし 202 返却', async () => {
    const r = await invokeFiberHandler({
      handler: (c) => c.SendStatus(202),
      req: { method: 'POST', path: '/accept' },
    });
    expect(r.status).toBe(202);
    expect(r.body).toBeUndefined();
  });

  it('T-INT-GL-004 chi middleware chain 3 段 + handler の順序が trace に記録', async () => {
    const app = createChiApp();
    app.use('cors', async (_n, next) => { await next(); });
    app.use('auth', async (_n, next) => { await next(); });
    app.use('logger', async (_n, next) => { await next(); });
    app.addRoute('GET', '/api/v1/status', async () => ({ status: 200, body: { ok: true } }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/api/v1/status' });
    expect(r.matched).toBe(true);
    expect(r.matchedPattern).toBe('/api/v1/status');
    expect(r.middlewareTrace.map((m) => m.name)).toEqual(['cors', 'auth', 'logger']);
  });

  it('T-INT-GL-005 chi pattern matching で複数 param decode + handler 実行', async () => {
    const app = createChiApp();
    app.addRoute('GET', '/orgs/{orgId}/repos/{repoName}', async (req) => ({
      status: 200,
      body: { orgId: req.params?.orgId, repoName: req.params?.repoName },
      headers: { 'content-type': 'application/json' },
    }));
    const r = await captureChiRoute({ app, method: 'GET', path: '/orgs/kiwa-lab/repos/kiwa' });
    expect(r.status).toBe(200);
    expect((r.body as { orgId: string; repoName: string })).toEqual({ orgId: 'kiwa-lab', repoName: 'kiwa' });
    expect(r.headers?.['content-type']).toBe('application/json');
  });
});
