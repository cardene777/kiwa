# nuxt を始める

Server Route が query を読み、header を設定することを確認します。

## 準備

```bash
pnpm add -D @kiwa-lab/nuxt vitest
```

## 実行

```ts
import { expect, test } from 'vitest';
import { invokeEventHandler } from '@kiwa-lab/nuxt';

test('query を読み response header を残す', async () => {
  const result = await invokeEventHandler({
    handler: (event) => {
      event.setHeader('Cache-Control', 'no-store');
      return { query: event.query.q };
    },
    url: 'http://localhost/api/search?q=kiwa',
  });

  expect(result.result).toEqual({ query: 'kiwa' });
  expect(result.env.responseHeaders.get('cache-control')).toBe('no-store');
});
```

## 確認

この例を `tests/search.nuxt.test.ts` に保存して `pnpm exec vitest run tests/search.nuxt.test.ts` を実行します。`result.result` は handler の通常値、`env` は H3 response への副作用です。両方を assertion して初めて、戻り値だけで header を取りこぼす事故を防げます。

同じ query key が URL に複数あれば値は配列です。options の `query` を渡すとその key は URL の値を置き換えます。request headers は小文字化された Map、response cookies と status は `env` から確認します。

## テストを隔離する

H3 event の cookie と response header は env に残ります。server route ごとに新しい event を作り、redirect と通常結果を別々に検証します。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-design --layer nuxt-server-route --module orders
/kiwa:kiwa-nuxt --module orders
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-nuxt/SKILL.md) を参照してください。
