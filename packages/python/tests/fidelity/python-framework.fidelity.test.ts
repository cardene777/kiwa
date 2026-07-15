/**
 * fidelity test — createPythonAppEnv (kiwa mock) が reference impl と同じ挙動を示すことを検証。
 * 5 case で dispatch / template / middleware / framework mode / 404 の 5 観点を cover。
 */
import { assertFidelity } from '@kiwa-lab/quality-metrics';
import { describe, expect, it } from 'vitest';
import { createPythonAppEnv, dispatchRequest, renderTemplate } from '../../src/index.js';

function referenceApp() {
  const routes = new Map<string, (req: { method: string; path: string }) => { status: number; body: string }>();
  return {
    register(method: string, path: string, handler: (req: { method: string; path: string }) => { status: number; body: string }) {
      routes.set(`${method} ${path}`, handler);
    },
    dispatch(req: { method: string; path: string }) {
      const h = routes.get(`${req.method} ${req.path}`);
      if (!h) return { status: 404, body: 'Not Found' };
      return h(req);
    },
  };
}

describe('python app env fidelity vs reference impl', () => {
  it('dispatch = registered route の handler 結果を返す', async () => {
    const mock = createPythonAppEnv({ framework: 'flask' });
    const real = referenceApp();
    mock.registerRoute('GET', '/x', async () => ({ status: 200, headers: {}, body: 'ok' }));
    real.register('GET', '/x', () => ({ status: 200, body: 'ok' }));

    const result = await assertFidelity({
      mockFn: async (m: string) => (await dispatchRequest(mock, { method: m, path: '/x' })).status,
      realFn: async (m: string) => real.dispatch({ method: m, path: '/x' }).status,
      cases: [{ name: 'GET returns 200', args: ['GET'] }],
    });
    expect(result.ratio).toBe(100);
  });

  it('未登録 route = 404', async () => {
    const mock = createPythonAppEnv({ framework: 'django' });
    const res = await dispatchRequest(mock, { method: 'GET', path: '/nope' });
    expect(res.status).toBe(404);
    expect(res.body).toBe('Not Found');
  });

  it('renderTemplate = variables 収集 + missing 検出', () => {
    const env = createPythonAppEnv({ framework: 'flask' });
    env.registerTemplate('greet', 'hello {{ name }} / {{ role }}');
    const result = renderTemplate(env, 'greet', { name: 'kiwa' });
    expect(result.variables).toEqual(['name', 'role']);
    expect(result.missing).toEqual(['role']);
    expect(result.html).toBe('hello kiwa / ');
  });

  it('middleware chain = 順次実行 + call history 記録', async () => {
    const env = createPythonAppEnv({ framework: 'fastapi' });
    const order: string[] = [];
    env.registerMiddleware({
      name: 'log',
      handler: async (_req, next) => {
        order.push('log:before');
        const res = await next();
        order.push('log:after');
        return res;
      },
    });
    env.registerRoute('GET', '/x', async () => {
      order.push('handler');
      return { status: 200, headers: {}, body: 'ok' };
    });
    await dispatchRequest(env, { method: 'GET', path: '/x' });
    expect(order).toEqual(['log:before', 'handler', 'log:after']);
    expect(env.middlewareCalls.length).toBe(1);
  });

  it('framework 別 mode default = fastapi/starlette は asgi、 django/flask は wsgi', () => {
    expect(createPythonAppEnv({ framework: 'django' }).mode).toBe('wsgi');
    expect(createPythonAppEnv({ framework: 'flask' }).mode).toBe('wsgi');
    expect(createPythonAppEnv({ framework: 'fastapi' }).mode).toBe('asgi');
    expect(createPythonAppEnv({ framework: 'starlette' }).mode).toBe('asgi');
  });
});

describe('v2.1 resilience primitives (generic)', () => {
  it('withRetry recovers after transient failure and eventually succeeds', async () => {
    const { withRetry } = await import('../../src/index.js');
    let attempts = 0;
    const wrapped = withRetry(async () => {
      attempts += 1;
      if (attempts < 3) throw new Error('flaky');
      return 'ok';
    }, { maxAttempts: 5 });
    expect(await wrapped()).toBe('ok');
    expect(attempts).toBe(3);
  });

  it('withTimeout rejects after ms elapsed', async () => {
    const { withTimeout } = await import('../../src/index.js');
    const wrapped = withTimeout(async () => {
      await new Promise((r) => setTimeout(r, 50));
      return 'never';
    }, { ms: 5 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
  });

  it('withRateLimit throws when exceeding maxRequests', async () => {
    const { withRateLimit } = await import('../../src/index.js');
    const wrapped = withRateLimit(async () => 'ok', { maxRequests: 2, windowMs: 1000 });
    await wrapped();
    await wrapped();
    await expect(wrapped()).rejects.toThrow(/rate limit/);
  });

  it('withCircuitBreaker opens after failureThreshold and rejects further calls', async () => {
    const { withCircuitBreaker } = await import('../../src/index.js');
    const wrapped = withCircuitBreaker(async () => { throw new Error('down'); }, {
      failureThreshold: 2, resetMs: 1000,
    });
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('down');
    await expect(wrapped()).rejects.toThrow('circuit breaker open');
  });

  it('withIdempotencyKey returns cached result on duplicate key', async () => {
    const { withIdempotencyKey } = await import('../../src/index.js');
    let counter = 0;
    const wrapped = withIdempotencyKey(async (_key: string) => {
      counter += 1;
      return { id: counter };
    });
    const a = await wrapped('K');
    const b = await wrapped('K');
    expect(a.id).toBe(b.id);
    expect(counter).toBe(1);
  });
});
