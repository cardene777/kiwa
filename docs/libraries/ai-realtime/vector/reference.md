# Vector リファレンス

`@kiwa-lab/vector` はプロバイダー共通のベクトル操作を提供します。実装上、`queryNearest` は非同期ではなく同期関数です。

## 公開 API

`createVectorClient` は provider、namespace、dimension を持つ in-memory client を作ります。`upsertVectors` と `deleteVectors` は record を追加または削除し、`queryNearest` は指定した metric で近傍を返します。`cosineSimilarity`、`euclideanDistance`、`dotProduct` は ranking の計算を単独で検証するときに使う distance primitive です。

## 設定

client 作成時に `provider`、`namespace`、`dimension` を指定します。`queryNearest(client, query, options)` には query vector、`topK`、`metric` を渡します。`dimension` は `upsert` する record の長さを検証します。

`dimension` を省略すると upsert 時の長さは検証しませんが、query 時の metric 関数は query と record の長さが違えば throw します。`failOn` を指定した client は一致する record で provider rejection を throw します。

`upsertWithRetry`、idempotency、hook、batch、circuit breaker の helper は upsert の上位経路です。基礎 client は retry、transaction、real provider request を行いません。

## 後始末

テストデータは `deleteVectors` で削除できます。完全に分離するなら client を作り直します。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>provider rejected id=$&#123;rec.id&#125;</code> | [packages/vector/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L57) |
| <code v-pre>dimension mismatch: expected $&#123;dimension&#125;, got $&#123;rec.values.length&#125;</code> | [packages/vector/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/client.ts#L60) |
| <code v-pre>dimension mismatch: $&#123;a.length&#125; vs $&#123;b.length&#125;</code> | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L16) |
| <code v-pre>dimension mismatch: $&#123;a.length&#125; vs $&#123;b.length&#125;</code> | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L26) |
| <code v-pre>dimension mismatch: $&#123;a.length&#125; vs $&#123;b.length&#125;</code> | [packages/vector/src/distance.ts](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/distance.ts#L7) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/vector/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 6 |
| [distance.ts](./api/distance) | 3 | 0 |
| [enhancements.ts](./api/enhancements) | 7 | 10 |
| [query.ts](./api/query) | 2 | 5 |
| [upsert.ts](./api/upsert) | 1 | 1 |

<!-- kiwa-public-api:end -->
