---
title: "@kiwa-lab/edge semantics-types の API 契約"
---

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics-types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>platformEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L343) <code v-pre>packages/edge/src/semantics/types.ts</code>

Translate a neutral event name to the platform dialect. Falls back to the neutral name if the platform has no specific dialect entry — this makes the map partial-safe without silent typos.

```ts
export declare function platformEventName(platform: EdgePlatform, neutral: NeutralEventName): string;
```

### 型

#### <code v-pre>AxisStep</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L356) <code v-pre>packages/edge/src/semantics/types.ts</code>

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

#### <code v-pre>EdgeAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L22) <code v-pre>packages/edge/src/semantics/types.ts</code>

```ts
export type EdgeAxis = 'durable-object' | 'websocket-edge' | 'edge-kv' | 'geo-replicated' | 'cron-trigger' | 'subrequest-limit' | 'cpu-time-limit' | 'streaming-response' | 'cold-start' | 'middleware-chain' | 'kv-eventual-consistency' | 'r2-multipart' | 'd1-read-replica' | 'do-state-migration' | 'websocket-hibernation' | 'global-routing';
```

#### <code v-pre>EdgePlatform</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L20) <code v-pre>packages/edge/src/semantics/types.ts</code>

Advanced edge semantics — platform-neutral axis SSOT. v0.1 edge mocks only carried fetch invocation + lightweight KV helpers. v0.2 adds 8 production semantics that edge runtimes expose differently — Durable Objects, websocket upgrades, edge KV, geo replication, cron triggers, subrequest limits, CPU time limits, and streaming responses. v1.2 adds 8 advanced production semantics — cold-start (serverless function warm/cold path + provisioned concurrency), middleware-chain (edge middleware auth → rewrite → cache → transform chain), KV eventual consistency (read-your-writes / monotonic-reads), R2 multipart upload (resumable + integrity check), D1 read replica (lag detection + failover), DurableObject state migration (schema versioning + zero-downtime rollout), WebSocket hibernation (resume + reconnect state), and global routing (Anycast + geo + latency-based failover). Each axis is expressed as a small pure state-machine helper that returns a neutral envelope, so downstream tests can drive the axis without knowing the platform's payload dialect.

```ts
export type EdgePlatform = 'cloudflare' | 'vercel' | 'deno';
```

#### <code v-pre>NeutralEventName</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/types.ts#L48) <code v-pre>packages/edge/src/semantics/types.ts</code>

Platform-neutral event names used inside the axis helpers. Real edge platforms expose different string ids (Cloudflare `durable_object.fetch`, Vercel `edge_function.session_affinity`, Deno Deploy `deploy.stateful_fetch`) — the {@link platformEventName} map handles the translation. Tests can assert on the neutral name via `step.neutralEvent` or on the platform-specific one via `step.platformEvent`.

```ts
export type NeutralEventName = 'durable-object.created' | 'durable-object.requested' | 'durable-object.alarm-fired' | 'durable-object.storage-written' | 'websocket.upgrade-requested' | 'websocket.accepted' | 'websocket.message' | 'websocket.closed' | 'kv.read' | 'kv.write' | 'kv.cache-hit' | 'kv.cache-miss' | 'geo.primary-write' | 'geo.replica-lagged' | 'geo.replica-synced' | 'geo.conflict-resolved' | 'cron.scheduled' | 'cron.started' | 'cron.completed' | 'cron.failed' | 'subrequest.started' | 'subrequest.counted' | 'subrequest.limited' | 'subrequest.completed' | 'cpu.started' | 'cpu.budget-warning' | 'cpu.limited' | 'cpu.completed' | 'stream.opened' | 'stream.chunk-sent' | 'stream.backpressure' | 'stream.closed' | 'cold-start.invoked' | 'cold-start.cache-hit' | 'cold-start.provisioned-hit' | 'cold-start.warmed' | 'middleware.entered' | 'middleware.rewritten' | 'middleware.short-circuited' | 'middleware.completed' | 'kv-consistency.write-quorum' | 'kv-consistency.stale-read' | 'kv-consistency.read-your-writes' | 'kv-consistency.monotonic-violation' | 'r2.multipart-initiated' | 'r2.part-uploaded' | 'r2.checksum-verified' | 'r2.multipart-completed' | 'd1.primary-write' | 'd1.replica-read' | 'd1.replica-lagged' | 'd1.replica-failover' | 'do-migration.initiated' | 'do-migration.schema-bumped' | 'do-migration.data-migrated' | 'do-migration.rolled-out' | 'ws-hibernation.entered' | 'ws-hibernation.resumed' | 'ws-hibernation.state-restored' | 'ws-hibernation.reconnected' | 'routing.anycast-received' | 'routing.geo-matched' | 'routing.latency-selected' | 'routing.failover-triggered';
```
