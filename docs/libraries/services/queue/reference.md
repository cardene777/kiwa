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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>createDevServerInngestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L103) <code v-pre>packages/queue/src/inngest/dev-server-inngest.ts</code>

Build a dev-server-backed Inngest env. When `devServer.url` is supplied the helper reuses that dev-server; otherwise it spawns one via `npx inngest-cli@latest dev`. The env still runs function handlers in-process (matching v0.1 scope) but every event goes through the real dev-server HTTP round-trip, so the wire shape is prod-parity.

```ts
export declare function createDevServerInngestEnv(opts: SetupInngestEnvOptions & {
    appId: string;
}): Promise<InngestTestEnv<'live'>>;
```

#### <code v-pre>createLocalstackSQSEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L26) <code v-pre>packages/queue/src/sqs/localstack-sqs.ts</code>

Build a LocalStack-backed SQS env. When `opts.localstack?.endpoint` is provided the helper connects directly to that endpoint and verifies responsiveness. Otherwise the helper would spawn a testcontainers LocalStack instance — kept out of the v0.2 scope so callers wanting fully-managed containers can opt in later. The v0.2 wire path shares the stub simulation for message state (so assertion helpers stay deterministic) while surfacing the LocalStack `endpoint` on the env for callers that want to point their own `@aws-sdk/client-sqs` at it.

```ts
export declare function createLocalstackSQSEnv(opts: SetupSQSEnvOptions): Promise<SQSTestEnv<'live'>>;
```

#### <code v-pre>createMiniflareCloudflareQueuesEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L54) <code v-pre>packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts</code>

Build a miniflare-shaped (offline, in-process) Cloudflare Queues env. The simulation covers the message lifecycle observed by production Workers — `send` / consumer batch / retry / DLQ — deterministically, without spinning up a wrangler dev-server. When `opts.miniflare?.miniflare` is supplied the helper leaves lifecycle to the caller and only consumes the injected instance for structural parity; the internal simulation still drives message state so tests stay deterministic.

```ts
export declare function createMiniflareCloudflareQueuesEnv(opts: SetupCloudflareQueuesEnvOptions): CloudflareQueuesTestEnv<'mock'>;
```

#### <code v-pre>createSandboxBullMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L46) <code v-pre>packages/queue/src/sandbox-queue.ts</code>

Build a sandbox (offline, in-process) BullMQ-shaped queue. Suitable for unit tests that need to exercise the job lifecycle (add / process / retry / fail / drain) without spinning up a Redis container.

```ts
export declare function createSandboxBullMQEnv(opts: SetupBullMQEnvOptions & {
    queueName: string;
}): BullMQTestEnv<'mock'>;
```

#### <code v-pre>createStubInngestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L48) <code v-pre>packages/queue/src/inngest/stub-inngest.ts</code>

Build a stub (offline, in-process) Inngest env. Deterministic enough to exercise the retry / step / concurrency semantics needed by unit tests without spinning up a real dev-server.

```ts
export declare function createStubInngestEnv(opts: SetupInngestEnvOptions & {
    appId: string;
}): InngestTestEnv<'mock'>;
```

#### <code v-pre>createStubRabbitMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L117) <code v-pre>packages/queue/src/rabbitmq/stub-rabbitmq.ts</code>

Build the stub RabbitMQ env — in-process, deterministic AMQP 0.9.1 model emulation. No docker required.

```ts
export declare function createStubRabbitMQEnv(opts?: SetupRabbitMQEnvOptions): RabbitMQTestEnv<'mock'>;
```

#### <code v-pre>createStubSQSEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L63) <code v-pre>packages/queue/src/sqs/stub-sqs.ts</code>

Build an in-process stub of AWS SQS covering the message lifecycle observed by production consumers — `send` / `receive` / `delete` / batch / visibility timeout / DLQ / FIFO deduplication — deterministically, without spinning up localstack.

```ts
export declare function createStubSQSEnv(opts: SetupSQSEnvOptions): SQSTestEnv<'mock'>;
```

#### <code v-pre>createTestcontainersBullMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L112) <code v-pre>packages/queue/src/testcontainers-queue.ts</code>

Build a testcontainers-backed BullMQ environment. Requires Docker; the real bullmq + ioredis peers do the heavy lifting so semantic drift from prod is limited to whatever bullmq itself abstracts.

```ts
export declare function createTestcontainersBullMQEnv(opts: SetupBullMQEnvOptions & {
    queueName: string;
}): Promise<BullMQTestEnv<'live'>>;
```

#### <code v-pre>createTestcontainersRabbitMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L17) <code v-pre>packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts</code>

Build a testcontainers-backed RabbitMQ env. When `opts.testcontainers?.amqpUrl` is provided the helper connects directly to that URL and verifies responsiveness. Otherwise the helper would spawn a testcontainers RabbitMQ instance — kept out of the v0.3 scope so callers wanting fully-managed containers can opt in later (add the `testcontainers` peer dep + a small container factory). The v0.3 wire path shares the stub simulation for message state (so assertion helpers stay deterministic) while surfacing the `amqpUrl` + `managementUrl` on the env for callers that want to point their own `amqplib` at it.

```ts
export declare function createTestcontainersRabbitMQEnv(opts: SetupRabbitMQEnvOptions): Promise<RabbitMQTestEnv<'live'>>;
```

#### <code v-pre>createWranglerCloudflareQueuesEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L109) <code v-pre>packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts</code>

Build a wrangler-backed Cloudflare Queues env. When `wrangler.url` is supplied the helper reuses that dev-server; otherwise it spawns one via `npx wrangler@latest dev`. The env still runs consumer batch handlers in-process (matching v0.2 scope) via the miniflare simulation so retry / DLQ semantics stay deterministic; the wrangler process provides the live wire so consumers can verify their local `wrangler.toml` binds correctly.

```ts
export declare function createWranglerCloudflareQueuesEnv(opts: SetupCloudflareQueuesEnvOptions): Promise<CloudflareQueuesTestEnv<'live'>>;
```

#### <code v-pre>dispatchJobEvent</code>

公開 entry point から解決しています。

`dispatchEvent` を `dispatchJobEvent` として公開しています。

```ts
export {
  startJob,
  dispatchEvent as dispatchJobEvent,
  summarizeJob,
} from './job-lifecycle-orchestrator.js';
```

#### <code v-pre>setupBullMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/setup-bullmq-env.ts#L18) <code v-pre>packages/queue/src/setup-bullmq-env.ts</code>

Factory for BullMQ test environments. `mode: 'sandbox'` (default) returns a fast, in-process fake — no Docker, no peer dependencies required beyond `bullmq`'s type shape via structural duck-typing. Use it for the fast unit-test lane. `mode: 'testcontainers'` boots a real Redis under testcontainers and wires up a real `bullmq.Queue` + `bullmq.Worker`. Use it for the integration lane that needs prod-shape parity.

```ts
export declare function setupBullMQEnv(opts?: SetupBullMQEnvOptions): Promise<BullMQTestEnv>;
```

#### <code v-pre>setupCloudflareQueuesEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts#L20) <code v-pre>packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts</code>

Factory for Cloudflare Queues test environments. `mode: 'miniflare'` (default) returns a fast, in-process fake — no wrangler subprocess, no network. Deterministic enough to exercise send / consumer batch / retry / DLQ semantics without spinning up an external process. `mode: 'wrangler'` boots (or connects to) a real `wrangler dev --local` process and verifies it responds before returning the env. The env still runs consumer batch handlers in-process (v0.2 scope) so retry / DLQ assertions stay deterministic across backends.

```ts
export declare function setupCloudflareQueuesEnv(opts?: SetupCloudflareQueuesEnvOptions): Promise<CloudflareQueuesTestEnv>;
```

#### <code v-pre>setupInngestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/setup-inngest-env.ts#L18) <code v-pre>packages/queue/src/inngest/setup-inngest-env.ts</code>

Factory for Inngest test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no dev-server, no network. Suitable for unit tests that need to exercise retry / step / concurrency semantics deterministically. `mode: 'dev-server'` boots (or connects to) a real Inngest dev-server and routes every event through the wire before dispatching function handlers. Suitable for integration tests that need prod-shape parity.

```ts
export declare function setupInngestEnv(opts?: SetupInngestEnvOptions): Promise<InngestTestEnv>;
```

#### <code v-pre>setupRabbitMQAdvancedEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L39) <code v-pre>packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts</code>

Build the advanced RabbitMQ test env. Composes over the basic stub adapter (v1.10-3) — the basic env owns exchange / queue / binding / consumer bookkeeping, while this env layers DLX routing, delayed message plugin, cluster simulation, federation, and auto-reconnect.

```ts
export declare function setupRabbitMQAdvancedEnv(opts?: SetupRabbitMQAdvancedEnvOptions): Promise<RabbitMQAdvancedTestEnv<'mock'>>;
```

#### <code v-pre>setupRabbitMQEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/setup-rabbitmq-env.ts#L19) <code v-pre>packages/queue/src/rabbitmq/setup-rabbitmq-env.ts</code>

Factory for RabbitMQ test environments. `mode: 'stub'` (default) returns a fast, in-process AMQP 0.9.1 model emulator. No docker, no network. Deterministic enough to exercise exchange / queue / binding / consumer / ack / nack / prefetch semantics. `mode: 'testcontainers'` connects to a running RabbitMQ broker (URL provided via `testcontainers.amqpUrl`) and verifies responsiveness via the management API. The env still runs the message simulation in-process (v0.3 scope) so assertions stay deterministic across backends; callers that want to drive the real wire can point their own `amqplib` at the exposed `env.amqpUrl`.

```ts
export declare function setupRabbitMQEnv(opts?: SetupRabbitMQEnvOptions): Promise<RabbitMQTestEnv>;
```

#### <code v-pre>setupSQSEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/setup-sqs-env.ts#L20) <code v-pre>packages/queue/src/sqs/setup-sqs-env.ts</code>

Factory for AWS SQS test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise send / receive / delete / batch / visibility timeout / DLQ / FIFO deduplication semantics without spinning up localstack. `mode: 'localstack'` connects to a running LocalStack endpoint (URL provided via `localstack.endpoint`) and verifies responsiveness before returning the env. The env still runs the message simulation in-process (v0.2 scope) so assertions stay deterministic across backends; callers that want to drive the real wire can point their own `@aws-sdk/client-sqs` at the exposed `env.endpoint`.

```ts
export declare function setupSQSEnv(opts?: SetupSQSEnvOptions): Promise<SQSTestEnv>;
```

#### <code v-pre>startJob</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L36) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export declare function startJob(input: {
    timestamp: string;
}): JobSession;
```

#### <code v-pre>summarizeJob</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L138) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export declare function summarizeJob(session: JobSession): JobSummary;
```

### 型

#### <code v-pre>BullMQMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L13) <code v-pre>packages/queue/src/types.ts</code>

BullMQ backend selection. - `testcontainers`: start a real Redis in a testcontainers-managed Docker container. Deterministic + prod-shape parity. Requires Docker + the `testcontainers` + `bullmq` + `ioredis` peer dependencies. - `sandbox`: run against an in-process Redis-compatible stub tied to the test process only. Fast (no container startup), fully offline, and sufficient for a large slice of BullMQ semantics (add / process / retry / fail / drain) but does not exercise Redis-side pipelining semantics.

```ts
export type BullMQMode = 'testcontainers' | 'sandbox';
```

#### <code v-pre>BullMQTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L116) <code v-pre>packages/queue/src/types.ts</code>

Return type of {@link setupBullMQEnv }. Reads much like a mini BullMQ facade — consumers register a processor, add jobs, then use the assertion helpers to observe outcomes without touching BullMQ directly.

```ts
export interface BullMQTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: BullMQMode;
    /** Queue name in use. */
    queueName: string;
    /** Optional Redis connection URL — undefined in sandbox mode. */
    redisUrl: string | undefined;
    /** Register the processor. Overwrites any previous processor. */
    process: <TData = unknown, TResult = unknown>(processor: JobProcessor<TData, TResult>) => void;
    /** Enqueue a job by name + data. Returns the snapshot at enqueue time. */
    addJob: <TData = unknown>(name: string, data: TData, options?: QueueJobOptions) => Promise<QueueJobSnapshot<TData>>;
    /**
     * Wait for at least one job matching `name` to reach a terminal state
     * (`completed` or `failed`). Rejects on timeout (default 5s).
     */
    waitForJob: <TData = unknown, TResult = unknown>(name: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<QueueJobSnapshot<TData, TResult>>;
    /** Assertion — the first job named `name` reached `completed`. */
    assertProcessed: <TData = unknown, TResult = unknown>(name: string, expected?: {
        returnValue?: TResult | undefined;
    } | undefined) => Promise<QueueJobSnapshot<TData, TResult>>;
    /** Assertion — the first job named `name` reached `failed`. */
    assertFailed: <TData = unknown>(name: string, expected?: {
        retry?: number | undefined;
        reasonMatch?: RegExp | undefined;
    } | undefined) => Promise<QueueJobSnapshot<TData>>;
    /** Assertion — the first job named `name` ran `expectedRetry` times before terminal. */
    assertRetried: <TData = unknown>(name: string, expectedRetry: number) => Promise<QueueJobSnapshot<TData>>;
    /** Assertion — the queue has no waiting / active jobs. */
    assertQueueDrained: () => Promise<void>;
    /** Introspection helper — list every snapshot the queue has ever seen. */
    listJobs: () => QueueJobSnapshot[];
}
```

#### <code v-pre>CloudflareQueueBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L78) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

The consumer batch delivered to the handler. Mirrors the shape production Workers see via the `queue(batch, env, ctx)` binding.

```ts
export interface CloudflareQueueBatch<TBody = unknown> {
    /** Queue name that produced the batch. */
    queue: string;
    /** Messages included in this batch. */
    messages: CloudflareQueueMessage<TBody>[];
    /** Convenience — ack every message in the batch. */
    ackAll: () => void;
    /** Convenience — retry every message in the batch. */
    retryAll: () => void;
}
```

#### <code v-pre>CloudflareQueueConsumer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L107) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Consumer handler signature — mirrors the shape of the Workers `queue()` entrypoint.

```ts
export type CloudflareQueueConsumer<TBody = unknown> = (batch: CloudflareQueueBatch<TBody>) => Promise<void> | void;
```

#### <code v-pre>CloudflareQueueConsumerRegistration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L151) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Consumer registration — mirrors the [[queues.consumers]] entry in `wrangler.toml`.

```ts
export interface CloudflareQueueConsumerRegistration<TBody = unknown> {
    /** Queue name the consumer listens on. */
    queue: string;
    /** Handler executed for every batch. */
    handler: CloudflareQueueConsumer<TBody>;
    /**
     * Batch delivery limit. Real Cloudflare Queues supports 1-100; helper
     * enforces `>= 1` but does not cap the upper bound so tests can inject
     * bespoke shapes. Defaults to 10 (matching production default).
     */
    maxBatchSize?: number | undefined;
    /**
     * Max time (ms) the helper waits before flushing a partial batch. Defaults
     * to 5000 (matching production default of 5s).
     */
    maxBatchTimeoutMs?: number | undefined;
    /**
     * Max number of retries before the message is shunted to the dead-letter
     * queue. Defaults to 3 (matching production default).
     */
    maxRetries?: number | undefined;
    /**
     * Name of the dead-letter queue that receives messages after `maxRetries`
     * failures. When omitted messages that exhaust their retries transition to
     * the `dead` state but are not routed anywhere.
     */
    deadLetterQueue?: string | undefined;
}
```

#### <code v-pre>CloudflareQueueMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L94) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Individual message inside a batch. Consumers call `.ack()` on success or `.retry()` to push the message back for another batch. Unhandled messages behave as retries — matching Cloudflare Queues production semantics.

```ts
export interface CloudflareQueueMessage<TBody = unknown> {
    id: string;
    body: TBody;
    timestamp: number;
    attempts: number;
    ack: () => void;
    retry: () => void;
}
```

#### <code v-pre>CloudflareQueueMessageSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L39) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Structural mirror of a persisted Cloudflare Queues message.

```ts
export interface CloudflareQueueMessageSnapshot<TBody = unknown> {
    id: string;
    queueName: string;
    body: TBody;
    attempts: number;
    state: CloudflareQueueMessageState;
    failedReason?: string | undefined;
    /**
     * ISO timestamp (ms since epoch) capturing when the message became visible
     * for the next consumer batch. For pending messages the value reflects the
     * scheduled visibility (send + delay); for terminal messages it reflects the
     * final observed batch time.
     */
    visibleAt: number;
}
```

#### <code v-pre>CloudflareQueueMessageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L31) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Terminal + intermediate states surfaced by the helper. `pending` messages live in the queue waiting for the next consumer batch. `delivered` messages are the ones consumer batches saw and either ack'd or retried. `retrying` covers explicit `msg.retry()` calls that pushed a message back for another batch. `dead` covers messages that exhausted `maxRetries` and were shunted into the dead-letter queue.

```ts
export type CloudflareQueueMessageState = 'pending' | 'delivered' | 'retrying' | 'ack' | 'dead';
```

#### <code v-pre>CloudflareQueueSendOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L59) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Options accepted by every {@link CloudflareQueuesTestEnv.send} call. Mirrors the subset of `Queue.send` options we honour in both backends.

```ts
export interface CloudflareQueueSendOptions {
    /**
     * Delay before the message becomes eligible for the next consumer batch
     * (seconds). Real Cloudflare Queues uses seconds so the helper follows
     * suit. Defaults to 0.
     */
    delaySeconds?: number | undefined;
    /**
     * Optional content type hint — real Cloudflare Queues honours JSON / text /
     * bytes / v8 for serialisation. The helper records the value on the
     * message snapshot but stores the body as-is (structural clone).
     */
    contentType?: 'json' | 'text' | 'bytes' | 'v8' | undefined;
}
```

#### <code v-pre>CloudflareQueuesMiniflareOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L114) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Options for the miniflare backend. Ignored when `mode === 'wrangler'`.

```ts
export interface CloudflareQueuesMiniflareOptions {
    /**
     * How often the miniflare-shaped scheduler pumps pending messages (ms).
     * Defaults to 1 which is the finest resolution the implementation supports.
     */
    pollIntervalMs?: number | undefined;
    /**
     * Optional externally-managed Miniflare instance. When supplied the helper
     * hooks into that instance instead of building an internal simulation. The
     * external instance is not owned by the env — the caller stays responsible
     * for its lifecycle.
     */
    miniflare?: unknown | undefined;
}
```

#### <code v-pre>CloudflareQueuesMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L15) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Cloudflare Queues backend selection. - `miniflare`: run against an in-process Cloudflare-shaped Queue simulation powered by miniflare (no wrangler subprocess, no network). Fast, offline, fully deterministic. Suitable for unit tests that need to exercise the send / consumer batch / retry / DLQ semantics without spinning up an external process. - `wrangler`: probe or auto-spawn a real Wrangler dev-server process (`wrangler dev --queue`). Exercises the actual wrangler wire while the consumer batch handler still executes in-process (v0.2 scope) so tests stay deterministic.

```ts
export type CloudflareQueuesMode = 'miniflare' | 'wrangler';
```

#### <code v-pre>CloudflareQueuesTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L205) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Return type of {@link setupCloudflareQueuesEnv }. Reads much like a mini Cloudflare Queues facade — consumers register batch handlers, then use the assertion helpers to observe outcomes without touching the wire.

```ts
export interface CloudflareQueuesTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: CloudflareQueuesMode;
    /** Optional dev-server URL — undefined in miniflare mode. */
    devServerUrl: string | undefined;
    /** Queue names the env has observed at least one send / consumer for. */
    queues: string[];
    /** Register (or replace) a consumer for a queue. */
    registerConsumer: <TBody = unknown>(registration: CloudflareQueueConsumerRegistration<TBody>) => void;
    /**
     * Enqueue a message. Returns the snapshot at enqueue time so tests can
     * capture the assigned id.
     */
    send: <TBody = unknown>(queueName: string, body: TBody, options?: CloudflareQueueSendOptions) => Promise<CloudflareQueueMessageSnapshot<TBody>>;
    /**
     * Wait for at least one message on `queueName` to reach a terminal state
     * (`ack` or `dead`). Rejects on timeout (default 5s).
     */
    waitForMessage: <TBody = unknown>(queueName: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<CloudflareQueueMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` reached `ack`. */
    assertAcknowledged: <TBody = unknown>(queueName: string, expected?: {
        attempts?: number | undefined;
    } | undefined) => Promise<CloudflareQueueMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` was routed to the DLQ. */
    assertDeadLettered: <TBody = unknown>(queueName: string, expected?: {
        dlq?: string | undefined;
        reasonMatch?: RegExp | undefined;
        attempts?: number | undefined;
    } | undefined) => Promise<CloudflareQueueMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` was retried `expectedRetries` times. */
    assertRetried: <TBody = unknown>(queueName: string, expectedRetries: number) => Promise<CloudflareQueueMessageSnapshot<TBody>>;
    /** Assertion — the queue has no pending / delivered messages. */
    assertQueueDrained: (queueName?: string | undefined) => Promise<void>;
    /** Introspection helper — every message snapshot the env has ever seen. */
    listMessages: (queueName?: string | undefined) => CloudflareQueueMessageSnapshot[];
    /**
     * Introspection helper — every message routed to the DLQ (per queue). Empty
     * when no consumer is registered with `deadLetterQueue`.
     */
    listDeadLetters: (dlqName?: string | undefined) => CloudflareQueueMessageSnapshot[];
}
```

#### <code v-pre>CloudflareQueuesWranglerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L132) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Options for the wrangler backend. Ignored when `mode === 'miniflare'`.

```ts
export interface CloudflareQueuesWranglerOptions {
    /**
     * Path to an externally-managed Wrangler dev-server binding. When set the
     * helper reuses the process instead of spawning `wrangler dev --queue`.
     */
    url?: string | undefined;
    /** Port for the auto-spawned wrangler dev-server. Defaults to `8787`. */
    port?: number | undefined;
    /**
     * Milliseconds to wait for the auto-spawned wrangler dev-server before
     * timing out. Defaults to `15000`.
     */
    startupTimeoutMs?: number | undefined;
}
```

#### <code v-pre>InngestDevServerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L114) <code v-pre>packages/queue/src/inngest/types.ts</code>

Options for the `dev-server` backend. Either supply `url` to point at an externally managed dev-server, or leave `url` undefined to let the helper spawn one via `npx inngest-cli@latest dev`.

```ts
export interface InngestDevServerOptions {
    /** Existing dev-server URL (e.g. `http://127.0.0.1:8288`). */
    url?: string | undefined;
    /** Port for the auto-spawned dev-server. Defaults to `8288`. */
    port?: number | undefined;
    /**
     * Milliseconds to wait for the auto-spawned dev-server before timing out.
     * Defaults to `15000`.
     */
    startupTimeoutMs?: number | undefined;
}
```

#### <code v-pre>InngestEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L34) <code v-pre>packages/queue/src/inngest/types.ts</code>

Structural mirror of an Inngest event — decoupled from the `inngest` SDK types so tests can build events without importing from the SDK.

```ts
export interface InngestEvent<TData = unknown> {
    /** Event name — Inngest routes events to functions by matching this field. */
    name: string;
    /** Arbitrary event payload. */
    data: TData;
    /** Optional event id — dev-server assigns one when omitted. */
    id?: string | undefined;
    /** Optional ISO timestamp — defaults to the send time. */
    ts?: number | undefined;
    /** Optional user object — matches the `user` field on real Inngest events. */
    user?: Record<string, unknown> | undefined;
}
```

#### <code v-pre>InngestFunctionContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L62) <code v-pre>packages/queue/src/inngest/types.ts</code>

Context surfaced to an Inngest function handler.

```ts
export interface InngestFunctionContext<TData = unknown> {
    event: InngestEvent<TData>;
    step: InngestStepContext;
    attempt: number;
}
```

#### <code v-pre>InngestFunctionDefinition</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L77) <code v-pre>packages/queue/src/inngest/types.ts</code>

Registered function definition. Structural mirror of the `inngest.createFunction` argument set.

```ts
export interface InngestFunctionDefinition<TData = unknown, TResult = unknown> {
    /** Stable identifier for the function — matches `id` in `inngest.createFunction`. */
    id: string;
    /** Event that triggers this function. Matches `event.name` on send. */
    event: string;
    /**
     * Retry count — total number of attempts including the first. Defaults to 1
     * (no retries). Matches the `retries` field on `inngest.createFunction`.
     */
    retries?: number | undefined;
    /**
     * Optional concurrency cap. `stub` mode enforces this by queuing extra events
     * behind the cap and running them sequentially. Defaults to unbounded.
     */
    concurrency?: number | undefined;
    /** Function body — receives `event` + `step` + `attempt`. */
    handler: InngestFunctionHandler<TData, TResult>;
}
```

#### <code v-pre>InngestFunctionHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L69) <code v-pre>packages/queue/src/inngest/types.ts</code>

Function handler signature — mirrors the `handler` parameter of `inngest.createFunction`.

```ts
export type InngestFunctionHandler<TData = unknown, TResult = unknown> = (ctx: InngestFunctionContext<TData>) => Promise<TResult> | TResult;
```

#### <code v-pre>InngestMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L14) <code v-pre>packages/queue/src/inngest/types.ts</code>

Inngest backend selection. - `stub`: fully in-process. Functions register by name + event key, and `sendEvent` invokes them directly without going through the Inngest wire protocol. Fast, offline, deterministic. Suitable for unit tests that need to exercise retry / step / concurrency semantics without a dev-server. - `dev-server`: talks to a real Inngest dev-server (either an externally managed one supplied via `devServer.url` or one spawned by the helper). Exercises the actual event dispatch + function execution round-trip. Best for integration lanes that need prod-shape parity.

```ts
export type InngestMode = 'stub' | 'dev-server';
```

#### <code v-pre>InngestRunSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L97) <code v-pre>packages/queue/src/inngest/types.ts</code>

Snapshot of a single function run — the shape assertion helpers observe.

```ts
export interface InngestRunSnapshot<TData = unknown, TResult = unknown> {
    runId: string;
    functionId: string;
    event: InngestEvent<TData>;
    state: InngestRunState;
    attemptsMade: number;
    returnValue?: TResult | undefined;
    failedReason?: string | undefined;
    /** Ordered list of step ids the run executed (including sleeps). */
    stepsRun: string[];
}
```

#### <code v-pre>InngestRunState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L23) <code v-pre>packages/queue/src/inngest/types.ts</code>

Terminal + intermediate states an Inngest function run can reach.

```ts
export type InngestRunState = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
```

#### <code v-pre>InngestStepContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L51) <code v-pre>packages/queue/src/inngest/types.ts</code>

Shape passed to a step's handler. Mirrors the surface the `step` object on a real Inngest function exposes for the pieces of the API we honour.

```ts
export interface InngestStepContext {
    /**
     * Run a named step. The `run` name is what tests observe through
     * `assertStepRan(functionId, stepId)`.
     */
    run: <T>(stepId: string, fn: () => Promise<T> | T) => Promise<T>;
    /** Sleep for `ms` milliseconds — stub mode advances a virtual clock. */
    sleep: (stepId: string, ms: number) => Promise<void>;
}
```

#### <code v-pre>InngestTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L148) <code v-pre>packages/queue/src/inngest/types.ts</code>

Return type of {@link setupInngestEnv }. Same surface across both backends so consumer tests can switch modes with a one-argument change.

```ts
export interface InngestTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: InngestMode;
    /** App id in use. */
    appId: string;
    /** Optional dev-server URL — undefined in stub mode. */
    devServerUrl: string | undefined;
    /** Register (or replace) a function definition after env creation. */
    registerFunction: <TData = unknown, TResult = unknown>(fn: InngestFunctionDefinition<TData, TResult>) => void;
    /**
     * Send an event by name + data. Returns the event id. The env dispatches
     * matching functions asynchronously — use `assertFunctionRan` / etc. to await
     * outcomes.
     */
    sendEvent: <TData = unknown>(name: string, data: TData) => Promise<string>;
    /**
     * Await the first run of `functionId` reaching a terminal state
     * (`completed` / `failed` / `cancelled`). Rejects on timeout (default 5s).
     */
    waitForRun: <TData = unknown, TResult = unknown>(functionId: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<InngestRunSnapshot<TData, TResult>>;
    /** Assertion — the first run of `functionId` reached `completed`. */
    assertFunctionRan: <TData = unknown, TResult = unknown>(functionId: string, expected?: {
        returnValue?: TResult | undefined;
    } | undefined) => Promise<InngestRunSnapshot<TData, TResult>>;
    /** Assertion — the first run of `functionId` failed. */
    assertFunctionFailed: <TData = unknown>(functionId: string, expected?: {
        attempts?: number | undefined;
        reasonMatch?: RegExp | undefined;
    } | undefined) => Promise<InngestRunSnapshot<TData>>;
    /** Assertion — the first run of `functionId` ran `expectedAttempts` times. */
    assertRetried: <TData = unknown>(functionId: string, expectedAttempts: number) => Promise<InngestRunSnapshot<TData>>;
    /** Assertion — the first run of `functionId` executed `stepId`. */
    assertStepRan: <TData = unknown>(functionId: string, stepId: string) => Promise<InngestRunSnapshot<TData>>;
    /**
     * Assertion — the queue has no queued / running runs. Waits up to 250ms for
     * inflight runs to settle, then throws if any remain.
     */
    assertQueueDrained: () => Promise<void>;
    /** Introspection helper — every run snapshot the env has ever seen. */
    listRuns: () => InngestRunSnapshot[];
}
```

#### <code v-pre>JobEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L14) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export type JobEvent = 'enqueue-succeeded' | 'process-started' | 'process-succeeded' | 'process-failed' | 'retry-scheduled' | 'retry-exhausted' | 'dlq-inspected' | 'timeout';
```

#### <code v-pre>JobProcessor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L62) <code v-pre>packages/queue/src/types.ts</code>

Processor signature — matches the shape of a bullmq `Worker` processor fn.

```ts
export type JobProcessor<TData = unknown, TResult = unknown> = (job: QueueJobSnapshot<TData, TResult>) => Promise<TResult> | TResult;
```

#### <code v-pre>JobSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L24) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export interface JobSession {
    state: JobState;
    enqueues: number;
    processStarts: number;
    processSuccesses: number;
    processFailures: number;
    retries: number;
    dlqInspections: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>JobState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L22) <code v-pre>packages/queue/src/types.ts</code>

Job lifecycle states surfaced by the helper.

```ts
export type JobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
```

#### <code v-pre>JobSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L124) <code v-pre>packages/queue/src/semantics/job-lifecycle-orchestrator.ts</code>

```ts
export interface JobSummary {
    currentState: JobState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    enqueues: number;
    processStarts: number;
    processSuccesses: number;
    processFailures: number;
    retries: number;
    dlqInspections: number;
}
```

#### <code v-pre>QueueJobOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L52) <code v-pre>packages/queue/src/types.ts</code>

Options accepted by every {@link BullMQTestEnv.addJob} call. Mirrors the subset of `bullmq.JobsOptions` we honour in both testcontainers and sandbox modes.

```ts
export interface QueueJobOptions {
    /** Retry count when the processor throws. `bullmq.JobsOptions.attempts`. */
    attempts?: number | undefined;
    /** Delay before the job becomes eligible (ms). */
    delay?: number | undefined;
    /** Explicit job id — otherwise the queue assigns a monotonically increasing id. */
    jobId?: string | undefined;
}
```

#### <code v-pre>QueueJobSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L37) <code v-pre>packages/queue/src/types.ts</code>

Structural mirror of a persisted job — decoupled from BullMQ's own types.

```ts
export interface QueueJobSnapshot<TData = unknown, TResult = unknown> {
    id: string;
    name: string;
    data: TData;
    state: JobState;
    attemptsMade: number;
    returnValue?: TResult | undefined;
    failedReason?: string | undefined;
}
```

#### <code v-pre>RabbitMQAdvancedQueueSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L45) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Extension of the basic queue spec to accept DLX + TTL + quorum arguments.

```ts
export interface RabbitMQAdvancedQueueSpec extends RabbitMQQueueSpec {
    /**
     * When set, messages that are nacked (requeue=false) or that exceed the
     * queue-level `messageTtlMs` are routed to this exchange. Mirrors the AMQP
     * `x-dead-letter-exchange` argument.
     */
    deadLetterExchange?: string | undefined;
    /**
     * Overrides the routing key used when a message is dead-lettered. Real
     * RabbitMQ keeps the original routing key when this is unset — the mock
     * mirrors that behavior.
     */
    deadLetterRoutingKey?: string | undefined;
    /**
     * Queue-level message TTL (milliseconds). Messages older than this are
     * dead-lettered on the next dispatch attempt. Mirrors `x-message-ttl`.
     */
    messageTtlMs?: number | undefined;
    /**
     * Max delivery count before the message is dead-lettered. Mirrors
     * `x-delivery-limit` used with quorum queues.
     */
    maxDeliveries?: number | undefined;
    /**
     * Queue kind — `classic` (default) or `quorum`. Quorum queues carry
     * additional guarantees when running in a cluster.
     */
    kind?: 'classic' | 'quorum' | undefined;
}
```

#### <code v-pre>RabbitMQAdvancedTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L173) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Advanced test env. Adds `dlx`, `delayed`, `cluster`, `federation`, `autoReconnect` handles on top of the basic env API (which is re-exported verbatim so a single call site can drive both surfaces).

```ts
export interface RabbitMQAdvancedTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    backend: 'stub';
    /** Basic API surface — same shape as the v1.10-3 basic adapter. */
    declareExchange: (spec: RabbitMQExchangeSpec) => Promise<void>;
    declareQueue: (spec: RabbitMQAdvancedQueueSpec) => Promise<void>;
    bindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
    unbindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
    publish: <TBody = unknown>(input: {
        exchange: string;
        routingKey: string;
        body: TBody;
        options?: RabbitMQPublishOptions;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    sendToQueue: <TBody = unknown>(input: {
        queue: string;
        body: TBody;
        options?: RabbitMQPublishOptions;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    peek: <TBody = unknown>(queueName: string) => RabbitMQMessageSnapshot<TBody>[];
    get: <TBody = unknown>(input: {
        queue: string;
        noAck?: boolean;
    }) => Promise<RabbitMQDelivery<TBody> | null>;
    consume: <TBody = unknown>(input: {
        queue: string;
        handler: (delivery: RabbitMQDelivery<TBody>) => void | Promise<void>;
        options?: RabbitMQConsumeOptions;
    }) => Promise<RabbitMQConsumer<TBody>>;
    /** DLX helpers. */
    dlx: {
        /** Introspection — every dead-letter that has fired. */
        listDeadLetters: <TBody = unknown>() => RabbitMQDeadLetterSnapshot<TBody>[];
        /**
         * Assertion — the given queue's last dead-letter matches the expected
         * shape. Returns the snapshot on success.
         */
        assertDeadLettered: <TBody = unknown>(queue: string, expected?: {
            reason?: RabbitMQDeadLetterSnapshot['reason'];
            deadLetterExchange?: string;
        }) => Promise<RabbitMQDeadLetterSnapshot<TBody>>;
    };
    /** Delayed message plugin helpers. */
    delayed: {
        /** Declare a delayed exchange (equivalent to `type: 'x-delayed-message'`). */
        declareDelayedExchange: (spec: RabbitMQDelayedExchangeSpec) => Promise<void>;
        /** Publish with an explicit delay (mirrors the `x-delay` header). */
        publishDelayed: <TBody = unknown>(input: {
            exchange: string;
            routingKey: string;
            body: TBody;
            delayMs: number;
            options?: RabbitMQPublishOptions;
        }) => Promise<RabbitMQDelayedMessageSnapshot<TBody>>;
        /**
         * Wait until scheduled delivery lands on the target queue. Rejects on
         * timeout.
         */
        waitForDelivery: <TBody = unknown>(exchange: string, opts?: {
            timeoutMs?: number;
        }) => Promise<RabbitMQMessageSnapshot<TBody>>;
        /**
         * Advance the internal clock, causing any due delayed messages to fire
         * synchronously. Useful for deterministic tests.
         */
        advanceClock: (ms: number) => Promise<void>;
        /** Introspection — all delayed messages the env has seen. */
        listPending: <TBody = unknown>() => RabbitMQDelayedMessageSnapshot<TBody>[];
    };
    /** Cluster helpers. */
    cluster: {
        listNodes: () => RabbitMQClusterNode[];
        /** Simulate a node going offline — messages route to other active nodes. */
        stopNode: (id: string) => Promise<void>;
        /** Bring a node back online. */
        startNode: (id: string) => Promise<void>;
        /**
         * Report which node currently hosts a given quorum queue. Round-robin
         * across active nodes.
         */
        resolveQueueNode: (queueName: string) => string | null;
        /**
         * Assertion — the queue is a quorum queue and it is currently hosted on
         * an active node with the required replica count. Real quorum queues
         * demand `initialReplicas` copies; the mock enforces a minimum active
         * node count.
         */
        assertQuorumHealthy: (queueName: string, opts?: {
            minReplicas?: number;
        }) => void;
    };
    /** Federation helpers. */
    federation: {
        listUpstreams: () => RabbitMQFederationUpstream[];
        listLinks: () => RabbitMQFederationLink[];
        /**
         * Simulate a message arriving on an upstream that is federated into this
         * broker. Mirrors what a federation plugin would do on the wire.
         */
        ingestFromUpstream: <TBody = unknown>(input: {
            upstreamName: string;
            exchange: string;
            routingKey: string;
            body: TBody;
        }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    };
    /** amqp-connection-manager style auto-reconnect helpers. */
    autoReconnect: {
        /**
         * Simulate the connection dropping and reconnecting after N attempts.
         * Returns the number of attempts + total delay observed.
         */
        simulateReconnect: (opts: {
            failAttempts: number;
        }) => Promise<{
            attempts: number;
            totalDelayMs: number;
            succeeded: boolean;
        }>;
        /** Introspection — current reconnect config. */
        getConfig: () => Required<NonNullable<SetupRabbitMQAdvancedEnvOptions['autoReconnect']>>;
    };
    /** Full reset. */
    reset: () => Promise<void>;
}
```

#### <code v-pre>RabbitMQBindingSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L125) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Binding declaration.

```ts
export interface RabbitMQBindingSpec {
    exchange: string;
    queue: string;
    /**
     * Routing key. Empty string for `fanout` (ignored) and headers exchanges.
     * For `topic` supports `*` (single word) + `#` (multiple words) wildcards.
     */
    routingKey: string;
    /**
     * Header match args for `headers` exchanges. `x-match=all` (all headers must
     * match) or `x-match=any` (any). Defaults to `all` when omitted.
     */
    args?: Record<string, unknown> | undefined;
}
```

#### <code v-pre>RabbitMQClusterNode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L90) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Node in a cluster.

```ts
export interface RabbitMQClusterNode {
    id: string;
    role: 'primary' | 'replica';
    /** True while the node is participating in the cluster. */
    active: boolean;
}
```

#### <code v-pre>RabbitMQConsumeOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L73) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Consume options.

```ts
export interface RabbitMQConsumeOptions {
    /**
     * When true, messages are auto-acknowledged upon receipt (no consumer ack
     * required). Defaults to false — consumers must call `ack(msg)` or
     * `nack(msg)` explicitly.
     */
    noAck?: boolean | undefined;
    /**
     * Consumer tag — mirrors AMQP's `consumerTag`. Auto-generated when omitted.
     */
    consumerTag?: string | undefined;
    /**
     * Per-consumer prefetch (QoS) — max unacked messages the consumer holds at
     * once. Real RabbitMQ enforces via `basic.qos`. Defaults to 0 (unlimited).
     */
    prefetch?: number | undefined;
    /**
     * When true the consumer is invoked exclusively (no other consumers on the
     * queue). The stub honours this by rejecting subsequent consumer registrations.
     */
    exclusive?: boolean | undefined;
}
```

#### <code v-pre>RabbitMQConsumer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L161) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Consumer registration handle.

```ts
export interface RabbitMQConsumer<TBody = unknown> {
    consumerTag: string;
    queueName: string;
    cancel: () => Promise<void>;
    /** Introspection — every delivery the consumer received. */
    deliveries: () => Array<RabbitMQMessageSnapshot<TBody>>;
}
```

#### <code v-pre>RabbitMQDeadLetterSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L127) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Dead-letter snapshot — captured every time a message enters a DLX.

```ts
export interface RabbitMQDeadLetterSnapshot<TBody = unknown> {
    originalMessageId: string;
    originalQueue: string;
    deadLetterExchange: string;
    deadLetterRoutingKey: string;
    reason: 'rejected' | 'expired' | 'maxlen' | 'delivery-limit';
    body: TBody;
    deliveryCount: number;
    timestamp: number;
}
```

#### <code v-pre>RabbitMQDelayedExchangeSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L76) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Delayed exchange declaration.

```ts
export interface RabbitMQDelayedExchangeSpec extends Omit<RabbitMQExchangeSpec, 'type'> {
    /**
     * Delayed message plugin exchange type — real RabbitMQ uses the fixed
     * value `x-delayed-message` when the plugin is enabled.
     */
    type: 'x-delayed-message';
    /**
     * Backing exchange type — the plugin routes as the backing type once the
     * delay elapses. Defaults to `direct`.
     */
    delayedType?: 'direct' | 'topic' | 'fanout' | 'headers' | undefined;
}
```

#### <code v-pre>RabbitMQDelayedMessageSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L116) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Delayed message snapshot — inspection helper.

```ts
export interface RabbitMQDelayedMessageSnapshot<TBody = unknown> {
    messageId: string;
    exchange: string;
    routingKey: string;
    body: TBody;
    delayMs: number;
    scheduledAt: number;
    delivered: boolean;
}
```

#### <code v-pre>RabbitMQDelivery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L141) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Delivered message wrapper — consumer receives one of these per delivery.

```ts
export interface RabbitMQDelivery<TBody = unknown> {
    messageId: string;
    queueName: string;
    exchange: string;
    routingKey: string;
    body: TBody;
    headers: Record<string, unknown>;
    deliveryCount: number;
    deliveryTag: string;
    /** Acknowledge the delivery — removes the message from the queue. */
    ack: () => void;
    /**
     * Negative acknowledge — when `requeue=true` the message goes back to the
     * head of the queue; when false it is discarded (or routed to the DLX if
     * bound).
     */
    nack: (opts?: {
        requeue?: boolean;
    }) => void;
}
```

#### <code v-pre>RabbitMQExchangeSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L97) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Exchange declaration.

```ts
export interface RabbitMQExchangeSpec {
    name: string;
    type: RabbitMQExchangeType;
    /** Durable flag — mirrors AMQP `durable=true` (stub tracks the flag). */
    durable?: boolean | undefined;
    /** Auto-delete flag — mirrors AMQP `autoDelete`. */
    autoDelete?: boolean | undefined;
    internal?: boolean | undefined;
    /** Additional exchange arguments. */
    args?: Record<string, unknown> | undefined;
}
```

#### <code v-pre>RabbitMQExchangeType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L21) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

AMQP 0.9.1 exchange types the adapter covers.

```ts
export type RabbitMQExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';
```

#### <code v-pre>RabbitMQFederationLink</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L109) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Federation link — binds an upstream to a downstream exchange or queue.

```ts
export interface RabbitMQFederationLink {
    upstreamName: string;
    downstreamExchange?: string | undefined;
    downstreamQueue?: string | undefined;
}
```

#### <code v-pre>RabbitMQFederationUpstream</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L98) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Federation upstream (source broker).

```ts
export interface RabbitMQFederationUpstream {
    name: string;
    /** Upstream URI — recorded so tests can assert against it. */
    uri: string;
    /** Prefetch on the federation link. Mirrors real federation configuration. */
    prefetchCount?: number | undefined;
    /** Optional expiry — how long the federated link stays alive. */
    expires?: number | undefined;
}
```

#### <code v-pre>RabbitMQMessageSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L33) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Structural mirror of a persisted AMQP message.

```ts
export interface RabbitMQMessageSnapshot<TBody = unknown> {
    messageId: string;
    queueName: string;
    exchange: string;
    routingKey: string;
    body: TBody;
    headers: Record<string, unknown>;
    deliveryCount: number;
    state: RabbitMQMessageState;
    failedReason?: string | undefined;
    /** Persistent flag — AMQP `deliveryMode=2` mirror. */
    persistent: boolean;
    /** ISO ms timestamp — enqueue time. */
    enqueuedAt: number;
}
```

#### <code v-pre>RabbitMQMessageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L24) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Terminal + intermediate states surfaced by the helper.

```ts
export type RabbitMQMessageState = 'ready' | 'unacked' | 'acked' | 'nacked' | 'requeued' | 'dead';
```

#### <code v-pre>RabbitMQMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L12) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

RabbitMQ backend selection. - `stub` — in-process AMQP 0.9.1 model emulation. No docker, no network. Fast + deterministic — enough to exercise exchange / queue / binding / consumer / ack / nack / prefetch semantics without spinning up a broker. - `testcontainers` — spawn a real `rabbitmq:3-management` container. The env exposes the amqp URL + management UI URL so consumers can drive the real broker via amqplib.

```ts
export type RabbitMQMode = 'stub' | 'testcontainers';
```

#### <code v-pre>RabbitMQPublishOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L50) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Options accepted by every publish.

```ts
export interface RabbitMQPublishOptions {
    /** Overrides `messageId` — otherwise auto-generated. */
    messageId?: string | undefined;
    /** Additional AMQP headers (also read by `headers` exchanges). */
    headers?: Record<string, unknown> | undefined;
    /**
     * Delivery mode. `persistent` messages survive broker restarts in production;
     * the stub tracks the flag so tests can assert against it.
     */
    persistent?: boolean | undefined;
    /**
     * Mandatory flag — real RabbitMQ returns the message when no binding matches
     * and `mandatory=true`. The stub records the return so tests can assert on
     * unroutable publishes.
     */
    mandatory?: boolean | undefined;
    /** AMQP `expiration` per-message TTL (milliseconds), applied on the stub. */
    expirationMs?: number | undefined;
    /** AMQP `priority` — 0..9. */
    priority?: number | undefined;
}
```

#### <code v-pre>RabbitMQQueueSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L110) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Queue declaration.

```ts
export interface RabbitMQQueueSpec {
    name: string;
    durable?: boolean | undefined;
    autoDelete?: boolean | undefined;
    exclusive?: boolean | undefined;
    /**
     * Queue-level max unacked messages — mirrors `x-max-length` in real Rabbit.
     * The stub tracks the limit for assertion purposes but does not block sends.
     */
    maxLength?: number | undefined;
    /** Additional queue arguments (x-* fields). */
    args?: Record<string, unknown> | undefined;
}
```

#### <code v-pre>RabbitMQTestcontainersOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L170) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Options for the testcontainers backend.

```ts
export interface RabbitMQTestcontainersOptions {
    /** Docker image. Defaults to `rabbitmq:3-management`. */
    image?: string | undefined;
    /**
     * Reuse an existing amqp URL (e.g. `amqp://guest:guest@localhost:5672`)
     * instead of spawning a container.
     */
    amqpUrl?: string | undefined;
    /** Startup timeout for auto-spawn (ms). Defaults to 60_000. */
    startupTimeoutMs?: number | undefined;
    /** Extra environment vars for the container. */
    env?: Record<string, string> | undefined;
}
```

#### <code v-pre>RabbitMQTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L201) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

RabbitMQ test env. Reads much like a mini AMQP channel facade — consumers declare topology, publish + consume messages, and use the assertion helpers to observe outcomes without touching a real broker.

```ts
export interface RabbitMQTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    backend: RabbitMQMode;
    /** Amqp URL — undefined in stub mode. */
    amqpUrl: string | undefined;
    /** Management UI URL — populated in testcontainers mode. */
    managementUrl: string | undefined;
    /** Declare an exchange. Idempotent for identical redeclarations. */
    declareExchange: (spec: RabbitMQExchangeSpec) => Promise<void>;
    /** Declare a queue. */
    declareQueue: (spec: RabbitMQQueueSpec) => Promise<void>;
    /** Bind a queue to an exchange. */
    bindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
    /** Unbind a queue from an exchange. */
    unbindQueue: (spec: RabbitMQBindingSpec) => Promise<void>;
    /** Publish a message to an exchange with routing key. */
    publish: <TBody = unknown>(input: {
        exchange: string;
        routingKey: string;
        body: TBody;
        options?: RabbitMQPublishOptions;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    /**
     * Directly enqueue on a queue — mirrors amqplib's default-exchange shortcut
     * where publishing on `""` with a routing key equal to the queue name puts
     * the message straight on the queue.
     */
    sendToQueue: <TBody = unknown>(input: {
        queue: string;
        body: TBody;
        options?: RabbitMQPublishOptions;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    /**
     * Peek at the messages currently on a queue — read-only, does not consume.
     */
    peek: <TBody = unknown>(queueName: string) => RabbitMQMessageSnapshot<TBody>[];
    /**
     * Get one message off the queue — mirrors AMQP `basic.get`. Returns null
     * when the queue is empty.
     */
    get: <TBody = unknown>(input: {
        queue: string;
        noAck?: boolean;
    }) => Promise<RabbitMQDelivery<TBody> | null>;
    /** Register a push-based consumer. */
    consume: <TBody = unknown>(input: {
        queue: string;
        handler: (delivery: RabbitMQDelivery<TBody>) => void | Promise<void>;
        options?: RabbitMQConsumeOptions;
    }) => Promise<RabbitMQConsumer<TBody>>;
    /**
     * Wait for a queue's next message (or a matching one) to reach a terminal
     * state (`acked` / `nacked` / `dead`). Rejects on timeout.
     */
    waitForMessage: <TBody = unknown>(queueName: string, opts?: {
        timeoutMs?: number;
        match?: (m: RabbitMQMessageSnapshot<TBody>) => boolean;
    }) => Promise<RabbitMQMessageSnapshot<TBody>>;
    /** Assertion — the next message on `queueName` was acked. */
    assertAcknowledged: <TBody = unknown>(queueName: string, expected?: {
        deliveryCount?: number;
    } | undefined) => Promise<RabbitMQMessageSnapshot<TBody>>;
    /** Assertion — the next message on `queueName` was requeued after a nack. */
    assertRequeued: <TBody = unknown>(queueName: string) => Promise<RabbitMQMessageSnapshot<TBody>>;
    /** Assertion — the queue is empty (no ready + no unacked). */
    assertQueueDrained: (queueName: string) => Promise<void>;
    /** Introspection — every publish the env has observed. */
    listPublished: <TBody = unknown>() => RabbitMQMessageSnapshot<TBody>[];
    /** Introspection — messages that were published as mandatory + unroutable. */
    listReturned: <TBody = unknown>() => RabbitMQMessageSnapshot<TBody>[];
    /** Reset all in-memory state. */
    reset: () => Promise<void>;
}
```

#### <code v-pre>SetupBullMQEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L70) <code v-pre>packages/queue/src/types.ts</code>

Common options for the `setupBullMQEnv` factory. `mode` chooses the backend; `redis` and `sandbox` are backend-specific overrides.

```ts
export interface SetupBullMQEnvOptions {
    /**
     * Backend selector. Defaults to `'sandbox'` when omitted — the fast, offline
     * path suitable for unit tests. Use `'testcontainers'` for integration-shaped
     * suites that exercise the real BullMQ + Redis roundtrip.
     */
    mode?: BullMQMode | undefined;
    /**
     * testcontainers overrides. Ignored when `mode === 'sandbox'`.
     */
    redis?: {
        /** Docker image tag. Defaults to `redis:7-alpine`. */
        image?: string | undefined;
        /**
         * Optional externally-managed Redis connection URL. When supplied the
         * helper skips container creation entirely.
         */
        url?: string | undefined;
    } | undefined;
    /**
     * sandbox overrides. Ignored when `mode === 'testcontainers'`.
     */
    sandbox?: {
        /**
         * How often to poll the sandbox scheduler when processing delayed jobs
         * (ms). Defaults to 1 which is the finest resolution the current
         * implementation supports.
         */
        pollIntervalMs?: number | undefined;
    } | undefined;
    /**
     * Queue name — mirrors `new Queue(name)` in real BullMQ. Defaults to
     * `'test-queue'`.
     */
    queueName?: string | undefined;
}
```

#### <code v-pre>SetupCloudflareQueuesEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L181) <code v-pre>packages/queue/src/cloudflare-queues/types.ts</code>

Common options for the `setupCloudflareQueuesEnv` factory.

```ts
export interface SetupCloudflareQueuesEnvOptions {
    /** Backend selector. Defaults to `'miniflare'`. */
    mode?: CloudflareQueuesMode | undefined;
    /**
     * Queue names the env pre-provisions. Additional queues are created lazily
     * on the first `send` / `registerConsumer` call, so this list is optional.
     */
    queues?: string[] | undefined;
    /**
     * Consumers registered at env creation time. Registering a duplicate
     * `queue` overwrites the previous handler.
     */
    consumers?: CloudflareQueueConsumerRegistration[] | undefined;
    /** miniflare overrides. */
    miniflare?: CloudflareQueuesMiniflareOptions | undefined;
    /** wrangler overrides. */
    wrangler?: CloudflareQueuesWranglerOptions | undefined;
}
```

#### <code v-pre>SetupInngestEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L127) <code v-pre>packages/queue/src/inngest/types.ts</code>

Common options for the `setupInngestEnv` factory.

```ts
export interface SetupInngestEnvOptions {
    /** Backend selector. Defaults to `'stub'`. */
    mode?: InngestMode | undefined;
    /**
     * Function definitions registered against the env. Registering a duplicate
     * `id` overwrites the previous one.
     */
    functions?: InngestFunctionDefinition[] | undefined;
    /** dev-server overrides. Ignored when `mode === 'stub'`. */
    devServer?: InngestDevServerOptions | undefined;
    /**
     * Inngest app name — mirrors `new Inngest({ id })` on the real SDK. Defaults
     * to `'kiwa-test-app'`.
     */
    appId?: string | undefined;
}
```

#### <code v-pre>SetupRabbitMQAdvancedEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L139) <code v-pre>packages/queue/src/rabbitmq-advanced/types.ts</code>

Options accepted by {@link setupRabbitMQAdvancedEnv }.

```ts
export interface SetupRabbitMQAdvancedEnvOptions {
    /** Standard exchanges (v1.10-3 basic API). */
    exchanges?: RabbitMQExchangeSpec[] | undefined;
    /** Delayed exchanges (this adapter). */
    delayedExchanges?: RabbitMQDelayedExchangeSpec[] | undefined;
    /** Queues with advanced arguments. */
    queues?: RabbitMQAdvancedQueueSpec[] | undefined;
    /** Bindings. */
    bindings?: RabbitMQBindingSpec[] | undefined;
    /** Cluster nodes — sizing simulation. */
    cluster?: {
        nodes: RabbitMQClusterNode[];
    } | undefined;
    /** Federation configuration. */
    federation?: {
        upstreams?: RabbitMQFederationUpstream[] | undefined;
        links?: RabbitMQFederationLink[] | undefined;
    } | undefined;
    /** amqp-connection-manager style auto-reconnect config. */
    autoReconnect?: {
        /** Initial retry delay in ms. Defaults to 100. */
        initialDelayMs?: number | undefined;
        /** Max retry delay in ms. Defaults to 1000. */
        maxDelayMs?: number | undefined;
        /** Multiplier applied between retries. Defaults to 2. */
        factor?: number | undefined;
        /** Max attempts before giving up. Defaults to 10. */
        maxAttempts?: number | undefined;
    } | undefined;
}
```

#### <code v-pre>SetupRabbitMQEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L185) <code v-pre>packages/queue/src/rabbitmq/types.ts</code>

Common options for the `setupRabbitMQEnv` factory.

```ts
export interface SetupRabbitMQEnvOptions {
    mode?: RabbitMQMode | undefined;
    /** Exchanges to declare at env creation time. */
    exchanges?: RabbitMQExchangeSpec[] | undefined;
    /** Queues to declare at env creation time. */
    queues?: RabbitMQQueueSpec[] | undefined;
    /** Bindings to declare at env creation time. */
    bindings?: RabbitMQBindingSpec[] | undefined;
    testcontainers?: RabbitMQTestcontainersOptions | undefined;
}
```

#### <code v-pre>SetupSQSEnvOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L172) <code v-pre>packages/queue/src/sqs/types.ts</code>

Common options for the `setupSQSEnv` factory.

```ts
export interface SetupSQSEnvOptions {
    /** Backend selector. Defaults to `'stub'`. */
    mode?: SQSMode | undefined;
    /**
     * Queue specs to create at env creation time. Additional queues can be
     * created later via `createQueue`.
     */
    queues?: SQSQueueSpec[] | undefined;
    /** AWS access credentials (localstack mode uses dummy defaults). */
    credentials?: {
        accessKeyId: string;
        secretAccessKey: string;
    } | undefined;
    /** localstack overrides. */
    localstack?: SQSLocalstackOptions | undefined;
}
```

#### <code v-pre>SQSBatchDeleteEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L122) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options for a batch delete.

```ts
export interface SQSBatchDeleteEntry {
    id: string;
    receiptHandle: string;
}
```

#### <code v-pre>SQSBatchSendEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L115) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options for a batch send.

```ts
export interface SQSBatchSendEntry<TBody = unknown> {
    id: string;
    body: TBody;
    options?: SQSSendOptions | undefined;
}
```

#### <code v-pre>SQSLocalstackOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L153) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options for the localstack backend. Ignored when `mode === 'stub'`.

```ts
export interface SQSLocalstackOptions {
    /** Docker image for LocalStack. Defaults to `localstack/localstack:3`. */
    image?: string | undefined;
    /**
     * Reuse an existing LocalStack endpoint URL (e.g. `http://localhost:4566`)
     * instead of spawning a container. When set, the helper skips
     * testcontainers and connects directly.
     */
    endpoint?: string | undefined;
    /** AWS region. Defaults to `us-east-1`. */
    region?: string | undefined;
    /**
     * Milliseconds to wait for the auto-spawned container before timing out.
     * Defaults to `60000`.
     */
    startupTimeoutMs?: number | undefined;
}
```

#### <code v-pre>SQSMessageSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L40) <code v-pre>packages/queue/src/sqs/types.ts</code>

Structural mirror of a persisted SQS message.

```ts
export interface SQSMessageSnapshot<TBody = unknown> {
    messageId: string;
    queueName: string;
    body: TBody;
    receiveCount: number;
    state: SQSMessageState;
    failedReason?: string | undefined;
    /** FIFO — non-empty when kind === 'fifo'. */
    messageGroupId?: string | undefined;
    messageDeduplicationId?: string | undefined;
    /**
     * ISO ms timestamp — when the message becomes visible for the next receive
     * (send time + delaySeconds, or receive time + visibilityTimeoutSeconds
     * while in-flight).
     */
    visibleAt: number;
}
```

#### <code v-pre>SQSMessageState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L33) <code v-pre>packages/queue/src/sqs/types.ts</code>

Terminal + intermediate states surfaced by the helper. `pending` messages live in the queue waiting for the next receive. `inflight` messages have been received and are within their visibility timeout window. `deleted` covers messages the consumer explicitly deleted. `dead` covers messages that exhausted `maxReceiveCount` and were routed to the DLQ.

```ts
export type SQSMessageState = 'pending' | 'inflight' | 'deleted' | 'dead';
```

#### <code v-pre>SQSMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L12) <code v-pre>packages/queue/src/sqs/types.ts</code>

AWS SQS backend selection. - `stub`: in-process, deterministic FIFO / standard queue emulation. No docker, no network. Suitable for unit tests that need to exercise the send / receive / delete / batch / visibility timeout / DLQ semantics without spinning up localstack. - `localstack`: run against a real LocalStack container. Exercises the actual `@aws-sdk/client-sqs` wire with a real (offline) SQS API.

```ts
export type SQSMode = 'stub' | 'localstack';
```

#### <code v-pre>SQSQueueKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L24) <code v-pre>packages/queue/src/sqs/types.ts</code>

FIFO / standard queue kind. FIFO queues require `.fifo` suffix on the queue name and honour `MessageGroupId` + `MessageDeduplicationId`.

```ts
export type SQSQueueKind = 'standard' | 'fifo';
```

#### <code v-pre>SQSQueueSpec</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L131) <code v-pre>packages/queue/src/sqs/types.ts</code>

Queue declaration — passed to `setupSQSEnv({ queues: [...] })` to create the queue up front (both stub + localstack modes honour this).

```ts
export interface SQSQueueSpec {
    /** Queue name — for FIFO queues must end with `.fifo`. */
    name: string;
    /** Queue kind — defaults to `standard`. */
    kind?: SQSQueueKind | undefined;
    /**
     * Queue-level default visibility timeout (seconds). Defaults to 30 which
     * matches production SQS.
     */
    visibilityTimeoutSeconds?: number | undefined;
    /**
     * DLQ config — when set, messages that exceed `maxReceiveCount` receives
     * are routed to `deadLetterTargetArn` (in stub mode the arn is treated as
     * a plain queue name).
     */
    redrivePolicy?: {
        deadLetterTargetArn: string;
        maxReceiveCount: number;
    } | undefined;
}
```

#### <code v-pre>SQSReceivedMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L103) <code v-pre>packages/queue/src/sqs/types.ts</code>

Received message wrapper — consumers call `.delete()` to remove the message after successful processing, `.changeVisibility()` to extend the inflight window, or let the visibility timeout expire so the message returns to the queue.

```ts
export interface SQSReceivedMessage<TBody = unknown> {
    messageId: string;
    receiptHandle: string;
    body: TBody;
    receiveCount: number;
    messageGroupId?: string | undefined;
    messageDeduplicationId?: string | undefined;
    delete: () => void;
    changeVisibility: (timeoutSeconds: number) => void;
}
```

#### <code v-pre>SQSReceiveOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L79) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options accepted by {@link SQSTestEnv.receive}.

```ts
export interface SQSReceiveOptions {
    /**
     * Max messages returned in one receive call. SQS caps at 10 — the helper
     * honours the same cap. Defaults to 1.
     */
    maxMessages?: number | undefined;
    /**
     * Visibility timeout for the returned messages (seconds). Defaults to the
     * queue-level `visibilityTimeoutSeconds` (30s if unset).
     */
    visibilityTimeoutSeconds?: number | undefined;
    /**
     * Long-poll wait time. When > 0 the helper will wait up to this many
     * seconds for a message to become visible. Defaults to 0.
     */
    waitTimeSeconds?: number | undefined;
}
```

#### <code v-pre>SQSSendOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L59) <code v-pre>packages/queue/src/sqs/types.ts</code>

Options accepted by every {@link SQSTestEnv.send} call.

```ts
export interface SQSSendOptions {
    /**
     * Delay before the message becomes eligible for the next receive
     * (seconds). Real SQS caps at 900. Defaults to 0.
     */
    delaySeconds?: number | undefined;
    /**
     * FIFO — required when the queue kind is `fifo`. Groups messages so
     * consumers in the same group process them in order.
     */
    messageGroupId?: string | undefined;
    /**
     * FIFO — optional deduplication token. Duplicate `send` calls with the
     * same deduplication id within the 5-minute production window are treated
     * as no-ops. The helper uses the same rule but without the time bound.
     */
    messageDeduplicationId?: string | undefined;
}
```

#### <code v-pre>SQSTestEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L194) <code v-pre>packages/queue/src/sqs/types.ts</code>

Return type of {@link setupSQSEnv }. Reads much like a mini SQS facade — consumers create queues, send / receive / delete messages, and use the assertion helpers to observe outcomes without touching the wire.

```ts
export interface SQSTestEnv<TMode extends TestMode = TestMode> extends TestEnvBase<TMode> {
    /** Chosen backend — mirrors the `mode` parameter. */
    backend: SQSMode;
    /** Localstack endpoint URL — undefined in stub mode. */
    endpoint: string | undefined;
    /** Queue names the env has observed. */
    queues: string[];
    /** Create (or replace) a queue. */
    createQueue: (spec: SQSQueueSpec) => Promise<void>;
    /** Enqueue a message. Returns the snapshot at enqueue time. */
    send: <TBody = unknown>(queueName: string, body: TBody, options?: SQSSendOptions) => Promise<SQSMessageSnapshot<TBody>>;
    /** Batch enqueue — up to 10 messages per call (mirrors SQS SendMessageBatch). */
    sendBatch: <TBody = unknown>(queueName: string, entries: SQSBatchSendEntry<TBody>[]) => Promise<SQSMessageSnapshot<TBody>[]>;
    /** Receive a batch — up to 10 messages per call. */
    receive: <TBody = unknown>(queueName: string, options?: SQSReceiveOptions) => Promise<SQSReceivedMessage<TBody>[]>;
    /** Batch delete — mirrors SQS DeleteMessageBatch. */
    deleteBatch: (queueName: string, entries: SQSBatchDeleteEntry[]) => Promise<void>;
    /**
     * Wait for the first message on `queueName` to reach a terminal state
     * (`deleted` or `dead`). Rejects on timeout (default 5s).
     */
    waitForMessage: <TBody = unknown>(queueName: string, opts?: {
        timeoutMs?: number | undefined;
    }) => Promise<SQSMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` was successfully deleted. */
    assertDeleted: <TBody = unknown>(queueName: string, expected?: {
        receiveCount?: number | undefined;
    } | undefined) => Promise<SQSMessageSnapshot<TBody>>;
    /** Assertion — the first message on `queueName` was routed to the DLQ. */
    assertDeadLettered: <TBody = unknown>(queueName: string, expected?: {
        dlq?: string | undefined;
        receiveCount?: number | undefined;
    } | undefined) => Promise<SQSMessageSnapshot<TBody>>;
    /** Assertion — the queue has no pending / inflight messages. */
    assertQueueDrained: (queueName?: string | undefined) => Promise<void>;
    /** Introspection helper — every message snapshot in a queue. */
    listMessages: (queueName?: string | undefined) => SQSMessageSnapshot[];
    /** Introspection helper — every message routed to a DLQ. */
    listDeadLetters: (dlqName?: string | undefined) => SQSMessageSnapshot[];
}
```
<!-- kiwa-public-api:end -->
