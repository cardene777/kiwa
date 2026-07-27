# Search の導入

Meilisearch 互換モックへ文書を登録し、検索結果を確認します。

## 前提

Node.js 20 以降とテストランナーを用意します。

## 実行

```sh
pnpm add -D @kiwa-lab/search vitest
```

```ts
import { expect, test } from 'vitest';
import { createMeilisearchMock } from '@kiwa-lab/search';

test('検索語に一致する文書を順位つきで返す', async () => {
  const search = createMeilisearchMock();
  await search.addDocuments('docs', [{ id: '1', title: 'kiwa release gate' }]);
  const result = await search.search('docs', { q: 'kiwa' });

  expect(result.hits[0]?.document.id).toBe('1');
  expect(result.totalHits).toBe(1);
});
```

## 確認

この例を `tests/search.test.ts` に保存して `pnpm exec vitest run tests/search.test.ts` を実行します。`result` には検索条件に一致した hit とページング情報が入ります。

空の query は filter 後のすべての文書を score 0 で返します。token は小文字化し、空白や `-`、`_`、句読点で分割します。同 score は追加順を保つため、fixture の順序も assertion に影響します。
<!-- skill-guide -->
## skill との使い分け

この library には package 固有の companion skill はありません。まずこの Quickstart の code を test に書き、query、filter、期待する hit を直接確認してください。仕様から test の土台を作る場合は、初回だけ kiwa plugin を導入し、対象が unit、API、UI、E2E のどれかに合う skill を選びます。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

検索仕様から test の土台を作るなら、まず検索語、許可する document、除外する document、期待順位を `kiwa-design` に書き出します。続けて `kiwa-vitest` で Vitest の test file を作り、fixture の追加順、query、filter、期待する hit の順序が test に現れていることを確認します。

```text
/kiwa:kiwa-design --layer unit --module product-search
/kiwa:kiwa-vitest --module product-search
```

既定の出力先を使った場合は、次で生成された file だけを実行します。

```bash
pnpm exec vitest run test/unit/product-search.test.ts
```

この確認は in-memory engine に対する application contract です。実サービスの ranking、filter DSL、indexing latency は証明しないため、provider を接続した integration test を別に用意してください。
