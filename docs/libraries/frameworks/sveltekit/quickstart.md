# sveltekit を始める

load が URL parameter を読み、data を返すことを確認します。この adapter は SvelteKit dev server を起動しません。`load` が受け取る server-side input と、header や cookie の副作用を Vitest で固定するためのものです。browser navigation や component の描画は application を起動する E2E test で確認します。

## 準備

```bash
pnpm add -D @kiwa-lab/sveltekit vitest
```

## 最初の load test を書く

`tests/item.sveltekit.test.ts` に保存してください。

```ts
import { expect, test } from 'vitest';
import { invokeLoad } from '@kiwa-lab/sveltekit';

test('load の data と redirect を分けて検証する', async () => {
  const result = await invokeLoad({
    load: async ({ params, setHeaders, cookies }) => {
      setHeaders({ 'cache-control': 'no-store' });
      cookies.set('seen', 'true');
      return { id: params.id };
    },
    url: 'http://localhost/items/42',
    params: { id: '42' },
  });

  expect(result.data).toEqual({ id: '42' });
  expect(result.redirect).toBeNull();
  expect(result.env.responseHeaders.get('cache-control')).toBe('no-store');
  expect(result.env.cookies.get('seen')).toBe('true');
});
```

## 確認する

```bash
pnpm exec vitest run tests/item.sveltekit.test.ts
```

`result.data` は通常 data、`result.redirect` は `null` です。redirect と error signal は throw して helper が捕捉します。`setHeaders` の値と cookie 更新は `result.env` の Map から確認します。status を含む object を返しても HTTP response に変換する adapter ではないため、実 response の serialization は E2E test に残してください。

## テストを隔離する

locals と cookie は hooks と load の双方から変更できます。環境をケースごとに作り、hook を実行した後は reset して状態の持越しを検出します。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。初回だけ plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer sveltekit-load --module dashboard
/kiwa:kiwa-sveltekit --module dashboard
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、対象 file を実行してください。

```bash
pnpm exec vitest run tests/item.sveltekit.test.ts
```
