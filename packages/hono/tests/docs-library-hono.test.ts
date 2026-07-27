import { expect, test } from 'vitest';
import {
  createExecutionContext,
  createHonoApp,
  createRpcClient,
  createWorkersEnv,
  invokeRoute,
  mockKVNamespace,
} from '../src/index.js';

type Profile = { name: string };
type AppEnv = { KV: ReturnType<typeof mockKVNamespace<{ source: string }>> };
type ProfileClient = {
  profiles: {
    ':id': {
      $post: (input: {
        param: { id: string };
        json: Profile;
        env: AppEnv;
        executionCtx: ReturnType<typeof createExecutionContext>;
      }) => Promise<{
        status: number;
        matched: boolean;
        json: () => Promise<{ id: string; accepted: boolean }>;
      }>;
    };
  };
};

test('the quickstart separates a match from a missing method', async () => {
  const app = createHonoApp();
  app.use('/users/*', async (c, next) => {
    c.set('authenticated', true);
    await next();
  });
  app.get('/users/:id', (c) => c.json({ id: c.req.param('id'), authenticated: c.get('authenticated') }));

  const found = await invokeRoute({ app, method: 'GET', path: '/users/42' });
  expect(found.matched).toBe(true);
  expect(found.response.body).toEqual({ id: '42', authenticated: true });
  expect(found.trace.map((entry) => entry.kind)).toEqual(['middleware', 'handler']);

  const missing = await invokeRoute({ app, method: 'POST', path: '/users/42' });
  expect(missing).toMatchObject({ matched: false, response: { status: 404 }, trace: [] });
});

test('the how-to waits for the worker side effect after the RPC response', async () => {
  const KV = mockKVNamespace<{ source: string }>();
  const env = createWorkersEnv({ kv: { KV } }) as unknown as AppEnv;
  const executionCtx = createExecutionContext();
  const app = createHonoApp<AppEnv>();
  app.post('/profiles/:id', async (c) => {
    const profile = await c.req.json<Profile>();
    const id = c.req.param('id');
    c.executionCtx?.waitUntil(
      c.env.KV.put(`profile:${id}`, JSON.stringify(profile), { metadata: { source: 'rpc' } }),
    );
    return c.json({ id, accepted: true }, 201);
  });

  const client = createRpcClient<AppEnv>(app) as ProfileClient;
  const response = await client.profiles[':id'].$post({
    param: { id: '42' },
    json: { name: 'Ada' },
    env,
    executionCtx,
  });

  expect(response).toMatchObject({ matched: true, status: 201 });
  await expect(response.json()).resolves.toEqual({ id: '42', accepted: true });
  expect(executionCtx.pendingCount()).toBe(1);
  await executionCtx.waitUntilAll();
  await expect(KV.getWithMetadata('profile:42')).resolves.toEqual({
    value: JSON.stringify({ name: 'Ada' }),
    metadata: { source: 'rpc' },
  });
});
