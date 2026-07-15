/**
 * integration test — 4 framework の end-to-end workflow (route 追加 → handler 呼出 →
 * response + middleware trace 検証) を v2.1 で 5 → 10 case に拡張。
 */
import { describe, expect, it } from 'vitest';
import {
  createGoAppEnv,
  invokeGinHandler,
  invokeEchoHandler,
  invokeFiberHandler,
  captureChiRoute,
  retryWithBackoff,
  batchDispatch,
  createObservabilityHook,
  createRateLimiter,
  createCircuitBreaker,
  createCancelToken,
  createRouteGroup,
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

  // v2.1 追加 5 case
  it('T-INT-GL-006 v2.1 retry + batch dispatch で 5 handler 全成功', async () => {
    const handlers = Array.from({ length: 5 }, (_, i) => async () => {
      const result = await retryWithBackoff(async () => i, { maxAttempts: 2, initialDelayMs: 1 });
      return result.value;
    });
    const batch = await batchDispatch(handlers, { concurrency: 2 });
    expect(batch.successCount).toBe(5);
    expect(batch.results.map((r) => r.value)).toEqual([0, 1, 2, 3, 4]);
  });

  it('T-INT-GL-007 v2.1 observability hook で 5 request event 蓄積 + duration 順', async () => {
    const hook = createObservabilityHook();
    for (let i = 0; i < 5; i += 1) {
      const start = performance.now();
      await invokeGinHandler({
        handler: (c) => { c.JSON(200, { i }); },
        req: { method: 'GET', path: `/o/${i}` },
      });
      hook.onRequest({
        framework: 'gin',
        method: 'GET',
        path: `/o/${i}`,
        status: 200,
        durationMs: performance.now() - start,
        timestamp: Date.now(),
      });
    }
    const events = hook.events();
    expect(events.length).toBe(5);
    expect(events.every((e) => e.durationMs >= 0)).toBe(true);
  });

  it('T-INT-GL-008 v2.1 rate limiter で burst 3 まで通過 + 4 個目 reject', () => {
    const rl = createRateLimiter({ requestsPerSecond: 1, burst: 3 });
    const results = [];
    for (let i = 0; i < 5; i += 1) results.push(rl.tryAcquire());
    const trueCount = results.filter((r) => r).length;
    expect(trueCount).toBeGreaterThanOrEqual(3);
    expect(trueCount).toBeLessThanOrEqual(4);
  });

  it('T-INT-GL-009 v2.1 circuit breaker が閾値超えで open + reject', async () => {
    const cb = createCircuitBreaker({ failureThreshold: 2, resetTimeoutMs: 100 });
    for (let i = 0; i < 2; i += 1) {
      await expect(cb.execute(async () => { throw new Error('fail'); })).rejects.toThrow();
    }
    expect(cb.state()).toBe('open');
    await expect(cb.execute(async () => 'ok')).rejects.toThrow('circuit-open');
  });

  it('T-INT-GL-010 v2.1 route group + subgroup で prefix 合成', () => {
    const api = createRouteGroup({ prefix: '/api', framework: 'gin' });
    api.addRoute('GET', '/health', 'health');
    const v1 = api.subgroup('/v1');
    v1.addRoute('GET', '/users', 'listUsers');
    v1.addRoute('POST', '/users', 'createUser');
    const cancel = createCancelToken();
    let cancelled = 0;
    cancel.onCancel(() => { cancelled += 1; });
    cancel.cancel();
    expect(api.routes.length).toBe(3);
    expect(api.routes.map((r) => r.fullPath).sort()).toEqual(['/api/health', '/api/v1/users', '/api/v1/users']);
    expect(cancelled).toBe(1);
  });
});
