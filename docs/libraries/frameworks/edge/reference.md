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
| 'completeCpu: session is idle, cannot complete' | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L133) |
| `startCpu: session is ${session.state}, expected idle` | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L48) |
| 'tickCpu: session is idle, call startCpu first' | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L74) |
| `tickCpu: session is ${session.state}, cannot tick` | [packages/edge/src/semantics/cpu-time-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L77) |
| `failCron: session is ${session.state}, expected running` | [packages/edge/src/semantics/cron-trigger.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L120) |
| `startCron: session is ${session.state}, expected scheduled` | [packages/edge/src/semantics/cron-trigger.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L71) |
| `completeCron: session is ${session.state}, expected running` | [packages/edge/src/semantics/cron-trigger.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L95) |
| `reportLag: unknown replicaId ${input.replicaId}` | [packages/edge/src/semantics/d1-read-replica.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L130) |
| `migrateInstance: session is ${session.state}, cannot migrate` | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L100) |
| `migrateInstance: unknown instanceId ${input.instanceId}` | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L104) |
| `migrateInstance: instance ${input.instanceId} already at toVersion` | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L107) |
| `completeRollout: ${stragglers.length} instances still on old version` | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L139) |
| `initiateMigration: toVersion ${input.toVersion} must be > fromVersion ${input.fromVersion}` | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L34) |
| `bumpSchema: session is ${session.state}, expected initiated` | [packages/edge/src/semantics/do-state-migration.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L73) |
| 'writeStorage: object is terminated' | [packages/edge/src/semantics/durable-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L115) |
| 'requestDurableObject: object is terminated' | [packages/edge/src/semantics/durable-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L73) |
| 'fireAlarm: object is terminated' | [packages/edge/src/semantics/durable-object.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L92) |
| `syncReplica: ${input.region} is not a replica region` | [packages/edge/src/semantics/geo-replicated.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L117) |
| `resolveConflict: ${input.region} is not a replica region` | [packages/edge/src/semantics/geo-replicated.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L141) |
| `markReplicaLagged: ${input.region} is not a replica region` | [packages/edge/src/semantics/geo-replicated.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L94) |
| `markUnhealthy: unknown popId ${input.popId}` | [packages/edge/src/semantics/global-routing.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L173) |
| `shortCircuit: chain is ${session.state}, cannot short-circuit` | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L106) |
| 'completeMiddleware: chain was short-circuited' | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L131) |
| 'completeMiddleware: chain already completed' | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L134) |
| `enterMiddleware: chain is ${session.state}` | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L46) |
| 'enterMiddleware: no more stages, call completeMiddleware' | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L50) |
| `rewriteRequest: chain is ${session.state}, cannot rewrite` | [packages/edge/src/semantics/middleware-chain.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L78) |
| `verifyChecksum: partNumber ${input.partNumber} not uploaded` | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L110) |
| `completeMultipart: uploaded ${session.parts.size}/${session.totalParts}` | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L154) |
| `completeMultipart: ${unverified.length} parts unverified` | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L160) |
| `uploadPart: session is ${session.state}` | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L69) |
| `uploadPart: partNumber ${input.partNumber} out of range [1, ${session.totalParts}]` | [packages/edge/src/semantics/r2-multipart.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L72) |
| `resumeStream: stream is ${session.state}, expected backpressure` | [packages/edge/src/semantics/streaming-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L113) |
| 'closeStream: stream already closed' | [packages/edge/src/semantics/streaming-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L141) |
| 'sendChunk: stream is closed' | [packages/edge/src/semantics/streaming-response.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L70) |
| 'startSubrequest: budget is limited, cannot start' | [packages/edge/src/semantics/subrequest-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L53) |
| 'countSubrequest: budget is limited, cannot count further' | [packages/edge/src/semantics/subrequest-limit.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L74) |
| 'closeWebSocket: socket already closed' | [packages/edge/src/semantics/websocket-edge.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L106) |
| `acceptWebSocket: socket is ${session.state}, expected pending` | [packages/edge/src/semantics/websocket-edge.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L64) |
| `sendMessage: socket is ${session.state}, expected open` | [packages/edge/src/semantics/websocket-edge.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L85) |
| `restoreState: session is ${session.state}, cannot restore` | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L105) |
| `completeReconnect: session is ${session.state}, expected resuming` | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L130) |
| `hibernate: session is ${session.state}, cannot hibernate` | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L49) |
| `resume: session is ${session.state}, cannot resume` | [packages/edge/src/semantics/websocket-hibernation.ts](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L77) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/index.ts) から同期しています。各項目は公開名、実際の TypeScript 宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `acceptWebSocket`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L62) `packages/edge/src/semantics/websocket-edge.ts`

Accept the pending upgrade, moving the socket 'open'. Rejects if the socket is not awaiting acceptance. Emits `websocket.accepted`.

```ts
export function acceptWebSocket(session: WebSocketSession): AxisStep<WsState>;
```

#### `AXIS_TO_EVENTS`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L22) `packages/edge/src/semantics/fidelity.ts`

```ts
export declare const AXIS_TO_EVENTS: Record<EdgeAxis, NeutralEventName[]>;
```

#### `bumpSchema`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L71) `packages/edge/src/semantics/do-state-migration.ts`

Bump schema version registry. Emits `do-migration.schema-bumped` and transitions to `schema-bumped`. Instances still hold old data until migrateInstance is called per instance.

```ts
export function bumpSchema(session: DoMigrationSession): AxisStep<DoMigrationState>;
```

#### `closeStream`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L136) `packages/edge/src/semantics/streaming-response.ts`

Close the stream. Transitions to `closed` and emits `stream.closed` with the final chunk + byte totals. Rejects if the stream is already `closed`.

```ts
export function closeStream(
  session: StreamSession,
  input: { reason: string },
): AxisStep<StreamState>;
```

#### `closeWebSocket`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L101) `packages/edge/src/semantics/websocket-edge.ts`

Close the socket with a status code. Rejects if already closed. Emits `websocket.closed`.

```ts
export function closeWebSocket(
  session: WebSocketSession,
  input: { code: number },
): AxisStep<WsState>;
```

#### `collectFidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L114) `packages/edge/src/semantics/fidelity.ts`

Collect the platform × axis coverage grid. `platforms` is the list of platforms to inspect — usually all 3 (`cloudflare`, `vercel`, `deno`). The output is a flat row list `platforms.length * 16 = 48` for the default setup (8 v0.2 axes + 8 v1.2 advanced axes), plus `platforms` + `axes` roll-up lists so callers can assert on the grid dimensions.

```ts
export function collectFidelityCoverage(platforms: EdgePlatform[]): FidelityCoverage;
```

#### `completeCpu`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L131) `packages/edge/src/semantics/cpu-time-limit.ts`

Finish the invocation. Transitions to `completed` and emits `cpu.completed` with the used ratio. Rejects if the session never started (`idle`).

```ts
export function completeCpu(session: CpuSession): AxisStep<CpuState>;
```

#### `completeCron`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L90) `packages/edge/src/semantics/cron-trigger.ts`

Finish a running invocation successfully. Transitions `running` → `completed` and emits `cron.completed`. Rejects if not `running`.

```ts
export function completeCron(
  session: CronSession,
  input: { durationMs: number },
): AxisStep<CronState>;
```

#### `completeMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L129) `packages/edge/src/semantics/middleware-chain.ts`

Complete the chain after every stage has been entered (or after the final stage). Emits `middleware.completed` with the total stage count.

```ts
export function completeMiddleware(session: MiddlewareSession): AxisStep<MiddlewareState>;
```

#### `completeMultipart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L152) `packages/edge/src/semantics/r2-multipart.ts`

Complete the multipart upload once all parts are uploaded and verified. Emits `r2.multipart-completed`. Rejects if any part is missing or unverified.

```ts
export function completeMultipart(session: R2MultipartSession): AxisStep<R2State>;
```

#### `completeReconnect`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L128) `packages/edge/src/semantics/websocket-hibernation.ts`

Complete reconnection — connection is fully live again. Transitions to `reconnected` and emits `ws-hibernation.reconnected`.

```ts
export function completeReconnect(session: WsHibernationSession): AxisStep<WsHibernationState>;
```

#### `completeRollout`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L134) `packages/edge/src/semantics/do-state-migration.ts`

Complete the rollout once every instance is at `toVersion`. Emits `do-migration.rolled-out`. Rejects if any instance is still on the old version (partial rollout).

```ts
export function completeRollout(session: DoMigrationSession): AxisStep<DoMigrationState>;
```

#### `completeSubrequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L112) `packages/edge/src/semantics/subrequest-limit.ts`

Mark an outbound subrequest as finished. Emits `subrequest.completed` with the final count. Does not mutate state — a completed request that already tripped the limit stays `limited`.

```ts
export function completeSubrequest(
  session: SubrequestSession,
  input: { url: string; durationMs: number },
): AxisStep<SubrequestState>;
```

#### `countSubrequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L72) `packages/edge/src/semantics/subrequest-limit.ts`

Count an admitted subrequest against the budget. Increments the count and emits `subrequest.limited` when the count reaches the hard limit (state → `limited`), otherwise `subrequest.counted` — flipping to `approaching-limit` once the warning threshold is crossed.

```ts
export function countSubrequest(session: SubrequestSession): AxisStep<SubrequestState>;
```

#### `createDurableObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L41) `packages/edge/src/semantics/durable-object.ts`

Create a durable object instance. State starts at 'initialized' and no request has been served yet. Emits `durable-object.created`.

```ts
export function createDurableObject(input: {
  id: string;
  platform: EdgePlatform;
}): DurableObjectSession;
```

#### `createEdgeKvSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L36) `packages/edge/src/semantics/edge-kv.ts`

Construct a KV session. No event is emitted — the store is simply opened. Defaults to eventual consistency, the common edge-KV replication model.

```ts
export function createEdgeKvSession(input: {
  platform: EdgePlatform;
  state?: KvState;
}): EdgeKvSession;
```

#### `createGeoReplicatedSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L46) `packages/edge/src/semantics/geo-replicated.ts`

Construct a geo-replicated session. Starts 'in-sync' at version 0 with every replica at zero lag. No event is emitted.

```ts
export function createGeoReplicatedSession(input: {
  platform: EdgePlatform;
  primaryRegion: GeoRegion;
  replicaRegions: GeoRegion[];
}): GeoReplicatedSession;
```

#### `createKvNamespace`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L42) `packages/edge/src/kv-mock.ts`

```ts
export function createKvNamespace(initial: Record<string, string> = {}): KVNamespace;
```

#### `enterMiddleware`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L44) `packages/edge/src/semantics/middleware-chain.ts`

Enter the next stage. Emits `middleware.entered` and transitions to `running`. Rejects if the chain has already short-circuited or completed.

```ts
export function enterMiddleware(session: MiddlewareSession): AxisStep<MiddlewareState>;
```

#### `evictExpired`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L116) `packages/edge/src/semantics/cold-start.ts`

Evict warm instances whose last invocation is older than TTL at the simulated wall-clock `nowMs`. Returns the count evicted. Provisioned instances are never evicted.

```ts
export function evictExpired(session: ColdStartSession, input: { nowMs: number }): number;
```

#### `failCron`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L115) `packages/edge/src/semantics/cron-trigger.ts`

Fail a running invocation. Increments `retryCount`; if retries remain the session re-enters the `scheduled` state (to be picked up again), otherwise it terminates in `failed`. Emits `cron.failed` with `willRetry` reflecting the decision. Rejects if the session already `completed`.

```ts
export function failCron(
  session: CronSession,
  input: { reason: string },
): AxisStep<CronState>;
```

#### `fireAlarm`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L90) `packages/edge/src/semantics/durable-object.ts`

Fire the scheduled alarm. Wakes the object into 'active' regardless of the prior state and clears the pending alarm. Emits `durable-object.alarm-fired`.

```ts
export function fireAlarm(session: DurableObjectSession): AxisStep<DoState>;
```

#### `forceConvergence`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L108) `packages/edge/src/semantics/kv-eventual-consistency.ts`

Force convergence by advancing the observed pointer on every replica to the latest write. Returns the count of keys reconciled.

```ts
export function forceConvergence(session: KvConsistencySession): number;
```

#### `geoPrimaryWrite`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L69) `packages/edge/src/semantics/geo-replicated.ts`

Write to the primary region. Bumps the version and marks every replica as lagging (they have not yet received the new version). Emits `geo.primary-write`.

```ts
export function geoPrimaryWrite(
  session: GeoReplicatedSession,
  input: { data: string },
): AxisStep<GeoState>;
```

#### `hibernate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L44) `packages/edge/src/semantics/websocket-hibernation.ts`

Hibernate the connection (idle timeout). Transitions to `hibernated` and emits `ws-hibernation.entered`. State is preserved in storage.

```ts
export function hibernate(
  session: WsHibernationSession,
  input: { nowMs: number },
): AxisStep<WsHibernationState>;
```

#### `initiateMigration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L27) `packages/edge/src/semantics/do-state-migration.ts`

Initiate a migration from `fromVersion` to `toVersion` for a set of instances. Emits `do-migration.initiated`. All instances start at `fromVersion`.

```ts
export function initiateMigration(input: {
  platform: EdgePlatform;
  fromVersion: number;
  toVersion: number;
  instanceIds: string[];
}): DoMigrationSession;
```

#### `initiateMultipart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L32) `packages/edge/src/semantics/r2-multipart.ts`

Initiate a multipart upload with a known total part count. Emits `r2.multipart-initiated` and enters `initiated`.

```ts
export function initiateMultipart(input: {
  platform: EdgePlatform;
  uploadId: string;
  totalParts: number;
}): R2MultipartSession;
```

#### `invokeColdStart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L48) `packages/edge/src/semantics/cold-start.ts`

Invoke a function with `instanceId` at simulated wall-clock `nowMs`. The class emitted depends on pool state — `provisioned` if reserved, `warm` if within TTL of last invoke, `cold` otherwise. After invocation the instance is marked warm.

```ts
export function invokeColdStart(
  session: ColdStartSession,
  input: { instanceId: string; nowMs: number },
): AxisStep<ColdStartClass>;
```

#### `invokeEdgeHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L92) `packages/edge/src/invoke-edge-handler.ts`

Invoke an edge runtime fetch handler in isolation and capture the returned Response + ExecutionContext side effects. The caller supplies `env` so KV / R2 / vars stay explicit in each test (no global state).

```ts
export async function invokeEdgeHandler<TEnv extends EdgeEnvBindings = EdgeEnvBindings>(
  opts: InvokeEdgeHandlerOptions<TEnv>,
): Promise<InvokeEdgeHandlerResult>;
```

#### `kvRangeQuery`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L102) `packages/edge/src/semantics/edge-kv.ts`

Range query over a key prefix. Returns the matching keys (sorted, up to `limit`) alongside the emitted step. Emits `kv.read` since a range scan is a store read. `limit` defaults to no cap.

```ts
export function kvRangeQuery(
  session: EdgeKvSession,
  input: { prefix: string; limit?: number },
): { matches: string[]; step: AxisStep<KvState> };
```

#### `kvRead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L55) `packages/edge/src/semantics/edge-kv.ts`

Read a key. Three outcomes: - cache warm → `kv.cache-hit` - store only → `kv.read` and the cache is populated (read-through) - absent → `kv.cache-miss`

```ts
export function kvRead(session: EdgeKvSession, input: { key: string }): AxisStep<KvState>;
```

#### `kvWrite`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L82) `packages/edge/src/semantics/edge-kv.ts`

Write a key. Updates the backing store and invalidates the cache entry so the next read goes through to the store. Emits `kv.write`.

```ts
export function kvWrite(
  session: EdgeKvSession,
  input: { key: string; value: string },
): AxisStep<KvState>;
```

#### `markReplicaLagged`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L89) `packages/edge/src/semantics/geo-replicated.ts`

Report replication lag for a specific replica. Rejects an unknown region. Emits `geo.replica-lagged`.

```ts
export function markReplicaLagged(
  session: GeoReplicatedSession,
  input: { region: GeoRegion; lagMs: number },
): AxisStep<GeoState>;
```

#### `markUnhealthy`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L167) `packages/edge/src/semantics/global-routing.ts`

Mark a POP unhealthy (e.g. probe failed). Later selectByLatency calls will skip it.

```ts
export function markUnhealthy(
  session: RoutingSession,
  input: { popId: string },
): void;
```

#### `matchGeo`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L70) `packages/edge/src/semantics/global-routing.ts`

Match request geo to a region. Returns POPs in that region (empty if none). Emits `routing.geo-matched` with match count.

```ts
export function matchGeo(
  session: RoutingSession,
  input: { requestId: string; region: string },
): AxisStep<RoutingState>;
```

#### `migrateInstance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L95) `packages/edge/src/semantics/do-state-migration.ts`

Migrate a single instance's data. Advances that instance's version to `toVersion` and increments the migrated count. Emits `do-migration.data-migrated`. Rejects if the instance is not registered or already migrated.

```ts
export function migrateInstance(
  session: DoMigrationSession,
  input: { instanceId: string },
): AxisStep<DoMigrationState>;
```

#### `observeRead`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L64) `packages/edge/src/semantics/kv-eventual-consistency.ts`

Observe a read of `key` returning value at timestamp `readTs` from replica `replicaId`. Classifies: `stale` if readTs &lt; writes[key], `converged` if equal, `violated` if this read is older than a previously observed monotonic read on same session (monotonic-reads violation).

```ts
export function observeRead(
  session: KvConsistencySession,
  input: { key: string; readTs: number; replicaId: string },
): AxisStep<KvConsistencyState>;
```

#### `openStream`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L30) `packages/edge/src/semantics/streaming-response.ts`

Open a response stream. `kind` defaults to `chunked` and `highWaterMark` to 65536 bytes (64 KiB). Emits `stream.opened` and seeds counters at zero.

```ts
export function openStream(input: {
  id: string;
  platform: EdgePlatform;
  kind?: StreamKind;
  highWaterMark?: number;
}): StreamSession;
```

#### `platformEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L343) `packages/edge/src/semantics/types.ts`

Translate a neutral event name to the platform dialect. Falls back to the neutral name if the platform has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export function platformEventName(
  platform: EdgePlatform,
  neutral: NeutralEventName,
): string;
```

#### `preWarmInstance`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L90) `packages/edge/src/semantics/cold-start.ts`

Explicitly pre-warm an instance without producing latency (e.g. via scheduled ping). Emits `cold-start.warmed` and marks the instance warm.

```ts
export function preWarmInstance(
  session: ColdStartSession,
  input: { instanceId: string; nowMs: number },
): AxisStep<ColdStartClass>;
```

#### `readFromReplica`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L77) `packages/edge/src/semantics/d1-read-replica.ts`

Route a read. Picks the healthiest replica in the given region (or any healthy replica if region has none), or falls back to primary if all replicas are unhealthy. Emits `d1.replica-read` on success, `d1.replica-failover` on fallback.

```ts
export function readFromReplica(
  session: D1Session,
  input: { query: string; preferredRegion?: string },
): AxisStep<D1RoutingState>;
```

#### `receiveAnycast`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L48) `packages/edge/src/semantics/global-routing.ts`

Receive an Anycast request at the network edge. Emits `routing.anycast-received` and returns the initial state.

```ts
export function receiveAnycast(
  session: RoutingSession,
  input: { requestId: string },
): AxisStep<RoutingState>;
```

#### `recordWriteQuorum`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L39) `packages/edge/src/semantics/kv-eventual-consistency.ts`

Record a write with monotonic timestamp `ts` reaching quorum. Emits `kv-consistency.write-quorum` and updates the write pointer. Later timestamps overwrite earlier ones (last-writer-wins).

```ts
export function recordWriteQuorum(
  session: KvConsistencySession,
  input: { key: string; ts: number },
): AxisStep<KvConsistencyState>;
```

#### `remainingBudget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L132) `packages/edge/src/semantics/subrequest-limit.ts`

Remaining subrequest budget (never negative).

```ts
export function remainingBudget(session: SubrequestSession): number;
```

#### `reportLag`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L124) `packages/edge/src/semantics/d1-read-replica.ts`

Report replica lag observed (e.g. from replication log). If lag exceeds threshold, marks replica unhealthy and emits `d1.replica-lagged`.

```ts
export function reportLag(
  session: D1Session,
  input: { replicaId: string; lagMs: number },
): AxisStep<D1RoutingState>;
```

#### `requestDurableObject`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L68) `packages/edge/src/semantics/durable-object.ts`

Route a fetch request to the object. Pins the instance 'active' and bumps the request counter. Emits `durable-object.requested`.

```ts
export function requestDurableObject(
  session: DurableObjectSession,
  input: { url: string },
): AxisStep<DoState>;
```

#### `requestWebSocketUpgrade`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L37) `packages/edge/src/semantics/websocket-edge.ts`

Begin the upgrade handshake. State starts 'pending' until the server accepts. Emits `websocket.upgrade-requested`.

```ts
export function requestWebSocketUpgrade(input: {
  id: string;
  platform: EdgePlatform;
}): WebSocketSession;
```

#### `resolveConflict`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L136) `packages/edge/src/semantics/geo-replicated.ts`

Resolve a write conflict for a region by picking a winning version. Rejects an unknown region. Adopts the chosen version, clears every replica's lag and forces the session back to 'in-sync'. Emits `geo.conflict-resolved`.

```ts
export function resolveConflict(
  session: GeoReplicatedSession,
  input: { region: GeoRegion; chosenVersion: number },
): AxisStep<GeoState>;
```

#### `restoreState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L100) `packages/edge/src/semantics/websocket-hibernation.ts`

Restore state from storage back into the resumed session. Confirms all expected keys are present and emits `ws-hibernation.state-restored`.

```ts
export function restoreState(
  session: WsHibernationSession,
  input: { expectedKeys: string[] },
): AxisStep<WsHibernationState>;
```

#### `resume`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L72) `packages/edge/src/semantics/websocket-hibernation.ts`

Resume a hibernated connection on inbound message. Transitions to `resuming` and emits `ws-hibernation.resumed` with time in hibernation.

```ts
export function resume(
  session: WsHibernationSession,
  input: { nowMs: number },
): AxisStep<WsHibernationState>;
```

#### `resumeStream`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L111) `packages/edge/src/semantics/streaming-response.ts`

Resume a back-pressured stream after the consumer drained. Transitions `backpressure` → `open`, drains one high-water mark worth of buffered bytes, and re-emits `stream.chunk-sent` tagged `resumed: true` (there is no distinct neutral resume event). Rejects unless the stream is `backpressure`.

```ts
export function resumeStream(session: StreamSession): AxisStep<StreamState>;
```

#### `rewriteRequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L73) `packages/edge/src/semantics/middleware-chain.ts`

Rewrite the URL/request within the current stage (e.g. locale prefix, a/b split). Records the rewritten URL and emits `middleware.rewritten`.

```ts
export function rewriteRequest(
  session: MiddlewareSession,
  input: { url: string },
): AxisStep<MiddlewareState>;
```

#### `rollbackMigration`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L163) `packages/edge/src/semantics/do-state-migration.ts`

Roll back the migration by resetting every instance to `fromVersion`. Used on rollout failure or a bad schema shipping. Transitions to `rolled-back`.

```ts
export function rollbackMigration(session: DoMigrationSession): void;
```

#### `scheduleCron`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L33) `packages/edge/src/semantics/cron-trigger.ts`

Schedule a cron invocation. Emits `cron.scheduled` and seeds the session in the `scheduled` state. `triggerType` defaults to `scheduled` (a plain time trigger) and `maxRetries` defaults to 3.

```ts
export function scheduleCron(input: {
  id: string;
  platform: EdgePlatform;
  triggerType?: CronTriggerType;
  cronSpec: string;
  maxRetries?: number;
}): CronSession;
```

#### `selectByLatency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L97) `packages/edge/src/semantics/global-routing.ts`

Select the lowest-latency healthy POP. If no healthy POP exists, emits `routing.failover-triggered` and returns the healthiest fallback (accepting some latency penalty).

```ts
export function selectByLatency(
  session: RoutingSession,
  input: { requestId: string; preferredRegion?: string },
): AxisStep<RoutingState>;
```

#### `sendChunk`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L65) `packages/edge/src/semantics/streaming-response.ts`

Write a chunk to the stream. Advances `chunksSent` + `bytesSent`; when the buffered byte total exceeds the high-water mark the stream flips to `backpressure` and emits `stream.backpressure`, otherwise `stream.chunk-sent`. Rejects if the stream is already `closed`.

```ts
export function sendChunk(
  session: StreamSession,
  input: { data: string },
): AxisStep<StreamState>;
```

#### `sendMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L80) `packages/edge/src/semantics/websocket-edge.ts`

Send a frame over the open socket. Rejects unless the socket is 'open'. Emits `websocket.message`.

```ts
export function sendMessage(
  session: WebSocketSession,
  input: { data: string },
): AxisStep<WsState>;
```

#### `shortCircuit`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L101) `packages/edge/src/semantics/middleware-chain.ts`

Short-circuit the chain (auth reject, cache hit, terminating rewrite). Transitions to `short-circuited` and emits `middleware.short-circuited`. Downstream stages are not invoked.

```ts
export function shortCircuit(
  session: MiddlewareSession,
  input: { reason: string },
): AxisStep<MiddlewareState>;
```

#### `startColdStartPool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L27) `packages/edge/src/semantics/cold-start.ts`

Open a cold-start pool. `warmedTtlMs` defines how long a warm instance lives after last invocation before eviction. `provisionedIds` are always-on reservations that never fall back to cold.

```ts
export function startColdStartPool(input: {
  platform: EdgePlatform;
  warmedTtlMs?: number;
  provisionedIds?: string[];
}): ColdStartSession;
```

#### `startCpu`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L46) `packages/edge/src/semantics/cpu-time-limit.ts`

Begin consuming the CPU budget. Transitions `idle` → `running` and emits `cpu.started`. Rejects if the session is not `idle`.

```ts
export function startCpu(session: CpuSession): AxisStep<CpuState>;
```

#### `startCpuBudget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L27) `packages/edge/src/semantics/cpu-time-limit.ts`

Open a CPU budget. `budgetMs` defaults to 50 (Workers free-plan default) and `warningAtMs` to 40 (80% of the default budget). Emits nothing — the budget is `idle` until {@link startCpu}.

```ts
export function startCpuBudget(input: {
  platform: EdgePlatform;
  budgetMs?: number;
  warningAtMs?: number;
}): CpuSession;
```

#### `startCron`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L69) `packages/edge/src/semantics/cron-trigger.ts`

Begin executing a scheduled invocation. Transitions `scheduled` → `running`, stamps `startedAt`, and emits `cron.started`. Rejects if the session is not currently `scheduled` (already running / terminal).

```ts
export function startCron(session: CronSession): AxisStep<CronState>;
```

#### `startD1`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L31) `packages/edge/src/semantics/d1-read-replica.ts`

Open a D1 session with primary + replica pool. `maxLagMs` is the threshold above which a replica is considered unhealthy and failover kicks in.

```ts
export function startD1(input: {
  platform: EdgePlatform;
  primaryId: string;
  replicas?: Omit<D1Replica, 'healthy'>[];
  maxLagMs?: number;
}): D1Session;
```

#### `startHibernationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L25) `packages/edge/src/semantics/websocket-hibernation.ts`

Open a hibernation session. Initial state is `live` with given `storedState` (persisted across hibernation).

```ts
export function startHibernationSession(input: {
  platform: EdgePlatform;
  connectionId: string;
  initialState?: Record<string, string | number | boolean>;
}): WsHibernationSession;
```

#### `startKvConsistency`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L23) `packages/edge/src/semantics/kv-eventual-consistency.ts`

Open a consistency session. Writes and observations start empty.

```ts
export function startKvConsistency(input: {
  platform: EdgePlatform;
}): KvConsistencySession;
```

#### `startMiddlewareChain`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L27) `packages/edge/src/semantics/middleware-chain.ts`

Open a middleware chain over the given ordered stages. The chain begins `idle` and needs an explicit `enterMiddleware` call per stage.

```ts
export function startMiddlewareChain(input: {
  platform: EdgePlatform;
  stages: MiddlewareStage[];
}): MiddlewareSession;
```

#### `startRoutingPool`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L29) `packages/edge/src/semantics/global-routing.ts`

Open a routing session with a POP pool. Each POP has a region tag, measured latency, and health flag.

```ts
export function startRoutingPool(input: {
  platform: EdgePlatform;
  pops: Pop[];
}): RoutingSession;
```

#### `startSubrequest`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L48) `packages/edge/src/semantics/subrequest-limit.ts`

Announce an outbound subrequest. Emits `subrequest.started` but does not advance the count (starting is distinct from counting — a started request only counts once it is admitted via {@link countSubrequest}). Rejects when the budget is already `limited`.

```ts
export function startSubrequest(
  session: SubrequestSession,
  input: { url: string },
): AxisStep<SubrequestState>;
```

#### `startSubrequestBudget`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L27) `packages/edge/src/semantics/subrequest-limit.ts`

Open a subrequest budget. `limit` defaults to 50 (Workers free-plan default) and `warningThreshold` to 40 (80% of the default limit). Emits nothing — the budget is inert until the first {@link startSubrequest}.

```ts
export function startSubrequestBudget(input: {
  platform: EdgePlatform;
  limit?: number;
  warningThreshold?: number;
}): SubrequestSession;
```

#### `syncReplica`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L112) `packages/edge/src/semantics/geo-replicated.ts`

Mark a replica caught up (lag → 0). When every replica has zero lag the session returns 'in-sync'. Rejects an unknown region. Emits `geo.replica-synced`.

```ts
export function syncReplica(
  session: GeoReplicatedSession,
  input: { region: GeoRegion },
): AxisStep<GeoState>;
```

#### `tickCpu`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L69) `packages/edge/src/semantics/cpu-time-limit.ts`

Advance the CPU clock by `deltaMs`. Emits `cpu.limited` when the accumulated time reaches the budget (state → `throttled`), `cpu.budget-warning` when it crosses the warning threshold (state → `warning`), otherwise a `cpu.started` heartbeat carrying the remaining budget. Rejects once the session is `throttled` or `completed`.

```ts
export function tickCpu(
  session: CpuSession,
  input: { deltaMs: number },
): AxisStep<CpuState>;
```

#### `uploadPart`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L64) `packages/edge/src/semantics/r2-multipart.ts`

Upload a single part with declared checksum. Transitions to `uploading` (first part) and emits `r2.part-uploaded`. Rejects if the part number is outside `[1, totalParts]`.

```ts
export function uploadPart(
  session: R2MultipartSession,
  input: { partNumber: number; sizeBytes: number; checksum: string },
): AxisStep<R2State>;
```

#### `verifyChecksum`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L104) `packages/edge/src/semantics/r2-multipart.ts`

Verify part checksum by comparing against expected. If mismatch, transitions to `checksum-failed` and requires the part to be re-uploaded. On match, marks verified and emits `r2.checksum-verified`.

```ts
export function verifyChecksum(
  session: R2MultipartSession,
  input: { partNumber: number; expected: string },
): AxisStep<R2State>;
```

#### `writeStorage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L110) `packages/edge/src/semantics/durable-object.ts`

Write a key to transactional storage. Implies an active handler, so the object stays 'active'. Emits `durable-object.storage-written`.

```ts
export function writeStorage(
  session: DurableObjectSession,
  input: { key: string; value: string },
): AxisStep<DoState>;
```

#### `writeToPrimary`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L53) `packages/edge/src/semantics/d1-read-replica.ts`

Route a write to primary. Emits `d1.primary-write`.

```ts
export function writeToPrimary(
  session: D1Session,
  input: { query: string },
): AxisStep<D1RoutingState>;
```

### 型

#### `AxisStep`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L356) `packages/edge/src/semantics/types.ts`

Axis result envelope returned by every state-machine step. Edge semantics are pure helpers (no adapters); the envelope surfaces the next state transition metadata so tests can drive the next call without re-reading runtime-specific telemetry.

```ts
export interface AxisStep<TState> {
  neutralEvent: NeutralEventName;
  platformEvent: string;
  state: TState;
  platform: EdgePlatform;
  metadata: Record<string, string | number | boolean>;
}
```

#### `ColdStartClass`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L11) `packages/edge/src/semantics/cold-start.ts`

Cold-start axis — serverless function warm/cold path + provisioned concurrency. Real edge runtimes distinguish `cold` (VM allocation + JIT), `warm` (recent eviction still in cache), and `provisioned` (always-on reserved instance) paths — each hits a different latency profile. The helper tracks the pool of warm instances and provisioned reservations, then returns which class the next invocation lands in.

```ts
export type ColdStartClass = 'cold' | 'warm' | 'provisioned';
```

#### `ColdStartSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cold-start.ts#L13) `packages/edge/src/semantics/cold-start.ts`

```ts
export interface ColdStartSession {
  platform: EdgePlatform;
  warmedIds: Set<string>;
  provisionedIds: Set<string>;
  warmedTtlMs: number;
  lastInvokeAtMs: Record<string, number>;
  history: AxisStep<ColdStartClass>[];
}
```

#### `CpuSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L13) `packages/edge/src/semantics/cpu-time-limit.ts`

```ts
export interface CpuSession {
  platform: EdgePlatform;
  budgetMs: number;
  warningAtMs: number;
  elapsedMs: number;
  state: CpuState;
  history: AxisStep<CpuState>[];
}
```

#### `CpuState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cpu-time-limit.ts#L11) `packages/edge/src/semantics/cpu-time-limit.ts`

CPU time limit — per-invocation compute budget. Edge runtimes bill wall-clock loosely but enforce a hard CPU budget (Cloudflare Workers 50ms on the free plan, Vercel + Deno enforce comparable ceilings). The axis accumulates elapsed CPU time across ticks: below a warning threshold it is `running`, at the threshold it flips to `warning`, and once the budget is exhausted the invocation is `throttled` and no further work is admitted.

```ts
export type CpuState = 'idle' | 'running' | 'warning' | 'throttled' | 'completed';
```

#### `CronSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L16) `packages/edge/src/semantics/cron-trigger.ts`

```ts
export interface CronSession {
  id: string;
  platform: EdgePlatform;
  triggerType: CronTriggerType;
  cronSpec: string;
  state: CronState;
  startedAt: number | null;
  retryCount: number;
  maxRetries: number;
  history: AxisStep<CronState>[];
}
```

#### `CronState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L11) `packages/edge/src/semantics/cron-trigger.ts`

Cron trigger — scheduled invocation lifecycle. Edge platforms fire scheduled handlers from distinct sources (Cloudflare Cron Triggers + Queue consumers + Email routing, Vercel Cron jobs, Deno Deploy cron) yet share the same observable lifecycle: an event is scheduled, starts running, then either completes or fails. A failed run re-enters the schedule until `maxRetries` is exhausted, at which point it terminates in `failed`.

```ts
export type CronState = 'scheduled' | 'running' | 'completed' | 'failed';
```

#### `CronTriggerType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/cron-trigger.ts#L14) `packages/edge/src/semantics/cron-trigger.ts`

Which trigger source fired the scheduled handler.

```ts
export type CronTriggerType = 'scheduled' | 'queue' | 'email';
```

#### `D1Replica`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L11) `packages/edge/src/semantics/d1-read-replica.ts`

```ts
export interface D1Replica {
  replicaId: string;
  region: string;
  lagMs: number;
  healthy: boolean;
}
```

#### `D1RoutingState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L9) `packages/edge/src/semantics/d1-read-replica.ts`

D1 read replica axis — primary-replica database routing. Writes always land on primary, reads route to nearest replica unless lag exceeds threshold, in which case failover to primary. The helper tracks per-replica lag (in milliseconds behind primary) and routing decisions.

```ts
export type D1RoutingState = 'primary' | 'replica' | 'lagged' | 'failing-over';
```

#### `D1Session`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/d1-read-replica.ts#L18) `packages/edge/src/semantics/d1-read-replica.ts`

```ts
export interface D1Session {
  platform: EdgePlatform;
  primaryId: string;
  replicas: Map<string, D1Replica>;
  maxLagMs: number;
  history: AxisStep<D1RoutingState>[];
}
```

#### `DoMigrationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L12) `packages/edge/src/semantics/do-state-migration.ts`

```ts
export interface DoMigrationSession {
  platform: EdgePlatform;
  fromVersion: number;
  toVersion: number;
  instances: Map<string, number>;
  migratedCount: number;
  state: DoMigrationState;
  history: AxisStep<DoMigrationState>[];
}
```

#### `DoMigrationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/do-state-migration.ts#L10) `packages/edge/src/semantics/do-state-migration.ts`

DurableObject state migration axis — schema versioning + zero-downtime rollout across DO instances. Migrations bump a schema version and apply a transform to each instance's state, but old workers may still be reading the previous schema during rollout. The helper tracks per-instance schema version so tests can assert atomic migration + safe rollback.

```ts
export type DoMigrationState = 'initiated' | 'schema-bumped' | 'data-migrated' | 'rolled-out' | 'rolled-back';
```

#### `DoState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L19) `packages/edge/src/semantics/durable-object.ts`

Durable Object — stateful, single-instance actor pinned to one edge location. Cloudflare Durable Objects are the canonical example; Vercel's closest analogue is a session-affine edge function, Deno Deploy exposes stateful objects backed by Deno KV. The mock reproduces the user-observable lifecycle: an instance is created once, receives fetch requests (which pin it "active"), can wake on a scheduled alarm, and persists to transactional storage. Hibernation / eviction is intentionally out of scope for v0.2 — the axis only exposes the 4 neutral events the fidelity grid tracks. State transitions: created → 'initialized' requestDurableObject → 'active' (from initialized or active) fireAlarm → 'active' (an alarm wakes the object) writeStorage → 'active' (a storage write implies an active handler)

```ts
export type DoState = 'initialized' | 'active' | 'hibernated' | 'terminated';
```

#### `DurableObjectSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/durable-object.ts#L21) `packages/edge/src/semantics/durable-object.ts`

```ts
export interface DurableObjectSession {
  id: string;
  platform: EdgePlatform;
  state: DoState;
  requestCount: number;
  storageKeys: Map<string, string>;
  scheduledAlarmAt: number | null;
  history: AxisStep<DoState>[];
}
```

#### `EdgeAxis`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L22) `packages/edge/src/semantics/types.ts`

```ts
export type EdgeAxis =
  | 'durable-object'
  | 'websocket-edge'
  | 'edge-kv'
  | 'geo-replicated'
  | 'cron-trigger'
  | 'subrequest-limit'
  | 'cpu-time-limit'
  | 'streaming-response'
  | 'cold-start'
  | 'middleware-chain'
  | 'kv-eventual-consistency'
  | 'r2-multipart'
  | 'd1-read-replica'
  | 'do-state-migration'
  | 'websocket-hibernation'
  | 'global-routing';
```

#### `EdgeEnvBindings`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L19) `packages/edge/src/invoke-edge-handler.ts`

```ts
export interface EdgeEnvBindings {
  readonly [bindingName: string]: KVNamespace | Record<string, unknown> | string | undefined;
}
```

#### `EdgeFetchHandler`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L23) `packages/edge/src/invoke-edge-handler.ts`

```ts
export type EdgeFetchHandler<TEnv extends EdgeEnvBindings = EdgeEnvBindings> = (
  request: Request,
  env: TEnv,
  ctx: SimulatedExecutionContext,
) => Promise<Response> | Response;
```

#### `EdgeKvSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L18) `packages/edge/src/semantics/edge-kv.ts`

```ts
export interface EdgeKvSession {
  platform: EdgePlatform;
  store: Map<string, string>;
  cache: Map<string, string>;
  state: KvState;
  history: AxisStep<KvState>[];
}
```

#### `EdgePlatform`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L20) `packages/edge/src/semantics/types.ts`

Advanced edge semantics — platform-neutral axis SSOT. v0.1 edge mocks only carried fetch invocation + lightweight KV helpers. v0.2 adds 8 production semantics that edge runtimes expose differently — Durable Objects, websocket upgrades, edge KV, geo replication, cron triggers, subrequest limits, CPU time limits, and streaming responses. v1.2 adds 8 advanced production semantics — cold-start (serverless function warm/cold path + provisioned concurrency), middleware-chain (edge middleware auth → rewrite → cache → transform chain), KV eventual consistency (read-your-writes / monotonic-reads), R2 multipart upload (resumable + integrity check), D1 read replica (lag detection + failover), DurableObject state migration (schema versioning + zero-downtime rollout), WebSocket hibernation (resume + reconnect state), and global routing (Anycast + geo + latency-based failover). Each axis is expressed as a small pure state-machine helper that returns a neutral envelope, so downstream tests can drive the axis without knowing the platform's payload dialect.

```ts
export type EdgePlatform = 'cloudflare' | 'vercel' | 'deno';
```

#### `FidelityCoverage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L16) `packages/edge/src/semantics/fidelity.ts`

```ts
export interface FidelityCoverage {
  platforms: EdgePlatform[];
  axes: EdgeAxis[];
  rows: FidelityRow[];
}
```

#### `FidelityRow`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/fidelity.ts#L9) `packages/edge/src/semantics/fidelity.ts`

Fidelity harness — collects the platform × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 platform × 8 axis" without walking every neutral event by hand.

```ts
export interface FidelityRow {
  platform: EdgePlatform;
  axis: EdgeAxis;
  neutralEvents: NeutralEventName[];
  platformEvents: string[];
}
```

#### `GeoRegion`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L19) `packages/edge/src/semantics/geo-replicated.ts`

Geo-replicated store — a primary region that accepts writes and N replica regions that catch up asynchronously. This is the multi-region consistency model behind Cloudflare Smart Placement + KV replication, Vercel Edge Config replication, and Deno KV's primary/replica topology. The mock exposes the observable lifecycle a test cares about: a primary write bumps a version and leaves replicas lagging, each replica is marked lagged then synced, and a write conflict can be explicitly resolved. State transitions: createGeoReplicatedSession → 'in-sync' (version 0, no lag) geoPrimaryWrite → 'lagging' (replicas fall behind) markReplicaLagged → 'lagging' syncReplica → 'in-sync' (only once every replica lag = 0) resolveConflict → 'in-sync'

```ts
export type GeoRegion = string;
```

#### `GeoReplicatedSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L23) `packages/edge/src/semantics/geo-replicated.ts`

```ts
export interface GeoReplicatedSession {
  platform: EdgePlatform;
  primaryRegion: GeoRegion;
  replicaRegions: GeoRegion[];
  state: GeoState;
  version: number;
  lagMs: Record<GeoRegion, number>;
  history: AxisStep<GeoState>[];
}
```

#### `GeoState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/geo-replicated.ts#L21) `packages/edge/src/semantics/geo-replicated.ts`

```ts
export type GeoState = 'in-sync' | 'lagging' | 'conflict-detected';
```

#### `InvokeEdgeHandlerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L29) `packages/edge/src/invoke-edge-handler.ts`

```ts
export interface InvokeEdgeHandlerOptions<TEnv extends EdgeEnvBindings = EdgeEnvBindings> {
  readonly handler: EdgeFetchHandler<TEnv>;
  readonly url: string;
  readonly method?: string;
  readonly headers?: Record<string, string>;
  readonly formData?: Record<string, string>;
  readonly jsonBody?: unknown;
  readonly env: TEnv;
}
```

#### `InvokeEdgeHandlerResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L39) `packages/edge/src/invoke-edge-handler.ts`

```ts
export interface InvokeEdgeHandlerResult {
  readonly response: Response;
  readonly redirect: { url: string; status: number } | null;
  readonly ctx: SimulatedExecutionContext;
  readonly error: unknown;
}
```

#### `KvConsistencySession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L13) `packages/edge/src/semantics/kv-eventual-consistency.ts`

```ts
export interface KvConsistencySession {
  platform: EdgePlatform;
  writes: Record<string, number>;
  observed: Record<string, number>;
  history: AxisStep<KvConsistencyState>[];
}
```

#### `KvConsistencyState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/kv-eventual-consistency.ts#L11) `packages/edge/src/semantics/kv-eventual-consistency.ts`

KV eventual consistency axis — models the read-your-writes / monotonic-reads subset of consistency guarantees that edge KV stores expose. Writes converge across quorum, but until convergence a read from a lagging replica returns stale data. The helper tracks per-key write timestamps and per-session last-observed timestamps, then detects violations (client writes t=100 → reads t=50 back = read-your-writes violation).

```ts
export type KvConsistencyState = 'writing' | 'converged' | 'stale' | 'violated';
```

#### `KVMockEntry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L37) `packages/edge/src/kv-mock.ts`

```ts
export interface KVMockEntry {
  readonly value: string;
  readonly metadata?: Record<string, unknown>;
}
```

#### `KVNamespace`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L27) `packages/edge/src/kv-mock.ts`

```ts
export interface KVNamespace {
  get(key: string): Promise<string | null>;
  get(key: string, type: 'text'): Promise<string | null>;
  get<T>(key: string, type: 'json'): Promise<T | null>;
  get(key: string, type: 'arrayBuffer'): Promise<ArrayBuffer | null>;
  put(key: string, value: string, options?: KVNamespacePutOptions): Promise<void>;
  delete(key: string): Promise<void>;
  list(options?: KVNamespaceListOptions): Promise<KVNamespaceListResult>;
}
```

#### `KVNamespaceListOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L17) `packages/edge/src/kv-mock.ts`

```ts
export interface KVNamespaceListOptions {
  readonly prefix?: string;
  readonly limit?: number;
}
```

#### `KVNamespaceListResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L22) `packages/edge/src/kv-mock.ts`

```ts
export interface KVNamespaceListResult {
  readonly keys: ReadonlyArray<{ readonly name: string; readonly metadata?: Record<string, unknown> }>;
  readonly list_complete: true;
}
```

#### `KVNamespacePutOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/kv-mock.ts#L12) `packages/edge/src/kv-mock.ts`

```ts
export interface KVNamespacePutOptions {
  readonly expirationTtl?: number;
  readonly metadata?: Record<string, unknown>;
}
```

#### `KvState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/edge-kv.ts#L16) `packages/edge/src/semantics/edge-kv.ts`

Edge KV — a globally replicated key/value store with a read-through cache. Cloudflare KV, Vercel Edge Config, and Deno KV all trade strong consistency for low-latency edge reads: a write may take time to propagate, and reads are served from a per-POP cache when warm. The mock models the observable surface: a backing `store`, a `cache` layer that a read populates and a write invalidates, and a range query over a key prefix. There is no state machine per se — the store is always usable. `state` records the consistency model the caller declared so downstream tests can assert on it. The 4 neutral events distinguish a cold read, a write, a warm cache hit, and a miss on an absent key.

```ts
export type KvState = 'consistent' | 'eventually-consistent';
```

#### `MiddlewareSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L14) `packages/edge/src/semantics/middleware-chain.ts`

```ts
export interface MiddlewareSession {
  platform: EdgePlatform;
  stages: MiddlewareStage[];
  currentIndex: number;
  state: MiddlewareState;
  history: AxisStep<MiddlewareState>[];
  rewrittenUrl?: string;
}
```

#### `MiddlewareStage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L12) `packages/edge/src/semantics/middleware-chain.ts`

```ts
export type MiddlewareStage = 'auth' | 'rewrite' | 'cache' | 'transform';
```

#### `MiddlewareState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/middleware-chain.ts#L10) `packages/edge/src/semantics/middleware-chain.ts`

Middleware chain axis — edge runtime middleware pipeline (auth → rewrite → cache → transform). Each middleware can pass, rewrite, short-circuit (return without invoking downstream), or complete. The chain preserves order so downstream tests can assert the exact sequence of stages executed.

```ts
export type MiddlewareState = 'idle' | 'running' | 'short-circuited' | 'completed';
```

#### `NeutralEventName`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L48) `packages/edge/src/semantics/types.ts`

Platform-neutral event names used inside the axis helpers. Real edge platforms expose different string ids (Cloudflare `durable_object.fetch`, Vercel `edge_function.session_affinity`, Deno Deploy `deploy.stateful_fetch`) — the {@link platformEventName} map handles the translation. Tests can assert on the neutral name via `step.neutralEvent` or on the platform-specific one via `step.platformEvent`.

```ts
export type NeutralEventName =
  // durable object / stateful affinity
  | 'durable-object.created'
  | 'durable-object.requested'
  | 'durable-object.alarm-fired'
  | 'durable-object.storage-written'
  // websocket edge
  | 'websocket.upgrade-requested'
  | 'websocket.accepted'
  | 'websocket.message'
  | 'websocket.closed'
  // edge KV
  | 'kv.read'
  | 'kv.write'
  | 'kv.cache-hit'
  | 'kv.cache-miss'
  // geo replication
  | 'geo.primary-write'
  | 'geo.replica-lagged'
  | 'geo.replica-synced'
  | 'geo.conflict-resolved'
  // cron trigger
  | 'cron.scheduled'
  | 'cron.started'
  | 'cron.completed'
  | 'cron.failed'
  // subrequest limit
  | 'subrequest.started'
  | 'subrequest.counted'
  | 'subrequest.limited'
  | 'subrequest.completed'
  // CPU time limit
  | 'cpu.started'
  | 'cpu.budget-warning'
  | 'cpu.limited'
  | 'cpu.completed'
  // streaming response
  | 'stream.opened'
  | 'stream.chunk-sent'
  | 'stream.backpressure'
  | 'stream.closed'
  // v1.2 advanced axis
  // cold-start
  | 'cold-start.invoked'
  | 'cold-start.cache-hit'
  | 'cold-start.provisioned-hit'
  | 'cold-start.warmed'
  // middleware-chain
  | 'middleware.entered'
  | 'middleware.rewritten'
  | 'middleware.short-circuited'
  | 'middleware.completed'
  // kv-eventual-consistency
  | 'kv-consistency.write-quorum'
  | 'kv-consistency.stale-read'
  | 'kv-consistency.read-your-writes'
  | 'kv-consistency.monotonic-violation'
  // r2-multipart
  | 'r2.multipart-initiated'
  | 'r2.part-uploaded'
  | 'r2.checksum-verified'
  | 'r2.multipart-completed'
  // d1-read-replica
  | 'd1.primary-write'
  | 'd1.replica-read'
  | 'd1.replica-lagged'
  | 'd1.replica-failover'
  // do-state-migration
  | 'do-migration.initiated'
  | 'do-migration.schema-bumped'
  | 'do-migration.data-migrated'
  | 'do-migration.rolled-out'
  // websocket-hibernation
  | 'ws-hibernation.entered'
  | 'ws-hibernation.resumed'
  | 'ws-hibernation.state-restored'
  | 'ws-hibernation.reconnected'
  // global-routing
  | 'routing.anycast-received'
  | 'routing.geo-matched'
  | 'routing.latency-selected'
  | 'routing.failover-triggered';
```

#### `Pop`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L12) `packages/edge/src/semantics/global-routing.ts`

```ts
export interface Pop {
  popId: string;
  region: string;
  latencyMs: number;
  healthy: boolean;
}
```

#### `R2MultipartSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L19) `packages/edge/src/semantics/r2-multipart.ts`

```ts
export interface R2MultipartSession {
  platform: EdgePlatform;
  uploadId: string;
  parts: Map<number, R2Part>;
  totalParts: number;
  state: R2State;
  history: AxisStep<R2State>[];
}
```

#### `R2Part`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L12) `packages/edge/src/semantics/r2-multipart.ts`

```ts
export interface R2Part {
  partNumber: number;
  sizeBytes: number;
  checksum: string;
  verified: boolean;
}
```

#### `R2State`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/r2-multipart.ts#L10) `packages/edge/src/semantics/r2-multipart.ts`

R2 multipart upload axis — resumable object storage upload flow. Real R2 / S3-compatible stores split large objects into ordered parts (5MB+ each), verify each part checksum, and commit on completion. The helper tracks per-part state and aggregate integrity so failed uploads can be resumed from the last verified part.

```ts
export type R2State = 'initiated' | 'uploading' | 'checksum-failed' | 'completed' | 'aborted';
```

#### `RoutingSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L19) `packages/edge/src/semantics/global-routing.ts`

```ts
export interface RoutingSession {
  platform: EdgePlatform;
  pops: Map<string, Pop>;
  history: AxisStep<RoutingState>[];
}
```

#### `RoutingState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/global-routing.ts#L10) `packages/edge/src/semantics/global-routing.ts`

Global routing axis — Anycast + geo + latency-based failover. Edge platforms receive requests on Anycast IPs and route them to the closest healthy POP based on geo match, then latency probe, then failover if the primary POP is unhealthy. The helper tracks POP health + observed latencies so tests can drive the routing decision tree.

```ts
export type RoutingState = 'anycast' | 'geo-matched' | 'latency-selected' | 'failing-over';
```

#### `SimulatedExecutionContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/invoke-edge-handler.ts#L12) `packages/edge/src/invoke-edge-handler.ts`

```ts
export interface SimulatedExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
  readonly waitedPromises: Promise<unknown>[];
  passThroughCalled: boolean;
}
```

#### `StreamKind`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L13) `packages/edge/src/semantics/streaming-response.ts`

Delivery mechanism for the streamed body.

```ts
export type StreamKind = 'chunked' | 'sse' | 'websocket';
```

#### `StreamSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L15) `packages/edge/src/semantics/streaming-response.ts`

```ts
export interface StreamSession {
  id: string;
  platform: EdgePlatform;
  kind: StreamKind;
  state: StreamState;
  chunksSent: number;
  bytesSent: number;
  highWaterMark: number;
  history: AxisStep<StreamState>[];
}
```

#### `StreamState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/streaming-response.ts#L10) `packages/edge/src/semantics/streaming-response.ts`

Streaming response — chunked / SSE / websocket body delivery with backpressure. Edge runtimes stream responses through a bounded buffer: while buffered bytes stay under the high-water mark the stream is `open` and chunks flow freely; once the mark is exceeded the stream enters `backpressure` and the producer must wait for the consumer to drain before resuming.

```ts
export type StreamState = 'open' | 'backpressure' | 'closed';
```

#### `SubrequestSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L13) `packages/edge/src/semantics/subrequest-limit.ts`

```ts
export interface SubrequestSession {
  platform: EdgePlatform;
  count: number;
  limit: number;
  warningThreshold: number;
  state: SubrequestState;
  history: AxisStep<SubrequestState>[];
}
```

#### `SubrequestState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/subrequest-limit.ts#L11) `packages/edge/src/semantics/subrequest-limit.ts`

Subrequest limit — outbound fetch budget per invocation. Edge runtimes cap how many subrequests a single handler may issue (Cloudflare Workers default 50 on the free plan, Vercel + Deno enforce comparable ceilings). The axis tracks a running count against the limit: below a warning threshold the session is `ok`, at the threshold it is `approaching-limit`, and once the count reaches the hard limit it is `limited` and further fetches are refused.

```ts
export type SubrequestState = 'ok' | 'approaching-limit' | 'limited';
```

#### `WebSocketSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L19) `packages/edge/src/semantics/websocket-edge.ts`

```ts
export interface WebSocketSession {
  id: string;
  platform: EdgePlatform;
  state: WsState;
  messages: string[];
  history: AxisStep<WsState>[];
}
```

#### `WsHibernationSession`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L12) `packages/edge/src/semantics/websocket-hibernation.ts`

```ts
export interface WsHibernationSession {
  platform: EdgePlatform;
  connectionId: string;
  state: WsHibernationState;
  storedState: Record<string, string | number | boolean>;
  hibernatedAtMs: number;
  history: AxisStep<WsHibernationState>[];
}
```

#### `WsHibernationState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L10) `packages/edge/src/semantics/websocket-hibernation.ts`

WebSocket hibernation axis — Cloudflare Workers / Vercel Edge model where an idle WebSocket connection is hibernated (freed from memory), then resumed on the next inbound message with restored state. The helper tracks per-connection hibernation status and last-known state so tests can drive hibernate → resume → reconnect flows.

```ts
export type WsHibernationState = 'live' | 'hibernated' | 'resuming' | 'reconnected';
```

#### `WsState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-edge.ts#L17) `packages/edge/src/semantics/websocket-edge.ts`

WebSocket at the edge — the HTTP-upgrade handshake plus the message / close lifecycle. All three runtimes accept a `101 Switching Protocols` upgrade (Cloudflare `WebSocketPair`, Vercel edge websockets, Deno `Deno.upgradeWebSocket`) but expose different telemetry strings. The mock drives the neutral lifecycle so a test can assert the handshake ordering without a live socket. State transitions: requestWebSocketUpgrade → 'pending' acceptWebSocket → 'open' (only from 'pending') sendMessage → 'open' (only while 'open') closeWebSocket → 'closed'

```ts
export type WsState = 'pending' | 'open' | 'closing' | 'closed';
```
<!-- kiwa-public-api:end -->
