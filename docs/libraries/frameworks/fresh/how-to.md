# fresh の使い方

## Island と Head を一つの page contract として検証する

product page では、SSR tree に Counter Island の placeholder を置き、layout と route がそれぞれ Head fragment を渡すことがあります。次の一つの test file は、placeholder が登録済みの Island に対応して click handler が実行されること、route 側の description が layout 側を上書きすることを同時に確認します。browser の hydration timing や DOM 更新ではなく、page が宣言した構造と callback の契約を確認する test です。

`tests/product-page.fresh.test.ts` を作成します。

```ts
import { expect, test } from 'vitest';
import {
  defineHead,
  defineIsland,
  h,
  hydrateIslands,
  islandPlaceholder,
  mergeHead,
  renderHead,
  simulateInteraction,
} from '@kiwa-lab/fresh';

test('hydrates the island and keeps the route head description', () => {
  let clicks = 0;
  const Counter = defineIsland({
    name: 'Counter',
    component: (props: { start: number }) => h(
      'button',
      { onClick: () => { clicks += 1; } },
      String(props.start),
    ),
  });
  const ssrTree = h('main', null, islandPlaceholder(Counter, { start: 7 }));
  const result = hydrateIslands({ ssrTree, islands: [Counter] });

  expect(result.hydrated).toHaveLength(1);
  expect(result.html).toContain('<button onClick=');
  expect(result.html).toContain('>7</button>');
  expect(simulateInteraction({ mount: result.hydrated[0]!.mount, event: 'click' }).invoked).toBe(1);
  expect(clicks).toBe(1);

  const head = mergeHead([
    defineHead({ title: 'Store', meta: [{ name: 'description', content: 'layout description' }] }),
    defineHead({ meta: [{ name: 'description', content: 'product description' }], link: [{ rel: 'icon', href: '/icon.svg' }] }),
  ]);
  const html = renderHead(head);
  expect(html).toContain('content="product description"');
  expect(html).toContain('rel="icon"');
});
```

`missing` は登録済み Island が SSR tree に現れなかった名前、`unregistered` は placeholder に対応する definition がない名前です。どちらも空であることを `hydrated` と合わせて確認します。synthetic event は tree 内の同名 handler を呼ぶだけで、bubbling、DOM 更新、state re-render は行いません。

Head では後に渡した fragment が title、base、同じ meta key、同じ `rel + href` の link、同じ src の script を置き換えます。inline script は src を持たないためすべて残ります。meta の charset は一つだけで最後の値を使います。

## route の停止を検証する

handler または defineRoute body は `throw redirect('/login')`、`throw notFound()` を使えます。helper は signal を response と result field に変換します。その他の例外は `error` と 500 response になるため、例外内容は `result.error` で assertion します。

## 実行して失敗を切り分ける

作成した file を実行します。

```bash
pnpm exec vitest run tests/product-page.fresh.test.ts
```

成功すれば、placeholder は定義済みの `Counter` に対応し、click handler は一度だけ呼ばれ、後に渡した description が Head に残ります。`hydrated` が空の場合は Island の名前または登録が一致していません。`unregistered` に名前がある場合は page 側の placeholder に対する definition がありません。Head の assertion が失敗する場合は、同じ meta key を複数の fragment で定義している順序を確認してください。

この test が保証するのは virtual tree 上の対応と統合規則です。Fresh の file-system routing、`_app.tsx`、`_layout.tsx`、実 browser での hydration、DOM event の propagation はここでは動きません。それらは Deno runtime を起動する integration test と browser E2E test に残します。
