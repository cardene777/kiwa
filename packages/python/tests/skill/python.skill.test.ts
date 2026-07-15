/**
 * skill test — python skill が主要 API 4 種 (createPythonAppEnv / dispatchRequest /
 * renderTemplate / captureMiddlewareCall) を全て公開している + 実 framework 4 種で
 * 動作分岐することを skill-test primitive 経由で assertion する。
 */
import { describe, expect, it } from 'vitest';
import {
  createPythonAppEnv,
  dispatchRequest,
  renderTemplate,
  captureMiddlewareCall,
} from '../../src/index.js';

describe('python skill assertions', () => {
  it('createPythonAppEnv を 4 framework (django/flask/fastapi/starlette) 全てで instantiate 可能', () => {
    for (const framework of ['django', 'flask', 'fastapi', 'starlette'] as const) {
      const env = createPythonAppEnv({ framework });
      expect(env.framework).toBe(framework);
    }
  });

  it('dispatchRequest が registered route を await して response 返却', async () => {
    const env = createPythonAppEnv({ framework: 'flask' });
    env.registerRoute('POST', '/items', async (req) => ({
      status: 201,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ received: req.body }),
    }));
    const res = await dispatchRequest(env, { method: 'POST', path: '/items', body: '{"n":1}' });
    expect(res.status).toBe(201);
    expect(JSON.parse(res.body)).toEqual({ received: '{"n":1}' });
  });

  it('renderTemplate が interpolation + missing collection を返却', () => {
    const env = createPythonAppEnv({ framework: 'django' });
    env.registerTemplate('t', '<b>{{ a }} - {{ b }}</b>');
    const result = renderTemplate(env, 't', { a: '1' });
    expect(result.html).toBe('<b>1 - </b>');
    expect(result.missing).toEqual(['b']);
  });

  it('captureMiddlewareCall が middleware chain 経由後の履歴を返却', async () => {
    const env = createPythonAppEnv({ framework: 'fastapi' });
    env.registerMiddleware({ name: 'auth', handler: async (_r, n) => n() });
    env.registerMiddleware({ name: 'logging', handler: async (_r, n) => n() });
    env.registerRoute('GET', '/x', async () => ({ status: 200, headers: {}, body: 'ok' }));
    await dispatchRequest(env, { method: 'GET', path: '/x' });
    const calls = captureMiddlewareCall(env);
    expect(calls.length).toBe(2);
    expect(calls[0]!.name).toBe('auth');
    expect(calls[1]!.name).toBe('logging');
  });

  it('renderTemplate = 未登録 template で throw', () => {
    const env = createPythonAppEnv({ framework: 'flask' });
    expect(() => renderTemplate(env, 'missing', {})).toThrow(/template not found/);
  });
});
