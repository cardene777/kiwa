# @kiwa-lab/workflow リファレンス

## client

`createWorkflowClient(options)` は in-memory の `WorkflowClient` を返します。`provider` の既定値は `temporal` です。`idSeed` を指定すると execution id の連番を固定でき、`now` で記録する時刻を制御できます。

| provider | execution id の prefix |
| --- | --- |
| `temporal` | `wf-` |
| `inngest` | `ing-` |
| `trigger` | `trg-` |
| `aws-sfn` | `sfn-` |

`register` は同じ name の workflow を置き換えます。`registered` は登録済みの定義、`listExecutions` は実行履歴のコピーを返します。`clear` は登録済み workflow と履歴を消去します。通常は client をテストごとに作るほうが、状態が明確です。

## workflow と step

`defineWorkflow(name, steps)` は `WorkflowDefinition` を作ります。step が空なら例外になります。各 `WorkflowStep` は次の context を受け取ります。

| field | 内容 |
| --- | --- |
| `workflowName` | 実行中の workflow 名 |
| `stepIndex` | 定義順のゼロ始まり index |
| `attempt` | 現在の実装では常に一 |
| `input` | `execute` に渡した input |
| `previous` | 直前の step の output |

`executeWorkflow` は client を使わず step 列を実行し、最後の `output` と各 step の `stepOutputs` を返します。`client.execute` は同じ処理を実行して、id、provider、開始と完了の時刻、`completed` または `failed` の status を付けます。

## retry

`retryStep(fn, options)` の `fn` は現在の attempt 番号を受け取ります。`options` では `maxAttempts` と `baseDelayMs` が必須です。待機時間は `baseDelayMs`、その二倍、さらに二倍と増え、`maxDelayMs` があれば上限になります。

`onAttempt` は失敗後の attempt と次の delay を受け取ります。`sleep` を指定すると待機を差し替えられます。結果には `value`、`attempts`、`succeeded`、`error`、`delaysMs` が含まれます。

## event

`eventDrivenTrigger(client, eventName, workflow)` は event と workflow を結び、`EventTriggerHandle` を返します。handle の `handledCount` で実行回数を取得し、`dispose` で登録を解除します。

`emitEvent(client, event)` は `EmittedEvent` の `name` と `payload` に一致する workflow を順番に実行し、`WorkflowExecutionResult[]` を返します。`emittedAt` は event の記録用フィールドです。

## resilience helper

`withRetry`、`withTimeout`、`withRateLimit`、`withCircuitBreaker`、`withObservability`、`withIdempotencyKey` は Promise を返す関数を包みます。`batchOperate` は item ごとの成功または失敗を `BatchResult[]` として返します。これらは状態を保持する helper もあるため、テストごとに新しく生成してください。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/workflow/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/workflow/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/resilience.ts#L72) |
| <code v-pre>workflow "$&#123;name&#125;" requires at least one step</code> | [packages/workflow/src/steps.ts](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/steps.ts#L23) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/workflow/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 5 |
| [events.ts](./api/events) | 2 | 2 |
| [index.ts](./api/index) | 0 | 1 |
| [resilience.ts](./api/resilience) | 7 | 6 |
| [retry.ts](./api/retry) | 1 | 2 |
| [steps.ts](./api/steps) | 2 | 5 |

<!-- kiwa-public-api:end -->
