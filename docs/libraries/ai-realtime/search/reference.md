# Search リファレンス

`@kiwa-lab/search` は検索アダプターをインメモリで提供します。

## 公開 API

`createMeilisearchMock`、`createAlgoliaMock`、`createTypesenseMock` は provider 名を設定した adapter を返します。provider の違いを意識せず index を操作したい場合は `SearchEngine` を作ります。いずれも `SearchAdapter` の `addDocuments`、`updateDocuments`、`deleteDocuments`、`search`、`clearIndex` を実装します。

## 設定

各 factory が返すアダプターに対して `addDocuments`、`updateDocuments`、`deleteDocuments`、`search`、`clearIndex` を呼びます。

`addDocuments` の inserted は新規 ID だけを数え、同じ ID は置換します。search の既定 limit は20、offset は0です。`processingTimeMs` は in-memory 処理時間で、backend latency の測定ではありません。

real driver helper は endpoint と API key の設定を作るだけで検索要求を送信しません。backend ごとの URL は `KIWA_MEILI_URL`、`KIWA_TYPESENSE_URL`、`KIWA_ALGOLIA_URL`、`KIWA_OPENSEARCH_URL` で上書きでき、key は対応する環境変数から読みます。

## 後始末

テスト間で文書を分離するには、factory をテストごとに作り直すか `clearIndex` を呼びます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>startFacetedSession: indexId must not be empty</code> | [packages/search/src/semantics/faceted-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/faceted-advanced.ts#L34) |
| <code v-pre>computeNestedFacets: no documents seeded</code> | [packages/search/src/semantics/faceted-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/faceted-advanced.ts#L59) |
| <code v-pre>filterPolygon: polygon must have at least 3 vertices</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L114) |
| <code v-pre>resolveIsochrone: travelTimeMinutes must be positive</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L135) |
| <code v-pre>startGeoSession: indexId must not be empty</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L41) |
| <code v-pre>seedGeoDocuments: invalid lat/lng for $&#123;d.id&#125;</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L55) |
| <code v-pre>filterBoundingBox: sw must be south-west of ne</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L66) |
| <code v-pre>filterRadius: invalid center lat/lng</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L89) |
| <code v-pre>filterRadius: radiusMeters must be positive</code> | [packages/search/src/semantics/geo.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/geo.ts#L92) |
| <code v-pre>promoteReplica: primary shard $&#123;input.shardId&#125; on $&#123;input.failedNode&#125; not found</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L102) |
| <code v-pre>promoteReplica: no replica available for shard $&#123;input.shardId&#125;</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L108) |
| <code v-pre>advanceRollingReindex: batchPercent must be within (0, 100&#93;</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L127) |
| <code v-pre>advanceRollingReindex: reindex already swapped</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L130) |
| <code v-pre>swapZeroDowntime: session is $&#123;session.state&#125;, expected reindex-completed</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L147) |
| <code v-pre>swapZeroDowntime: newIndexId must not be empty</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L150) |
| <code v-pre>startIndexMgmtSession: indexId must not be empty</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L38) |
| <code v-pre>startIndexMgmtSession: shardCount must be positive</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L41) |
| <code v-pre>startIndexMgmtSession: replicaCount must be non-negative</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L44) |
| <code v-pre>startIndexMgmtSession: nodes must not be empty</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L47) |
| <code v-pre>allocateShards: session is $&#123;session.state&#125;, not idle</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L65) |
| <code v-pre>allocateShards: need at least $&#123;requiredNodes&#125; nodes for $&#123;session.replicaCount&#125; replicas</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L71) |
| <code v-pre>promoteReplica: session is $&#123;session.state&#125;, expected shard-allocated</code> | [packages/search/src/semantics/index-management.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/index-management.ts#L96) |
| <code v-pre>bucketHistogram: interval must be positive</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L108) |
| <code v-pre>computePercentile: percentile must be within &#91;0, 100&#93;</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L134) |
| <code v-pre>computePercentile: no numeric values found for field $&#123;input.field&#125;</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L142) |
| <code v-pre>startQueryDslSession: indexId must not be empty</code> | [packages/search/src/semantics/query-dsl.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/query-dsl.ts#L48) |
| <code v-pre>scoreTfIdf: query must contain at least one token</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L115) |
| <code v-pre>scoreTfIdf: no documents seeded</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L119) |
| <code v-pre>selectAbVariant: variants must not be empty</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L174) |
| <code v-pre>selectAbVariant: userId must not be empty</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L177) |
| <code v-pre>startRelevanceSession: indexId must not be empty</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L38) |
| <code v-pre>startRelevanceSession: bm25K1 must be positive</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L41) |
| <code v-pre>startRelevanceSession: bm25B must be within 0..1</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L44) |
| <code v-pre>scoreBm25: query must contain at least one token</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L70) |
| <code v-pre>scoreBm25: no documents seeded</code> | [packages/search/src/semantics/relevance.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/relevance.ts#L74) |
| <code v-pre>cacheEmbedding: key must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L122) |
| <code v-pre>cacheEmbedding: embedding must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L125) |
| <code v-pre>startSemanticSession: sessionId must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L42) |
| <code v-pre>understandQuery: rawQuery must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L62) |
| <code v-pre>understandQuery: unexpected state $&#123;session.state&#125;</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L65) |
| <code v-pre>classifyIntent: session is $&#123;session.state&#125;, not query-understood</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L78) |
| <code v-pre>crossEncoderRerank: session is $&#123;session.state&#125;, need intent-classified or query-understood</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L93) |
| <code v-pre>crossEncoderRerank: candidates must not be empty</code> | [packages/search/src/semantics/semantic.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/semantic.ts#L96) |
| <code v-pre>startSynonymSession: indexId must not be empty</code> | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L33) |
| <code v-pre>expandMultiLanguage: query must not be empty</code> | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L56) |
| <code v-pre>expandMultiLanguage: languages must not be empty</code> | [packages/search/src/semantics/synonym-advanced.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/synonym-advanced.ts#L59) |
| <code v-pre>fuseHybrid: session is $&#123;session.state&#125;, not knn-queried</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L112) |
| <code v-pre>fuseHybrid: weights must be non-negative</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L115) |
| <code v-pre>recallAnn: session is $&#123;session.state&#125;, expected knn-queried or hybrid-fused</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L141) |
| <code v-pre>recallAnn: groundTruth must not be empty</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L144) |
| <code v-pre>startVectorSession: indexId must not be empty</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L34) |
| <code v-pre>startVectorSession: dimensions must be positive</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L37) |
| <code v-pre>buildVectorIndex: session is $&#123;session.state&#125;, cannot rebuild</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L55) |
| <code v-pre>buildVectorIndex: vector dim $&#123;entry.vector.length&#125; != index dim $&#123;session.dimensions&#125;</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L59) |
| <code v-pre>queryKnn: index must be built first</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L79) |
| <code v-pre>queryKnn: query dim $&#123;query.length&#125; != index dim $&#123;session.dimensions&#125;</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L82) |
| <code v-pre>queryKnn: k must be positive</code> | [packages/search/src/semantics/vector.ts](https://github.com/cardene777/kiwa/blob/main/packages/search/src/semantics/vector.ts#L85) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/search/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [algolia.ts](./api/algolia) | 1 | 0 |
| [engine.ts](./api/engine) | 1 | 1 |
| [index.ts](./api/index) | 1 | 0 |
| [meilisearch.ts](./api/meilisearch) | 1 | 0 |
| [real-driver.ts](./api/real-driver) | 7 | 2 |
| [types.ts](./api/types) | 0 | 6 |
| [typesense.ts](./api/typesense) | 1 | 0 |

<!-- kiwa-public-api:end -->
