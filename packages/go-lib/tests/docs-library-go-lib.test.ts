import { expect, it } from 'vitest';
import {
  invokeEchoHandler,
  invokeFiberHandler,
  invokeGinHandler,
  retryWithBackoff,
} from '../src/index.js';

it('validates the Quickstart Gin handler and abort examples', async () => {
  const user = await invokeGinHandler({
    handler: (context) => {
      context.Header('x-request-id', 'test-1');
      context.JSON(200, { id: context.Param('id'), page: context.Query('page') });
    },
    req: { method: 'GET', path: '/users/1', params: { id: '1' }, query: { page: '2' } },
  });
  expect(user).toMatchObject({ status: 200, body: { id: '1', page: '2' } });

  const denied = await invokeGinHandler({
    handler: (context) => { context.status(401); context.abort(); },
    req: { method: 'GET', path: '/private' },
  });
  expect(denied).toMatchObject({ status: 401, aborted: true });
});

it('validates the how-to adapter and retry contracts', async () => {
  const echo = await invokeEchoHandler({
    handler: () => new Error('validation failed'), req: { method: 'POST', path: '/items' },
  });
  expect(echo).toMatchObject({ status: 200, handlerError: 'validation failed' });
  const fiber = await invokeFiberHandler({
    handler: (context) => context.Status(202).SendStatus(202), req: { method: 'POST', path: '/items' },
  });
  expect(fiber.status).toBe(202);
  expect(fiber).not.toHaveProperty('body');

  let attempts = 0;
  const succeeded = await retryWithBackoff(async () => {
    attempts += 1;
    if (attempts < 3) throw new Error('temporary failure');
    return 'ok';
  }, { maxAttempts: 5, initialDelayMs: 1 });
  expect(succeeded).toMatchObject({ ok: true, attempts: 3, value: 'ok' });
  const failed = await retryWithBackoff(async () => { throw new Error('still unavailable'); }, { maxAttempts: 2, initialDelayMs: 1 });
  expect(failed).toMatchObject({ ok: false, attempts: 2 });
});
