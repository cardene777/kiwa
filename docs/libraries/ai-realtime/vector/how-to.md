# @kiwa-lab/vector を使う

RAG の retrieval test では、embedding を生成するモデルではなく、すでに得られた数値ベクトルをどの document と結び付け、どの metric で順位付けするかを確認します。この page の例では近傍検索、metadata filter、次元不一致、削除を同じ file で扱います。実際の embedding model が変わる場合は、dimension と metric を application contract として見直してください。

## retrieval を確認する

`tests/rag.vector.test.ts` を作り、次の内容を保存します。

```ts
import {
  createVectorClient,
  deleteVectors,
  queryNearest,
  upsertVectors,
} from "@kiwa-lab/vector";
import { describe, expect, it } from "vitest";

describe("RAG retrieval", () => {
  it("returns the closest document for a cosine query", async () => {
    const client = createVectorClient({ provider: "pinecone", dimension: 3 });
    await upsertVectors(client, [
      { id: "handbook", values: [1, 0, 0], metadata: { source: "docs" } },
      { id: "pricing", values: [0, 1, 0], metadata: { source: "site" } },
    ]);

    const result = queryNearest(client, [1, 0, 0], { topK: 2, metric: "cosine" });
    expect(result.matches.map((match) => match.id)).toEqual(["handbook", "pricing"]);
  });

  it("uses a metadata predicate to narrow retrieval", async () => {
    const client = createVectorClient({ provider: "pgvector", dimension: 2 });
    await client.upsert([
      { id: "ja-1", values: [1, 0], metadata: { lang: "ja" } },
      { id: "en-1", values: [0.9, 0.1], metadata: { lang: "en" } },
    ]);

    const result = queryNearest(client, [1, 0], {
      topK: 5,
      filter: (metadata) => metadata?.lang === "ja",
    });
    expect(result.matches.map((match) => match.id)).toEqual(["ja-1"]);
  });

  it("rejects an invalid dimension and removes a record", async () => {
    const client = createVectorClient({ provider: "qdrant", dimension: 2 });
    await client.upsert([{ id: "old", values: [1, 0] }]);

    await expect(client.upsert([{ id: "bad", values: [1, 2, 3] }])).rejects.toThrow(
      /dimension mismatch/,
    );
    await expect(deleteVectors(client, ["old", "missing"])).resolves.toMatchObject({
      deletedCount: 1,
    });
    expect(client.size()).toBe(0);
  });
});
```

## 実行する

```bash
pnpm exec vitest run tests/rag.vector.test.ts
```

cosine と dot は score が大きい順、euclidean は距離が小さい順に返ります。同じ query でも metric を変えると順序が変わるため、採用する metric を test の option と assertion に明示します。`topK` の既定値は 10 です。metadata は常に match に含まれ、ベクトル値自体は `includeValues: true` を指定したときだけ含まれます。

filter は provider DSL ではなく JavaScript の predicate function です。tenant、language、document type のように retrieval 前に除外したい条件を metadata から判定します。provider の metadata index、range filter、ACL を検証するものではありません。

`dimension` を指定した client は upsert 時に record の長さを検証します。batch 内の途中で不一致が見つかると、それより前に upsert した record は残ります。全件を transaction として扱いたい場合は、application 側で事前に dimension を検証するか、実 provider の transaction semantics を integration test で確認してください。

## 実サービスへ渡す確認

この client は Pinecone、Weaviate、Qdrant、pgvector の SDK や index server には接続しません。Map に record を保持し、距離計算と result shape を再現します。embedding model、index build、network timeout、provider の namespace isolation、認可、retry、index latency は実 provider を接続する integration test で確認します。

期待する document が先頭に来ない場合は、query と record の dimension、metric、metadata filter、embedding の向きを確認します。`dimension mismatch` は client の dimension と record または query の要素数が違うことを示します。削除後に record が残る場合は、同じ client instance と namespace を query しているかを確認してください。
