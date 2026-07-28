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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>compileSubject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L156) <code v-pre>packages/streaming/src/nats.ts</code>

Compile a NATS subject pattern (`orders.&gt;`, `orders.*.created`) into a regex. `*` matches exactly one token, `&gt;` matches one or more trailing tokens. Literal matches are supported as-is.

```ts
export declare function compileSubject(pattern: string): SubjectMatcher;
```

#### <code v-pre>CONSUMER&#95;LAG&#95;TELEMETRY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L13) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export declare const CONSUMER_LAG_TELEMETRY_SYMBOL: unique symbol;
```

#### <code v-pre>createConsumerLagTelemetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L97) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

Create a consumer-lag + telemetry aggregator. Producers call `recordHighWatermark` on each append, consumers call `recordCommittedOffset` on each commit. `snapshot()` returns the pair as a single row — the same shape observability platforms pull off Kafka via JMX exports.

```ts
export declare function createConsumerLagTelemetry(config: ConsumerLagTelemetryConfig): ConsumerLagTelemetry;
```

#### <code v-pre>createDeadLetterQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L50) <code v-pre>packages/streaming/src/dlq.ts</code>

Create a DLQ-aware handler. Each incoming message is invoked against `handler`; on error, the message is re-tried up to `retryPolicy.maxAttempts` total attempts. When the budget is exhausted, the message is quarantined with the last error message + attempt count.

```ts
export declare function createDeadLetterQueue<TValue = unknown, TKey = string>(config: DeadLetterQueueConfig<TValue, TKey>): DeadLetterQueue<TValue, TKey>;
```

#### <code v-pre>createExactlyOnceSemantics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L55) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

Create the cross-provider exactly-once semantics wrapper. Records enqueued between `begin()` and `commit()` become part of an atomic batch — nothing lands until commit succeeds. `abort()` discards the batch, and a `read-committed` filter excludes any message tagged with an aborted batch id (delivered as a header `x-kiwa-txn-aborted: true`).

```ts
export declare function createExactlyOnceSemantics<TValue = unknown>(config: ExactlyOnceConfig): ExactlyOnceSemantics<TValue>;
```

#### <code v-pre>createFidelityHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L59) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Default grid — Kafka + Redpanda cover the Kafka-shaped axes (raw protocol, consumer group, schema evolution, transactions, exactly-once, lag). NATS covers the JetStream + KV/Object axes + shares exactly-once + lag. `not-applicable` marks a real-world mismatch (e.g. NATS has no raw Kafka wire protocol) so tests can distinguish "missing on purpose" from "todo".

```ts
export declare function createFidelityHarness(): FidelityHarness;
```

#### <code v-pre>createIdempotentProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L39) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Idempotent producer — dedups (producerId, sequenceNumber) pairs so retries from the client side don't produce double writes. Kafka's real implementation stores (pid, seq) → last offset per partition; the mock uses a single global set which is enough to model the observable behavior.

```ts
export declare function createIdempotentProducer(config: IdempotentProducerConfig): IdempotentProducer;
```

#### <code v-pre>createKafkaConsumerGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L91) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

Create a coordinator-side consumer-group model. Static members (`groupInstanceId` set) survive a re-join without triggering a rebalance — this is the KIP-345 flow that keeps assignments sticky across pod restarts. Cooperative protocol emits `reassignedMembers` = only those whose partitions moved, so tests can assert incremental behavior.

```ts
export declare function createKafkaConsumerGroup(config: KafkaConsumerGroupConfig): KafkaConsumerGroup;
```

#### <code v-pre>createKafkaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L141) <code v-pre>packages/streaming/src/kafka.ts</code>

Create a Kafka-shaped mock — the object returned mirrors the surface of `new Kafka({...})` from the `kafkajs` package. Every producer / consumer / admin issued from the same mock shares topic state so tests can write in one client and assert in another.

```ts
export declare function createKafkaMock(config?: KafkaMockConfig): KafkaMock;
```

#### <code v-pre>createKafkaRawProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L114) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

Create a Kafka raw-protocol semantics model. Exposes the pieces of the wire protocol that show up in exactly-once tests: producer id + epoch, txn coordinator state, incremental fetch sessions, and ISR + high-watermark.

```ts
export declare function createKafkaRawProtocol(config?: KafkaRawProtocolConfig): KafkaRawProtocol;
```

#### <code v-pre>createNatsJetStreamDurable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L102) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

Create a durable-consumer model. `deliver(now)` picks the next eligible message (either a new one or a redelivery whose backoff has elapsed) and increments its attempt count. On the `maxDeliver`+1st failure, the message is quarantined for inspection.

```ts
export declare function createNatsJetStreamDurable<TValue = unknown>(config: DurableConsumerConfig): NatsJetStreamDurable<TValue>;
```

#### <code v-pre>createNatsKvObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L129) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

Create a combined KV + Object-store model. KV supports history depth + delete tombstones; Object splits inputs into chunks with per-chunk digest and an optional LZ4-tagged compression pass so tests can validate the chunk boundary + digest + reassembly.

```ts
export declare function createNatsKvObject(): NatsKvObject;
```

#### <code v-pre>createNatsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L187) <code v-pre>packages/streaming/src/nats.ts</code>

Create a NATS-shaped mock — the returned object mirrors the surface of `connect({...})` from the `nats` package. All subscriptions / streams / stores share one instance so tests can publish in one place and observe in another.

```ts
export declare function createNatsMock(config?: NatsMockConfig): NatsMock;
```

#### <code v-pre>createReadCommittedFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L203) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Read-committed filter — shaped like kafkajs's `isolationLevel: 'read_committed'` consumer flag. In the mock, aborted transactions are never flushed to the underlying broker so the filter is a no-op by construction; the identity exists as a symmetric API surface for tests.

```ts
export declare function createReadCommittedFilter(level?: IsolationLevel): ReadCommittedFilter;
```

#### <code v-pre>createRedpandaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L35) <code v-pre>packages/streaming/src/redpanda.ts</code>

Create a Redpanda-shaped mock. Under the hood it's the same broker mock as Kafka + a schema registry — the split exists so tests targeting Redpanda can pick the exact symbol / surface they want to assert against.

```ts
export declare function createRedpandaMock(config?: RedpandaMockConfig): RedpandaMock;
```

#### <code v-pre>createRedpandaSchemaEvolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L131) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

Create a Redpanda schema-evolution registry. Registration enforces the subject's current compat mode + tracks a schema reference graph (`references`) so tests can validate composed schemas (Order → Address).

```ts
export declare function createRedpandaSchemaEvolution(config?: RedpandaSchemaEvolutionConfig): RedpandaSchemaEvolution;
```

#### <code v-pre>createRedpandaTransactions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L82) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

Create the Redpanda transaction coordinator model. Fencing is enforced via `guardEpoch(transactionalId, providedEpoch)` — the same call the broker uses to reject stale producers when the same `transactional.id` re-registers.

```ts
export declare function createRedpandaTransactions(config?: RedpandaTransactionsConfig): RedpandaTransactions;
```

#### <code v-pre>createSchemaRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L74) <code v-pre>packages/streaming/src/schema-registry.ts</code>

Create a Confluent-shaped schema registry mock. Every registered schema gets a monotonically increasing id + subject-scoped version. Compatibility enforcement is structural — see `checkCompatibility` for the rule set.

```ts
export declare function createSchemaRegistry(config?: SchemaRegistryConfig): SchemaRegistry;
```

#### <code v-pre>createTransactionalProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L104) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Transactional producer — messages sent between beginTransaction() and commitTransaction() are only visible to read-committed consumers after the commit lands. abortTransaction() marks the batch aborted and read-committed consumers skip it entirely. The mock defers the actual `producer.send()` until commit — this matches the observable behavior read-committed consumers see, without modeling the transaction coordinator's on-disk state.

```ts
export declare function createTransactionalProducer(config: TransactionalProducerConfig): TransactionalProducer;
```

#### <code v-pre>dispatchPipelineEvent</code>

公開 entry point から解決しています。

`dispatchEvent` を `dispatchPipelineEvent` として公開しています。

```ts
export {
  startPipeline,
  dispatchEvent as dispatchPipelineEvent,
  summarizePipeline,
} from './pipeline-orchestrator.js';
```

#### <code v-pre>DLQ&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L10) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export declare const DLQ_SYMBOL: unique symbol;
```

#### <code v-pre>EXACTLY&#95;ONCE&#95;SEMANTICS&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L12) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export declare const EXACTLY_ONCE_SEMANTICS_SYMBOL: unique symbol;
```

#### <code v-pre>FIDELITY&#95;HARNESS&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L9) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export declare const FIDELITY_HARNESS_SYMBOL: unique symbol;
```

#### <code v-pre>IDEMPOTENT&#95;PRODUCER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L10) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export declare const IDEMPOTENT_PRODUCER_SYMBOL: unique symbol;
```

#### <code v-pre>isConsumerLagTelemetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L193) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

Type guard: recognize a ConsumerLagTelemetry.

```ts
export declare function isConsumerLagTelemetry(value: unknown): value is ConsumerLagTelemetry;
```

#### <code v-pre>isDeadLetterQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L120) <code v-pre>packages/streaming/src/dlq.ts</code>

Type guard: recognize a DeadLetterQueue.

```ts
export declare function isDeadLetterQueue(value: unknown): value is DeadLetterQueue;
```

#### <code v-pre>isExactlyOnceSemantics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L142) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

Type guard: recognize an ExactlyOnceSemantics wrapper.

```ts
export declare function isExactlyOnceSemantics(value: unknown): value is ExactlyOnceSemantics<unknown>;
```

#### <code v-pre>isFidelityHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L121) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Type guard: recognize a FidelityHarness.

```ts
export declare function isFidelityHarness(value: unknown): value is FidelityHarness;
```

#### <code v-pre>isIdempotentProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L221) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Type guard: recognize an IdempotentProducer.

```ts
export declare function isIdempotentProducer(value: unknown): value is IdempotentProducer;
```

#### <code v-pre>isKafkaConsumerGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L264) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

Type guard: recognize a KafkaConsumerGroup.

```ts
export declare function isKafkaConsumerGroup(value: unknown): value is KafkaConsumerGroup;
```

#### <code v-pre>isKafkaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L488) <code v-pre>packages/streaming/src/kafka.ts</code>

Type guard: recognize a KafkaMock.

```ts
export declare function isKafkaMock(value: unknown): value is KafkaMock;
```

#### <code v-pre>isKafkaRawProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L235) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

Type guard: recognize a KafkaRawProtocol.

```ts
export declare function isKafkaRawProtocol(value: unknown): value is KafkaRawProtocol;
```

#### <code v-pre>isNatsJetStreamDurable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L247) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

Type guard: recognize a NatsJetStreamDurable.

```ts
export declare function isNatsJetStreamDurable(value: unknown): value is NatsJetStreamDurable<unknown>;
```

#### <code v-pre>isNatsKvObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L296) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

Type guard: recognize a NatsKvObject.

```ts
export declare function isNatsKvObject(value: unknown): value is NatsKvObject;
```

#### <code v-pre>isNatsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L488) <code v-pre>packages/streaming/src/nats.ts</code>

Type guard: recognize a NatsMock.

```ts
export declare function isNatsMock(value: unknown): value is NatsMock;
```

#### <code v-pre>isRealDriverMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L130) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Env-gate — returns whether tests should also run the real driver against KIWA_MODE=real.

```ts
export declare function isRealDriverMode(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>isRedpandaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L63) <code v-pre>packages/streaming/src/redpanda.ts</code>

Type guard: recognize a RedpandaMock.

```ts
export declare function isRedpandaMock(value: unknown): value is RedpandaMock;
```

#### <code v-pre>isRedpandaSchemaEvolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L243) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

Type guard: recognize a RedpandaSchemaEvolution.

```ts
export declare function isRedpandaSchemaEvolution(value: unknown): value is RedpandaSchemaEvolution;
```

#### <code v-pre>isRedpandaTransactions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L206) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

Type guard: recognize a RedpandaTransactions instance.

```ts
export declare function isRedpandaTransactions(value: unknown): value is RedpandaTransactions;
```

#### <code v-pre>isSchemaRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L237) <code v-pre>packages/streaming/src/schema-registry.ts</code>

Type guard: recognize a SchemaRegistry.

```ts
export declare function isSchemaRegistry(value: unknown): value is SchemaRegistry;
```

#### <code v-pre>isTransactionalProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L230) <code v-pre>packages/streaming/src/exactly-once.ts</code>

Type guard: recognize a TransactionalProducer.

```ts
export declare function isTransactionalProducer(value: unknown): value is TransactionalProducer;
```

#### <code v-pre>KAFKA&#95;ADMIN&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L18) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_ADMIN_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;CONSUMER&#95;GROUP&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L10) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export declare const KAFKA_CONSUMER_GROUP_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;CONSUMER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L17) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_CONSUMER_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;MOCK&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L15) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_MOCK_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;PRODUCER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L16) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export declare const KAFKA_PRODUCER_SYMBOL: unique symbol;
```

#### <code v-pre>KAFKA&#95;RAW&#95;PROTOCOL&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L15) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export declare const KAFKA_RAW_PROTOCOL_SYMBOL: unique symbol;
```

#### <code v-pre>matchSubject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L177) <code v-pre>packages/streaming/src/nats.ts</code>

Match a subject against a compiled pattern.

```ts
export declare function matchSubject(matcher: SubjectMatcher, subject: string): boolean;
```

#### <code v-pre>NATS&#95;JETSTREAM&#95;DURABLE&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L12) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export declare const NATS_JETSTREAM_DURABLE_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;JETSTREAM&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L13) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_JETSTREAM_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;KV&#95;OBJECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L11) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export declare const NATS_KV_OBJECT_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;KV&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L14) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_KV_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;MOCK&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L12) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_MOCK_SYMBOL: unique symbol;
```

#### <code v-pre>NATS&#95;OBJECT&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L15) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export declare const NATS_OBJECT_SYMBOL: unique symbol;
```

#### <code v-pre>READ&#95;COMMITTED&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L12) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export declare const READ_COMMITTED_SYMBOL: unique symbol;
```

#### <code v-pre>REDPANDA&#95;MOCK&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L14) <code v-pre>packages/streaming/src/redpanda.ts</code>

```ts
export declare const REDPANDA_MOCK_SYMBOL: unique symbol;
```

#### <code v-pre>REDPANDA&#95;SCHEMA&#95;EVOLUTION&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L13) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export declare const REDPANDA_SCHEMA_EVOLUTION_SYMBOL: unique symbol;
```

#### <code v-pre>REDPANDA&#95;TRANSACTIONS&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L11) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export declare const REDPANDA_TRANSACTIONS_SYMBOL: unique symbol;
```

#### <code v-pre>requiredKeyFor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L139) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Which real-driver key an axis requires when KIWA_MODE=real is set. Tests check `requiredKeyFor(cell.axis)` and skip the real-driver assertion when the corresponding env var isn't present.

```ts
export declare function requiredKeyFor(axis: SemanticsAxis): string | null;
```

#### <code v-pre>SCHEMA&#95;REGISTRY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L12) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export declare const SCHEMA_REGISTRY_SYMBOL: unique symbol;
```

#### <code v-pre>startPipeline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L41) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export declare function startPipeline(input: {
    timestamp: string;
}): PipelineSession;
```

#### <code v-pre>summarizePipeline</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L158) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export declare function summarizePipeline(session: PipelineSession): PipelineSummary;
```

#### <code v-pre>TRANSACTIONAL&#95;PRODUCER&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L11) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export declare const TRANSACTIONAL_PRODUCER_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>AckPendingEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L40) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface AckPendingEntry {
    readonly seq: number;
    readonly deliveries: number;
    readonly lastDeliveredAt: number;
}
```

#### <code v-pre>AckPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L16) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export type AckPolicy = 'explicit' | 'all' | 'none';
```

#### <code v-pre>BackoffKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L12) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export type BackoffKind = 'constant' | 'linear' | 'exponential';
```

#### <code v-pre>CellStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L21) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export type CellStatus = 'implemented' | 'not-applicable' | 'planned';
```

#### <code v-pre>CommittedOffset</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L82) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface CommittedOffset {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
}
```

#### <code v-pre>CompatibilityCheckResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L30) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface CompatibilityCheckResult {
    readonly compatible: boolean;
    readonly mode: CompatibilityMode;
    readonly reasons: readonly string[];
}
```

#### <code v-pre>CompatibilityMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L51) <code v-pre>packages/streaming/src/types.ts</code>

Compatibility mode — controls whether a new schema version can be registered against an existing subject. See Confluent Schema Registry docs for the canonical semantics; the mock enforces the intent, not every corner case.

```ts
export type CompatibilityMode = 'BACKWARD' | 'FORWARD' | 'FULL' | 'BACKWARD_TRANSITIVE' | 'FORWARD_TRANSITIVE' | 'FULL_TRANSITIVE' | 'NONE';
```

#### <code v-pre>CompressionKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L13) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export type CompressionKind = 'none' | 'lz4';
```

#### <code v-pre>ConsumerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L49) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface ConsumerConfig {
    readonly groupId: string;
    readonly partitionAssigner?: PartitionAssigner;
    readonly sessionTimeoutMs?: number;
}
```

#### <code v-pre>ConsumerLagTelemetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L36) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export interface ConsumerLagTelemetry {
    readonly [CONSUMER_LAG_TELEMETRY_SYMBOL]: true;
    readonly config: Required<ConsumerLagTelemetryConfig>;
    /** Update the broker-side high watermark for a topic-partition. */
    recordHighWatermark(topic: string, partition: number, offset: number, timestamp: number): void;
    /** Update the consumer group's committed offset for a topic-partition. */
    recordCommittedOffset(consumerGroup: string, topic: string, partition: number, offset: number, timestamp: number): void;
    /** Capture a snapshot for a single (group, topic, partition). */
    snapshot(input: {
        readonly consumerGroup: string;
        readonly topic: string;
        readonly partition: number;
        readonly now: number;
    }): OffsetSnapshot | null;
    /** Capture snapshots for every (group, topic, partition) known to the telemetry. */
    snapshotAll(now: number): readonly OffsetSnapshot[];
    /** Aggregate lag across all partitions of a topic for a single group. */
    aggregateGroupLag(consumerGroup: string, topic: string, now: number): {
        readonly totalOffsetLag: number;
        readonly maxOffsetLag: number;
        readonly partitionCount: number;
    };
    reset(): void;
}
```

#### <code v-pre>ConsumerLagTelemetryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L17) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export interface ConsumerLagTelemetryConfig {
    readonly provider: StreamingProvider;
    /** Refresh interval in ms — throttles snapshot generation. Default 5_000. */
    readonly refreshIntervalMs?: number;
}
```

#### <code v-pre>DeadLetterEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L33) <code v-pre>packages/streaming/src/types.ts</code>

DLQ (dead-letter queue) entry — a message that exceeded retry budget.

```ts
export interface DeadLetterEntry<TValue = unknown, TKey = string> {
    readonly original: StreamingMessage<TValue, TKey>;
    readonly attempts: number;
    readonly reason: string;
    readonly quarantinedAt: number;
}
```

#### <code v-pre>DeadLetterQueue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L31) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export interface DeadLetterQueue<TValue = unknown, TKey = string> {
    readonly [DLQ_SYMBOL]: true;
    readonly topic: string;
    readonly deadLetterTopic: string;
    /** Process one message through the retry + quarantine chain. */
    handle(message: StreamingMessage<TValue, TKey>): Promise<'handled' | 'quarantined'>;
    /** Immutable snapshot of currently quarantined entries. */
    quarantined(): readonly DeadLetterEntry<TValue, TKey>[];
    /** Manually enqueue an entry into the DLQ (useful for injecting fixtures). */
    quarantine(entry: DeadLetterEntry<TValue, TKey>): void;
    reset(): void;
}
```

#### <code v-pre>DeadLetterQueueConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L23) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export interface DeadLetterQueueConfig<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly handler: MessageHandler<TValue, TKey>;
    readonly retryPolicy: RetryPolicy;
    /** Optional callback that receives every quarantined entry — useful for alert wiring. */
    readonly onDeadLetter?: (entry: DeadLetterEntry<TValue, TKey>) => void;
}
```

#### <code v-pre>DeliveryAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L33) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface DeliveryAttempt<TValue = unknown> {
    readonly seq: number;
    readonly attempt: number;
    readonly deliveredAt: number;
    readonly message: StreamingMessage<TValue>;
}
```

#### <code v-pre>DurableConsumerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L18) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface DurableConsumerConfig {
    readonly durableName: string;
    readonly filterSubject?: string;
    /** ack_wait — after this many ms with no ack, the message is redelivered. Default 30_000. */
    readonly ackWaitMs?: number;
    /** max_deliver — total delivery attempts before quarantine. Default 3. */
    readonly maxDeliver?: number;
    readonly ackPolicy?: AckPolicy;
    /**
     * backoff schedule (ms) — delay between redelivery attempts. When exhausted,
     * the last entry is used for further redeliveries. Empty ⇒ immediate.
     */
    readonly backoff?: readonly number[];
}
```

#### <code v-pre>EvolutionCheckResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L38) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface EvolutionCheckResult {
    readonly compatible: boolean;
    readonly mode: CompatibilityMode;
    readonly reasons: readonly string[];
}
```

#### <code v-pre>EvolutionSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L28) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface EvolutionSchema {
    readonly id: number;
    readonly subject: string;
    readonly version: number;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly references: readonly SchemaReference[];
    readonly registeredAt: number;
}
```

#### <code v-pre>ExactlyOnceConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L18) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export interface ExactlyOnceConfig {
    readonly provider: StreamingProvider;
    readonly transactionalId: string;
    readonly isolationLevel?: IsolationLevel;
}
```

#### <code v-pre>ExactlyOnceIsolationLevel</code>

公開 entry point から解決しています。

`IsolationLevel` を `ExactlyOnceIsolationLevel` として公開しています。

```ts
export {
  createExactlyOnceSemantics,
  EXACTLY_ONCE_SEMANTICS_SYMBOL,
  isExactlyOnceSemantics,
  type ExactlyOnceConfig,
  type ExactlyOnceSemantics,
  type IsolationLevel as ExactlyOnceIsolationLevel,
  type PendingRecord,
  type TxnState as ExactlyOnceTxnState,
} from './exactly-once.js';
```

#### <code v-pre>ExactlyOnceSemantics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L32) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export interface ExactlyOnceSemantics<TValue = unknown> {
    readonly [EXACTLY_ONCE_SEMANTICS_SYMBOL]: true;
    readonly config: Required<ExactlyOnceConfig>;
    begin(): void;
    send(record: PendingRecord<TValue>): void;
    commit(): readonly StreamingMessage<TValue>[];
    abort(): void;
    state(): TxnState;
    /** Filter a stream according to the configured isolation level. */
    filter(messages: readonly StreamingMessage<TValue>[]): readonly StreamingMessage<TValue>[];
    reset(): void;
}
```

#### <code v-pre>ExactlyOnceTxnState</code>

公開 entry point から解決しています。

`TxnState` を `ExactlyOnceTxnState` として公開しています。

```ts
export {
  createExactlyOnceSemantics,
  EXACTLY_ONCE_SEMANTICS_SYMBOL,
  isExactlyOnceSemantics,
  type ExactlyOnceConfig,
  type ExactlyOnceSemantics,
  type IsolationLevel as ExactlyOnceIsolationLevel,
  type PendingRecord,
  type TxnState as ExactlyOnceTxnState,
} from './exactly-once.js';
```

#### <code v-pre>FetchSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L37) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface FetchSession {
    readonly sessionId: number;
    epoch: number;
}
```

#### <code v-pre>FidelityCell</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L23) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export interface FidelityCell {
    readonly provider: StreamingProvider;
    readonly axis: SemanticsAxis;
    readonly status: CellStatus;
    readonly note?: string;
}
```

#### <code v-pre>FidelityHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L30) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export interface FidelityHarness {
    readonly [FIDELITY_HARNESS_SYMBOL]: true;
    readonly cells: readonly FidelityCell[];
    cellFor(provider: StreamingProvider, axis: SemanticsAxis): FidelityCell | null;
    cellsFor(provider: StreamingProvider): readonly FidelityCell[];
    axesFor(provider: StreamingProvider, status: CellStatus): readonly SemanticsAxis[];
    totalCells(): number;
}
```

#### <code v-pre>GroupMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L22) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface GroupMember {
    readonly memberId: string;
    /** Group instance id from KIP-345. Present ⇒ member is "static". */
    readonly groupInstanceId: string | undefined;
    readonly subscribedTopics: readonly string[];
    lastHeartbeatAt: number;
    assignedPartitions: Map<string, number[]>;
}
```

#### <code v-pre>IdempotentProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L20) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface IdempotentProducer {
    readonly [IDEMPOTENT_PRODUCER_SYMBOL]: true;
    readonly producerId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send<TValue = unknown, TKey = string>(record: ProducerRecord<TValue, TKey>, sequenceNumber: number): Promise<PublishResult[]>;
    /** Returns true when the (producerId, sequenceNumber) has already been observed. */
    isDuplicate(sequenceNumber: number): boolean;
}
```

#### <code v-pre>IdempotentProducerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L14) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface IdempotentProducerConfig {
    readonly kafka: KafkaMock;
    /** Producer identity used for dedup. In real Kafka this is broker-assigned. */
    readonly producerId?: string;
}
```

#### <code v-pre>IsolationLevel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L179) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export type IsolationLevel = 'read-committed' | 'read-uncommitted';
```

#### <code v-pre>JetStreamConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L33) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamConfig {
    readonly name: string;
    readonly subjects: readonly string[];
    /** Retention policy — `limits` = size/time based, `interest` = consumer-based, `workqueue` = consume-once. */
    readonly retention?: 'limits' | 'interest' | 'workqueue';
    readonly maxMsgs?: number;
}
```

#### <code v-pre>JetStreamConsumer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L53) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamConsumer {
    readonly durable: string;
    fetch(batch: number): Promise<StreamingMessage[]>;
    ack(message: StreamingMessage): void;
    info(): {
        readonly delivered: number;
        readonly ackFloor: number;
    };
}
```

#### <code v-pre>JetStreamConsumerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L47) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamConsumerConfig {
    readonly durable: string;
    readonly filterSubject?: string;
    readonly ackPolicy?: 'explicit' | 'none' | 'all';
}
```

#### <code v-pre>JetStreamPublishAck</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L41) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamPublishAck {
    readonly stream: string;
    readonly seq: number;
    readonly duplicate: boolean;
}
```

#### <code v-pre>JetStreamStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L60) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface JetStreamStore {
    readonly [NATS_JETSTREAM_SYMBOL]: true;
    addStream(config: JetStreamConfig): Promise<void>;
    publish<TValue = unknown>(subject: string, data: TValue): Promise<JetStreamPublishAck>;
    consumer(streamName: string, config: JetStreamConsumerConfig): Promise<JetStreamConsumer>;
    listStreams(): readonly string[];
    getStreamMessages(streamName: string): readonly StreamingMessage[];
}
```

#### <code v-pre>KafkaAdmin</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L88) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaAdmin {
    readonly [KAFKA_ADMIN_SYMBOL]: true;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    createTopics(opts: {
        readonly topics: readonly {
            readonly topic: string;
            readonly numPartitions?: number;
        }[];
    }): Promise<void>;
    listTopics(): Promise<string[]>;
    deleteTopics(opts: {
        readonly topics: readonly string[];
    }): Promise<void>;
    fetchTopicMetadata(opts: {
        readonly topics: readonly string[];
    }): Promise<{
        readonly topics: readonly KafkaTopicSpec[];
    }>;
}
```

#### <code v-pre>KafkaConsumer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L66) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaConsumer {
    readonly [KAFKA_CONSUMER_SYMBOL]: true;
    readonly groupId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    subscribe(opts: {
        readonly topics: readonly string[];
        readonly fromBeginning?: boolean;
    }): Promise<void>;
    run<TValue = unknown, TKey = string>(opts: {
        readonly eachMessage: MessageHandler<TValue, TKey>;
        readonly autoCommit?: boolean;
    }): Promise<void>;
    commitOffsets(offsets: readonly CommittedOffset[]): Promise<void>;
    seek(opts: {
        readonly topic: string;
        readonly partition: number;
        readonly offset: number;
    }): void;
    assignments(): ReadonlyMap<string, readonly number[]>;
    isConnected(): boolean;
}
```

#### <code v-pre>KafkaConsumerGroup</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L39) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface KafkaConsumerGroup {
    readonly [KAFKA_CONSUMER_GROUP_SYMBOL]: true;
    readonly groupId: string;
    readonly config: Required<KafkaConsumerGroupConfig>;
    /** Register topic partition counts so the coordinator can compute assignments. */
    registerTopic(topic: string, numPartitions: number): void;
    /** JoinGroup RPC — returns the assigned memberId. Blocks until SyncGroup. */
    joinGroup(input: {
        readonly subscribedTopics: readonly string[];
        readonly groupInstanceId?: string;
    }): {
        readonly memberId: string;
        readonly generationId: number;
    };
    /** LeaveGroup RPC — removes the member and triggers a rebalance. */
    leaveGroup(memberId: string): void;
    /** Heartbeat — extend the member's liveness. Throws if the member is unknown. */
    heartbeat(memberId: string, now?: number): void;
    /**
     * Detect expired members (no heartbeat within `sessionTimeoutMs`) and remove
     * them. Returns removed member ids. Callers typically loop this on a timer.
     */
    expireDeadMembers(now: number): readonly string[];
    /** Force a rebalance — recomputes assignments across the current member set. */
    rebalance(): RebalanceResult;
    /** Current generation id. */
    generation(): number;
    listMembers(): readonly GroupMember[];
    reset(): void;
}
```

#### <code v-pre>KafkaConsumerGroupConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L14) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface KafkaConsumerGroupConfig {
    readonly groupId: string;
    /** `sessionTimeoutMs` from KIP-32 — heartbeat expiry window. Default 30_000. */
    readonly sessionTimeoutMs?: number;
    /** Rebalance protocol — `cooperative` = KIP-429 incremental. Default `eager`. */
    readonly protocol?: RebalanceProtocol;
}
```

#### <code v-pre>KafkaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L105) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaMock {
    readonly [KAFKA_MOCK_SYMBOL]: true;
    readonly config: KafkaMockConfig;
    producer(): KafkaProducer;
    consumer(config: ConsumerConfig): KafkaConsumer;
    admin(): KafkaAdmin;
    /** Reset all producers / consumers / topics — useful between test cases. */
    reset(): void;
    /** Direct topic access for lower-level assertions. */
    getTopicMessages(topic: string): readonly StreamingMessage[];
    getCommittedOffset(groupId: string, topic: string, partition: number): number | undefined;
}
```

#### <code v-pre>KafkaMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L22) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaMockConfig {
    readonly clientId?: string;
    readonly brokers?: readonly string[];
    /** Default partition count for auto-created topics. */
    readonly defaultPartitionCount?: number;
}
```

#### <code v-pre>KafkaProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L55) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaProducer {
    readonly [KAFKA_PRODUCER_SYMBOL]: true;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    send<TValue = unknown, TKey = string>(record: ProducerRecord<TValue, TKey>): Promise<PublishResult[]>;
    sendBatch(records: readonly ProducerRecord[]): Promise<PublishResult[]>;
    isConnected(): boolean;
}
```

#### <code v-pre>KafkaRawProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L42) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface KafkaRawProtocol {
    readonly [KAFKA_RAW_PROTOCOL_SYMBOL]: true;
    readonly config: Required<KafkaRawProtocolConfig>;
    /** InitProducerId — assigns a fresh (producerId, epoch=0) pair. */
    initProducerId(): ProducerIdentity;
    /**
     * Fence a producer identity — bumps the current epoch, which causes any
     * older-epoch send to be rejected as `INVALID_PRODUCER_EPOCH`. Matches the
     * KIP-98 fencing rule that a coordinator re-init bumps epoch.
     */
    fenceProducer(producerId: number): ProducerIdentity;
    /** Return true if (producerId, epoch) is still the latest identity. */
    isValidEpoch(identity: ProducerIdentity): boolean;
    /** Transition the transaction coordinator state machine. Rejects invalid transitions. */
    transitionTransaction(from: TransactionCoordinatorState, to: TransactionCoordinatorState): void;
    /** Current transaction coordinator state. */
    transactionState(): TransactionCoordinatorState;
    /** Open a new incremental fetch session (KIP-227). */
    openFetchSession(): FetchSession;
    /** Advance a fetch session epoch and return the current one. Throws on stale sessions. */
    bumpFetchSession(sessionId: number): number;
    /** Add a broker id to the ISR set for the given topic-partition. */
    addToIsr(topic: string, partition: number, brokerId: number): void;
    /** Remove a broker id from the ISR set (lag / heartbeat timeout). */
    removeFromIsr(topic: string, partition: number, brokerId: number): void;
    /** Current ISR set for a topic-partition. */
    getIsr(topic: string, partition: number): readonly number[];
    /**
     * Try to advance the high-watermark to `nextOffset`. Only succeeds when the
     * ISR set size >= `minInSyncReplicas`. Returns the resulting HW.
     */
    advanceHighWatermark(topic: string, partition: number, nextOffset: number): number;
    /** Current high watermark for a topic-partition. */
    getHighWatermark(topic: string, partition: number): number;
    /** Reset all state — useful between test cases. */
    reset(): void;
}
```

#### <code v-pre>KafkaRawProtocolConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L17) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface KafkaRawProtocolConfig {
    /** How many replicas a partition has. Default 3, matches broker.default. */
    readonly replicationFactor?: number;
    /** min.insync.replicas — commit gate. Default 2. */
    readonly minInSyncReplicas?: number;
}
```

#### <code v-pre>KafkaTopicSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L29) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface KafkaTopicSpec {
    readonly topic: string;
    readonly numPartitions: number;
    /** Optional per-partition ownership map — group id → member id. */
    readonly assignments?: ReadonlyMap<number, string>;
}
```

#### <code v-pre>KvBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L15) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface KvBucketConfig {
    readonly bucket: string;
    /** History depth — max revisions kept per key. Default 1. */
    readonly historyDepth?: number;
    /** ttl in ms — 0 = keep forever. Default 0. */
    readonly ttlMs?: number;
}
```

#### <code v-pre>KVEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L79) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface KVEntry<TValue = unknown> {
    readonly bucket: string;
    readonly key: string;
    readonly value: TValue;
    readonly revision: number;
    readonly timestamp: number;
}
```

#### <code v-pre>KvRevision</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L23) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface KvRevision<TValue = unknown> {
    readonly bucket: string;
    readonly key: string;
    readonly value: TValue;
    readonly revision: number;
    readonly createdAt: number;
    readonly operation: 'put' | 'delete';
}
```

#### <code v-pre>KVStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L69) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface KVStore {
    readonly [NATS_KV_SYMBOL]: true;
    readonly bucket: string;
    put<TValue = unknown>(key: string, value: TValue): Promise<number>;
    get<TValue = unknown>(key: string): Promise<KVEntry<TValue> | null>;
    delete(key: string): Promise<void>;
    keys(): Promise<string[]>;
    watch(): AsyncIterable<KVEntry>;
}
```

#### <code v-pre>KvWatchEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L32) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface KvWatchEvent<TValue = unknown> {
    readonly revision: KvRevision<TValue>;
}
```

#### <code v-pre>MessageHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L28) <code v-pre>packages/streaming/src/types.ts</code>

Handler shape shared by consumer / group / subject subscribers.

```ts
export type MessageHandler<TValue = unknown, TKey = string> = (message: StreamingMessage<TValue, TKey>) => void | Promise<void>;
```

#### <code v-pre>NatsJetStreamDurable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L53) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface NatsJetStreamDurable<TValue = unknown> {
    readonly [NATS_JETSTREAM_DURABLE_SYMBOL]: true;
    readonly config: Required<Pick<DurableConsumerConfig, 'durableName' | 'ackWaitMs' | 'maxDeliver' | 'ackPolicy'>> & {
        readonly backoff: readonly number[];
        readonly filterSubject: string | undefined;
    };
    /** Enqueue a fresh message onto the stream. Returns the assigned seq. */
    publish(message: Omit<StreamingMessage<TValue>, 'offset'> & {
        readonly subject?: string;
    }): number;
    /** Deliver the next unacked / pending message to the consumer. */
    deliver(now: number): DeliveryAttempt<TValue> | null;
    /** Ack a delivered message by seq — marks it done. */
    ack(seq: number): void;
    /** Nack — mark the delivery failed. Redelivered on next `deliver()` respecting backoff. */
    nack(seq: number, now: number): void;
    /**
     * Sweep — advance any pending deliveries whose `ack_wait` has elapsed. This
     * is what real JetStream does on a timer; tests drive it explicitly.
     */
    sweepExpired(now: number): readonly number[];
    /** Current ack-pending window (seq → deliveries + lastDeliveredAt). */
    ackPending(): readonly AckPendingEntry[];
    /** Messages that exceeded `maxDeliver` and were quarantined. */
    quarantined(): readonly QuarantinedMessage<TValue>[];
    info(): {
        readonly delivered: number;
        readonly ackFloor: number;
        readonly pending: number;
    };
    reset(): void;
}
```

#### <code v-pre>NatsKvObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L58) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface NatsKvObject {
    readonly [NATS_KV_OBJECT_SYMBOL]: true;
    createKvBucket(config: KvBucketConfig): void;
    putKv<TValue = unknown>(bucket: string, key: string, value: TValue): KvRevision<TValue>;
    getKv<TValue = unknown>(bucket: string, key: string): KvRevision<TValue> | null;
    historyKv<TValue = unknown>(bucket: string, key: string): readonly KvRevision<TValue>[];
    deleteKv(bucket: string, key: string): KvRevision<null>;
    watchKv(bucket: string): AsyncIterable<KvWatchEvent>;
    emitWatchEvents(bucket: string, now: number): void;
    createObjectBucket(config: ObjectBucketConfig): void;
    putObject(bucket: string, name: string, bytes: Uint8Array): ObjectRecord;
    getObject(bucket: string, name: string): ObjectRecord | null;
    reassembleObject(bucket: string, name: string): Uint8Array | null;
    reset(): void;
}
```

#### <code v-pre>NatsMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L109) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsMock {
    readonly [NATS_MOCK_SYMBOL]: true;
    readonly config: NatsMockConfig;
    publish<TValue = unknown>(subject: string, data: TValue, options?: NatsPublishOptions): Promise<PublishResult>;
    subscribe<TValue = unknown>(subject: string, handler: MessageHandler<TValue>): NatsSubscription;
    request<TIn = unknown, TOut = unknown>(subject: string, data: TIn): Promise<StreamingMessage<TOut>>;
    jetstream(): JetStreamStore;
    kv(bucket: string): KVStore;
    objectStore(bucket: string): ObjectStore;
    drain(): Promise<void>;
    reset(): void;
    getSubjectMessages(subject: string): readonly StreamingMessage[];
}
```

#### <code v-pre>NatsMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L17) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsMockConfig {
    readonly servers?: readonly string[];
    readonly name?: string;
}
```

#### <code v-pre>NatsPublishOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L22) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsPublishOptions {
    readonly headers?: Record<string, string>;
    readonly reply?: string;
}
```

#### <code v-pre>NatsSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L27) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface NatsSubscription {
    readonly subject: string;
    unsubscribe(): void;
    isClosed(): boolean;
}
```

#### <code v-pre>ObjectBucketConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L36) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface ObjectBucketConfig {
    readonly bucket: string;
    /** Chunk size in bytes for object writes. Default 128 * 1024. */
    readonly chunkSizeBytes?: number;
    readonly compression?: CompressionKind;
}
```

#### <code v-pre>ObjectChunk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L43) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface ObjectChunk {
    readonly index: number;
    readonly bytes: Uint8Array;
    readonly digest: string;
}
```

#### <code v-pre>ObjectEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L104) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface ObjectEntry {
    readonly info: ObjectInfo;
    readonly data: Uint8Array;
}
```

#### <code v-pre>ObjectInfo</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L96) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface ObjectInfo {
    readonly bucket: string;
    readonly name: string;
    readonly size: number;
    readonly digest: string;
    readonly timestamp: number;
}
```

#### <code v-pre>ObjectRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L49) <code v-pre>packages/streaming/src/semantics/nats-kv-object.ts</code>

```ts
export interface ObjectRecord {
    readonly bucket: string;
    readonly name: string;
    readonly size: number;
    readonly chunks: readonly ObjectChunk[];
    readonly compression: CompressionKind;
    readonly writtenAt: number;
}
```

#### <code v-pre>ObjectStore</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L87) <code v-pre>packages/streaming/src/nats.ts</code>

```ts
export interface ObjectStore {
    readonly [NATS_OBJECT_SYMBOL]: true;
    readonly bucket: string;
    put(name: string, data: Uint8Array | string): Promise<ObjectInfo>;
    get(name: string): Promise<ObjectEntry | null>;
    delete(name: string): Promise<void>;
    list(): Promise<ObjectInfo[]>;
}
```

#### <code v-pre>OffsetSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L23) <code v-pre>packages/streaming/src/semantics/consumer-lag-telemetry.ts</code>

```ts
export interface OffsetSnapshot {
    readonly topic: string;
    readonly partition: number;
    readonly consumerGroup: string;
    readonly highWatermark: number;
    readonly committedOffset: number;
    readonly offsetLag: number;
    readonly headTimestamp: number;
    readonly lastConsumedTimestamp: number;
    readonly timeLagMs: number;
    readonly capturedAt: number;
}
```

#### <code v-pre>PartitionAssigner</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L20) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export type PartitionAssigner = 'range' | 'round-robin';
```

#### <code v-pre>PendingRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L24) <code v-pre>packages/streaming/src/semantics/exactly-once.ts</code>

```ts
export interface PendingRecord<TValue = unknown> {
    readonly topic: string;
    readonly value: TValue;
    readonly key: string | null;
}
```

#### <code v-pre>PipelineEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L21) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export type PipelineEvent = 'produce-succeeded' | 'produce-failed' | 'consume-succeeded' | 'consume-failed' | 'rebalance-triggered' | 'rebalance-completed' | 'dlq-message-added' | 'stop-requested';
```

#### <code v-pre>PipelineSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L31) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export interface PipelineSession {
    state: PipelineState;
    messagesProduced: number;
    messagesConsumed: number;
    rebalancesExecuted: number;
    dlqMessagesCount: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>PipelineState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L14) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

v2.1 pipeline-orchestrator = producer + consumer group + exactly-once + DLQ + schema registry の 継続合成 layer。 Streaming pair v0.1 → v2.1 = 5 段深化到達 = **depth-5 pattern 6 例目発生** (Mobile + Desktop + quality-metrics + Payment + Realtime + Streaming = 6 pair 到達 = **systematic law confirmed**)、 pattern 昇格階段 の 最上位 = kiwa 全体 の 必ず守る 最上位規範化 confirmed。 shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.3) 変更 0、 新規 file 追加 のみ、 backward compat 絶対維持。

```ts
export type PipelineState = 'producing' | 'consuming' | 'rebalancing' | 'dlq-active' | 'stopped';
```

#### <code v-pre>PipelineSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L146) <code v-pre>packages/streaming/src/semantics/pipeline-orchestrator.ts</code>

```ts
export interface PipelineSummary {
    currentState: PipelineState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    messagesProduced: number;
    messagesConsumed: number;
    rebalancesExecuted: number;
    dlqMessagesCount: number;
}
```

#### <code v-pre>ProducerEpoch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L18) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface ProducerEpoch {
    readonly producerId: number;
    readonly epoch: number;
    readonly transactionalId?: string;
}
```

#### <code v-pre>ProducerIdentity</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L32) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export interface ProducerIdentity {
    readonly producerId: number;
    readonly epoch: number;
}
```

#### <code v-pre>ProducerMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L41) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface ProducerMessage<TValue = unknown, TKey = string> {
    readonly key?: TKey;
    readonly value: TValue;
    readonly partition?: number;
    readonly headers?: Record<string, string>;
    readonly timestamp?: number;
}
```

#### <code v-pre>ProducerRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L36) <code v-pre>packages/streaming/src/kafka.ts</code>

```ts
export interface ProducerRecord<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly messages: readonly ProducerMessage<TValue, TKey>[];
}
```

#### <code v-pre>PublishResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L9) <code v-pre>packages/streaming/src/types.ts</code>

Result of a single message publish.

```ts
export interface PublishResult {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
    readonly timestamp: number;
}
```

#### <code v-pre>QuarantinedMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L46) <code v-pre>packages/streaming/src/semantics/nats-jetstream-durable.ts</code>

```ts
export interface QuarantinedMessage<TValue = unknown> {
    readonly seq: number;
    readonly attempts: number;
    readonly message: StreamingMessage<TValue>;
    readonly reason: string;
}
```

#### <code v-pre>ReadCommittedFilter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L181) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface ReadCommittedFilter {
    readonly [READ_COMMITTED_SYMBOL]: true;
    readonly isolationLevel: IsolationLevel;
    /**
     * Filter a raw message stream to only committed records. The mock treats
     * every message emitted through `createTransactionalProducer.commit()` as
     * committed; uncommitted / aborted batches never reach the underlying
     * KafkaMock so this filter is effectively an identity for messages sourced
     * through the mock's own flow — but the shape mirrors kafkajs so tests can
     * assert against the same field.
     */
    filter<TValue = unknown, TKey = string>(messages: readonly StreamingMessage<TValue, TKey>[]): readonly StreamingMessage<TValue, TKey>[];
}
```

#### <code v-pre>RebalanceProtocol</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L12) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export type RebalanceProtocol = 'eager' | 'cooperative';
```

#### <code v-pre>RebalanceResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L31) <code v-pre>packages/streaming/src/semantics/kafka-consumer-group.ts</code>

```ts
export interface RebalanceResult {
    readonly generationId: number;
    readonly protocol: RebalanceProtocol;
    readonly assignments: ReadonlyMap<string, ReadonlyMap<string, readonly number[]>>;
    /** Members whose assignments changed compared to the previous generation. */
    readonly reassignedMembers: readonly string[];
}
```

#### <code v-pre>RedpandaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L25) <code v-pre>packages/streaming/src/redpanda.ts</code>

RedpandaMock exposes the same producer/consumer/admin surface as KafkaMock (structural compatibility) + a colocated `schemaRegistry` field so tests can register schemas + assert compatibility without a second setup call.

```ts
export interface RedpandaMock extends KafkaMock {
    readonly [REDPANDA_MOCK_SYMBOL]: true;
    readonly schemaRegistry: SchemaRegistry;
}
```

#### <code v-pre>RedpandaMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L16) <code v-pre>packages/streaming/src/redpanda.ts</code>

```ts
export interface RedpandaMockConfig extends KafkaMockConfig {
    readonly schemaRegistry?: SchemaRegistryConfig;
}
```

#### <code v-pre>RedpandaSchemaEvolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L44) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface RedpandaSchemaEvolution {
    readonly [REDPANDA_SCHEMA_EVOLUTION_SYMBOL]: true;
    readonly config: Required<RedpandaSchemaEvolutionConfig>;
    register(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
        readonly references?: readonly SchemaReference[];
    }): EvolutionSchema;
    latest(subject: string): EvolutionSchema | null;
    versions(subject: string): readonly EvolutionSchema[];
    setCompatibility(subject: string, mode: CompatibilityMode): void;
    getCompatibility(subject: string): CompatibilityMode;
    check(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
    }): EvolutionCheckResult;
    subjectFor(topic: string, part: 'key' | 'value', recordName?: string): string;
    resolveReferences(schema: EvolutionSchema): readonly EvolutionSchema[];
    reset(): void;
}
```

#### <code v-pre>RedpandaSchemaEvolutionConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L17) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface RedpandaSchemaEvolutionConfig {
    readonly defaultCompatibility?: CompatibilityMode;
    readonly subjectNamingStrategy?: SubjectNamingStrategy;
}
```

#### <code v-pre>RedpandaTransactions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L40) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface RedpandaTransactions {
    readonly [REDPANDA_TRANSACTIONS_SYMBOL]: true;
    readonly config: Required<RedpandaTransactionsConfig>;
    /** InitTransactions equivalent — assign producer id + starting epoch. */
    initTransactions(transactionalId: string): ProducerEpoch;
    /**
     * Bump the epoch when a new client with the same transactionalId connects.
     * The old epoch is fenced — subsequent writes with it get InvalidProducerEpoch.
     */
    bumpEpoch(transactionalId: string): ProducerEpoch;
    /** Open a new transaction for the given producer. */
    beginTransaction(transactionalId: string, producer: ProducerEpoch): void;
    /** Register a partition that will receive writes inside the open transaction. */
    addPartition(transactionalId: string, topic: string, partition: number): void;
    /** Commit — moves phase idle → prepareCommit → committed. */
    commitTransaction(transactionalId: string): void;
    /** Abort — moves phase ongoing → prepareAbort → aborted, or short-circuits on fence. */
    abortTransaction(transactionalId: string, reason?: string): void;
    /** Auto-abort any transactions that have exceeded `transactionTimeoutMs`. */
    expireStale(now: number): readonly string[];
    currentPhase(transactionalId: string): TxnPhase;
    currentProducer(transactionalId: string): ProducerEpoch | null;
    /** Guard: throw InvalidProducerEpoch if `provided` is older than the current. */
    guardEpoch(transactionalId: string, provided: ProducerEpoch): void;
    reset(): void;
}
```

#### <code v-pre>RedpandaTransactionsConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L13) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface RedpandaTransactionsConfig {
    /** Transaction timeout after which the coordinator auto-aborts. Default 60_000ms. */
    readonly transactionTimeoutMs?: number;
}
```

#### <code v-pre>RegisteredSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L21) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface RegisteredSchema {
    readonly id: number;
    readonly subject: string;
    readonly version: number;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly registeredAt: number;
}
```

#### <code v-pre>RetryPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L14) <code v-pre>packages/streaming/src/dlq.ts</code>

```ts
export interface RetryPolicy {
    readonly maxAttempts: number;
    readonly backoff?: BackoffKind;
    /** Backoff base in ms — constant returns this, linear multiplies by attempt, exponential = base * 2^(attempt-1). */
    readonly baseDelayMs?: number;
    /** Cap the backoff delay so retries don't stall long-running tests. */
    readonly maxDelayMs?: number;
}
```

#### <code v-pre>SchemaKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L41) <code v-pre>packages/streaming/src/types.ts</code>

Schema kind supported by the schema-registry mock.

```ts
export type SchemaKind = 'avro' | 'protobuf' | 'json';
```

#### <code v-pre>SchemaReference</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L22) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface SchemaReference {
    readonly name: string;
    readonly subject: string;
    readonly version: number;
}
```

#### <code v-pre>SchemaRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L36) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface SchemaRegistry {
    readonly [SCHEMA_REGISTRY_SYMBOL]: true;
    readonly config: SchemaRegistryConfig;
    /**
     * Register a schema version against a subject. Enforces the subject's
     * current compat mode; throws when incompatible.
     */
    register(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
    }): Promise<RegisteredSchema>;
    getById(id: number): Promise<RegisteredSchema | null>;
    getLatestVersion(subject: string): Promise<RegisteredSchema | null>;
    listVersions(subject: string): Promise<RegisteredSchema[]>;
    listSubjects(): Promise<string[]>;
    setCompatibility(subject: string, mode: CompatibilityMode): Promise<void>;
    getCompatibility(subject: string): CompatibilityMode;
    checkCompatibility(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
    }): CompatibilityCheckResult;
    subjectFor(topic: string, kind: 'key' | 'value'): string;
    reset(): void;
}
```

#### <code v-pre>SchemaRegistryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L14) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface SchemaRegistryConfig {
    /** Default compat mode applied to new subjects. */
    readonly defaultCompatibility?: CompatibilityMode;
    /** Subject naming strategy — how tests derive subject from topic. */
    readonly subjectNamingStrategy?: SubjectNamingStrategy;
}
```

#### <code v-pre>SemanticsAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L11) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export type SemanticsAxis = 'kafka-raw-protocol' | 'kafka-consumer-group' | 'redpanda-schema-evolution' | 'redpanda-transactions' | 'nats-jetstream-durable' | 'nats-kv-object' | 'exactly-once' | 'consumer-lag-telemetry';
```

#### <code v-pre>StreamingMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L17) <code v-pre>packages/streaming/src/types.ts</code>

Single received message shared across all provider mocks.

```ts
export interface StreamingMessage<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
    readonly timestamp: number;
    readonly key: TKey | null;
    readonly value: TValue;
    readonly headers: Record<string, string>;
}
```

#### <code v-pre>StreamingProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L6) <code v-pre>packages/streaming/src/types.ts</code>

```ts
export type StreamingProvider = 'kafka' | 'redpanda' | 'nats';
```

#### <code v-pre>SubjectNamingStrategy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L44) <code v-pre>packages/streaming/src/types.ts</code>

Subject naming strategy — how subjects derive from topic.

```ts
export type SubjectNamingStrategy = 'topic-name' | 'record-name' | 'topic-record-name';
```

#### <code v-pre>TransactionalProducer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L79) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface TransactionalProducer {
    readonly [TRANSACTIONAL_PRODUCER_SYMBOL]: true;
    readonly transactionalId: string;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    initTransactions(): Promise<void>;
    beginTransaction(): Promise<void>;
    send<TValue = unknown, TKey = string>(record: ProducerRecord<TValue, TKey>): Promise<PublishResult[]>;
    commitTransaction(): Promise<void>;
    abortTransaction(): Promise<void>;
    currentState(): TransactionState;
}
```

#### <code v-pre>TransactionalProducerConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L72) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export interface TransactionalProducerConfig {
    readonly kafka: KafkaMock;
    readonly transactionalId: string;
}
```

#### <code v-pre>TransactionCoordinatorState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L24) <code v-pre>packages/streaming/src/semantics/kafka-raw-protocol.ts</code>

```ts
export type TransactionCoordinatorState = 'Empty' | 'Ongoing' | 'PrepareCommit' | 'CompleteCommit' | 'PrepareAbort' | 'CompleteAbort';
```

#### <code v-pre>TransactionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L77) <code v-pre>packages/streaming/src/exactly-once.ts</code>

```ts
export type TransactionState = 'idle' | 'active' | 'committed' | 'aborted';
```

#### <code v-pre>TxnPhase</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L24) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export type TxnPhase = 'idle' | 'ongoing' | 'prepareCommit' | 'prepareAbort' | 'committed' | 'aborted';
```

#### <code v-pre>TxnRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L32) <code v-pre>packages/streaming/src/semantics/redpanda-transactions.ts</code>

```ts
export interface TxnRecord {
    readonly transactionalId: string;
    readonly producer: ProducerEpoch;
    phase: TxnPhase;
    readonly openedAt: number;
    readonly participatingPartitions: Set<string>;
}
```
<!-- kiwa-public-api:end -->
