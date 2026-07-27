# route と reactive state を検証する

account page を例に、未認証なら loader が redirect し、認証済みなら profile resource を更新しながら表示名の変更を一回だけ反映する流れを確認します。`@kiwa-lab/solidjs` は Solid runtime を置き換えるものではありません。route の入力、reactive state の遷移、非同期結果を小さく固定するための helper です。

次の test では redirect と通常の page を別の case にします。redirect は page を描画しない制御 signal であり、system error や not found と同じ assertion に混ぜてはいけません。認証済み case では `batch` が二つの更新を一回の effect 実行にまとめ、resource が最新値へ refresh されることを確認します。

`tests/account.solidjs.test.ts` を作成します。

```ts
import { expect, test } from 'vitest';
import {
  batch,
  createResourceStub,
  h,
  invokeSolidRoute,
  mockEffect,
  mockSignal,
  redirect,
} from '@kiwa-lab/solidjs';

test('redirects an unauthenticated account route', async () => {
  const result = await invokeSolidRoute({
    page: () => h('p', null, 'This page must not render'),
    load: async () => {
      throw redirect('/login', 302);
    },
  });

  expect(result.error).toBeUndefined();
  expect(result.tree).toBeNull();
  expect(result.redirect).toEqual({ url: '/login', status: 302 });
});

test('updates an authenticated profile once and refreshes its resource', async () => {
  const [firstName, setFirstName] = mockSignal('Ada');
  const [lastName, setLastName] = mockSignal('Lovelace');
  let renders = 0;
  const effect = mockEffect(() => {
    void firstName();
    void lastName();
    renders += 1;
  });
  const baseline = renders;

  batch(() => {
    setFirstName('Grace');
    setLastName('Hopper');
  });
  expect(renders).toBe(baseline + 1);

  let requests = 0;
  const { accessor, actions, initialFetch } = createResourceStub(async () => {
    requests += 1;
    return { displayName: `user-${requests}` };
  });
  expect(accessor.state).toBe('pending');
  await initialFetch;
  expect(accessor()).toEqual({ displayName: 'user-1' });

  const refreshing = actions.refetch();
  expect(accessor.state).toBe('refreshing');
  await refreshing;
  expect(accessor.state).toBe('ready');
  expect(accessor()).toEqual({ displayName: 'user-2' });

  effect.dispose();
});
```

実行します。

```bash
pnpm exec vitest run tests/account.solidjs.test.ts
```

redirect case が失敗する場合は、`throw redirect` を `return redirect` にしていないか確認してください。`notFound()` を throw した場合は `result.notFound`、通常の例外は `result.error` です。認証済み case で effect が複数回実行される場合は、関連する setter がすべて同じ `batch` の中にあるかを確認します。同じ値を setter に渡す場合は `Object.is` が true となり、effect は再実行されません。

resource の fetch error は throw されず `accessor.error` に保存されます。error UI では成功値の assertion とは分けて `accessor.state === 'errored'` と `accessor.error` を確認します。実 router の nested route matching、browser hydration、HTTP header、実 Suspense の scheduling はこの adapter の外です。SolidStart と browser を含む integration test で検証してください。
