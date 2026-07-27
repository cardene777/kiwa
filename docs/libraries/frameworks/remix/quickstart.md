# @kiwa-lab/remix を始める

`@kiwa-lab/remix` は loader と action の戻り値を、通常 data、`Response`、redirect、error に分けて確認する test adapter です。この Quickstart では loader の通常 data を確認します。Remix server、route manifest、browser transition は起動しません。

## 準備

```bash
pnpm add -D @kiwa-lab/remix vitest
```

## 実行

```ts
import { expect, test } from 'vitest';
import { invokeLoader } from '@kiwa-lab/remix';

test('loader の data を Response と区別する', async () => {
  const result = await invokeLoader({
    loader: async () => ({ ok: true }),
    url: 'http://localhost/items',
  });

  expect(result.result).toEqual({ ok: true });
  expect(result.response).toBeNull();
  expect(result.redirect).toBeNull();
});
```

## 確認

この例を `tests/items.remix.test.ts` に保存して次を実行します。

```bash
pnpm exec vitest run tests/items.remix.test.ts
```

成功時は一件の test が pass します。`result.result` は `{ ok: true }`、`result.response` と `result.redirect` は `null` です。失敗した場合は、loader が値または `null` を return しているかを先に確認してください。

loader が `Response` を返した場合は `response` に入り、3xx Response はさらに `redirect` に location と status が入ります。`null` は正しい data ですが、`undefined` は実装漏れとして `error` になります。

## テストを隔離する

loader と action は request ごとに独立した入力で呼びます。`Response`、redirect、error は異なる結果フィールドであるため、一つの assertion にまとめません。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。Quickstart の最小 test で API と期待結果を理解してから、初回だけ Claude Code で plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer remix-loader --module products
/kiwa:kiwa-remix --module products
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合してから、プロジェクトの runner を実行します。

```bash
pnpm exec vitest run tests/integration/products.remix.test.ts
```

失敗時は、loader の `undefined` return、action と loader の HTTP method、redirect と通常 error の assertion を取り違えていないかを確認してください。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-remix/SKILL.md) を参照してください。
