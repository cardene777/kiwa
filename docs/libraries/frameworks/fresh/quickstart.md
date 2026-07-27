# fresh を始める

このガイドでは Fresh handler の HTTP response と `ctx.render` で渡す page data を検証します。Request と context は helper が作るため、server を起動する必要はありません。

## インストール

```bash
pnpm add -D @kiwa-lab/fresh vitest
```

## route と未対応 method を同時に確認する

`tests/profile.fresh.test.ts` を作成し、次の内容を保存します。

```ts
import { expect, test } from 'vitest';
import { h, invokeFreshHandler } from '@kiwa-lab/fresh';

test('renders a profile and reports an unsupported method', async () => {
  const route = {
    handlers: {
      GET: (_req, ctx) => ctx.render({ name: 'Ada' }),
    },
    page: ({ data, params }) => h('h1', null, `${params.id} ${data?.name}`),
  };

  const result = await invokeFreshHandler({
    ...route,
    req: new Request('http://localhost/profile/42'),
    params: { id: '42' },
  });

  expect(result.response.status).toBe(200);
  expect(result.renderData).toEqual({ name: 'Ada' });
  expect(result.page).not.toBeNull();
  await expect(result.response.text()).resolves.toBe('<h1>42 Ada</h1>');

  const unsupported = await invokeFreshHandler({
    ...route,
    req: new Request('http://localhost/profile/42', { method: 'POST' }),
  });
  expect(unsupported.response.status).toBe(405);
  expect(unsupported.response.headers.get('allow')).toBe('GET');
});
```

`ctx.render(data)` の sentinel response は利用者へそのまま返りません。page を渡した場合は virtual tree が HTML に変換され、page を省略した場合は空の HTML response になります。

## 実行して確認する

```bash
pnpm exec vitest run tests/profile.fresh.test.ts
```

`1 passed` と表示されれば、GET handler が `ctx.render` に渡したデータ、route parameter、page の HTML、最終 Response を一つの test で確認できています。Deno runtime や file-system router は起動していません。実際の middleware、route 解決、browser 上の Island は Fresh application の integration test と E2E test で確認します。

handler object に request method がない場合は 405 と `Allow` header が返ります。単一の handler function を渡す場合はすべての method に同じ function を使います。route が未一致なのか、page の response が不正なのかを、これらの assertion で切り分けられます。

## 次に読む

[使い方](./how-to) で Island hydration と Head の重複解決を扱います。[リファレンス](./reference) には redirect と not found の結果をまとめています。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、入力から結果までの境界を直接確認してください。仕様から test の土台を作る場合は、初回だけ kiwa plugin を導入して対象に合う skill を選びます。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

生成された test は、Fresh route の実行環境を再現するものではありません。route input、期待 Response、対象外の境界をこの Quickstart と照合してから採用します。専用 skill がないため、route または Island の unit test を作る場合は、次の generic layer を使います。

```text
/kiwa:kiwa-design --layer unit --module profile-route
/kiwa:kiwa-vitest --module profile-route
```

生成後は handler の method、parameter、`ctx.render` の data、Island の callback を実装に合わせて書き換え、project の runner を実行します。

```bash
pnpm exec vitest run tests/profile.fresh.test.ts
```

失敗時は、file-system router や browser hydration を unit test で期待していないか、placeholder の Island 名と definition の名前が一致しているかを確認してください。
