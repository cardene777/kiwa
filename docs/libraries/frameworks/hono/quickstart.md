# @kiwa-lab/hono を始める

`@kiwa-lab/hono` は、Hono application の route と middleware を process 内で呼び出す test adapter です。ここで確認するのは、登録した request の行き先と response の契約です。HTTP server、Cloudflare Workers、外部 network は起動しません。

この最初の test は二つの境界を分けて確認します。`/users/42` は route に到達し、認証 middleware が handler より先に動きます。`/users/42` への `POST` は route が未一致です。status だけでなく `matched` を確認することで、handler が意図的に返した 404 と route 登録の間違いを混同しません。

## 準備

```bash
pnpm add -D @kiwa-lab/hono vitest
```

## 最初の route test

`tests/users.hono.test.ts` を作成します。

```ts
import { expect, test } from 'vitest';
import { createHonoApp, invokeRoute } from '@kiwa-lab/hono';

test('runs middleware and distinguishes an unmatched route', async () => {
  const app = createHonoApp();

  app.use('/users/*', async (c, next) => {
    c.set('authenticated', true);
    await next();
  });
  app.get('/users/:id', (c) => c.json({
    id: c.req.param('id'),
    authenticated: c.get('authenticated'),
  }));

  const found = await invokeRoute({ app, method: 'GET', path: '/users/42' });
  expect(found.matched).toBe(true);
  expect(found.response.status).toBe(200);
  expect(found.response.body).toEqual({ id: '42', authenticated: true });
  expect(found.trace.map((entry) => entry.kind)).toEqual(['middleware', 'handler']);

  const missing = await invokeRoute({ app, method: 'POST', path: '/users/42' });
  expect(missing.matched).toBe(false);
  expect(missing.response.status).toBe(404);
  expect(missing.trace).toEqual([]);
});
```

実行します。

```bash
pnpm exec vitest run tests/users.hono.test.ts
```

成功時は、GET request だけが route に届き、`use` が handler の前に実行されたことまで確認できます。失敗時は、まず method と route pattern を確認してください。`/users/:id` は `GET` 専用です。middleware が実行されない場合は、`use` の pattern が request path に一致しているか、middleware 内で `await next()` を呼んでいるかを確認します。

## この adapter が扱う範囲

`/users/:id` と `/files/*` のような parameter と wildcard は扱えます。正規表現 route、完全な Hono TrieRouter、streaming response、SSE、WebSocket は扱いません。response は test のために memory に buffer されます。これらの機能や実際の Workers binding 設定は preview environment で別途 integration test にします。

## 次に読む

[使い方](./how-to) では、同じ一つの test file で hc 形式の RPC と `waitUntil` を扱います。[リファレンス](./reference) には route matching、response、Workers mock の契約をまとめています。

<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の test を実装し、request から response までの境界を直接確認してください。HTTP route の仕様から integration test の下書きを作る場合だけ、初回に Claude Code の plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次に integration の仕様と API test を生成します。

```text
/kiwa:kiwa-design --layer integration --module users
/kiwa:kiwa-api --module users --target src/app.ts --backend msw
```

生成された file は、出力先を変えていなければ次で実行します。

```bash
pnpm exec vitest run test/integration/users.test.ts
```

生成物にも `matched` と status の両方の assertion を残してください。実 Hono や Workers runtime でしか検証できない内容を、この adapter の unit test に期待しないことも重要です。
