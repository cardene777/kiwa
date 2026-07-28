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
| 'setupCloudflareQueuesEnv: cannot use env after stop()' | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L108) |
| &#96;dispatch: maxBatchSize must be &gt;= 1 for queue "$&#123;queueName&#125;", got $&#123;size&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L252) |
| 'send: queueName must be a non-empty string' | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L284) |
| 'send: delaySeconds must be non-negative' | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L288) |
| &#96;waitForMessage: timeout waiting for queue "$&#123;queueName&#125;" after $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L330) |
| &#96;assertAcknowledged: expected message on "$&#123;queueName&#125;" to be acked, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L347) |
| &#96;assertAcknowledged: expected $&#123;expected.attempts&#125; attempt(s), observed $&#123;snap.attempts&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L352) |
| &#96;assertDeadLettered: expected message on "$&#123;queueName&#125;" to be dead-lettered, got state=$&#123;snap.state&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L368) |
| &#96;assertDeadLettered: expected $&#123;expected.attempts&#125; attempt(s), observed $&#123;snap.attempts&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L373) |
| &#96;assertDeadLettered: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L378) |
| &#96;assertDeadLettered: message "$&#123;snap.id&#125;" was not routed to DLQ "$&#123;expected.dlq&#125;" (observed queues: $&#123;JSON.stringify(Array.from(dlqMessages.keys()))&#125;)&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L386) |
| &#96;assertRetried: expected $&#123;expectedRetries&#125; attempt(s) for "$&#123;queueName&#125;", observed $&#123;snap.attempts&#125;&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L399) |
| &#96;assertQueueDrained: queue$&#123;queueName ? &#96; "$&#123;queueName&#125;"&#96; : 's'&#125; still have pending / delivered / retrying messages after 250ms&#96; | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L426) |
| 'registerConsumer: &#96;queue&#96; must be a non-empty string identifying the source queue' | [packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L74) |
| &#96;setupCloudflareQueuesEnv: unknown mode "$&#123;String(mode)&#125;" — expected "miniflare" or "wrangler"&#96; | [packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts#L25) |
| &#96;@kiwa-lab/queue: wrangler dev did not respond at $&#123;probeUrl&#125; within $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L42) |
| "@kiwa-lab/queue: wrangler mode requires node:child&#95;process (Node &gt;= 20). Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L55) |
| &#96;@kiwa-lab/queue: dev-server rejected event "$&#123;event.name&#125;" (HTTP $&#123;response.status&#125;): $&#123;body&#125;&#96; | [packages/queue/src/inngest/dev-server-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L136) |
| &#96;@kiwa-lab/queue: Inngest dev-server did not respond at $&#123;probeUrl&#125; within $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/inngest/dev-server-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L42) |
| "@kiwa-lab/queue: dev-server mode requires node:child&#95;process (Node &gt;= 20). Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/queue/src/inngest/dev-server-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L55) |
| &#96;setupInngestEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "dev-server"&#96; | [packages/queue/src/inngest/setup-inngest-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/setup-inngest-env.ts#L24) |
| &#96;waitForRun: timeout waiting for function "$&#123;functionId&#125;" after $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L213) |
| &#96;assertFunctionRan: expected function "$&#123;functionId&#125;" to complete, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L230) |
| &#96;assertFunctionRan: return value mismatch for "$&#123;functionId&#125;". expected=$&#123;wanted&#125; actual=$&#123;actual&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L238) |
| &#96;assertFunctionFailed: expected function "$&#123;functionId&#125;" to fail, got state=$&#123;snap.state&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L253) |
| &#96;assertFunctionFailed: expected $&#123;expected.attempts&#125; attempt(s), observed $&#123;snap.attemptsMade&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L258) |
| &#96;assertFunctionFailed: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L263) |
| &#96;assertRetried: expected $&#123;expectedAttempts&#125; attempt(s) for "$&#123;functionId&#125;", observed $&#123;snap.attemptsMade&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L275) |
| &#96;assertStepRan: expected step "$&#123;stepId&#125;" to run in function "$&#123;functionId&#125;", observed steps=$&#123;JSON.stringify(snap.stepsRun)&#125;&#96; | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L287) |
| 'assertQueueDrained: env still has queued / running runs after 250ms' | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L309) |
| 'setupInngestEnv: cannot use env after stop()' | [packages/queue/src/inngest/stub-inngest.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L69) |
| &#96;assertDeadLettered: no dead-letter observed for queue $&#123;queue&#125;&#96; + (expected ? &#96; matching $&#123;JSON.stringify(expected)&#125;&#96; : '') | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L212) |
| &#96;publishDelayed: exchange $&#123;input.exchange&#125; is not a delayed exchange&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L235) |
| 'publishDelayed: delayMs must be non-negative' | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L240) |
| &#96;waitForDelivery: no delayed message delivered to $&#123;exchange&#125; within $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L280) |
| &#96;stopNode: node $&#123;id&#125; not registered&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L318) |
| &#96;startNode: node $&#123;id&#125; not registered&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L324) |
| &#96;assertQuorumHealthy: queue $&#123;queueName&#125; not declared&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L338) |
| &#96;assertQuorumHealthy: queue $&#123;queueName&#125; is not a quorum queue&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L341) |
| &#96;assertQuorumHealthy: queue $&#123;queueName&#125; requires $&#123;min&#125; active nodes, only $&#123;activeCount&#125; available&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L346) |
| &#96;ingestFromUpstream: upstream $&#123;input.upstreamName&#125; not registered&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L367) |
| &#96;ingestFromUpstream: no federation link for upstream $&#123;input.upstreamName&#125; → $&#123;input.exchange&#125;&#96; | [packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L376) |
| &#96;setupRabbitMQEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "testcontainers"&#96; | [packages/queue/src/rabbitmq/setup-rabbitmq-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/setup-rabbitmq-env.ts#L24) |
| &#96;stub-rabbitmq: exchange $&#123;spec.name&#125; already declared with type $&#123;existing.type&#125;, cannot redeclare as $&#123;spec.type&#125;&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L133) |
| &#96;stub-rabbitmq: queue $&#123;queueName&#125; not declared&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L169) |
| &#96;stub-rabbitmq: exchange $&#123;exchangeName&#125; not declared&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L185) |
| &#96;bindQueue: exchange $&#123;spec.exchange&#125; not declared&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L337) |
| &#96;bindQueue: queue $&#123;spec.queue&#125; not declared&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L340) |
| &#96;get: queue $&#123;input.queue&#125; not declared&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L413) |
| &#96;consume: queue $&#123;input.queue&#125; not declared&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L427) |
| &#96;consume: queue $&#123;input.queue&#125; has exclusive consumer&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L431) |
| &#96;consume: cannot register exclusive consumer, others already exist&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L434) |
| &#96;waitForMessage: timeout waiting for message on $&#123;queueName&#125;&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L481) |
| &#96;assertAcknowledged: expected deliveryCount $&#123;expected.deliveryCount&#125; but got $&#123;snap.deliveryCount&#125;&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L492) |
| &#96;assertRequeued: timeout waiting for requeued delivery on $&#123;queueName&#125;&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L511) |
| &#96;assertQueueDrained: queue $&#123;queueName&#125; still has $&#123;pending.length&#125; pending messages&#96; | [packages/queue/src/rabbitmq/stub-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L518) |
| 'setupRabbitMQEnv: mode="testcontainers" requires testcontainers.amqpUrl (v0.3 scope). Provide the URL of a running RabbitMQ broker, or use mode="stub" for zero-infra tests.' | [packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L22) |
| &#96;setupRabbitMQEnv: RabbitMQ broker at $&#123;amqpUrl&#125; did not respond within $&#123;timeoutMs&#125;ms: $&#123; lastError instanceof Error ? lastError.message : String(lastError) &#125;&#96; | [packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L97) |
| 'setupBullMQEnv: cannot addJob after stop()' | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L147) |
| 'addJob: attempts must be at least 1' | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L153) |
| 'addJob: delay must be non-negative' | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L156) |
| &#96;waitForJob: timeout waiting for job "$&#123;name&#125;" after $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L201) |
| &#96;assertProcessed: expected job "$&#123;name&#125;" to complete, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L218) |
| &#96;assertProcessed: return value mismatch for "$&#123;name&#125;". expected=$&#123;wanted&#125; actual=$&#123;actual&#125;&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L227) |
| &#96;assertFailed: expected job "$&#123;name&#125;" to fail, got state=$&#123;snap.state&#125;&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L240) |
| &#96;assertFailed: expected $&#123;expected.retry&#125; attempt(s), observed $&#123;snap.attemptsMade&#125;&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L245) |
| &#96;assertFailed: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L250) |
| &#96;assertRetried: expected $&#123;expectedRetry&#125; attempt(s) for "$&#123;name&#125;", observed $&#123;snap.attemptsMade&#125;&#96; | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L262) |
| 'assertQueueDrained: queue still has waiting / active jobs after 250ms' | [packages/queue/src/sandbox-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L279) |
| &#96;setupBullMQEnv: unknown mode "$&#123;String(mode)&#125;" — expected "sandbox" or "testcontainers"&#96; | [packages/queue/src/setup-bullmq-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/setup-bullmq-env.ts#L24) |
| &#96;setupSQSEnv: LocalStack at "$&#123;endpoint&#125;" did not respond within $&#123;timeoutMs&#125;ms — $&#123;reason&#125;&#96; | [packages/queue/src/sqs/localstack-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L105) |
| 'setupSQSEnv: mode="localstack" requires localstack.endpoint (v0.2 scope). Provide the URL of a running LocalStack instance, or use mode="stub" for zero-infra tests.' | [packages/queue/src/sqs/localstack-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L31) |
| &#96;setupSQSEnv: unknown mode "$&#123;String(mode)&#125;" — expected "stub" or "localstack"&#96; | [packages/queue/src/sqs/setup-sqs-env.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/setup-sqs-env.ts#L25) |
| &#96;createQueue: FIFO queue name "$&#123;spec.name&#125;" must end with ".fifo" (AWS SQS constraint)&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L101) |
| 'send: queueName must be a non-empty string' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L149) |
| 'send: delaySeconds must be non-negative' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L153) |
| 'send: delaySeconds cannot exceed 900 (AWS SQS constraint mirrored by the stub)' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L155) |
| &#96;send: FIFO queue "$&#123;queueName&#125;" requires messageGroupId — pass it via send options&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L161) |
| 'sendBatch: SQS SendMessageBatch caps at 10 entries per call' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L217) |
| 'deleteBatch: SQS DeleteMessageBatch caps at 10 entries per call' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L293) |
| &#96;waitForMessage: timeout waiting for queue "$&#123;queueName&#125;" after $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L320) |
| &#96;assertDeleted: expected message on "$&#123;queueName&#125;" to be deleted, got state=$&#123;snap.state&#125; reason=$&#123;snap.failedReason ?? 'unknown'&#125;&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L337) |
| &#96;assertDeleted: expected $&#123;expected.receiveCount&#125; receive(s), observed $&#123;snap.receiveCount&#125;&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L342) |
| &#96;assertDeadLettered: expected message on "$&#123;queueName&#125;" to be dead-lettered, got state=$&#123;snap.state&#125;&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L354) |
| &#96;assertDeadLettered: expected $&#123;expected.receiveCount&#125; receive(s), observed $&#123;snap.receiveCount&#125;&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L359) |
| &#96;assertDeadLettered: message "$&#123;snap.messageId&#125;" was not routed to DLQ "$&#123;expected.dlq&#125;"&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L367) |
| &#96;assertQueueDrained: queue$&#123;queueName ? &#96; "$&#123;queueName&#125;"&#96; : 's'&#125; still have pending / inflight messages after 250ms&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L388) |
| 'setupSQSEnv: cannot use env after stop()' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L82) |
| &#96;setupSQSEnv: queue "$&#123;name&#125;" does not exist — call createQueue() or pass it via setupSQSEnv(&#123; queues &#125;)&#96; | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L88) |
| 'createQueue: &#96;name&#96; must be a non-empty string' | [packages/queue/src/sqs/stub-sqs.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L97) |
| &#96;waitForJob: timeout waiting for job "$&#123;name&#125;" after $&#123;timeoutMs&#125;ms&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L275) |
| &#96;assertProcessed: expected job "$&#123;name&#125;" to complete, got state=$&#123;snap.state&#125;&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L291) |
| &#96;assertProcessed: return value mismatch for "$&#123;name&#125;". expected=$&#123;wanted&#125; actual=$&#123;actual&#125;&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L299) |
| &#96;assertFailed: expected job "$&#123;name&#125;" to fail, got state=$&#123;snap.state&#125;&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L312) |
| &#96;assertFailed: expected $&#123;expected.retry&#125; attempt(s), observed $&#123;snap.attemptsMade&#125;&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L317) |
| &#96;assertFailed: failedReason "$&#123;snap.failedReason ?? ''&#125;" did not match $&#123;expected.reasonMatch&#125;&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L322) |
| &#96;assertRetried: expected $&#123;expectedRetry&#125; attempt(s) for "$&#123;name&#125;", observed $&#123;snap.attemptsMade&#125;&#96; | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L334) |
| 'assertQueueDrained: queue still has waiting / active / delayed jobs after 1s' | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L353) |
| "@kiwa-lab/queue: testcontainers mode requires 'bullmq' + 'ioredis' peer dependencies. Install with &#96;pnpm add -D bullmq ioredis&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L73) |
| "@kiwa-lab/queue: testcontainers mode requires the 'testcontainers' peer dependency. Install with &#96;pnpm add -D testcontainers&#96;. Original error: " + (caught instanceof Error ? caught.message : String(caught)) | [packages/queue/src/testcontainers-queue.ts](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L92) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createDevServerInngestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/dev-server-inngest.ts#L103) `packages/queue/src/inngest/dev-server-inngest.ts`

Build a dev-server-backed Inngest env. When `devServer.url` is supplied the helper reuses that dev-server; otherwise it spawns one via `npx inngest-cli@latest dev`. The env still runs function handlers in-process (matching v0.1 scope) but every event goes through the real dev-server HTTP round-trip, so the wire shape is prod-parity.

```ts
export declare function createDevServerInngestEnv(opts: SetupInngestEnvOptions & {
    appId: string;
}): Promise<InngestTestEnv<'live'>>;
```

#### `createLocalstackSQSEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/localstack-sqs.ts#L26) `packages/queue/src/sqs/localstack-sqs.ts`

Build a LocalStack-backed SQS env. When `opts.localstack?.endpoint` is provided the helper connects directly to that endpoint and verifies responsiveness. Otherwise the helper would spawn a testcontainers LocalStack instance — kept out of the v0.2 scope so callers wanting fully-managed containers can opt in later. The v0.2 wire path shares the stub simulation for message state (so assertion helpers stay deterministic) while surfacing the LocalStack `endpoint` on the env for callers that want to point their own `@aws-sdk/client-sqs` at it.

```ts
export declare function createLocalstackSQSEnv(opts: SetupSQSEnvOptions): Promise<SQSTestEnv<'live'>>;
```

#### `createMiniflareCloudflareQueuesEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts#L54) `packages/queue/src/cloudflare-queues/miniflare-cloudflare-queues.ts`

Build a miniflare-shaped (offline, in-process) Cloudflare Queues env. The simulation covers the message lifecycle observed by production Workers — `send` / consumer batch / retry / DLQ — deterministically, without spinning up a wrangler dev-server. When `opts.miniflare?.miniflare` is supplied the helper leaves lifecycle to the caller and only consumes the injected instance for structural parity; the internal simulation still drives message state so tests stay deterministic.

```ts
export declare function createMiniflareCloudflareQueuesEnv(opts: SetupCloudflareQueuesEnvOptions): CloudflareQueuesTestEnv<'mock'>;
```

#### `createSandboxBullMQEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sandbox-queue.ts#L46) `packages/queue/src/sandbox-queue.ts`

Build a sandbox (offline, in-process) BullMQ-shaped queue. Suitable for unit tests that need to exercise the job lifecycle (add / process / retry / fail / drain) without spinning up a Redis container.

```ts
export declare function createSandboxBullMQEnv(opts: SetupBullMQEnvOptions & {
    queueName: string;
}): BullMQTestEnv<'mock'>;
```

#### `createStubInngestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/stub-inngest.ts#L48) `packages/queue/src/inngest/stub-inngest.ts`

Build a stub (offline, in-process) Inngest env. Deterministic enough to exercise the retry / step / concurrency semantics needed by unit tests without spinning up a real dev-server.

```ts
export declare function createStubInngestEnv(opts: SetupInngestEnvOptions & {
    appId: string;
}): InngestTestEnv<'mock'>;
```

#### `createStubRabbitMQEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/stub-rabbitmq.ts#L117) `packages/queue/src/rabbitmq/stub-rabbitmq.ts`

Build the stub RabbitMQ env — in-process, deterministic AMQP 0.9.1 model emulation. No docker required.

```ts
export declare function createStubRabbitMQEnv(opts?: SetupRabbitMQEnvOptions): RabbitMQTestEnv<'mock'>;
```

#### `createStubSQSEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/stub-sqs.ts#L63) `packages/queue/src/sqs/stub-sqs.ts`

Build an in-process stub of AWS SQS covering the message lifecycle observed by production consumers — `send` / `receive` / `delete` / batch / visibility timeout / DLQ / FIFO deduplication — deterministically, without spinning up localstack.

```ts
export declare function createStubSQSEnv(opts: SetupSQSEnvOptions): SQSTestEnv<'mock'>;
```

#### `createTestcontainersBullMQEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/testcontainers-queue.ts#L112) `packages/queue/src/testcontainers-queue.ts`

Build a testcontainers-backed BullMQ environment. Requires Docker; the real bullmq + ioredis peers do the heavy lifting so semantic drift from prod is limited to whatever bullmq itself abstracts.

```ts
export declare function createTestcontainersBullMQEnv(opts: SetupBullMQEnvOptions & {
    queueName: string;
}): Promise<BullMQTestEnv<'live'>>;
```

#### `createTestcontainersRabbitMQEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts#L17) `packages/queue/src/rabbitmq/testcontainers-rabbitmq.ts`

Build a testcontainers-backed RabbitMQ env. When `opts.testcontainers?.amqpUrl` is provided the helper connects directly to that URL and verifies responsiveness. Otherwise the helper would spawn a testcontainers RabbitMQ instance — kept out of the v0.3 scope so callers wanting fully-managed containers can opt in later (add the `testcontainers` peer dep + a small container factory). The v0.3 wire path shares the stub simulation for message state (so assertion helpers stay deterministic) while surfacing the `amqpUrl` + `managementUrl` on the env for callers that want to point their own `amqplib` at it.

```ts
export declare function createTestcontainersRabbitMQEnv(opts: SetupRabbitMQEnvOptions): Promise<RabbitMQTestEnv<'live'>>;
```

#### `createWranglerCloudflareQueuesEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts#L109) `packages/queue/src/cloudflare-queues/wrangler-cloudflare-queues.ts`

Build a wrangler-backed Cloudflare Queues env. When `wrangler.url` is supplied the helper reuses that dev-server; otherwise it spawns one via `npx wrangler@latest dev`. The env still runs consumer batch handlers in-process (matching v0.2 scope) via the miniflare simulation so retry / DLQ semantics stay deterministic; the wrangler process provides the live wire so consumers can verify their local `wrangler.toml` binds correctly.

```ts
export declare function createWranglerCloudflareQueuesEnv(opts: SetupCloudflareQueuesEnvOptions): Promise<CloudflareQueuesTestEnv<'live'>>;
```

#### `dispatchJobEvent`

公開 entry point から解決しています。

`dispatchEvent` を `dispatchJobEvent` として公開しています。

```ts
export {
  startJob,
  dispatchEvent as dispatchJobEvent,
  summarizeJob,
} from './job-lifecycle-orchestrator.js';
```

#### `setupBullMQEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/setup-bullmq-env.ts#L18) `packages/queue/src/setup-bullmq-env.ts`

Factory for BullMQ test environments. `mode: 'sandbox'` (default) returns a fast, in-process fake — no Docker, no peer dependencies required beyond `bullmq`'s type shape via structural duck-typing. Use it for the fast unit-test lane. `mode: 'testcontainers'` boots a real Redis under testcontainers and wires up a real `bullmq.Queue` + `bullmq.Worker`. Use it for the integration lane that needs prod-shape parity.

```ts
export declare function setupBullMQEnv(opts?: SetupBullMQEnvOptions): Promise<BullMQTestEnv>;
```

#### `setupCloudflareQueuesEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts#L20) `packages/queue/src/cloudflare-queues/setup-cloudflare-queues-env.ts`

Factory for Cloudflare Queues test environments. `mode: 'miniflare'` (default) returns a fast, in-process fake — no wrangler subprocess, no network. Deterministic enough to exercise send / consumer batch / retry / DLQ semantics without spinning up an external process. `mode: 'wrangler'` boots (or connects to) a real `wrangler dev --local` process and verifies it responds before returning the env. The env still runs consumer batch handlers in-process (v0.2 scope) so retry / DLQ assertions stay deterministic across backends.

```ts
export declare function setupCloudflareQueuesEnv(opts?: SetupCloudflareQueuesEnvOptions): Promise<CloudflareQueuesTestEnv>;
```

#### `setupInngestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/setup-inngest-env.ts#L18) `packages/queue/src/inngest/setup-inngest-env.ts`

Factory for Inngest test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no dev-server, no network. Suitable for unit tests that need to exercise retry / step / concurrency semantics deterministically. `mode: 'dev-server'` boots (or connects to) a real Inngest dev-server and routes every event through the wire before dispatching function handlers. Suitable for integration tests that need prod-shape parity.

```ts
export declare function setupInngestEnv(opts?: SetupInngestEnvOptions): Promise<InngestTestEnv>;
```

#### `setupRabbitMQAdvancedEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts#L39) `packages/queue/src/rabbitmq-advanced/setup-rabbitmq-advanced-env.ts`

Build the advanced RabbitMQ test env. Composes over the basic stub adapter (v1.10-3) — the basic env owns exchange / queue / binding / consumer bookkeeping, while this env layers DLX routing, delayed message plugin, cluster simulation, federation, and auto-reconnect.

```ts
export declare function setupRabbitMQAdvancedEnv(opts?: SetupRabbitMQAdvancedEnvOptions): Promise<RabbitMQAdvancedTestEnv<'mock'>>;
```

#### `setupRabbitMQEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/setup-rabbitmq-env.ts#L19) `packages/queue/src/rabbitmq/setup-rabbitmq-env.ts`

Factory for RabbitMQ test environments. `mode: 'stub'` (default) returns a fast, in-process AMQP 0.9.1 model emulator. No docker, no network. Deterministic enough to exercise exchange / queue / binding / consumer / ack / nack / prefetch semantics. `mode: 'testcontainers'` connects to a running RabbitMQ broker (URL provided via `testcontainers.amqpUrl`) and verifies responsiveness via the management API. The env still runs the message simulation in-process (v0.3 scope) so assertions stay deterministic across backends; callers that want to drive the real wire can point their own `amqplib` at the exposed `env.amqpUrl`.

```ts
export declare function setupRabbitMQEnv(opts?: SetupRabbitMQEnvOptions): Promise<RabbitMQTestEnv>;
```

#### `setupSQSEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/setup-sqs-env.ts#L20) `packages/queue/src/sqs/setup-sqs-env.ts`

Factory for AWS SQS test environments. `mode: 'stub'` (default) returns a fast, in-process fake — no docker, no network. Deterministic enough to exercise send / receive / delete / batch / visibility timeout / DLQ / FIFO deduplication semantics without spinning up localstack. `mode: 'localstack'` connects to a running LocalStack endpoint (URL provided via `localstack.endpoint`) and verifies responsiveness before returning the env. The env still runs the message simulation in-process (v0.2 scope) so assertions stay deterministic across backends; callers that want to drive the real wire can point their own `@aws-sdk/client-sqs` at the exposed `env.endpoint`.

```ts
export declare function setupSQSEnv(opts?: SetupSQSEnvOptions): Promise<SQSTestEnv>;
```

#### `startJob`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L36) `packages/queue/src/semantics/job-lifecycle-orchestrator.ts`

```ts
export declare function startJob(input: {
    timestamp: string;
}): JobSession;
```

#### `summarizeJob`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L138) `packages/queue/src/semantics/job-lifecycle-orchestrator.ts`

```ts
export declare function summarizeJob(session: JobSession): JobSummary;
```

### 型

#### `BullMQMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L13) `packages/queue/src/types.ts`

BullMQ backend selection. - `testcontainers`: start a real Redis in a testcontainers-managed Docker container. Deterministic + prod-shape parity. Requires Docker + the `testcontainers` + `bullmq` + `ioredis` peer dependencies. - `sandbox`: run against an in-process Redis-compatible stub tied to the test process only. Fast (no container startup), fully offline, and sufficient for a large slice of BullMQ semantics (add / process / retry / fail / drain) but does not exercise Redis-side pipelining semantics.

```ts
export type BullMQMode = 'testcontainers' | 'sandbox';
```

#### `BullMQTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L116) `packages/queue/src/types.ts`

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

#### `CloudflareQueueBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L78) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueueConsumer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L107) `packages/queue/src/cloudflare-queues/types.ts`

Consumer handler signature — mirrors the shape of the Workers `queue()` entrypoint.

```ts
export type CloudflareQueueConsumer<TBody = unknown> = (batch: CloudflareQueueBatch<TBody>) => Promise<void> | void;
```

#### `CloudflareQueueConsumerRegistration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L151) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueueMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L94) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueueMessageSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L39) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueueMessageState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L31) `packages/queue/src/cloudflare-queues/types.ts`

Terminal + intermediate states surfaced by the helper. `pending` messages live in the queue waiting for the next consumer batch. `delivered` messages are the ones consumer batches saw and either ack'd or retried. `retrying` covers explicit `msg.retry()` calls that pushed a message back for another batch. `dead` covers messages that exhausted `maxRetries` and were shunted into the dead-letter queue.

```ts
export type CloudflareQueueMessageState = 'pending' | 'delivered' | 'retrying' | 'ack' | 'dead';
```

#### `CloudflareQueueSendOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L59) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueuesMiniflareOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L114) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueuesMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L15) `packages/queue/src/cloudflare-queues/types.ts`

Cloudflare Queues backend selection. - `miniflare`: run against an in-process Cloudflare-shaped Queue simulation powered by miniflare (no wrangler subprocess, no network). Fast, offline, fully deterministic. Suitable for unit tests that need to exercise the send / consumer batch / retry / DLQ semantics without spinning up an external process. - `wrangler`: probe or auto-spawn a real Wrangler dev-server process (`wrangler dev --queue`). Exercises the actual wrangler wire while the consumer batch handler still executes in-process (v0.2 scope) so tests stay deterministic.

```ts
export type CloudflareQueuesMode = 'miniflare' | 'wrangler';
```

#### `CloudflareQueuesTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L205) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `CloudflareQueuesWranglerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L132) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `InngestDevServerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L114) `packages/queue/src/inngest/types.ts`

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

#### `InngestEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L34) `packages/queue/src/inngest/types.ts`

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

#### `InngestFunctionContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L62) `packages/queue/src/inngest/types.ts`

Context surfaced to an Inngest function handler.

```ts
export interface InngestFunctionContext<TData = unknown> {
    event: InngestEvent<TData>;
    step: InngestStepContext;
    attempt: number;
}
```

#### `InngestFunctionDefinition`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L77) `packages/queue/src/inngest/types.ts`

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

#### `InngestFunctionHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L69) `packages/queue/src/inngest/types.ts`

Function handler signature — mirrors the `handler` parameter of `inngest.createFunction`.

```ts
export type InngestFunctionHandler<TData = unknown, TResult = unknown> = (ctx: InngestFunctionContext<TData>) => Promise<TResult> | TResult;
```

#### `InngestMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L14) `packages/queue/src/inngest/types.ts`

Inngest backend selection. - `stub`: fully in-process. Functions register by name + event key, and `sendEvent` invokes them directly without going through the Inngest wire protocol. Fast, offline, deterministic. Suitable for unit tests that need to exercise retry / step / concurrency semantics without a dev-server. - `dev-server`: talks to a real Inngest dev-server (either an externally managed one supplied via `devServer.url` or one spawned by the helper). Exercises the actual event dispatch + function execution round-trip. Best for integration lanes that need prod-shape parity.

```ts
export type InngestMode = 'stub' | 'dev-server';
```

#### `InngestRunSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L97) `packages/queue/src/inngest/types.ts`

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

#### `InngestRunState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L23) `packages/queue/src/inngest/types.ts`

Terminal + intermediate states an Inngest function run can reach.

```ts
export type InngestRunState = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
```

#### `InngestStepContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L51) `packages/queue/src/inngest/types.ts`

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

#### `InngestTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L148) `packages/queue/src/inngest/types.ts`

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

#### `JobEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L14) `packages/queue/src/semantics/job-lifecycle-orchestrator.ts`

```ts
export type JobEvent = 'enqueue-succeeded' | 'process-started' | 'process-succeeded' | 'process-failed' | 'retry-scheduled' | 'retry-exhausted' | 'dlq-inspected' | 'timeout';
```

#### `JobProcessor`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L62) `packages/queue/src/types.ts`

Processor signature — matches the shape of a bullmq `Worker` processor fn.

```ts
export type JobProcessor<TData = unknown, TResult = unknown> = (job: QueueJobSnapshot<TData, TResult>) => Promise<TResult> | TResult;
```

#### `JobSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L24) `packages/queue/src/semantics/job-lifecycle-orchestrator.ts`

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

#### `JobState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L22) `packages/queue/src/types.ts`

Job lifecycle states surfaced by the helper.

```ts
export type JobState = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed';
```

#### `JobSummary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/semantics/job-lifecycle-orchestrator.ts#L124) `packages/queue/src/semantics/job-lifecycle-orchestrator.ts`

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

#### `QueueJobOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L52) `packages/queue/src/types.ts`

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

#### `QueueJobSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L37) `packages/queue/src/types.ts`

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

#### `RabbitMQAdvancedQueueSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L45) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `RabbitMQAdvancedTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L173) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `RabbitMQBindingSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L125) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQClusterNode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L90) `packages/queue/src/rabbitmq-advanced/types.ts`

Node in a cluster.

```ts
export interface RabbitMQClusterNode {
    id: string;
    role: 'primary' | 'replica';
    /** True while the node is participating in the cluster. */
    active: boolean;
}
```

#### `RabbitMQConsumeOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L73) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQConsumer`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L161) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQDeadLetterSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L127) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `RabbitMQDelayedExchangeSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L76) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `RabbitMQDelayedMessageSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L116) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `RabbitMQDelivery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L141) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQExchangeSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L97) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQExchangeType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L21) `packages/queue/src/rabbitmq/types.ts`

AMQP 0.9.1 exchange types the adapter covers.

```ts
export type RabbitMQExchangeType = 'direct' | 'topic' | 'fanout' | 'headers';
```

#### `RabbitMQFederationLink`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L109) `packages/queue/src/rabbitmq-advanced/types.ts`

Federation link — binds an upstream to a downstream exchange or queue.

```ts
export interface RabbitMQFederationLink {
    upstreamName: string;
    downstreamExchange?: string | undefined;
    downstreamQueue?: string | undefined;
}
```

#### `RabbitMQFederationUpstream`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L98) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `RabbitMQMessageSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L33) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQMessageState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L24) `packages/queue/src/rabbitmq/types.ts`

Terminal + intermediate states surfaced by the helper.

```ts
export type RabbitMQMessageState = 'ready' | 'unacked' | 'acked' | 'nacked' | 'requeued' | 'dead';
```

#### `RabbitMQMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L12) `packages/queue/src/rabbitmq/types.ts`

RabbitMQ backend selection. - `stub` — in-process AMQP 0.9.1 model emulation. No docker, no network. Fast + deterministic — enough to exercise exchange / queue / binding / consumer / ack / nack / prefetch semantics without spinning up a broker. - `testcontainers` — spawn a real `rabbitmq:3-management` container. The env exposes the amqp URL + management UI URL so consumers can drive the real broker via amqplib.

```ts
export type RabbitMQMode = 'stub' | 'testcontainers';
```

#### `RabbitMQPublishOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L50) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQQueueSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L110) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQTestcontainersOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L170) `packages/queue/src/rabbitmq/types.ts`

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

#### `RabbitMQTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L201) `packages/queue/src/rabbitmq/types.ts`

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

#### `SetupBullMQEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/types.ts#L70) `packages/queue/src/types.ts`

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

#### `SetupCloudflareQueuesEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/cloudflare-queues/types.ts#L181) `packages/queue/src/cloudflare-queues/types.ts`

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

#### `SetupInngestEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/inngest/types.ts#L127) `packages/queue/src/inngest/types.ts`

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

#### `SetupRabbitMQAdvancedEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq-advanced/types.ts#L139) `packages/queue/src/rabbitmq-advanced/types.ts`

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

#### `SetupRabbitMQEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/rabbitmq/types.ts#L185) `packages/queue/src/rabbitmq/types.ts`

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

#### `SetupSQSEnvOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L172) `packages/queue/src/sqs/types.ts`

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

#### `SQSBatchDeleteEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L122) `packages/queue/src/sqs/types.ts`

Options for a batch delete.

```ts
export interface SQSBatchDeleteEntry {
    id: string;
    receiptHandle: string;
}
```

#### `SQSBatchSendEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L115) `packages/queue/src/sqs/types.ts`

Options for a batch send.

```ts
export interface SQSBatchSendEntry<TBody = unknown> {
    id: string;
    body: TBody;
    options?: SQSSendOptions | undefined;
}
```

#### `SQSLocalstackOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L153) `packages/queue/src/sqs/types.ts`

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

#### `SQSMessageSnapshot`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L40) `packages/queue/src/sqs/types.ts`

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

#### `SQSMessageState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L33) `packages/queue/src/sqs/types.ts`

Terminal + intermediate states surfaced by the helper. `pending` messages live in the queue waiting for the next receive. `inflight` messages have been received and are within their visibility timeout window. `deleted` covers messages the consumer explicitly deleted. `dead` covers messages that exhausted `maxReceiveCount` and were routed to the DLQ.

```ts
export type SQSMessageState = 'pending' | 'inflight' | 'deleted' | 'dead';
```

#### `SQSMode`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L12) `packages/queue/src/sqs/types.ts`

AWS SQS backend selection. - `stub`: in-process, deterministic FIFO / standard queue emulation. No docker, no network. Suitable for unit tests that need to exercise the send / receive / delete / batch / visibility timeout / DLQ semantics without spinning up localstack. - `localstack`: run against a real LocalStack container. Exercises the actual `@aws-sdk/client-sqs` wire with a real (offline) SQS API.

```ts
export type SQSMode = 'stub' | 'localstack';
```

#### `SQSQueueKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L24) `packages/queue/src/sqs/types.ts`

FIFO / standard queue kind. FIFO queues require `.fifo` suffix on the queue name and honour `MessageGroupId` + `MessageDeduplicationId`.

```ts
export type SQSQueueKind = 'standard' | 'fifo';
```

#### `SQSQueueSpec`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L131) `packages/queue/src/sqs/types.ts`

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

#### `SQSReceivedMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L103) `packages/queue/src/sqs/types.ts`

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

#### `SQSReceiveOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L79) `packages/queue/src/sqs/types.ts`

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

#### `SQSSendOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L59) `packages/queue/src/sqs/types.ts`

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

#### `SQSTestEnv`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/queue/src/sqs/types.ts#L194) `packages/queue/src/sqs/types.ts`

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
