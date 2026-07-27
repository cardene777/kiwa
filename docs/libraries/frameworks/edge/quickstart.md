# edge を始める

この手順では、Edge fetch handler を実 runtime なしで直接呼び出し、Response と `ExecutionContext` の副作用を確認します。handler に渡す env は明示するため、test 間で global binding を共有しません。

## 追加する

```sh
pnpm add -D @kiwa-lab/edge
```

## response と background work を一緒に確認する

```ts
import { expect, test } from 'vitest';
import { invokeEdgeHandler } from '@kiwa-lab/edge';

test('records background work and receives a JSON request', async () => {
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

  expect(result.response.status).toBe(200);
  await expect(result.response.json()).resolves.toEqual({ body: { id: 'o-1' } });
  expect(result.ctx.waitedPromises).toHaveLength(1);
  await expect(result.ctx.waitedPromises[0]).resolves.toBe('logged');
  expect(result.ctx.passThroughCalled).toBe(true);
});
```

`waitUntil` は promise を記録するだけで、`invokeEdgeHandler` はその解決を待ちません。background work の成功や失敗は、取得した `waitedPromises` を個別に await して検証してください。

body がなければ既定 method は GET です。`formData` または `jsonBody` を渡すと POST になります。両方を渡した場合は formData が優先されます。handler が throw すると helper 自体は reject せず、status 500 の Response と `result.error` を返します。実 workerd、Cloudflare、Vercel の runtime 固有の挙動はこの helper では検証しません。

最初の例を `tests/edge-handler.test.ts` に保存して実行します。

```bash
pnpm exec vitest run tests/edge-handler.test.ts
```

成功時は Vitest が `1 passed` と表示し、response は JSON body を反映し、記録された background promise は `logged` に解決します。`waitUntil` の失敗を検証したい場合は promise を reject させ、`waitedPromises` を `await expect(...).rejects` で確認します。helper の戻り値だけを確認しても background task の結果は検証できません。

次は [edge の使い方](./how-to) で KV binding と error の扱いを確認します。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer edge-handler --module geo-route
/kiwa:kiwa-edge --module geo-route
```

生成した test を開き、URL、method、env binding、response、`waitUntil` の assertion が仕様どおりか確認してから、生成された test file だけを実行します。

```bash
pnpm exec vitest run tests/spec/edge-handler/geo-route.test.ts
```

`kiwa-edge` が `createKvNamespace` で準備するのは KV だけです。R2、D1、Durable Object、Queue、service binding は test 側で `vi.fn()` などの mock を渡します。実 workerd や provider 固有の制限はこの test で証明できないため、deployment target ごとの integration test を別に用意してください。layer の選択肢と入力形式は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-edge/SKILL.md) を参照してください。
