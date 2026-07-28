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
| 'DLQ: maxAttempts must be &gt;= 1' | [packages/streaming/src/dlq.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L54) |
| 'transactional producer: already initialized' | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L124) |
| 'transactional producer: initTransactions() not called' | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L129) |
| 'transactional producer: transaction already active' | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L131) |
| 'transactional producer: no active transaction' | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L141) |
| 'transactional producer: no active transaction to commit' | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L154) |
| 'transactional producer: no active transaction to abort' | [packages/streaming/src/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L166) |
| &#96;kafka mock: partition $&#123;explicit&#125; out of range 0..$&#123;topic.numPartitions - 1&#125; for topic "$&#123;topic.topic&#125;"&#96; | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L174) |
| &#96;kafka mock: partition $&#123;partition&#125; missing on "$&#123;topic.topic&#125;"&#96; | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L203) |
| 'kafka mock: producer.send before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L273) |
| 'kafka mock: consumer.subscribe before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L358) |
| 'kafka mock: consumer.run before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L373) |
| 'kafka mock: admin.createTopics before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L436) |
| 'kafka mock: admin.listTopics before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L442) |
| 'kafka mock: admin.deleteTopics before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L446) |
| 'kafka mock: admin.fetchTopicMetadata before connect' | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L450) |
| &#96;kafka mock: unknown topic "$&#123;name&#125;"&#96; | [packages/streaming/src/kafka.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L454) |
| &#96;nats mock: '&gt;' wildcard must be the last token in "$&#123;pattern&#125;"&#96; | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L162) |
| 'jetstream: stream must declare at least one subject' | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L212) |
| &#96;jetstream: no stream matches subject "$&#123;subject&#125;"&#96; | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L223) |
| &#96;jetstream: stream "$&#123;streamName&#125;" not found&#96; | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L243) |
| &#96;nats mock: request to "$&#123;subject&#125;" received no reply&#96; | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L364) |
| &#96;nats mock: kv bucket "$&#123;bucket&#125;" not found&#96; | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L377) |
| &#96;nats mock: object bucket "$&#123;bucket&#125;" not found&#96; | [packages/streaming/src/nats.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L415) |
| &#96;schema-registry: incompatible schema for subject "$&#123;input.subject&#125;" (mode=$&#123;check.mode&#125;): $&#123;check.reasons.join('; ')&#125;&#96; | [packages/streaming/src/schema-registry.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L97) |
| &#96;exactly-once ($&#123;cfg.provider&#125;): abort without active transaction&#96; | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L113) |
| &#96;exactly-once ($&#123;cfg.provider&#125;): begin without commit/abort of previous txn&#96; | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L74) |
| &#96;exactly-once ($&#123;cfg.provider&#125;): send without active transaction&#96; | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L85) |
| &#96;exactly-once ($&#123;cfg.provider&#125;): commit without active transaction&#96; | [packages/streaming/src/semantics/exactly-once.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L91) |
| &#96;kafka consumer-group: unknown member $&#123;memberId&#125;&#96; | [packages/streaming/src/semantics/kafka-consumer-group.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L220) |
| &#96;kafka raw-protocol: unknown producer id $&#123;producerId&#125;&#96; | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L144) |
| &#96;kafka raw-protocol: txn state mismatch — current=$&#123;txnState&#125;, requested from=$&#123;from&#125;&#96; | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L156) |
| &#96;kafka raw-protocol: invalid txn transition $&#123;from&#125; -&gt; $&#123;to&#125;&#96; | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L162) |
| &#96;kafka raw-protocol: fetch session $&#123;sessionId&#125; not open&#96; | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L178) |
| &#96;kafka raw-protocol: ISR size cannot exceed replicationFactor=$&#123;cfg.replicationFactor&#125;&#96; | [packages/streaming/src/semantics/kafka-raw-protocol.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L187) |
| &#96;nats kv-object: unknown KV bucket "$&#123;bucket&#125;"&#96; | [packages/streaming/src/semantics/nats-kv-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L135) |
| &#96;nats kv-object: unknown object bucket "$&#123;bucket&#125;"&#96; | [packages/streaming/src/semantics/nats-kv-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L141) |
| &#96;redpanda schema-evolution: incompatible schema for "$&#123;input.subject&#125;" (mode=$&#123;check.mode&#125;): $&#123;check.reasons.join('; ')&#125;&#96; | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L157) |
| &#96;redpanda schema-evolution: unknown reference subject "$&#123;r.subject&#125;"&#96; | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L166) |
| &#96;redpanda schema-evolution: reference version $&#123;r.version&#125; not registered for "$&#123;r.subject&#125;"&#96; | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L170) |
| 'redpanda schema-evolution: record-name strategy needs a recordName' | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L215) |
| 'redpanda schema-evolution: topic-record-name strategy needs a recordName' | [packages/streaming/src/semantics/redpanda-schema-evolution.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L219) |
| &#96;redpanda transactions: transaction already ongoing for "$&#123;transactionalId&#125;"&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L130) |
| &#96;redpanda transactions: no open transaction for "$&#123;transactionalId&#125;"&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L142) |
| &#96;redpanda transactions: cannot add partition in phase=$&#123;txn.phase&#125;&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L144) |
| &#96;redpanda transactions: no open transaction for "$&#123;transactionalId&#125;"&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L150) |
| &#96;redpanda transactions: cannot commit in phase=$&#123;txn.phase&#125;&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L152) |
| &#96;redpanda transactions: no open transaction for "$&#123;transactionalId&#125;"&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L159) |
| &#96;redpanda transactions: unknown transactionalId "$&#123;transactionalId&#125;"&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L183) |
| &#96;redpanda transactions: producer id mismatch — got $&#123;provided.producerId&#125;, current $&#123;current.producerId&#125;&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L186) |
| &#96;redpanda transactions: InvalidProducerEpoch — got $&#123;provided.epoch&#125;, current $&#123;current.epoch&#125;&#96; | [packages/streaming/src/semantics/redpanda-transactions.ts](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L191) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `compileSubject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L156) `packages/streaming/src/nats.ts`

Compile a NATS subject pattern (`orders.&gt;`, `orders.*.created`) into a regex. `*` matches exactly one token, `&gt;` matches one or more trailing tokens. Literal matches are supported as-is.

```ts
export declare function compileSubject(pattern: string): SubjectMatcher;
```

#### `CONSUMER_LAG_TELEMETRY_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L13) `packages/streaming/src/semantics/consumer-lag-telemetry.ts`

```ts
export declare const CONSUMER_LAG_TELEMETRY_SYMBOL: unique symbol;
```

#### `createConsumerLagTelemetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L97) `packages/streaming/src/semantics/consumer-lag-telemetry.ts`

Create a consumer-lag + telemetry aggregator. Producers call `recordHighWatermark` on each append, consumers call `recordCommittedOffset` on each commit. `snapshot()` returns the pair as a single row — the same shape observability platforms pull off Kafka via JMX exports.

```ts
export declare function createConsumerLagTelemetry(config: ConsumerLagTelemetryConfig): ConsumerLagTelemetry;
```

#### `createDeadLetterQueue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L50) `packages/streaming/src/dlq.ts`

Create a DLQ-aware handler. Each incoming message is invoked against `handler`; on error, the message is re-tried up to `retryPolicy.maxAttempts` total attempts. When the budget is exhausted, the message is quarantined with the last error message + attempt count.

```ts
export declare function createDeadLetterQueue<TValue = unknown, TKey = string>(config: DeadLetterQueueConfig<TValue, TKey>): DeadLetterQueue<TValue, TKey>;
```

#### `createExactlyOnceSemantics`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L55) `packages/streaming/src/semantics/exactly-once.ts`

Create the cross-provider exactly-once semantics wrapper. Records enqueued between `begin()` and `commit()` become part of an atomic batch — nothing lands until commit succeeds. `abort()` discards the batch, and a `read-committed` filter excludes any message tagged with an aborted batch id (delivered as a header `x-kiwa-txn-aborted: true`).

```ts
export declare function createExactlyOnceSemantics<TValue = unknown>(config: ExactlyOnceConfig): ExactlyOnceSemantics<TValue>;
```

#### `createFidelityHarness`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L59) `packages/streaming/src/semantics/fidelity-harness.ts`

Default grid — Kafka + Redpanda cover the Kafka-shaped axes (raw protocol, consumer group, schema evolution, transactions, exactly-once, lag). NATS covers the JetStream + KV/Object axes + shares exactly-once + lag. `not-applicable` marks a real-world mismatch (e.g. NATS has no raw Kafka wire protocol) so tests can distinguish "missing on purpose" from "todo".

```ts
export declare function createFidelityHarness(): FidelityHarness;
```

#### `createIdempotentProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L39) `packages/streaming/src/exactly-once.ts`

Idempotent producer — dedups (producerId, sequenceNumber) pairs so retries from the client side don't produce double writes. Kafka's real implementation stores (pid, seq) → last offset per partition; the mock uses a single global set which is enough to model the observable behavior.

```ts
export declare function createIdempotentProducer(config: IdempotentProducerConfig): IdempotentProducer;
```

#### `createKafkaConsumerGroup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L91) `packages/streaming/src/semantics/kafka-consumer-group.ts`

Create a coordinator-side consumer-group model. Static members (`groupInstanceId` set) survive a re-join without triggering a rebalance — this is the KIP-345 flow that keeps assignments sticky across pod restarts. Cooperative protocol emits `reassignedMembers` = only those whose partitions moved, so tests can assert incremental behavior.

```ts
export declare function createKafkaConsumerGroup(config: KafkaConsumerGroupConfig): KafkaConsumerGroup;
```

#### `createKafkaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L141) `packages/streaming/src/kafka.ts`

Create a Kafka-shaped mock — the object returned mirrors the surface of `new Kafka({...})` from the `kafkajs` package. Every producer / consumer / admin issued from the same mock shares topic state so tests can write in one client and assert in another.

```ts
export declare function createKafkaMock(config?: KafkaMockConfig): KafkaMock;
```

#### `createKafkaRawProtocol`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L114) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

Create a Kafka raw-protocol semantics model. Exposes the pieces of the wire protocol that show up in exactly-once tests: producer id + epoch, txn coordinator state, incremental fetch sessions, and ISR + high-watermark.

```ts
export declare function createKafkaRawProtocol(config?: KafkaRawProtocolConfig): KafkaRawProtocol;
```

#### `createNatsJetStreamDurable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L102) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

Create a durable-consumer model. `deliver(now)` picks the next eligible message (either a new one or a redelivery whose backoff has elapsed) and increments its attempt count. On the `maxDeliver`+1st failure, the message is quarantined for inspection.

```ts
export declare function createNatsJetStreamDurable<TValue = unknown>(config: DurableConsumerConfig): NatsJetStreamDurable<TValue>;
```

#### `createNatsKvObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L129) `packages/streaming/src/semantics/nats-kv-object.ts`

Create a combined KV + Object-store model. KV supports history depth + delete tombstones; Object splits inputs into chunks with per-chunk digest and an optional LZ4-tagged compression pass so tests can validate the chunk boundary + digest + reassembly.

```ts
export declare function createNatsKvObject(): NatsKvObject;
```

#### `createNatsMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L187) `packages/streaming/src/nats.ts`

Create a NATS-shaped mock — the returned object mirrors the surface of `connect({...})` from the `nats` package. All subscriptions / streams / stores share one instance so tests can publish in one place and observe in another.

```ts
export declare function createNatsMock(config?: NatsMockConfig): NatsMock;
```

#### `createReadCommittedFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L203) `packages/streaming/src/exactly-once.ts`

Read-committed filter — shaped like kafkajs's `isolationLevel: 'read_committed'` consumer flag. In the mock, aborted transactions are never flushed to the underlying broker so the filter is a no-op by construction; the identity exists as a symmetric API surface for tests.

```ts
export declare function createReadCommittedFilter(level?: IsolationLevel): ReadCommittedFilter;
```

#### `createRedpandaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L35) `packages/streaming/src/redpanda.ts`

Create a Redpanda-shaped mock. Under the hood it's the same broker mock as Kafka + a schema registry — the split exists so tests targeting Redpanda can pick the exact symbol / surface they want to assert against.

```ts
export declare function createRedpandaMock(config?: RedpandaMockConfig): RedpandaMock;
```

#### `createRedpandaSchemaEvolution`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L131) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

Create a Redpanda schema-evolution registry. Registration enforces the subject's current compat mode + tracks a schema reference graph (`references`) so tests can validate composed schemas (Order → Address).

```ts
export declare function createRedpandaSchemaEvolution(config?: RedpandaSchemaEvolutionConfig): RedpandaSchemaEvolution;
```

#### `createRedpandaTransactions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L82) `packages/streaming/src/semantics/redpanda-transactions.ts`

Create the Redpanda transaction coordinator model. Fencing is enforced via `guardEpoch(transactionalId, providedEpoch)` — the same call the broker uses to reject stale producers when the same `transactional.id` re-registers.

```ts
export declare function createRedpandaTransactions(config?: RedpandaTransactionsConfig): RedpandaTransactions;
```

#### `createSchemaRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L74) `packages/streaming/src/schema-registry.ts`

Create a Confluent-shaped schema registry mock. Every registered schema gets a monotonically increasing id + subject-scoped version. Compatibility enforcement is structural — see `checkCompatibility` for the rule set.

```ts
export declare function createSchemaRegistry(config?: SchemaRegistryConfig): SchemaRegistry;
```

#### `createTransactionalProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L104) `packages/streaming/src/exactly-once.ts`

Transactional producer — messages sent between beginTransaction() and commitTransaction() are only visible to read-committed consumers after the commit lands. abortTransaction() marks the batch aborted and read-committed consumers skip it entirely. The mock defers the actual `producer.send()` until commit — this matches the observable behavior read-committed consumers see, without modeling the transaction coordinator's on-disk state.

```ts
export declare function createTransactionalProducer(config: TransactionalProducerConfig): TransactionalProducer;
```

#### `dispatchPipelineEvent`

公開 entry point から解決しています。

`dispatchEvent` を `dispatchPipelineEvent` として公開しています。

```ts
export {
  startPipeline,
  dispatchEvent as dispatchPipelineEvent,
  summarizePipeline,
} from './pipeline-orchestrator.js';
```

#### `DLQ_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L10) `packages/streaming/src/dlq.ts`

```ts
export declare const DLQ_SYMBOL: unique symbol;
```

#### `EXACTLY_ONCE_SEMANTICS_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L12) `packages/streaming/src/semantics/exactly-once.ts`

```ts
export declare const EXACTLY_ONCE_SEMANTICS_SYMBOL: unique symbol;
```

#### `FIDELITY_HARNESS_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L9) `packages/streaming/src/semantics/fidelity-harness.ts`

```ts
export declare const FIDELITY_HARNESS_SYMBOL: unique symbol;
```

#### `IDEMPOTENT_PRODUCER_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L10) `packages/streaming/src/exactly-once.ts`

```ts
export declare const IDEMPOTENT_PRODUCER_SYMBOL: unique symbol;
```

#### `isConsumerLagTelemetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L193) `packages/streaming/src/semantics/consumer-lag-telemetry.ts`

Type guard: recognize a ConsumerLagTelemetry.

```ts
export declare function isConsumerLagTelemetry(value: unknown): value is ConsumerLagTelemetry;
```

#### `isDeadLetterQueue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L120) `packages/streaming/src/dlq.ts`

Type guard: recognize a DeadLetterQueue.

```ts
export declare function isDeadLetterQueue(value: unknown): value is DeadLetterQueue;
```

#### `isExactlyOnceSemantics`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L142) `packages/streaming/src/semantics/exactly-once.ts`

Type guard: recognize an ExactlyOnceSemantics wrapper.

```ts
export declare function isExactlyOnceSemantics(value: unknown): value is ExactlyOnceSemantics<unknown>;
```

#### `isFidelityHarness`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L121) `packages/streaming/src/semantics/fidelity-harness.ts`

Type guard: recognize a FidelityHarness.

```ts
export declare function isFidelityHarness(value: unknown): value is FidelityHarness;
```

#### `isIdempotentProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L221) `packages/streaming/src/exactly-once.ts`

Type guard: recognize an IdempotentProducer.

```ts
export declare function isIdempotentProducer(value: unknown): value is IdempotentProducer;
```

#### `isKafkaConsumerGroup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L264) `packages/streaming/src/semantics/kafka-consumer-group.ts`

Type guard: recognize a KafkaConsumerGroup.

```ts
export declare function isKafkaConsumerGroup(value: unknown): value is KafkaConsumerGroup;
```

#### `isKafkaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L488) `packages/streaming/src/kafka.ts`

Type guard: recognize a KafkaMock.

```ts
export declare function isKafkaMock(value: unknown): value is KafkaMock;
```

#### `isKafkaRawProtocol`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L235) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

Type guard: recognize a KafkaRawProtocol.

```ts
export declare function isKafkaRawProtocol(value: unknown): value is KafkaRawProtocol;
```

#### `isNatsJetStreamDurable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L247) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

Type guard: recognize a NatsJetStreamDurable.

```ts
export declare function isNatsJetStreamDurable(value: unknown): value is NatsJetStreamDurable<unknown>;
```

#### `isNatsKvObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L296) `packages/streaming/src/semantics/nats-kv-object.ts`

Type guard: recognize a NatsKvObject.

```ts
export declare function isNatsKvObject(value: unknown): value is NatsKvObject;
```

#### `isNatsMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L488) `packages/streaming/src/nats.ts`

Type guard: recognize a NatsMock.

```ts
export declare function isNatsMock(value: unknown): value is NatsMock;
```

#### `isRealDriverMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L130) `packages/streaming/src/semantics/fidelity-harness.ts`

Env-gate — returns whether tests should also run the real driver against KIWA_MODE=real.

```ts
export declare function isRealDriverMode(env?: NodeJS.ProcessEnv): boolean;
```

#### `isRedpandaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L63) `packages/streaming/src/redpanda.ts`

Type guard: recognize a RedpandaMock.

```ts
export declare function isRedpandaMock(value: unknown): value is RedpandaMock;
```

#### `isRedpandaSchemaEvolution`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L243) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

Type guard: recognize a RedpandaSchemaEvolution.

```ts
export declare function isRedpandaSchemaEvolution(value: unknown): value is RedpandaSchemaEvolution;
```

#### `isRedpandaTransactions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L206) `packages/streaming/src/semantics/redpanda-transactions.ts`

Type guard: recognize a RedpandaTransactions instance.

```ts
export declare function isRedpandaTransactions(value: unknown): value is RedpandaTransactions;
```

#### `isSchemaRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L237) `packages/streaming/src/schema-registry.ts`

Type guard: recognize a SchemaRegistry.

```ts
export declare function isSchemaRegistry(value: unknown): value is SchemaRegistry;
```

#### `isTransactionalProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L230) `packages/streaming/src/exactly-once.ts`

Type guard: recognize a TransactionalProducer.

```ts
export declare function isTransactionalProducer(value: unknown): value is TransactionalProducer;
```

#### `KAFKA_ADMIN_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L18) `packages/streaming/src/kafka.ts`

```ts
export declare const KAFKA_ADMIN_SYMBOL: unique symbol;
```

#### `KAFKA_CONSUMER_GROUP_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L10) `packages/streaming/src/semantics/kafka-consumer-group.ts`

```ts
export declare const KAFKA_CONSUMER_GROUP_SYMBOL: unique symbol;
```

#### `KAFKA_CONSUMER_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L17) `packages/streaming/src/kafka.ts`

```ts
export declare const KAFKA_CONSUMER_SYMBOL: unique symbol;
```

#### `KAFKA_MOCK_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L15) `packages/streaming/src/kafka.ts`

```ts
export declare const KAFKA_MOCK_SYMBOL: unique symbol;
```

#### `KAFKA_PRODUCER_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L16) `packages/streaming/src/kafka.ts`

```ts
export declare const KAFKA_PRODUCER_SYMBOL: unique symbol;
```

#### `KAFKA_RAW_PROTOCOL_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L15) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

```ts
export declare const KAFKA_RAW_PROTOCOL_SYMBOL: unique symbol;
```

#### `matchSubject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L177) `packages/streaming/src/nats.ts`

Match a subject against a compiled pattern.

```ts
export declare function matchSubject(matcher: SubjectMatcher, subject: string): boolean;
```

#### `NATS_JETSTREAM_DURABLE_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L12) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

```ts
export declare const NATS_JETSTREAM_DURABLE_SYMBOL: unique symbol;
```

#### `NATS_JETSTREAM_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L13) `packages/streaming/src/nats.ts`

```ts
export declare const NATS_JETSTREAM_SYMBOL: unique symbol;
```

#### `NATS_KV_OBJECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L11) `packages/streaming/src/semantics/nats-kv-object.ts`

```ts
export declare const NATS_KV_OBJECT_SYMBOL: unique symbol;
```

#### `NATS_KV_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L14) `packages/streaming/src/nats.ts`

```ts
export declare const NATS_KV_SYMBOL: unique symbol;
```

#### `NATS_MOCK_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L12) `packages/streaming/src/nats.ts`

```ts
export declare const NATS_MOCK_SYMBOL: unique symbol;
```

#### `NATS_OBJECT_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L15) `packages/streaming/src/nats.ts`

```ts
export declare const NATS_OBJECT_SYMBOL: unique symbol;
```

#### `READ_COMMITTED_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L12) `packages/streaming/src/exactly-once.ts`

```ts
export declare const READ_COMMITTED_SYMBOL: unique symbol;
```

#### `REDPANDA_MOCK_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L14) `packages/streaming/src/redpanda.ts`

```ts
export declare const REDPANDA_MOCK_SYMBOL: unique symbol;
```

#### `REDPANDA_SCHEMA_EVOLUTION_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L13) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

```ts
export declare const REDPANDA_SCHEMA_EVOLUTION_SYMBOL: unique symbol;
```

#### `REDPANDA_TRANSACTIONS_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L11) `packages/streaming/src/semantics/redpanda-transactions.ts`

```ts
export declare const REDPANDA_TRANSACTIONS_SYMBOL: unique symbol;
```

#### `requiredKeyFor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L139) `packages/streaming/src/semantics/fidelity-harness.ts`

Which real-driver key an axis requires when KIWA_MODE=real is set. Tests check `requiredKeyFor(cell.axis)` and skip the real-driver assertion when the corresponding env var isn't present.

```ts
export declare function requiredKeyFor(axis: SemanticsAxis): string | null;
```

#### `SCHEMA_REGISTRY_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L12) `packages/streaming/src/schema-registry.ts`

```ts
export declare const SCHEMA_REGISTRY_SYMBOL: unique symbol;
```

#### `startPipeline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L41) `packages/streaming/src/semantics/pipeline-orchestrator.ts`

```ts
export declare function startPipeline(input: {
    timestamp: string;
}): PipelineSession;
```

#### `summarizePipeline`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L158) `packages/streaming/src/semantics/pipeline-orchestrator.ts`

```ts
export declare function summarizePipeline(session: PipelineSession): PipelineSummary;
```

#### `TRANSACTIONAL_PRODUCER_SYMBOL`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L11) `packages/streaming/src/exactly-once.ts`

```ts
export declare const TRANSACTIONAL_PRODUCER_SYMBOL: unique symbol;
```

### 型

#### `AckPendingEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L40) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

```ts
export interface AckPendingEntry {
    readonly seq: number;
    readonly deliveries: number;
    readonly lastDeliveredAt: number;
}
```

#### `AckPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L16) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

```ts
export type AckPolicy = 'explicit' | 'all' | 'none';
```

#### `BackoffKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L12) `packages/streaming/src/dlq.ts`

```ts
export type BackoffKind = 'constant' | 'linear' | 'exponential';
```

#### `CellStatus`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L21) `packages/streaming/src/semantics/fidelity-harness.ts`

```ts
export type CellStatus = 'implemented' | 'not-applicable' | 'planned';
```

#### `CommittedOffset`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L82) `packages/streaming/src/kafka.ts`

```ts
export interface CommittedOffset {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
}
```

#### `CompatibilityCheckResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L30) `packages/streaming/src/schema-registry.ts`

```ts
export interface CompatibilityCheckResult {
    readonly compatible: boolean;
    readonly mode: CompatibilityMode;
    readonly reasons: readonly string[];
}
```

#### `CompatibilityMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L51) `packages/streaming/src/types.ts`

Compatibility mode — controls whether a new schema version can be registered against an existing subject. See Confluent Schema Registry docs for the canonical semantics; the mock enforces the intent, not every corner case.

```ts
export type CompatibilityMode = 'BACKWARD' | 'FORWARD' | 'FULL' | 'BACKWARD_TRANSITIVE' | 'FORWARD_TRANSITIVE' | 'FULL_TRANSITIVE' | 'NONE';
```

#### `CompressionKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L13) `packages/streaming/src/semantics/nats-kv-object.ts`

```ts
export type CompressionKind = 'none' | 'lz4';
```

#### `ConsumerConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L49) `packages/streaming/src/kafka.ts`

```ts
export interface ConsumerConfig {
    readonly groupId: string;
    readonly partitionAssigner?: PartitionAssigner;
    readonly sessionTimeoutMs?: number;
}
```

#### `ConsumerLagTelemetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L36) `packages/streaming/src/semantics/consumer-lag-telemetry.ts`

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

#### `ConsumerLagTelemetryConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L17) `packages/streaming/src/semantics/consumer-lag-telemetry.ts`

```ts
export interface ConsumerLagTelemetryConfig {
    readonly provider: StreamingProvider;
    /** Refresh interval in ms — throttles snapshot generation. Default 5_000. */
    readonly refreshIntervalMs?: number;
}
```

#### `DeadLetterEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L33) `packages/streaming/src/types.ts`

DLQ (dead-letter queue) entry — a message that exceeded retry budget.

```ts
export interface DeadLetterEntry<TValue = unknown, TKey = string> {
    readonly original: StreamingMessage<TValue, TKey>;
    readonly attempts: number;
    readonly reason: string;
    readonly quarantinedAt: number;
}
```

#### `DeadLetterQueue`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L31) `packages/streaming/src/dlq.ts`

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

#### `DeadLetterQueueConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L23) `packages/streaming/src/dlq.ts`

```ts
export interface DeadLetterQueueConfig<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly handler: MessageHandler<TValue, TKey>;
    readonly retryPolicy: RetryPolicy;
    /** Optional callback that receives every quarantined entry — useful for alert wiring. */
    readonly onDeadLetter?: (entry: DeadLetterEntry<TValue, TKey>) => void;
}
```

#### `DeliveryAttempt`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L33) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

```ts
export interface DeliveryAttempt<TValue = unknown> {
    readonly seq: number;
    readonly attempt: number;
    readonly deliveredAt: number;
    readonly message: StreamingMessage<TValue>;
}
```

#### `DurableConsumerConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L18) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

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

#### `EvolutionCheckResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L38) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

```ts
export interface EvolutionCheckResult {
    readonly compatible: boolean;
    readonly mode: CompatibilityMode;
    readonly reasons: readonly string[];
}
```

#### `EvolutionSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L28) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

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

#### `ExactlyOnceConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L18) `packages/streaming/src/semantics/exactly-once.ts`

```ts
export interface ExactlyOnceConfig {
    readonly provider: StreamingProvider;
    readonly transactionalId: string;
    readonly isolationLevel?: IsolationLevel;
}
```

#### `ExactlyOnceIsolationLevel`

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

#### `ExactlyOnceSemantics`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L32) `packages/streaming/src/semantics/exactly-once.ts`

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

#### `ExactlyOnceTxnState`

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

#### `FetchSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L37) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

```ts
export interface FetchSession {
    readonly sessionId: number;
    epoch: number;
}
```

#### `FidelityCell`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L23) `packages/streaming/src/semantics/fidelity-harness.ts`

```ts
export interface FidelityCell {
    readonly provider: StreamingProvider;
    readonly axis: SemanticsAxis;
    readonly status: CellStatus;
    readonly note?: string;
}
```

#### `FidelityHarness`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L30) `packages/streaming/src/semantics/fidelity-harness.ts`

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

#### `GroupMember`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L22) `packages/streaming/src/semantics/kafka-consumer-group.ts`

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

#### `IdempotentProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L20) `packages/streaming/src/exactly-once.ts`

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

#### `IdempotentProducerConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L14) `packages/streaming/src/exactly-once.ts`

```ts
export interface IdempotentProducerConfig {
    readonly kafka: KafkaMock;
    /** Producer identity used for dedup. In real Kafka this is broker-assigned. */
    readonly producerId?: string;
}
```

#### `IsolationLevel`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L179) `packages/streaming/src/exactly-once.ts`

```ts
export type IsolationLevel = 'read-committed' | 'read-uncommitted';
```

#### `JetStreamConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L33) `packages/streaming/src/nats.ts`

```ts
export interface JetStreamConfig {
    readonly name: string;
    readonly subjects: readonly string[];
    /** Retention policy — `limits` = size/time based, `interest` = consumer-based, `workqueue` = consume-once. */
    readonly retention?: 'limits' | 'interest' | 'workqueue';
    readonly maxMsgs?: number;
}
```

#### `JetStreamConsumer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L53) `packages/streaming/src/nats.ts`

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

#### `JetStreamConsumerConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L47) `packages/streaming/src/nats.ts`

```ts
export interface JetStreamConsumerConfig {
    readonly durable: string;
    readonly filterSubject?: string;
    readonly ackPolicy?: 'explicit' | 'none' | 'all';
}
```

#### `JetStreamPublishAck`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L41) `packages/streaming/src/nats.ts`

```ts
export interface JetStreamPublishAck {
    readonly stream: string;
    readonly seq: number;
    readonly duplicate: boolean;
}
```

#### `JetStreamStore`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L60) `packages/streaming/src/nats.ts`

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

#### `KafkaAdmin`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L88) `packages/streaming/src/kafka.ts`

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

#### `KafkaConsumer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L66) `packages/streaming/src/kafka.ts`

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

#### `KafkaConsumerGroup`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L39) `packages/streaming/src/semantics/kafka-consumer-group.ts`

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

#### `KafkaConsumerGroupConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L14) `packages/streaming/src/semantics/kafka-consumer-group.ts`

```ts
export interface KafkaConsumerGroupConfig {
    readonly groupId: string;
    /** `sessionTimeoutMs` from KIP-32 — heartbeat expiry window. Default 30_000. */
    readonly sessionTimeoutMs?: number;
    /** Rebalance protocol — `cooperative` = KIP-429 incremental. Default `eager`. */
    readonly protocol?: RebalanceProtocol;
}
```

#### `KafkaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L105) `packages/streaming/src/kafka.ts`

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

#### `KafkaMockConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L22) `packages/streaming/src/kafka.ts`

```ts
export interface KafkaMockConfig {
    readonly clientId?: string;
    readonly brokers?: readonly string[];
    /** Default partition count for auto-created topics. */
    readonly defaultPartitionCount?: number;
}
```

#### `KafkaProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L55) `packages/streaming/src/kafka.ts`

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

#### `KafkaRawProtocol`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L42) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

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

#### `KafkaRawProtocolConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L17) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

```ts
export interface KafkaRawProtocolConfig {
    /** How many replicas a partition has. Default 3, matches broker.default. */
    readonly replicationFactor?: number;
    /** min.insync.replicas — commit gate. Default 2. */
    readonly minInSyncReplicas?: number;
}
```

#### `KafkaTopicSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L29) `packages/streaming/src/kafka.ts`

```ts
export interface KafkaTopicSpec {
    readonly topic: string;
    readonly numPartitions: number;
    /** Optional per-partition ownership map — group id → member id. */
    readonly assignments?: ReadonlyMap<number, string>;
}
```

#### `KvBucketConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L15) `packages/streaming/src/semantics/nats-kv-object.ts`

```ts
export interface KvBucketConfig {
    readonly bucket: string;
    /** History depth — max revisions kept per key. Default 1. */
    readonly historyDepth?: number;
    /** ttl in ms — 0 = keep forever. Default 0. */
    readonly ttlMs?: number;
}
```

#### `KVEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L79) `packages/streaming/src/nats.ts`

```ts
export interface KVEntry<TValue = unknown> {
    readonly bucket: string;
    readonly key: string;
    readonly value: TValue;
    readonly revision: number;
    readonly timestamp: number;
}
```

#### `KvRevision`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L23) `packages/streaming/src/semantics/nats-kv-object.ts`

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

#### `KVStore`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L69) `packages/streaming/src/nats.ts`

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

#### `KvWatchEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L32) `packages/streaming/src/semantics/nats-kv-object.ts`

```ts
export interface KvWatchEvent<TValue = unknown> {
    readonly revision: KvRevision<TValue>;
}
```

#### `MessageHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L28) `packages/streaming/src/types.ts`

Handler shape shared by consumer / group / subject subscribers.

```ts
export type MessageHandler<TValue = unknown, TKey = string> = (message: StreamingMessage<TValue, TKey>) => void | Promise<void>;
```

#### `NatsJetStreamDurable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L53) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

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

#### `NatsKvObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L58) `packages/streaming/src/semantics/nats-kv-object.ts`

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

#### `NatsMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L109) `packages/streaming/src/nats.ts`

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

#### `NatsMockConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L17) `packages/streaming/src/nats.ts`

```ts
export interface NatsMockConfig {
    readonly servers?: readonly string[];
    readonly name?: string;
}
```

#### `NatsPublishOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L22) `packages/streaming/src/nats.ts`

```ts
export interface NatsPublishOptions {
    readonly headers?: Record<string, string>;
    readonly reply?: string;
}
```

#### `NatsSubscription`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L27) `packages/streaming/src/nats.ts`

```ts
export interface NatsSubscription {
    readonly subject: string;
    unsubscribe(): void;
    isClosed(): boolean;
}
```

#### `ObjectBucketConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L36) `packages/streaming/src/semantics/nats-kv-object.ts`

```ts
export interface ObjectBucketConfig {
    readonly bucket: string;
    /** Chunk size in bytes for object writes. Default 128 * 1024. */
    readonly chunkSizeBytes?: number;
    readonly compression?: CompressionKind;
}
```

#### `ObjectChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L43) `packages/streaming/src/semantics/nats-kv-object.ts`

```ts
export interface ObjectChunk {
    readonly index: number;
    readonly bytes: Uint8Array;
    readonly digest: string;
}
```

#### `ObjectEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L104) `packages/streaming/src/nats.ts`

```ts
export interface ObjectEntry {
    readonly info: ObjectInfo;
    readonly data: Uint8Array;
}
```

#### `ObjectInfo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L96) `packages/streaming/src/nats.ts`

```ts
export interface ObjectInfo {
    readonly bucket: string;
    readonly name: string;
    readonly size: number;
    readonly digest: string;
    readonly timestamp: number;
}
```

#### `ObjectRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-kv-object.ts#L49) `packages/streaming/src/semantics/nats-kv-object.ts`

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

#### `ObjectStore`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/nats.ts#L87) `packages/streaming/src/nats.ts`

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

#### `OffsetSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/consumer-lag-telemetry.ts#L23) `packages/streaming/src/semantics/consumer-lag-telemetry.ts`

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

#### `PartitionAssigner`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L20) `packages/streaming/src/kafka.ts`

```ts
export type PartitionAssigner = 'range' | 'round-robin';
```

#### `PendingRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/exactly-once.ts#L24) `packages/streaming/src/semantics/exactly-once.ts`

```ts
export interface PendingRecord<TValue = unknown> {
    readonly topic: string;
    readonly value: TValue;
    readonly key: string | null;
}
```

#### `PipelineEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L21) `packages/streaming/src/semantics/pipeline-orchestrator.ts`

```ts
export type PipelineEvent = 'produce-succeeded' | 'produce-failed' | 'consume-succeeded' | 'consume-failed' | 'rebalance-triggered' | 'rebalance-completed' | 'dlq-message-added' | 'stop-requested';
```

#### `PipelineSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L31) `packages/streaming/src/semantics/pipeline-orchestrator.ts`

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

#### `PipelineState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L14) `packages/streaming/src/semantics/pipeline-orchestrator.ts`

v2.1 pipeline-orchestrator = producer + consumer group + exactly-once + DLQ + schema registry の 継続合成 layer。 Streaming pair v0.1 → v2.1 = 5 段深化到達 = **depth-5 pattern 6 例目発生** (Mobile + Desktop + quality-metrics + Payment + Realtime + Streaming = 6 pair 到達 = **systematic law confirmed**)、 pattern 昇格階段 の 最上位 = kiwa 全体 の 必ず守る 最上位規範化 confirmed。 shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.3) 変更 0、 新規 file 追加 のみ、 backward compat 絶対維持。

```ts
export type PipelineState = 'producing' | 'consuming' | 'rebalancing' | 'dlq-active' | 'stopped';
```

#### `PipelineSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/pipeline-orchestrator.ts#L146) `packages/streaming/src/semantics/pipeline-orchestrator.ts`

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

#### `ProducerEpoch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L18) `packages/streaming/src/semantics/redpanda-transactions.ts`

```ts
export interface ProducerEpoch {
    readonly producerId: number;
    readonly epoch: number;
    readonly transactionalId?: string;
}
```

#### `ProducerIdentity`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L32) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

```ts
export interface ProducerIdentity {
    readonly producerId: number;
    readonly epoch: number;
}
```

#### `ProducerMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L41) `packages/streaming/src/kafka.ts`

```ts
export interface ProducerMessage<TValue = unknown, TKey = string> {
    readonly key?: TKey;
    readonly value: TValue;
    readonly partition?: number;
    readonly headers?: Record<string, string>;
    readonly timestamp?: number;
}
```

#### `ProducerRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/kafka.ts#L36) `packages/streaming/src/kafka.ts`

```ts
export interface ProducerRecord<TValue = unknown, TKey = string> {
    readonly topic: string;
    readonly messages: readonly ProducerMessage<TValue, TKey>[];
}
```

#### `PublishResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L9) `packages/streaming/src/types.ts`

Result of a single message publish.

```ts
export interface PublishResult {
    readonly topic: string;
    readonly partition: number;
    readonly offset: number;
    readonly timestamp: number;
}
```

#### `QuarantinedMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/nats-jetstream-durable.ts#L46) `packages/streaming/src/semantics/nats-jetstream-durable.ts`

```ts
export interface QuarantinedMessage<TValue = unknown> {
    readonly seq: number;
    readonly attempts: number;
    readonly message: StreamingMessage<TValue>;
    readonly reason: string;
}
```

#### `ReadCommittedFilter`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L181) `packages/streaming/src/exactly-once.ts`

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

#### `RebalanceProtocol`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L12) `packages/streaming/src/semantics/kafka-consumer-group.ts`

```ts
export type RebalanceProtocol = 'eager' | 'cooperative';
```

#### `RebalanceResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-consumer-group.ts#L31) `packages/streaming/src/semantics/kafka-consumer-group.ts`

```ts
export interface RebalanceResult {
    readonly generationId: number;
    readonly protocol: RebalanceProtocol;
    readonly assignments: ReadonlyMap<string, ReadonlyMap<string, readonly number[]>>;
    /** Members whose assignments changed compared to the previous generation. */
    readonly reassignedMembers: readonly string[];
}
```

#### `RedpandaMock`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L25) `packages/streaming/src/redpanda.ts`

RedpandaMock exposes the same producer/consumer/admin surface as KafkaMock (structural compatibility) + a colocated `schemaRegistry` field so tests can register schemas + assert compatibility without a second setup call.

```ts
export interface RedpandaMock extends KafkaMock {
    readonly [REDPANDA_MOCK_SYMBOL]: true;
    readonly schemaRegistry: SchemaRegistry;
}
```

#### `RedpandaMockConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L16) `packages/streaming/src/redpanda.ts`

```ts
export interface RedpandaMockConfig extends KafkaMockConfig {
    readonly schemaRegistry?: SchemaRegistryConfig;
}
```

#### `RedpandaSchemaEvolution`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L44) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

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

#### `RedpandaSchemaEvolutionConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L17) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

```ts
export interface RedpandaSchemaEvolutionConfig {
    readonly defaultCompatibility?: CompatibilityMode;
    readonly subjectNamingStrategy?: SubjectNamingStrategy;
}
```

#### `RedpandaTransactions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L40) `packages/streaming/src/semantics/redpanda-transactions.ts`

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

#### `RedpandaTransactionsConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L13) `packages/streaming/src/semantics/redpanda-transactions.ts`

```ts
export interface RedpandaTransactionsConfig {
    /** Transaction timeout after which the coordinator auto-aborts. Default 60_000ms. */
    readonly transactionTimeoutMs?: number;
}
```

#### `RegisteredSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L21) `packages/streaming/src/schema-registry.ts`

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

#### `RetryPolicy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/dlq.ts#L14) `packages/streaming/src/dlq.ts`

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

#### `SchemaKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L41) `packages/streaming/src/types.ts`

Schema kind supported by the schema-registry mock.

```ts
export type SchemaKind = 'avro' | 'protobuf' | 'json';
```

#### `SchemaReference`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L22) `packages/streaming/src/semantics/redpanda-schema-evolution.ts`

```ts
export interface SchemaReference {
    readonly name: string;
    readonly subject: string;
    readonly version: number;
}
```

#### `SchemaRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L36) `packages/streaming/src/schema-registry.ts`

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

#### `SchemaRegistryConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L14) `packages/streaming/src/schema-registry.ts`

```ts
export interface SchemaRegistryConfig {
    /** Default compat mode applied to new subjects. */
    readonly defaultCompatibility?: CompatibilityMode;
    /** Subject naming strategy — how tests derive subject from topic. */
    readonly subjectNamingStrategy?: SubjectNamingStrategy;
}
```

#### `SemanticsAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L11) `packages/streaming/src/semantics/fidelity-harness.ts`

```ts
export type SemanticsAxis = 'kafka-raw-protocol' | 'kafka-consumer-group' | 'redpanda-schema-evolution' | 'redpanda-transactions' | 'nats-jetstream-durable' | 'nats-kv-object' | 'exactly-once' | 'consumer-lag-telemetry';
```

#### `StreamingMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L17) `packages/streaming/src/types.ts`

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

#### `StreamingProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L6) `packages/streaming/src/types.ts`

```ts
export type StreamingProvider = 'kafka' | 'redpanda' | 'nats';
```

#### `SubjectNamingStrategy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/types.ts#L44) `packages/streaming/src/types.ts`

Subject naming strategy — how subjects derive from topic.

```ts
export type SubjectNamingStrategy = 'topic-name' | 'record-name' | 'topic-record-name';
```

#### `TransactionalProducer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L79) `packages/streaming/src/exactly-once.ts`

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

#### `TransactionalProducerConfig`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L72) `packages/streaming/src/exactly-once.ts`

```ts
export interface TransactionalProducerConfig {
    readonly kafka: KafkaMock;
    readonly transactionalId: string;
}
```

#### `TransactionCoordinatorState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/kafka-raw-protocol.ts#L24) `packages/streaming/src/semantics/kafka-raw-protocol.ts`

```ts
export type TransactionCoordinatorState = 'Empty' | 'Ongoing' | 'PrepareCommit' | 'CompleteCommit' | 'PrepareAbort' | 'CompleteAbort';
```

#### `TransactionState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/exactly-once.ts#L77) `packages/streaming/src/exactly-once.ts`

```ts
export type TransactionState = 'idle' | 'active' | 'committed' | 'aborted';
```

#### `TxnPhase`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L24) `packages/streaming/src/semantics/redpanda-transactions.ts`

```ts
export type TxnPhase = 'idle' | 'ongoing' | 'prepareCommit' | 'prepareAbort' | 'committed' | 'aborted';
```

#### `TxnRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-transactions.ts#L32) `packages/streaming/src/semantics/redpanda-transactions.ts`

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
