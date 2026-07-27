# @kiwa-lab/search を使う

検索画面では、結果があることだけでなく、許可された文書だけが返り、更新済みの値が表示され、削除済みの文書が残らないことを確認します。この page では product index を一つ作り、検索、filter、更新、削除を同じ test file で扱います。利用している provider に応じて `provider` を選び、実際の document field と UI が必要とする条件へ置き換えてください。

## product index を操作する

`tests/products.search.test.ts` を作り、次の内容を保存します。

```ts
import { SearchEngine, createMeilisearchMock } from "@kiwa-lab/search";
import { describe, expect, it } from "vitest";

describe("product search", () => {
  it("returns a document matching a query", async () => {
    const search = createMeilisearchMock();
    await search.addDocuments("docs", [{ id: "1", title: "kiwa release gate" }]);

    const result = await search.search("docs", { q: "kiwa" });
    expect(result.hits[0]?.document.id).toBe("1");
    expect(result.totalHits).toBe(1);
  });

  it("filters products before returning results", async () => {
    const search = new SearchEngine({ provider: "meilisearch" });
    await search.addDocuments("products", [
      { id: "1", title: "Keyboard", category: "input" },
      { id: "2", title: "Monitor", category: "display" },
    ]);

    const result = await search.search("products", {
      q: "keyboard",
      filter: { category: "input" },
    });
    expect(result.hits.map((hit) => hit.document.id)).toEqual(["1"]);
  });

  it("keeps existing document fields when a document is updated", async () => {
    const search = new SearchEngine({ provider: "algolia" });
    await search.addDocuments("products", [{ id: "p-1", title: "Keyboard", stock: 0 }]);
    await search.updateDocuments("products", [
      { id: "p-1", title: "Wireless Keyboard", stock: 12 },
    ]);

    const result = await search.search("products", { q: "wireless" });
    expect(result.hits[0]?.document).toMatchObject({
      id: "p-1",
      title: "Wireless Keyboard",
      stock: 12,
    });
  });

  it("removes a deleted document from the next search", async () => {
    const search = new SearchEngine({ provider: "typesense" });
    await search.addDocuments("products", [{ id: "p-2", title: "Discontinued Camera" }]);

    await expect(search.deleteDocuments("products", ["p-2"])).resolves.toMatchObject({
      deleted: 1,
    });
    await expect(search.search("products", { q: "camera" })).resolves.toMatchObject({
      hits: [],
    });
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/products.search.test.ts
```

空の query は、filter 後に残った全 document を score 0 で返します。token は小文字化され、空白、ハイフン、アンダースコア、句読点で分割されます。同じ score の document は追加順を保つため、fixture の追加順も画面の表示順に関わります。

filter は field の strict equality だけを扱います。`updateDocuments` は既存 ID の document を shallow merge し、存在しない ID は追加します。`deleteDocuments` の戻り値だけでなく、その後の query から消えたことまで assertion すると、画面だけで非表示にした実装を見逃しません。

## 実サービスへ渡す確認

Meilisearch、Algolia、Typesense は共有の word-overlap engine を使います。実 provider の ranking、synonym、複雑な filter DSL、facet 設定、indexing latency、typo tolerance の細かな挙動を完全には再現しません。mock では UI が受け取る result shape と application の条件分岐を固定し、実 provider を接続する integration test では採用している ranking と filter を確認します。

期待と異なる document が返る場合は、まず index 名、query token、filter field と fixture の値を確認します。更新後に古い値が見える場合は、別の `SearchEngine` instance を参照していないか、test 間で index state を共有していないかを確認します。一つの instance を共有する必要がある場合は `clearIndex` を test の終了時に呼びます。
