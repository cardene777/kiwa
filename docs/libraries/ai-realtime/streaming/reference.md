# Streaming リファレンス

`@kiwa-lab/streaming` はすべてインメモリのテストアダプタです。生成したモックを同じテスト内の producer、consumer、admin、registry で共有してください。

## Kafka モック

`createKafkaMock(config)` は KafkaJS 風の `producer()`、`consumer(config)`、`admin()` を返します。`defaultPartitionCount` の既定値は 1 です。明示的な partition が範囲外なら producer は throw します。

producer と admin は `connect` 前の操作を reject します。consumer は `connect` 前に `subscribe` または `run` を呼ぶと reject します。

| API | 動作 |
| --- | --- |
| `producer.send` | topic を自動作成し、各メッセージの topic、partition、offset、timestamp を返す |
| `producer.sendBatch` | record ごとに順番に `send` し、結果を平坦化して返す |
| `consumer.subscribe` | group の購読集合を更新し、range または round-robin で partition を再配分する |
| `consumer.run` | 現在割当済みの partition を開始 offset から最後まで処理する |
| `consumer.seek` | 次の `run` にだけ開始 offset を上書きする |
| `consumer.commitOffsets` | 指定した offset をそのまま保存する |
| `admin.fetchTopicMetadata` | 未知の topic では reject する |
| `reset` | topic と group を全削除する |

`getTopicMessages` は partition番号順にメッセージを連結します。送信した時刻の全体順ではありません。

## Exactly once の補助

`createIdempotentProducer` は producer インスタンス内で sequence number を Set に保存します。同じ number の再送は空配列を返します。partition ごとの broker-assigned producer ID や、送信失敗後の再試行状態はモデル化しません。

`createTransactionalProducer` は `initTransactions`、`beginTransaction`、`send`、`commitTransaction` または `abortTransaction` の順で使います。`send` の返り値は仮の負の offset で、実際の送信は commit 時です。abort した record は Kafka モックに保存されません。commit 後の state は `committed`、abort 後は `aborted` のままです。

`createReadCommittedFilter` は API 形状のための identity filter です。このモックでは abort した record が保存されないため、入力をそのまま返します。

## NATS と JetStream

`createNatsMock` は core pub/sub、request reply、JetStream、KV、Object Store を1つの状態に保持します。`drain` はすべての subscription を非アクティブにし、`reset` は subscription、message、stream、KV、object を消去します。

JetStream は登録済み stream に一致する subject へだけ publish できます。`maxMsgs` を超えると最古のメッセージを削除します。durable consumer は `fetch` で現時点のメッセージを取得します。ack policy と retention policy の値は設定として受け取りますが、配信制御を変えません。

KV の `watch` は変更を待ち続ける watcher ではなく、呼び出し時に存在する entries を順に yield します。Object Store の digest は衝突耐性を目的としない簡易ハッシュで、実際の SHA-256 ではありません。

## スキーマレジストリ

`createSchemaRegistry` は subject ごとに連番 version、全体で連番 id を発行します。初期互換性 mode は `BACKWARD` です。新規 subject、同じ schema string と kind の再登録、`NONE` mode は互換です。

`subjectNamingStrategy` の既定は `topic-name` です。`orders` の value subject は `orders-value` です。`record-name` は `ordersValue`、`topic-record-name` は `orders-Value` を返します。

必須フィールドの追加または削除、schema kind の変更は `NONE` 以外で非互換になります。検査は文字列から Avro、Protobuf、JSON Schema らしい必須フィールドを抽出するだけで、正式な schema validator ではありません。

## DLQ

`createDeadLetterQueue` は handler を最大 `maxAttempts` 回実行します。成功すると `handled`、最後まで失敗すると `quarantined` を返し、`<topic>.DLQ` に相当する `deadLetterTopic` と内部配列へ entry を記録します。broker への publish は行いません。

`retryPolicy.backoff` は `constant`、`linear`、`exponential` です。base delay が未指定なら 0 ms、max delay が指定されればそれを超えません。`onDeadLetter` は隔離ごとに同期で呼ばれます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>DLQ: maxAttempts must be &gt;= 1</code> | [packages/streaming/src/dlq.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L54) |
| <code v-pre>transactional producer: already initialized</code> | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L124) |
| <code v-pre>transactional producer: initTransactions() not called</code> | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L129) |
| <code v-pre>transactional producer: transaction already active</code> | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L131) |
| <code v-pre>transactional producer: no active transaction</code> | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L141) |
| <code v-pre>transactional producer: no active transaction to commit</code> | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L154) |
| <code v-pre>transactional producer: no active transaction to abort</code> | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L166) |
| <code v-pre>kafka mock: partition $&#123;explicit&#125; out of range 0..$&#123;topic.numPartitions - 1&#125; for topic "$&#123;topic.topic&#125;"</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L174) |
| <code v-pre>kafka mock: partition $&#123;partition&#125; missing on "$&#123;topic.topic&#125;"</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L203) |
| <code v-pre>kafka mock: producer.send before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L273) |
| <code v-pre>kafka mock: consumer.subscribe before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L358) |
| <code v-pre>kafka mock: consumer.run before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L373) |
| <code v-pre>kafka mock: admin.createTopics before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L436) |
| <code v-pre>kafka mock: admin.listTopics before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L442) |
| <code v-pre>kafka mock: admin.deleteTopics before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L446) |
| <code v-pre>kafka mock: admin.fetchTopicMetadata before connect</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L450) |
| <code v-pre>kafka mock: unknown topic "$&#123;name&#125;"</code> | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L454) |
| <code v-pre>nats mock: '&gt;' wildcard must be the last token in "$&#123;pattern&#125;"</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L162) |
| <code v-pre>jetstream: stream must declare at least one subject</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L212) |
| <code v-pre>jetstream: no stream matches subject "$&#123;subject&#125;"</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L223) |
| <code v-pre>jetstream: stream "$&#123;streamName&#125;" not found</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L243) |
| <code v-pre>nats mock: request to "$&#123;subject&#125;" received no reply</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L364) |
| <code v-pre>nats mock: kv bucket "$&#123;bucket&#125;" not found</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L377) |
| <code v-pre>nats mock: object bucket "$&#123;bucket&#125;" not found</code> | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L415) |
| <code v-pre>schema-registry: incompatible schema for subject "$&#123;input.subject&#125;" (mode=$&#123;check.mode&#125;): $&#123;check.reasons.join('; ')&#125;</code> | [packages/streaming/src/schema-registry.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L97) |
| <code v-pre>exactly-once ($&#123;cfg.provider&#125;): abort without active transaction</code> | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L113) |
| <code v-pre>exactly-once ($&#123;cfg.provider&#125;): begin without commit/abort of previous txn</code> | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L74) |
| <code v-pre>exactly-once ($&#123;cfg.provider&#125;): send without active transaction</code> | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L85) |
| <code v-pre>exactly-once ($&#123;cfg.provider&#125;): commit without active transaction</code> | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L91) |
| <code v-pre>kafka consumer-group: unknown member $&#123;memberId&#125;</code> | [packages/streaming/src/semantics/kafka-consumer-group.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L220) |
| <code v-pre>kafka raw-protocol: unknown producer id $&#123;producerId&#125;</code> | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L144) |
| <code v-pre>kafka raw-protocol: txn state mismatch — current=$&#123;txnState&#125;, requested from=$&#123;from&#125;</code> | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L156) |
| <code v-pre>kafka raw-protocol: invalid txn transition $&#123;from&#125; -&gt; $&#123;to&#125;</code> | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L162) |
| <code v-pre>kafka raw-protocol: fetch session $&#123;sessionId&#125; not open</code> | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L178) |
| <code v-pre>kafka raw-protocol: ISR size cannot exceed replicationFactor=$&#123;cfg.replicationFactor&#125;</code> | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L187) |
| <code v-pre>nats kv-object: unknown KV bucket "$&#123;bucket&#125;"</code> | [packages/streaming/src/semantics/nats-kv-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L135) |
| <code v-pre>nats kv-object: unknown object bucket "$&#123;bucket&#125;"</code> | [packages/streaming/src/semantics/nats-kv-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L141) |
| <code v-pre>redpanda schema-evolution: incompatible schema for "$&#123;input.subject&#125;" (mode=$&#123;check.mode&#125;): $&#123;check.reasons.join('; ')&#125;</code> | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L157) |
| <code v-pre>redpanda schema-evolution: unknown reference subject "$&#123;r.subject&#125;"</code> | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L166) |
| <code v-pre>redpanda schema-evolution: reference version $&#123;r.version&#125; not registered for "$&#123;r.subject&#125;"</code> | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L170) |
| <code v-pre>redpanda schema-evolution: record-name strategy needs a recordName</code> | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L215) |
| <code v-pre>redpanda schema-evolution: topic-record-name strategy needs a recordName</code> | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L219) |
| <code v-pre>redpanda transactions: transaction already ongoing for "$&#123;transactionalId&#125;"</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L130) |
| <code v-pre>redpanda transactions: no open transaction for "$&#123;transactionalId&#125;"</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L142) |
| <code v-pre>redpanda transactions: cannot add partition in phase=$&#123;txn.phase&#125;</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L144) |
| <code v-pre>redpanda transactions: no open transaction for "$&#123;transactionalId&#125;"</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L150) |
| <code v-pre>redpanda transactions: cannot commit in phase=$&#123;txn.phase&#125;</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L152) |
| <code v-pre>redpanda transactions: no open transaction for "$&#123;transactionalId&#125;"</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L159) |
| <code v-pre>redpanda transactions: unknown transactionalId "$&#123;transactionalId&#125;"</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L183) |
| <code v-pre>redpanda transactions: producer id mismatch — got $&#123;provided.producerId&#125;, current $&#123;current.producerId&#125;</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L186) |
| <code v-pre>redpanda transactions: InvalidProducerEpoch — got $&#123;provided.epoch&#125;, current $&#123;current.epoch&#125;</code> | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L191) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [dlq.ts](./api/dlq) | 3 | 4 |
| [exactly-once.ts](./api/exactly-once) | 8 | 7 |
| [index.ts](./api/index) | 1 | 2 |
| [kafka.ts](./api/kafka) | 6 | 11 |
| [nats.ts](./api/nats) | 8 | 14 |
| [redpanda.ts](./api/redpanda) | 3 | 2 |
| [schema-registry.ts](./api/schema-registry) | 3 | 4 |
| [semantics/consumer-lag-telemetry.ts](./api/semantics__consumer-lag-telemetry) | 3 | 3 |
| [semantics/exactly-once.ts](./api/semantics__exactly-once) | 3 | 3 |
| [semantics/fidelity-harness.ts](./api/semantics__fidelity-harness) | 5 | 4 |
| [semantics/kafka-consumer-group.ts](./api/semantics__kafka-consumer-group) | 3 | 5 |
| [semantics/kafka-raw-protocol.ts](./api/semantics__kafka-raw-protocol) | 3 | 5 |
| [semantics/nats-jetstream-durable.ts](./api/semantics__nats-jetstream-durable) | 3 | 6 |
| [semantics/nats-kv-object.ts](./api/semantics__nats-kv-object) | 3 | 8 |
| [semantics/pipeline-orchestrator.ts](./api/semantics__pipeline-orchestrator) | 2 | 4 |
| [semantics/redpanda-schema-evolution.ts](./api/semantics__redpanda-schema-evolution) | 3 | 5 |
| [semantics/redpanda-transactions.ts](./api/semantics__redpanda-transactions) | 3 | 5 |
| [types.ts](./api/types) | 0 | 8 |

<!-- kiwa-public-api:end -->
