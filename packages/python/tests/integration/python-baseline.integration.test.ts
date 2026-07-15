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
