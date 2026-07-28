# @kiwa-lab/queue リファレンス

## 環境を作る

| 関数 | モード | 主な操作 | 停止時に解放するもの |
| --- | --- | --- | --- |
| `setupBullMQEnv` | `sandbox` `testcontainers` | `process` `addJob` | worker、queue、Redis 接続、コンテナ |
| `setupInngestEnv` | `stub` `dev-server` | `registerFunction` `sendEvent` | function 登録、起動した開発サーバー |
| `setupCloudflareQueuesEnv` | `miniflare` `wrangler` | `registerConsumer` `send` | consumer、起動した Wrangler プロセス |
| `setupSQSEnv` | `stub` `localstack` | `createQueue` `send` `receive` | queue 状態、接続した LocalStack の利用状態 |
| `setupRabbitMQEnv` | `stub` `testcontainers` | `declareExchange` `bindQueue` `publish` | consumer、channel、broker 接続 |

各 factory は非同期です。返された環境はテストが完了するたびに `await env.stop()` で終了してください。外部プロセスを自動起動するモードは、既存の endpoint または URL を指定して接続することもできます。

## BullMQ

`setupBullMQEnv` は `mode`、`redis`、`sandbox`、`queueName` を受け取ります。`mode` の既定値は `sandbox`、`queueName` の既定値は `test-queue` です。`redis` の `image` はコンテナ起動時、`url` は既存 Redis 接続時に使います。

`process` は processor を登録または置き換えます。`addJob` は `attempts`、`delay`、`jobId` を含む job option を受け取ります。結果の確認には次を使います。

- `waitForJob` は完了または失敗まで待ちます
- `assertProcessed` は完了と必要なら `returnValue` を検証します
- `assertFailed` は失敗と `retry`、`reasonMatch` を検証します
- `assertRetried` は実行回数を検証します
- `assertQueueDrained` は waiting と active の job が残っていないことを検証します
- `listJobs` は sandbox が記録した snapshot を返します

## Inngest

`setupInngestEnv` は `mode`、`functions`、`devServer`、`appId` を受け取ります。`functions` は作成時に関数を登録するための配列で、作成後は `registerFunction` でも追加または置換できます。

`sendEvent` はイベント名と payload を受け取り、イベント id を返します。`assertFunctionRan`、`assertFunctionFailed`、`assertRetried`、`assertStepRan`、`assertQueueDrained` は function id を使って実行結果を検証します。`waitForRun` と `listRuns` は結果を観察するときに使います。

## Cloudflare Queues

`setupCloudflareQueuesEnv` は `mode`、事前に作る `queues`、事前登録する `consumers`、`miniflare`、`wrangler` を受け取ります。consumer の登録には queue 名、handler、必要に応じて `maxBatchSize`、`maxRetries`、`deadLetterQueue` を渡します。

`send` は queue 名、body、任意の送信 option を受け取ります。`assertAcknowledged`、`assertDeadLettered`、`assertRetried`、`assertQueueDrained` が状態を検証し、`listMessages` と `listDeadLetters` が記録を返します。`miniflare` では retry delay、partial-batch timer、consumer concurrency を本番同等には扱いません。

## SQS

`setupSQSEnv` は `mode`、`queues`、`credentials`、`localstack` を受け取ります。queue の定義には `name`、`kind`、`visibilityTimeoutSeconds`、`redrivePolicy` を指定できます。`kind` は `standard` または `fifo` です。

`send` と `sendBatch` でメッセージを投入し、`receive` で最大十件を取得します。受信したメッセージは `delete()` で確定し、削除しなければ visibility timeout の後に再び取得対象になります。`deleteBatch`、`assertDeleted`、`assertDeadLettered`、`assertQueueDrained`、`listMessages`、`listDeadLetters` も利用できます。

## RabbitMQ

`setupRabbitMQEnv` は exchange、queue、binding を初期設定として受け取れます。作成後にも `declareExchange`、`declareQueue`、`bindQueue`、`unbindQueue` を使えます。メッセージは `publish` または `sendToQueue` で送り、`get`、`consume`、`waitForMessage`、`assertAcknowledged` などで確認します。

遅延 exchange、dead letter、cluster、federation を対象にする場合は `setupRabbitMQAdvancedEnv` と対応する型を使います。高度な AMQP 機能は stub の振る舞いだけで判定せず、実ブローカー接続のテストも用意してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>setupCloudflareQueuesEnv: cannot use env after stop()</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L108) |
| <code v-pre>dispatch: maxBatchSize must be &gt;= 1 for queue "$&#123;queueName&#125;", got $&#123;size&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L252) |
| <code v-pre>send: queueName must be a non-empty string</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L284) |
| <code v-pre>send: delaySeconds must be non-negative</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L288) |
| <code v-pre>waitForMessage: timeout waiting for queue "$&#123;queueName&#125;" after $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L330) |
| <code v-pre>assertAcknowledged: expected message on "$&#123;queueName&#125;" to be acked, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L347) |
| <code v-pre>assertAcknowledged: expected $&#123;expected.attempts&#125; attempt(s), observed $&#123;snap.attempts&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L352) |
| <code v-pre>assertDeadLettered: expected message on "$&#123;queueName&#125;" to be dead-lettered, got state=$&#123;snap.state&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L368) |
| <code v-pre>assertDeadLettered: expected $&#123;expected.attempts&#125; attempt(s), observed $&#123;snap.attempts&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L373) |
| <code v-pre>assertDeadLettered: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L378) |
| <code v-pre>assertDeadLettered: message "$&#123;snap.id&#125;" was not routed to DLQ "$&#123;expected.dlq&#125;" (observed queues: $&#123;JSON.stringify(Array.from(dlqMessages.keys()))&#125;)</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L386) |
| <code v-pre>assertRetried: expected $&#123;expectedRetries&#125; attempt(s) for "$&#123;queueName&#125;", observed $&#123;snap.attempts&#125;</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L399) |
| <code v-pre>assertQueueDrained: queue$&#123;queueName ? &#96; "$&#123;queueName&#125;"&#96; : 's'&#125; still have pending / delivered / retrying messages after 250ms</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L426) |
| <code v-pre>registerConsumer: &#96;queue&#96; must be a non-empty string identifying the source queue</code> | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L74) |
| <code v-pre>setupCloudflareQueuesEnv: unknown mode "$&#123;String(mode)&#125;" — expected "miniflare" or "wrangler"</code> | [packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts#L25) |
| <code v-pre>@kiwa-lab/queue: wrangler dev did not respond at $&#123;probeUrl&#125; within $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L42) |
| <code v-pre>"@kiwa-lab/queue: wrangler mode requires node:child&#95;process (Node &gt;= 20). Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L55) |
| <code v-pre>@kiwa-lab/queue: dev-server rejected event "$&#123;event.name&#125;" (HTTP $&#123;response.status&#125;): $&#123;body&#125;</code> | [packages/queue/src/inngest/dev-server-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L136) |
| <code v-pre>@kiwa-lab/queue: Inngest dev-server did not respond at $&#123;probeUrl&#125; within $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/inngest/dev-server-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L42) |
| <code v-pre>"@kiwa-lab/queue: dev-server mode requires node:child&#95;process (Node &gt;= 20). Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/queue/src/inngest/dev-server-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L55) |
| <code v-pre>setupInngestEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "dev-server"</code> | [packages/queue/src/inngest/setup-inngest-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/setup-inngest-env.ts#L24) |
| <code v-pre>waitForRun: timeout waiting for function "$&#123;functionId&#125;" after $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L213) |
| <code v-pre>assertFunctionRan: expected function "$&#123;functionId&#125;" to complete, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L230) |
| <code v-pre>assertFunctionRan: return value mismatch for "$&#123;functionId&#125;". expected=$&#123;wanted&#125; actual=$&#123;actual&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L238) |
| <code v-pre>assertFunctionFailed: expected function "$&#123;functionId&#125;" to fail, got state=$&#123;snap.state&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L253) |
| <code v-pre>assertFunctionFailed: expected $&#123;expected.attempts&#125; attempt(s), observed $&#123;snap.attemptsMade&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L258) |
| <code v-pre>assertFunctionFailed: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L263) |
| <code v-pre>assertRetried: expected $&#123;expectedAttempts&#125; attempt(s) for "$&#123;functionId&#125;", observed $&#123;snap.attemptsMade&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L275) |
| <code v-pre>assertStepRan: expected step "$&#123;stepId&#125;" to run in function "$&#123;functionId&#125;", observed steps=$&#123;JSON.stringify(snap.stepsRun)&#125;</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L287) |
| <code v-pre>assertQueueDrained: env still has queued / running runs after 250ms</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L309) |
| <code v-pre>setupInngestEnv: cannot use env after stop()</code> | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L69) |
| <code v-pre>&#96;assertDeadLettered: no dead-letter observed for queue $&#123;queue&#125;&#96; + (expected ? &#96; matching $&#123;JSON.stringify(expected)&#125;&#96; : '')</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L212) |
| <code v-pre>publishDelayed: exchange $&#123;input.exchange&#125; is not a delayed exchange</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L235) |
| <code v-pre>publishDelayed: delayMs must be non-negative</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L240) |
| <code v-pre>waitForDelivery: no delayed message delivered to $&#123;exchange&#125; within $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L280) |
| <code v-pre>stopNode: node $&#123;id&#125; not registered</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L318) |
| <code v-pre>startNode: node $&#123;id&#125; not registered</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L324) |
| <code v-pre>assertQuorumHealthy: queue $&#123;queueName&#125; not declared</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L338) |
| <code v-pre>assertQuorumHealthy: queue $&#123;queueName&#125; is not a quorum queue</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L341) |
| <code v-pre>assertQuorumHealthy: queue $&#123;queueName&#125; requires $&#123;min&#125; active nodes, only $&#123;activeCount&#125; available</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L346) |
| <code v-pre>ingestFromUpstream: upstream $&#123;input.upstreamName&#125; not registered</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L367) |
| <code v-pre>ingestFromUpstream: no federation link for upstream $&#123;input.upstreamName&#125; → $&#123;input.exchange&#125;</code> | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L376) |
| <code v-pre>setupRabbitMQEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "testcontainers"</code> | [packages/queue/src/rabbitmq/setup-rabbitmq-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/setup-rabbitmq-env.ts#L24) |
| <code v-pre>stub-rabbitmq: exchange $&#123;spec.name&#125; already declared with type $&#123;existing.type&#125;, cannot redeclare as $&#123;spec.type&#125;</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L133) |
| <code v-pre>stub-rabbitmq: queue $&#123;queueName&#125; not declared</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L169) |
| <code v-pre>stub-rabbitmq: exchange $&#123;exchangeName&#125; not declared</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L185) |
| <code v-pre>bindQueue: exchange $&#123;spec.exchange&#125; not declared</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L337) |
| <code v-pre>bindQueue: queue $&#123;spec.queue&#125; not declared</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L340) |
| <code v-pre>get: queue $&#123;input.queue&#125; not declared</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L413) |
| <code v-pre>consume: queue $&#123;input.queue&#125; not declared</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L427) |
| <code v-pre>consume: queue $&#123;input.queue&#125; has exclusive consumer</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L431) |
| <code v-pre>consume: cannot register exclusive consumer, others already exist</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L434) |
| <code v-pre>waitForMessage: timeout waiting for message on $&#123;queueName&#125;</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L481) |
| <code v-pre>assertAcknowledged: expected deliveryCount $&#123;expected.deliveryCount&#125; but got $&#123;snap.deliveryCount&#125;</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L492) |
| <code v-pre>assertRequeued: timeout waiting for requeued delivery on $&#123;queueName&#125;</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L511) |
| <code v-pre>assertQueueDrained: queue $&#123;queueName&#125; still has $&#123;pending.length&#125; pending messages</code> | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L518) |
| <code v-pre>setupRabbitMQEnv: mode="testcontainers" requires testcontainers.amqpUrl (v0.3 scope). Provide the URL of a running RabbitMQ broker, or use mode="stub" for zero-infra tests.</code> | [packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L22) |
| <code v-pre>setupRabbitMQEnv: RabbitMQ broker at $&#123;amqpUrl&#125; did not respond within $&#123;timeoutMs&#125;ms: $&#123; lastError instanceof Error ? lastError.message : String(lastError) &#125;</code> | [packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L97) |
| <code v-pre>setupBullMQEnv: cannot addJob after stop()</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L147) |
| <code v-pre>addJob: attempts must be at least 1</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L153) |
| <code v-pre>addJob: delay must be non-negative</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L156) |
| <code v-pre>waitForJob: timeout waiting for job "$&#123;name&#125;" after $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L201) |
| <code v-pre>assertProcessed: expected job "$&#123;name&#125;" to complete, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L218) |
| <code v-pre>assertProcessed: return value mismatch for "$&#123;name&#125;". expected=$&#123;wanted&#125; actual=$&#123;actual&#125;</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L227) |
| <code v-pre>assertFailed: expected job "$&#123;name&#125;" to fail, got state=$&#123;snap.state&#125;</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L240) |
| <code v-pre>assertFailed: expected $&#123;expected.retry&#125; attempt(s), observed $&#123;snap.attemptsMade&#125;</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L245) |
| <code v-pre>assertFailed: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L250) |
| <code v-pre>assertRetried: expected $&#123;expectedRetry&#125; attempt(s) for "$&#123;name&#125;", observed $&#123;snap.attemptsMade&#125;</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L262) |
| <code v-pre>assertQueueDrained: queue still has waiting / active jobs after 250ms</code> | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L279) |
| <code v-pre>setupBullMQEnv: unknown mode "$&#123;String(mode)&#125;" — expected "sandbox" or "testcontainers"</code> | [packages/queue/src/setup-bullmq-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/setup-bullmq-env.ts#L24) |
| <code v-pre>setupSQSEnv: LocalStack at "$&#123;endpoint&#125;" did not respond within $&#123;timeoutMs&#125;ms — $&#123;reason&#125;</code> | [packages/queue/src/sqs/localstack-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L105) |
| <code v-pre>setupSQSEnv: mode="localstack" requires localstack.endpoint (v0.2 scope). Provide the URL of a running LocalStack instance, or use mode="stub" for zero-infra tests.</code> | [packages/queue/src/sqs/localstack-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L31) |
| <code v-pre>setupSQSEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "localstack"</code> | [packages/queue/src/sqs/setup-sqs-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/setup-sqs-env.ts#L25) |
| <code v-pre>createQueue: FIFO queue name "$&#123;spec.name&#125;" must end with ".fifo" (AWS SQS constraint)</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L101) |
| <code v-pre>send: queueName must be a non-empty string</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L149) |
| <code v-pre>send: delaySeconds must be non-negative</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L153) |
| <code v-pre>send: delaySeconds cannot exceed 900 (AWS SQS constraint mirrored by the stub)</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L155) |
| <code v-pre>send: FIFO queue "$&#123;queueName&#125;" requires messageGroupId — pass it via send options</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L161) |
| <code v-pre>sendBatch: SQS SendMessageBatch caps at 10 entries per call</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L217) |
| <code v-pre>deleteBatch: SQS DeleteMessageBatch caps at 10 entries per call</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L293) |
| <code v-pre>waitForMessage: timeout waiting for queue "$&#123;queueName&#125;" after $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L320) |
| <code v-pre>assertDeleted: expected message on "$&#123;queueName&#125;" to be deleted, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L337) |
| <code v-pre>assertDeleted: expected $&#123;expected.receiveCount&#125; receive(s), observed $&#123;snap.receiveCount&#125;</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L342) |
| <code v-pre>assertDeadLettered: expected message on "$&#123;queueName&#125;" to be dead-lettered, got state=$&#123;snap.state&#125;</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L354) |
| <code v-pre>assertDeadLettered: expected $&#123;expected.receiveCount&#125; receive(s), observed $&#123;snap.receiveCount&#125;</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L359) |
| <code v-pre>assertDeadLettered: message "$&#123;snap.messageId&#125;" was not routed to DLQ "$&#123;expected.dlq&#125;"</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L367) |
| <code v-pre>assertQueueDrained: queue$&#123;queueName ? &#96; "$&#123;queueName&#125;"&#96; : 's'&#125; still have pending / inflight messages after 250ms</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L388) |
| <code v-pre>setupSQSEnv: cannot use env after stop()</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L82) |
| <code v-pre>setupSQSEnv: queue "$&#123;name&#125;" does not exist — call createQueue() or pass it via setupSQSEnv(&#123; queues &#125;)</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L88) |
| <code v-pre>createQueue: &#96;name&#96; must be a non-empty string</code> | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L97) |
| <code v-pre>waitForJob: timeout waiting for job "$&#123;name&#125;" after $&#123;timeoutMs&#125;ms</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L275) |
| <code v-pre>assertProcessed: expected job "$&#123;name&#125;" to complete, got state=$&#123;snap.state&#125;</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L291) |
| <code v-pre>assertProcessed: return value mismatch for "$&#123;name&#125;". expected=$&#123;wanted&#125; actual=$&#123;actual&#125;</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L299) |
| <code v-pre>assertFailed: expected job "$&#123;name&#125;" to fail, got state=$&#123;snap.state&#125;</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L312) |
| <code v-pre>assertFailed: expected $&#123;expected.retry&#125; attempt(s), observed $&#123;snap.attemptsMade&#125;</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L317) |
| <code v-pre>assertFailed: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L322) |
| <code v-pre>assertRetried: expected $&#123;expectedRetry&#125; attempt(s) for "$&#123;name&#125;", observed $&#123;snap.attemptsMade&#125;</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L334) |
| <code v-pre>assertQueueDrained: queue still has waiting / active / delayed jobs after 1s</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L353) |
| <code v-pre>"@kiwa-lab/queue: testcontainers mode requires 'bullmq' + 'ioredis' peer dependencies. Install with &#96;pnpm add -D bullmq ioredis&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L73) |
| <code v-pre>"@kiwa-lab/queue: testcontainers mode requires the 'testcontainers' peer dependency. Install with &#96;pnpm add -D testcontainers&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught))</code> | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L92) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [cloudflare-queues/miniflare-cloudflare-queues.ts](./api/cloudflare-queues-miniflare-cloudflare-queues) | 1 | 0 |
| [cloudflare-queues/setup-cloudflare-queues-env.ts](./api/cloudflare-queues-setup-cloudflare-queues-env) | 1 | 0 |
| [cloudflare-queues/types.ts](./api/cloudflare-queues-types) | 0 | 12 |
| [cloudflare-queues/wrangler-cloudflare-queues.ts](./api/cloudflare-queues-wrangler-cloudflare-queues) | 1 | 0 |
| [index.ts](./api/index) | 1 | 0 |
| [inngest/dev-server-inngest.ts](./api/inngest-dev-server-inngest) | 1 | 0 |
| [inngest/setup-inngest-env.ts](./api/inngest-setup-inngest-env) | 1 | 0 |
| [inngest/stub-inngest.ts](./api/inngest-stub-inngest) | 1 | 0 |
| [inngest/types.ts](./api/inngest-types) | 0 | 11 |
| [rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](./api/rabbitmq-advanced-setup-rabbitmq-advanced-env) | 1 | 0 |
| [rabbitmq-advanced/types.ts](./api/rabbitmq-advanced-types) | 0 | 9 |
| [rabbitmq/setup-rabbitmq-env.ts](./api/rabbitmq-setup-rabbitmq-env) | 1 | 0 |
| [rabbitmq/stub-rabbitmq.ts](./api/rabbitmq-stub-rabbitmq) | 1 | 0 |
| [rabbitmq/testcontainers-rabbitmq.ts](./api/rabbitmq-testcontainers-rabbitmq) | 1 | 0 |
| [rabbitmq/types.ts](./api/rabbitmq-types) | 0 | 14 |
| [sandbox-queue.ts](./api/sandbox-queue) | 1 | 0 |
| [semantics/job-lifecycle-orchestrator.ts](./api/semantics-job-lifecycle-orchestrator) | 2 | 3 |
| [setup-bullmq-env.ts](./api/setup-bullmq-env) | 1 | 0 |
| [sqs/localstack-sqs.ts](./api/sqs-localstack-sqs) | 1 | 0 |
| [sqs/setup-sqs-env.ts](./api/sqs-setup-sqs-env) | 1 | 0 |
| [sqs/stub-sqs.ts](./api/sqs-stub-sqs) | 1 | 0 |
| [sqs/types.ts](./api/sqs-types) | 0 | 13 |
| [testcontainers-queue.ts](./api/testcontainers-queue) | 1 | 0 |
| [types.ts](./api/types) | 0 | 7 |

<!-- kiwa-public-api:end -->
