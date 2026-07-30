---
name: kiwa-vector
description: @kiwa-lab/vector を使い、embedding の保存、近傍検索、metadata filter、次元不一致を検証する Vitest を作成する。
user_invocable: true
context: conversation
agent: general-purpose
allowed-tools: Bash, Read, Glob, Grep, Write, Edit
---

# kiwa vector

`@kiwa-lab/vector` の in-memory client を使い、アプリケーションが embedding を保存して retrieval 結果を利用する境界を test します。Pinecone、Weaviate、Qdrant、pgvector の network client や index build を実行する skill ではありません。

## 入力

`$ARGUMENTS` で対象 module を受け取ります。対象の embedding dimension、採用する metric、期待する document の順位、metadata による除外条件を確認してから test を書きます。実 provider の namespace、ACL、filter DSL が要件に含まれる場合は、その部分を integration test として分離します。

## 作成する test

`createVectorClient({ provider, dimension })` で client を作り、`await upsertVectors(client, records)` または `await client.upsert(records)` で fixture を追加します。`queryNearest(client, query, { topK, metric, filter })` の `matches` に、期待する ID と順位が入ることを assertion にします。filter は object ではなく metadata を受け取る predicate function です。

dimension を指定した case では、不一致の record が `dimension mismatch` で reject されることも確認します。不要な record は `await deleteVectors(client, ids)` で削除し、次の query または `client.size()` で消えたことを確認します。cosine と dot は高い score を先に、euclidean は小さい距離を先に返すため、metric を変えたときは assertion も変えます。

## 実行する

既定では `tests/{module}.vector.test.ts` に出力します。たとえば module が `rag-search` なら、次を実行します。

```bash
pnpm exec vitest run tests/rag-search.vector.test.ts
```

失敗時は query と record の dimension、metric、metadata filter、fixture の追加順を確認します。batch の途中で upsert が失敗しても前の record は残るため、all-or-nothing を必要とする application は事前検証または実 provider の integration test を追加します。

## 実サービスの境界

この skill が固定するのは application の retrieval contract です。embedding model の品質、provider の index latency、network timeout、認可、retry、実 namespace isolation は別の integration test で確認します。
