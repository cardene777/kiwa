import { expect, test } from 'vitest';
import { captureMiddlewareCall, createPythonAppEnv, dispatchRequest, renderTemplate, withRetry } from '../src/index.js';

test('validates the Quickstart route and middleware contract', async () => {
  const env = createPythonAppEnv({ framework: 'flask' });
  env.registerMiddleware({ name: 'auth', handler: async (request, next) => request.headers?.authorization === 'Bearer test-token' ? next() : { status: 401, headers: {}, body: 'unauthorized' } });
  env.registerRoute('POST', '/items', async (request) => ({ status: 201, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ received: request.body }) }));
  const result = await dispatchRequest(env, { method: 'POST', path: '/items', headers: { authorization: 'Bearer test-token' }, body: '{"n":1}' });
  expect(result).toEqual({ status: 201, headers: { 'content-type': 'application/json' }, body: '{"received":"{\\"n\\":1}"}' });
  expect(captureMiddlewareCall(env)).toEqual([{ name: 'auth', path: '/items', at: 0 }]);
});

test('validates the template, middleware order, 404, and retry how-to', async () => {
  const templateEnv = createPythonAppEnv({ framework: 'django' });
  templateEnv.registerTemplate('welcome', '<b>{{ a }} - {{ b }}</b>');
  expect(renderTemplate(templateEnv, 'welcome', { a: '1' }).missing).toEqual(['b']);
  const env = createPythonAppEnv(); const order: string[] = [];
  env.registerMiddleware({ name: 'logging', handler: async (_request, next) => { order.push('before'); const response = await next(); order.push('after'); return response; } });
  env.registerRoute('GET', '/users', async () => ({ status: 200, headers: {}, body: 'ok' }));
  await dispatchRequest(env, { method: 'GET', path: '/users' });
  expect(order).toEqual(['before', 'after']);
  expect(await dispatchRequest(createPythonAppEnv(), { method: 'GET', path: '/missing' })).toMatchObject({ status: 404, body: 'Not Found' });
  let attempts = 0;
  const load = withRetry(async () => { attempts += 1; if (attempts < 3) throw new Error('temporary'); return 'loaded'; }, { maxAttempts: 3, backoffMs: 1, retryOn: (error) => (error as Error).message === 'temporary' });
  await expect(load()).resolves.toBe('loaded');
  expect(attempts).toBe(3);
});
