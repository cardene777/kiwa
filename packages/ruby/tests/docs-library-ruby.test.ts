import { expect, test } from 'vitest';
import { captureActiveRecord, createRubyAppEnv, dispatchGenericRequest, dispatchRailsRequest, renderERB, withRetry } from '../src/index.js';

test('validates the Quickstart Rails action and generic route', async () => {
  const env = createRubyAppEnv({ framework: 'rails' });
  const result = await dispatchRailsRequest(env, { method: 'POST', path: '/posts', body: { title: 'kiwa' } }, {
    beforeActions: [() => env.recordAR({ op: 'find', model: 'CurrentUser', args: {} })],
    action: async (request) => { env.recordAR({ op: 'create', model: 'Post', args: request.body }); return { status: 201, body: '{"ok":true}', headers: {}, cookies: {}, session: {} }; },
  });
  expect(result).toMatchObject({ response: { status: 201 }, beforeActionCount: 1 });
  expect(captureActiveRecord(env).byOp).toMatchObject({ find: 1, create: 1 });
  const generic = createRubyAppEnv({ framework: 'sinatra' });
  generic.addRoute({ method: 'GET', path: '/posts/:id', handler: (request) => ({ status: 200, body: request.path, headers: {}, cookies: {}, session: {} }) });
  expect(await dispatchGenericRequest(generic, { method: 'GET', path: '/posts/42' })).toMatchObject({ matched: true, response: { body: '/posts/42' } });
});

test('validates ActiveRecord, ERB, 404, and retry how-to', async () => {
  const env = createRubyAppEnv({ framework: 'rails' }); env.recordAR({ op: 'create', model: 'Post', args: { title: 'kiwa' } });
  expect(captureActiveRecord(env)).toMatchObject({ total: 1, byOp: { create: 1 }, byModel: { Post: 1 } });
  expect(renderERB('<h1><%= title %></h1><p><%= author.name %></p>', { title: 'kiwa' }).missing).toEqual(['author.name']);
  expect(await dispatchGenericRequest(createRubyAppEnv(), { method: 'GET', path: '/missing' })).toMatchObject({ matched: false, response: { status: 404, body: 'Not Found' } });
  let attempts = 0; const load = withRetry(async () => { attempts += 1; if (attempts < 3) throw new Error('temporary'); return 'loaded'; }, { maxAttempts: 3, backoffMs: 1, retryOn: (error) => (error as Error).message === 'temporary' });
  await expect(load()).resolves.toBe('loaded'); expect(attempts).toBe(3);
});
