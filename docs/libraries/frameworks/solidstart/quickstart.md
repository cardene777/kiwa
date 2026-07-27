# solidstart を始める

この手順では SolidStart API route を直接呼び、Request body、params、locals、Response を確認します。helper は HTTP server や route matching を起動しません。

## 追加する

```sh
pnpm add -D @kiwa-lab/solidstart
```

## JSON response を検証する

`tests/users.solidstart.test.ts` を作成し、次の内容を保存します。

```ts
import { expect, test } from 'vitest';
import { invokeApiRoute, json } from '@kiwa-lab/solidstart';

test('reads JSON and locals', async () => {
  const result = await invokeApiRoute({
    handler: async ({ request, params, locals }) => {
      const body = await request.json();
      return json({ id: params.id, name: body.name, role: locals.role }, { status: 201 });
    },
    url: 'http://localhost/api/users/42',
    params: { id: '42' },
    jsonBody: { name: 'Ada' },
    locals: { role: 'admin' },
  });

  expect(result.response.status).toBe(201);
  await expect(result.response.json()).resolves.toEqual({ id: '42', name: 'Ada', role: 'admin' });
  expect(result.redirect).toBeNull();
});

test('uses POST when form data is supplied', async () => {
  const result = await invokeApiRoute({
    handler: ({ request }) => new Response(request.method),
    url: 'http://localhost/api/users',
    formData: { name: 'Ada' },
  });

  await expect(result.response.text()).resolves.toBe('POST');
});
```

`json` は content type が未指定なら JSON を設定し、body を `JSON.stringify` します。Response init に独自の content type を渡した場合は、その値を維持します。

## 実行して確認する

保存した test だけを実行します。

```bash
pnpm exec vitest run tests/users.solidstart.test.ts
```

`1 passed` と表示されれば、route handler が受け取った JSON body、URL parameter、`locals` と、返した `201` の JSON response を一つの unit test で確認できています。Vinxi server を起動したこと、実際の route matching や middleware が動いたことは示しません。それらは SolidStart application 側の integration test で確認します。

## request の既定を確認する

body がなければ既定 method は GET です。`jsonBody` または `formData` を渡すと POST になり、両方を渡すと formData が優先されます。

API route の通常例外は捕捉されず、`invokeApiRoute` 自体が reject します。3xx Response は `result.redirect` に location と status を記録します。次は [solidstart の使い方](./how-to) で server function と redirect を扱います。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。初回だけ kiwa plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer solidstart-server-function --module update-profile
/kiwa:kiwa-solidstart --module update-profile
```

生成された test を開き、server function なら `args`、headers、cookies、redirect または error の assertion があることを確認します。API route なら method、params、body、locals、response を確認します。たとえば `tests/integration/update-profile.solidstart.test.ts` に出力した場合は、次のようにその file を実行します。

```bash
pnpm exec vitest run tests/integration/update-profile.solidstart.test.ts
```

これは handler を直接呼ぶ test であり、Vinxi server、route matching、middleware を起動しません。これらは SolidStart application 側の integration test で確認してください。layer の選択肢と入力形式は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-solidstart/SKILL.md) を参照してください。
