/**
 * integration test — python domain の end-to-end workflow (env 作成 → route 登録 →
 * middleware 登録 → dispatch → template render → middleware history 確認) を 5 case で cover。
 */
import { describe, expect, it } from 'vitest';
import {
  createPythonAppEnv,
  dispatchRequest,
  renderTemplate,
  captureMiddlewareCall,
} from '../../src/index.js';

describe('python integration — dispatch → middleware → template workflow', () => {
  it('T-INT-P-001 Django app で GET /users → route handler で template render → 200 返却', async () => {
    const env = createPythonAppEnv({ framework: 'django' });
    env.registerTemplate('users_list', '<ul>{{ names }}</ul>');
    env.registerRoute('GET', '/users', async () => {
      const html = renderTemplate(env, 'users_list', { names: 'alice, bob' }).html;
      return { status: 200, headers: { 'content-type': 'text/html' }, body: html };
    });
    const res = await dispatchRequest(env, { method: 'GET', path: '/users' });
    expect(res.status).toBe(200);
    expect(res.body).toBe('<ul>alice, bob</ul>');
  });

  it('T-INT-P-002 FastAPI (ASGI) で POST /items → JSON parse 相当 → 201', async () => {
    const env = createPythonAppEnv({ framework: 'fastapi' });
    expect(env.mode).toBe('asgi');
    env.registerRoute('POST', '/items', async (req) => ({
      status: 201,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ echo: req.body }),
    }));
    const res = await dispatchRequest(env, { method: 'POST', path: '/items', body: '{"n":1}' });
    expect(res.status).toBe(201);
    expect(JSON.parse(res.body)).toEqual({ echo: '{"n":1}' });
  });

  it('T-INT-P-003 middleware chain で auth → logging → handler の順で実行', async () => {
    const env = createPythonAppEnv({ framework: 'flask' });
    env.registerMiddleware({ name: 'auth', handler: async (_r, n) => n() });
    env.registerMiddleware({ name: 'logging', handler: async (_r, n) => n() });
    env.registerRoute('GET', '/x', async () => ({ status: 200, headers: {}, body: 'ok' }));
    const res = await dispatchRequest(env, { method: 'GET', path: '/x' });
    expect(res.status).toBe(200);
    const calls = captureMiddlewareCall(env);
    expect(calls.map((c) => c.name)).toEqual(['auth', 'logging']);
  });

  it('T-INT-P-004 未登録 path = 404 Not Found', async () => {
    const env = createPythonAppEnv({ framework: 'starlette' });
    const res = await dispatchRequest(env, { method: 'GET', path: '/nope' });
    expect(res.status).toBe(404);
    expect(res.body).toBe('Not Found');
  });

  it('T-INT-P-005 middleware が throw = dispatch 経由で throw が伝搬', async () => {
    const env = createPythonAppEnv({ framework: 'fastapi' });
    env.registerMiddleware({
      name: 'blocker',
      handler: async () => {
        throw new Error('forbidden by middleware');
      },
    });
    env.registerRoute('GET', '/x', async () => ({ status: 200, headers: {}, body: 'ok' }));
    await expect(dispatchRequest(env, { method: 'GET', path: '/x' })).rejects.toThrow(/forbidden by middleware/);
  });
});

describe('v2.1 resilience integration', () => {
  it('T-INT-V21-001 batchOperate runs items in parallel with per-item error isolation', async () => {
    const { batchOperate } = await import('../../src/index.js');
    const results = await batchOperate(
      [{ name: 'a', input: 1 }, { name: 'b', input: 2 }, { name: 'c', input: 3 }],
      async (item) => {
        if (item.name === 'b') throw new Error('bad');
        return (item.input as number) * 10;
      },
    );
    expect(results.filter((r) => r.ok).length).toBe(2);
    expect(results.filter((r) => !r.ok).length).toBe(1);
  });

  it('T-INT-V21-002 withRetry + withTimeout can be composed', async () => {
    const { withRetry, withTimeout } = await import('../../src/index.js');
    let calls = 0;
    const slow = async () => {
      calls += 1;
      await new Promise((r) => setTimeout(r, 20));
      return 'done';
    };
    const wrapped = withRetry(withTimeout(slow, { ms: 5 }), { maxAttempts: 2 });
    await expect(wrapped()).rejects.toThrow(/timeout/);
    expect(calls).toBe(2);
  });

  it('T-INT-V21-003 withObservability fires start/success hooks in order', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => 'ok', {
      onStart: () => events.push('start'),
      onSuccess: () => events.push('success'),
    });
    await wrapped();
    expect(events).toEqual(['start', 'success']);
  });

  it('T-INT-V21-004 withObservability captures error path', async () => {
    const { withObservability } = await import('../../src/index.js');
    const events: string[] = [];
    const wrapped = withObservability('op', async () => { throw new Error('nope'); }, {
      onStart: () => events.push('start'),
      onError: () => events.push('error'),
    });
    await expect(wrapped()).rejects.toThrow('nope');
    expect(events).toEqual(['start', 'error']);
  });

  it('T-INT-V21-005 withRetry retryOn callback conditionally suppresses retry', async () => {
    const { withRetry } = await import('../../src/index.js');
    let calls = 0;
    const wrapped = withRetry(async () => {
      calls += 1;
      throw new Error('fatal');
    }, { maxAttempts: 5, retryOn: (err) => (err as Error).message !== 'fatal' });
    await expect(wrapped()).rejects.toThrow('fatal');
    expect(calls).toBe(1);
  });
});
