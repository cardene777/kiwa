import { expect, it } from 'vitest';
import {
  captureTowerMiddleware,
  invokeAxumHandler,
  invokeRocketRoute,
  withRetry,
} from '../src/index.js';

it('keeps the documented handler and middleware flows runnable', async () => {
  const created = await invokeAxumHandler({
    handler: async (body: { name: string } | undefined) => ({ result: 'created', name: body?.name }),
    method: 'POST',
    path: '/api/create',
    body: { name: 'kiwa' },
    headers: { authorization: 'Bearer test-token' },
  });
  expect(created).toMatchObject({ status: 200, body: { result: 'created', name: 'kiwa' } });

  const failed = await invokeRocketRoute({
    route: async () => { throw new Error('validation failed'); },
    method: 'POST',
    path: '/create',
    guards: ['ApiKey', 'RateLimit'],
  });
  expect(failed).toMatchObject({ status: 500, body: null, reason: 'validation failed' });

  const trace = await captureTowerMiddleware({
    middleware: async () => ({ status: 401, body: 'unauthorized' }),
    request: { method: 'GET', path: '/private', headers: {} },
    handler: async () => ({ status: 200, body: 'should not run' }),
  });
  expect(trace.response).toEqual({ status: 401, body: 'unauthorized' });

  let calls = 0;
  const retry = withRetry(async () => {
    calls += 1;
    if (calls < 3) throw new Error('temporary failure');
    return 'ok';
  }, { maxAttempts: 5 });
  await expect(retry()).resolves.toBe('ok');
  expect(calls).toBe(3);
});
