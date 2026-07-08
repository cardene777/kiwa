import { describe, expect, it } from 'vitest';
import { invokeRoute } from '@kiwa/hono';
import {
  buildDogfoodApp,
  resetRateLimit,
  ROUTE_PATHS,
  MIDDLEWARE_ORDER,
  type DogfoodEnv,
} from '../src/routes/app.js';
import { createDogfoodBindings } from '../src/workers/bindings.js';

/**
 * Route + middleware chain behavior tests — the shape of every response
 * spec + the ordered middleware trace end-to-end.
 */
describe('dogfood app — route + middleware chain', () => {
  it('T-DHW-AR-001 GET /health passes through 5 middleware in order', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'GET',
      path: ROUTE_PATHS.health,
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.matched).toBe(true);
    expect(result.response.status).toBe(200);
    expect(result.response.body).toEqual({ ok: true, route: 'health' });
    // 5 middleware + 1 handler = 6 trace entries in order.
    const middlewareTrace = result.trace.filter((t) => t.kind === 'middleware');
    expect(middlewareTrace.length).toBe(MIDDLEWARE_ORDER.length);
    expect(result.response.headers['access-control-allow-origin']).toBe('*');
  });

  it('T-DHW-AR-002 GET /greet/:name resolves param from URL', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'GET',
      path: '/greet/kiwa',
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.response.status).toBe(200);
    expect(result.response.body).toEqual({ ok: true, message: 'hello kiwa' });
  });

  it('T-DHW-AR-003 unauthenticated request short-circuits at auth middleware', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'GET',
      path: ROUTE_PATHS.health,
      // no Authorization header → auth middleware returns 401
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.response.status).toBe(401);
    expect(result.response.body).toEqual({ error: 'unauthorized' });
  });

  it('T-DHW-AR-004 rate-limit middleware short-circuits after N requests', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings({ rateLimit: 2 });
    for (let i = 0; i < 2; i += 1) {
      const ok = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
        app,
        method: 'GET',
        path: ROUTE_PATHS.health,
        headers: {
          authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
          'x-client-id': 'test',
        },
        env: bindings.env,
        executionCtx: bindings.ctx,
      });
      expect(ok.response.status).toBe(200);
    }
    const throttled = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'GET',
      path: ROUTE_PATHS.health,
      headers: {
        authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
        'x-client-id': 'test',
      },
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(throttled.response.status).toBe(429);
    expect((throttled.response.body as { error: string }).error).toBe('rate-limited');
  });

  it('T-DHW-AR-005 validator middleware rejects invalid JSON on POST', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'POST',
      path: ROUTE_PATHS.kvCounter,
      headers: {
        authorization: `Bearer ${bindings.env.AUTH_TOKEN}`,
        'content-type': 'application/json',
      },
      body: 'this-is-not-json',
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.response.status).toBe(400);
    expect(result.response.body).toEqual({ error: 'invalid-json' });
  });

  it('T-DHW-AR-006 unknown route returns 404 without running middleware', async () => {
    resetRateLimit();
    const app = buildDogfoodApp();
    const bindings = createDogfoodBindings();
    const result = await invokeRoute<DogfoodEnv, Record<string, unknown>>({
      app,
      method: 'GET',
      path: '/does-not-exist',
      headers: { authorization: `Bearer ${bindings.env.AUTH_TOKEN}` },
      env: bindings.env,
      executionCtx: bindings.ctx,
    });
    expect(result.matched).toBe(false);
    expect(result.response.status).toBe(404);
    // 404 fallback bypasses the middleware chain (matches Hono default).
    expect(result.trace.length).toBe(0);
  });
});
