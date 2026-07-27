# @kiwa-lab/edge の使い方

profile endpoint が KV から JSON を読む処理と、room を Durable Object として扱う処理を分けて test します。前者は handler が失敗を 500 response と `error` に変換する境界、後者は provider に依存しない lifecycle state machine の境界です。Cloudflare、Vercel、Deno の実 runtime を起動しない in-memory test seam であることを前提にします。

`tests/profile-room.edge.test.ts` を作成します。

```ts
import { expect, test } from 'vitest';
import {
  createDurableObject,
  createKvNamespace,
  invokeEdgeHandler,
  requestDurableObject,
  writeStorage,
} from '@kiwa-lab/edge';

test('returns 500 when a profile binding contains invalid JSON', async () => {
  const KV = createKvNamespace({ 'profile:u-1': 'not-json' });
  const result = await invokeEdgeHandler({
    url: 'https://example.com/profile/u-1',
    env: { KV },
    handler: async (_request, env) => {
      const value = await env.KV.get('profile:u-1');
      return Response.json(JSON.parse(String(value)));
    },
  });

  expect(result.response.status).toBe(500);
  expect(result.error).toBeInstanceOf(Error);
});

test('records a room request and rejects a terminated room', () => {
  const room = createDurableObject({ id: 'room-1', platform: 'cloudflare' });
  const request = requestDurableObject(room, { url: 'https://edge/room-1/join' });
  const write = writeStorage(room, { key: 'last-message', value: 'hello' });

  expect(request).toMatchObject({ state: 'active', neutralEvent: 'durable-object.requested' });
  expect(write.neutralEvent).toBe('durable-object.storage-written');
  expect(room.storageKeys.get('last-message')).toBe('hello');

  room.state = 'terminated';
  expect(() => requestDurableObject(room, { url: '/join' })).toThrow(/terminated/);
});
```

実行します。

```bash
pnpm exec vitest run tests/profile-room.edge.test.ts
```

KV mock は text、JSON、ArrayBuffer を保持しますが、expiration と実際の replication delay は再現しません。`result.error` が空で 500 を返したい場合は handler 自身で error response を返してください。throw を helper が捕捉した場合だけ `result.error` に元の例外が入ります。

Durable Object の request、alarm、storage は neutral event として記録されます。terminated object に対する request、alarm、storage は error です。WebSocket upgrade、hibernation、実行の直列化、storage transaction は provider の integration test で確認してください。CPU limit、subrequest limit、実 geo 情報、runtime が追加する header もこの library の対象外です。
