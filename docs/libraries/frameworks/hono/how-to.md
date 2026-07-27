# hono の使い方

## RPC と background work を一緒に確認する

profile を更新する handler を考えます。client は `POST /profiles/:id` に JSON body を送り、handler は response を返しながら `waitUntil` で KV へ保存します。この test の目的は、RPC の input mapping と deferred side effect の両方を一つの利用シナリオとして確認することです。KV が更新済みであることを先に assertion してはいけません。`waitUntilAll` を待つまで background work の完了は保証されないためです。

`tests/profile-rpc.hono.test.ts` を作成します。

```ts
import { expect, test } from 'vitest';
import {
  createExecutionContext,
  createHonoApp,
  createRpcClient,
  createWorkersEnv,
  mockKVNamespace,
} from '@kiwa-lab/hono';

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

test('posts through the RPC client and waits for the KV write', async () => {
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

  expect(response.matched).toBe(true);
  expect(response.status).toBe(201);
  await expect(response.json()).resolves.toEqual({ id: '42', accepted: true });
  expect(executionCtx.pendingCount()).toBe(1);

  await executionCtx.waitUntilAll();
  await expect(KV.getWithMetadata('profile:42')).resolves.toEqual({
    value: JSON.stringify({ name: 'Ada' }),
    metadata: { source: 'rpc' },
  });
});
```

実行します。

```bash
pnpm exec vitest run tests/profile-rpc.hono.test.ts
```

`':id'` は parameter segment です。`param.id` を渡さない場合、client は request を実行する前に missing parameter error を返します。`$get`、`$post`、`$put`、`$delete`、`$patch` だけが RPC terminal です。client の TypeScript type は呼び出し側が定義する契約であり、この adapter は runtime で JSON schema を検証しません。入力値の validation は handler に追加して別の test で確認します。

## Workers mock を選ぶ

この例の KV は instance 内だけに状態を持ち、expiration は読み取り時に `Date.now()` で判定されます。D1 を使う handler では、`__setResponse` で SQL text ごとの結果を用意し、`__log` で query と bindings を確認します。D1 mock は SQL や transaction を実行しません。R2 mock は value と metadata を保存しますが、checksum と content type の推論は行いません。

`waitUntilAll` が reject した場合は background work の失敗です。promise を catch して握りつぶさず、保存処理の error を test で扱ってください。Cloudflare runtime、network fetch、Durable Objects、Queue、WebSocket、streaming は adapter の外です。これらは Miniflare または preview environment の integration test で確認します。
