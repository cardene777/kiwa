import { expect, test } from 'vitest';
import {
  createDurableObject,
  createKvNamespace,
  invokeEdgeHandler,
  requestDurableObject,
  writeStorage,
} from '../src/index.js';

test('the quickstart observes JSON input and deferred work', async () => {
  const result = await invokeEdgeHandler({
    handler: async (request, _env, ctx) => {
      ctx.waitUntil(Promise.resolve('logged'));
      ctx.passThroughOnException();
      return Response.json({ body: await request.json() });
    },
    url: 'https://example.com/orders',
    jsonBody: { id: 'o-1' },
    env: {},
  });
  await expect(result.response.json()).resolves.toEqual({ body: { id: 'o-1' } });
  await expect(result.ctx.waitedPromises[0]).resolves.toBe('logged');
  expect(result.ctx.passThroughCalled).toBe(true);
});

test('the how-to separates a broken KV value from a terminated room', async () => {
  const KV = createKvNamespace({ 'profile:u-1': 'not-json' });
  const result = await invokeEdgeHandler({
    url: 'https://example.com/profile/u-1',
    env: { KV },
    handler: async (_request, env) => Response.json(JSON.parse(String(await env.KV.get('profile:u-1')))),
  });
  expect(result.response.status).toBe(500);
  expect(result.error).toBeInstanceOf(Error);

  const room = createDurableObject({ id: 'room-1', platform: 'cloudflare' });
  expect(requestDurableObject(room, { url: 'https://edge/room-1/join' }).state).toBe('active');
  expect(writeStorage(room, { key: 'last-message', value: 'hello' }).neutralEvent).toBe('durable-object.storage-written');
  room.state = 'terminated';
  expect(() => requestDurableObject(room, { url: '/join' })).toThrow(/terminated/);
});
