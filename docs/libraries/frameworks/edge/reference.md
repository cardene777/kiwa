# edge リファレンス

`invokeEdgeHandler` は handler、URL、env、method、headers、formData、jsonBody を受け取ります。結果は response、redirect、execution context、error です。

execution context は `waitUntil`、`passThroughOnException`、`waitedPromises`、`passThroughCalled` を持ちます。`waitUntil` の promise は利用者が明示的に await します。

`createKvNamespace(initial)` は in-memory KV を作ります。`put`、`delete`、prefix と limit を持つ `list`、text、JSON、ArrayBuffer の `get` を提供します。list の `list_complete` は常に true で cursor はありません。

semantics entry point は edge platform の state machine を公開します。Durable Object、WebSocket、KV consistency、geo replication、cron、subrequest budget、CPU budget、stream、cold start、middleware、R2 multipart、D1 replica、global routing などを状態と history で検証します。実 runtime の副作用を代替するものではありません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>completeCpu: session is idle, cannot complete</code> | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L133) |
| <code v-pre>startCpu: session is $&#123;session.state&#125;, expected idle</code> | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L48) |
| <code v-pre>tickCpu: session is idle, call startCpu first</code> | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L74) |
| <code v-pre>tickCpu: session is $&#123;session.state&#125;, cannot tick</code> | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L77) |
| <code v-pre>failCron: session is $&#123;session.state&#125;, expected running</code> | [packages/edge/src/semantics/cron-trigger.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L120) |
| <code v-pre>startCron: session is $&#123;session.state&#125;, expected scheduled</code> | [packages/edge/src/semantics/cron-trigger.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L71) |
| <code v-pre>completeCron: session is $&#123;session.state&#125;, expected running</code> | [packages/edge/src/semantics/cron-trigger.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L95) |
| <code v-pre>reportLag: unknown replicaId $&#123;input.replicaId&#125;</code> | [packages/edge/src/semantics/d1-read-replica.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L130) |
| <code v-pre>migrateInstance: session is $&#123;session.state&#125;, cannot migrate</code> | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L100) |
| <code v-pre>migrateInstance: unknown instanceId $&#123;input.instanceId&#125;</code> | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L104) |
| <code v-pre>migrateInstance: instance $&#123;input.instanceId&#125; already at toVersion</code> | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L107) |
| <code v-pre>completeRollout: $&#123;stragglers.length&#125; instances still on old version</code> | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L139) |
| <code v-pre>initiateMigration: toVersion $&#123;input.toVersion&#125; must be &gt; fromVersion $&#123;input.fromVersion&#125;</code> | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L34) |
| <code v-pre>bumpSchema: session is $&#123;session.state&#125;, expected initiated</code> | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L73) |
| <code v-pre>writeStorage: object is terminated</code> | [packages/edge/src/semantics/durable-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L115) |
| <code v-pre>requestDurableObject: object is terminated</code> | [packages/edge/src/semantics/durable-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L73) |
| <code v-pre>fireAlarm: object is terminated</code> | [packages/edge/src/semantics/durable-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L92) |
| <code v-pre>syncReplica: $&#123;input.region&#125; is not a replica region</code> | [packages/edge/src/semantics/geo-replicated.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L117) |
| <code v-pre>resolveConflict: $&#123;input.region&#125; is not a replica region</code> | [packages/edge/src/semantics/geo-replicated.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L141) |
| <code v-pre>markReplicaLagged: $&#123;input.region&#125; is not a replica region</code> | [packages/edge/src/semantics/geo-replicated.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L94) |
| <code v-pre>markUnhealthy: unknown popId $&#123;input.popId&#125;</code> | [packages/edge/src/semantics/global-routing.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L173) |
| <code v-pre>shortCircuit: chain is $&#123;session.state&#125;, cannot short-circuit</code> | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L106) |
| <code v-pre>completeMiddleware: chain was short-circuited</code> | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L131) |
| <code v-pre>completeMiddleware: chain already completed</code> | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L134) |
| <code v-pre>enterMiddleware: chain is $&#123;session.state&#125;</code> | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L46) |
| <code v-pre>enterMiddleware: no more stages, call completeMiddleware</code> | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L50) |
| <code v-pre>rewriteRequest: chain is $&#123;session.state&#125;, cannot rewrite</code> | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L78) |
| <code v-pre>verifyChecksum: partNumber $&#123;input.partNumber&#125; not uploaded</code> | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L110) |
| <code v-pre>completeMultipart: uploaded $&#123;session.parts.size&#125;/$&#123;session.totalParts&#125;</code> | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L154) |
| <code v-pre>completeMultipart: $&#123;unverified.length&#125; parts unverified</code> | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L160) |
| <code v-pre>uploadPart: session is $&#123;session.state&#125;</code> | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L69) |
| <code v-pre>uploadPart: partNumber $&#123;input.partNumber&#125; out of range &#91;1, $&#123;session.totalParts&#125;&#93;</code> | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L72) |
| <code v-pre>resumeStream: stream is $&#123;session.state&#125;, expected backpressure</code> | [packages/edge/src/semantics/streaming-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L113) |
| <code v-pre>closeStream: stream already closed</code> | [packages/edge/src/semantics/streaming-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L141) |
| <code v-pre>sendChunk: stream is closed</code> | [packages/edge/src/semantics/streaming-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L70) |
| <code v-pre>startSubrequest: budget is limited, cannot start</code> | [packages/edge/src/semantics/subrequest-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L53) |
| <code v-pre>countSubrequest: budget is limited, cannot count further</code> | [packages/edge/src/semantics/subrequest-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L74) |
| <code v-pre>closeWebSocket: socket already closed</code> | [packages/edge/src/semantics/websocket-edge.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L106) |
| <code v-pre>acceptWebSocket: socket is $&#123;session.state&#125;, expected pending</code> | [packages/edge/src/semantics/websocket-edge.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L64) |
| <code v-pre>sendMessage: socket is $&#123;session.state&#125;, expected open</code> | [packages/edge/src/semantics/websocket-edge.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L85) |
| <code v-pre>restoreState: session is $&#123;session.state&#125;, cannot restore</code> | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L105) |
| <code v-pre>completeReconnect: session is $&#123;session.state&#125;, expected resuming</code> | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L130) |
| <code v-pre>hibernate: session is $&#123;session.state&#125;, cannot hibernate</code> | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L49) |
| <code v-pre>resume: session is $&#123;session.state&#125;, cannot resume</code> | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L77) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [invoke-edge-handler.ts](./api/invoke-edge-handler) | 1 | 5 |
| [kv-mock.ts](./api/kv-mock) | 1 | 5 |
| [semantics/cold-start.ts](./api/semantics-cold-start) | 4 | 2 |
| [semantics/cpu-time-limit.ts](./api/semantics-cpu-time-limit) | 4 | 2 |
| [semantics/cron-trigger.ts](./api/semantics-cron-trigger) | 4 | 3 |
| [semantics/d1-read-replica.ts](./api/semantics-d1-read-replica) | 4 | 3 |
| [semantics/do-state-migration.ts](./api/semantics-do-state-migration) | 5 | 2 |
| [semantics/durable-object.ts](./api/semantics-durable-object) | 4 | 2 |
| [semantics/edge-kv.ts](./api/semantics-edge-kv) | 4 | 2 |
| [semantics/fidelity.ts](./api/semantics-fidelity) | 2 | 2 |
| [semantics/geo-replicated.ts](./api/semantics-geo-replicated) | 5 | 3 |
| [semantics/global-routing.ts](./api/semantics-global-routing) | 5 | 3 |
| [semantics/kv-eventual-consistency.ts](./api/semantics-kv-eventual-consistency) | 4 | 2 |
| [semantics/middleware-chain.ts](./api/semantics-middleware-chain) | 5 | 3 |
| [semantics/r2-multipart.ts](./api/semantics-r2-multipart) | 4 | 3 |
| [semantics/streaming-response.ts](./api/semantics-streaming-response) | 4 | 3 |
| [semantics/subrequest-limit.ts](./api/semantics-subrequest-limit) | 5 | 2 |
| [semantics/types.ts](./api/semantics-types) | 1 | 4 |
| [semantics/websocket-edge.ts](./api/semantics-websocket-edge) | 4 | 2 |
| [semantics/websocket-hibernation.ts](./api/semantics-websocket-hibernation) | 5 | 2 |

<!-- kiwa-public-api:end -->
