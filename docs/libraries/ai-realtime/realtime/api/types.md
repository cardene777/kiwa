---
title: "@kiwa-lab/realtime types の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>types</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)



### 型

#### <code v-pre>BroadcastEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L66) <code v-pre>packages/realtime/src/types.ts</code>

Broadcast event — channel 内の任意 event 名 payload 配信。 provider 全てで ordering は per-channel FIFO を保証する (Ably history rewind は除く、 see `historyRewind` in ChannelOptions)。

```ts
export interface BroadcastEvent<TPayload = unknown> {
    channel: string;
    event: string;
    payload: TPayload;
    /** server 割当 ID (Ably message ID / Pusher socket_id 等の抽象)。 */
    id: string;
    timestamp: number;
}
```

#### <code v-pre>ConnectionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L18) <code v-pre>packages/realtime/src/types.ts</code>

接続状態の 5 state machine。 disconnected → connecting → connected → reconnecting → disconnected を 4 provider 全てで模倣する。

```ts
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'closed';
```

#### <code v-pre>PostgresChangeEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L82) <code v-pre>packages/realtime/src/types.ts</code>

```ts
export interface PostgresChangeEvent<TRow = Record<string, unknown>> {
    channel: string;
    eventType: PostgresChangeType;
    schema: string;
    table: string;
    /** UPDATE / DELETE 時の旧 row (INSERT 時は null)。 */
    oldRecord: TRow | null;
    /** INSERT / UPDATE 時の新 row (DELETE 時は null)。 */
    newRecord: TRow | null;
    timestamp: number;
}
```

#### <code v-pre>PostgresChangeType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L80) <code v-pre>packages/realtime/src/types.ts</code>

Postgres changes event — Supabase Realtime 固有の semantics だが、 DB CDC を realtime 通知する共通 pattern として 4 provider mock で扱える (Ably / Pusher / Socket.io は broadcast の特殊形として emit)。

```ts
export type PostgresChangeType = 'INSERT' | 'UPDATE' | 'DELETE';
```

#### <code v-pre>PresenceEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L53) <code v-pre>packages/realtime/src/types.ts</code>

Presence event 1 件 (join / leave / sync)。

```ts
export interface PresenceEvent {
    type: PresenceEventType;
    channel: string;
    /** sync 時は全 member、 join/leave は該当 user のみ。 */
    members: PresenceMember[];
    timestamp: number;
}
```

#### <code v-pre>PresenceEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L41) <code v-pre>packages/realtime/src/types.ts</code>

Presence event の種類。 実 provider (Supabase / Ably / Pusher) 全てで sync / join / leave の 3 event 相当が存在する。

```ts
export type PresenceEventType = 'sync' | 'join' | 'leave';
```

#### <code v-pre>PresenceMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L44) <code v-pre>packages/realtime/src/types.ts</code>

1 user 分の presence metadata。 provider 別 field は `payload` に格納。

```ts
export interface PresenceMember {
    userId: string;
    /** provider 別の任意 metadata (Supabase `presence_ref` / Ably `clientId` 等)。 */
    payload: Record<string, unknown>;
    /** presence が最後に更新された server timestamp (ms)。 */
    updatedAt: number;
}
```

#### <code v-pre>RealtimeAnyEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L209) <code v-pre>packages/realtime/src/types.ts</code>

subscribe の union event 型 (adapter 側で filter する)。

```ts
export type RealtimeAnyEvent = ({
    kind: 'presence';
} & PresenceEvent) | ({
    kind: 'broadcast';
} & BroadcastEvent) | ({
    kind: 'postgres_changes';
} & PostgresChangeEvent) | {
    kind: 'connection';
    state: ConnectionState;
    timestamp: number;
};
```

#### <code v-pre>RealtimeEventHandler</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L206) <code v-pre>packages/realtime/src/types.ts</code>

subscribe に渡す handler。 5 event 種を全て受け取れる union。

```ts
export type RealtimeEventHandler = (event: RealtimeAnyEvent) => void;
```

#### <code v-pre>RealtimeMetrics</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L222) <code v-pre>packages/realtime/src/types.ts</code>

mock が公開する累積 metric。 fidelity harness が集計に使う。

```ts
export interface RealtimeMetrics {
    /** subscribe 回数。 */
    subscribeCount: number;
    /** publish 回数。 */
    publishCount: number;
    /** 実際に配信された event 総数 (drop 前)。 */
    eventsDelivered: number;
    /** backpressure で drop された event 数。 */
    eventsDropped: number;
    /** reconnect 発生回数 (auto + manual)。 */
    reconnectCount: number;
    /** subscribe → 初 event までの latency サンプル (ms)。 */
    subscribeLatencyMs: number[];
    /** publish → subscriber 受信までの latency サンプル (ms)。 */
    publishLatencyMs: number[];
}
```

#### <code v-pre>RealtimeMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L170) <code v-pre>packages/realtime/src/types.ts</code>

kiwa realtime mock を全 SDK adapter が満たすべき最小 interface。 SDK 固有の API (`supabase.channel().on()` / `ably.channels.get().subscribe()` / `pusher.subscribe()` / `io.of().on()`) は adapter 別に定義、 本 interface は 4 provider 共通の低レベル操作 (subscribe / publish / presence / disconnect) を集約する。

```ts
export interface RealtimeMock {
    /** provider 名 (`supabase` / `ably` / `pusher` / `socketio`)。 */
    readonly provider: string;
    /**
     * channel 購読 — subscribe 後 scenario event が順次 handler に流れる。
     * unsubscribe は返り値 handle の `.unsubscribe()` で行う。
     */
    subscribe(channel: string, handler: RealtimeEventHandler): Promise<SubscriptionHandle>;
    /** broadcast event を channel に publish (server 経由の擬似 emit)。 */
    publish(channel: string, event: string, payload: unknown): Promise<void>;
    /** presence state を track (join)。 unsubscribe or leave で自動 leave。 */
    trackPresence(channel: string, userId: string, payload?: Record<string, unknown>): Promise<void>;
    /** presence untrack (leave)。 */
    untrackPresence(channel: string, userId: string): Promise<void>;
    /** 現時点の connection state。 */
    getConnectionState(): ConnectionState;
    /** 手動 disconnect (test 用)。 */
    disconnect(): Promise<void>;
    /** 手動 reconnect (test 用)。 */
    reconnect(): Promise<void>;
    /** 累積 metric (fidelity 計測用)。 */
    getMetrics(): RealtimeMetrics;
    /** metric + subscription state を初期化。 */
    reset(): void;
}
```

#### <code v-pre>RealtimeMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L128) <code v-pre>packages/realtime/src/types.ts</code>

Mock 設定 — 4 provider adapter で共通に使う。 `scenarios` は channel 名 → 発火 event 列で index、 event は subscribe 後の 順序で emit される。 reconnect 挙動は `reconnect` で override。

```ts
export interface RealtimeMockConfig {
    /** artificial latency (ms、 default 5)。 subscribe / publish 遅延。 */
    artificialLatencyMs?: number;
    /** provider 識別子 (report 用、 default 'mock-realtime')。 */
    provider?: string;
    /** reconnect policy (default {maxAttempts: 5, initialBackoffMs: 100})。 */
    reconnect?: ReconnectPolicy;
    /**
     * channel 別の scenario (subscribe 後に順次 emit される event 列)。
     * key = channel 名。 value = event 列 (順序保持)。
     */
    scenarios?: Record<string, ScenarioEvent[]>;
    /**
     * pending event backpressure — queue 満杯 event drop 数の閾値。
     * default = Infinity (drop なし)、 Socket.io 実装で意味を持つ。
     */
    backpressureLimit?: number;
}
```

#### <code v-pre>ReconnectPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L109) <code v-pre>packages/realtime/src/types.ts</code>

Reconnect policy — provider 全てで指数 backoff + jitter が実装されている。 mock は artificial delay で挙動を模倣。

```ts
export interface ReconnectPolicy {
    /** 最大再接続試行回数 (default 5)。 */
    maxAttempts?: number;
    /** 初期 backoff delay (ms、 default 100)。 */
    initialBackoffMs?: number;
    /** 最大 backoff delay (ms、 default 5000)。 */
    maxBackoffMs?: number;
    /** backoff 倍率 (default 2)。 */
    backoffMultiplier?: number;
    /** 0-1 の jitter 割合 (default 0.1)。 */
    jitter?: number;
}
```

#### <code v-pre>Room</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L99) <code v-pre>packages/realtime/src/types.ts</code>

Room semantics — Socket.io namespace + room の 2 階層構造、 Ably では channel、 Supabase では channel、 Pusher では channel-name 相当。 mock ではすべて `{ namespace?: string; room: string }` に正規化。

```ts
export interface Room {
    /** Socket.io 固有 (default 未指定 = `/`)。 */
    namespace?: string;
    room: string;
}
```

#### <code v-pre>ScenarioEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L151) <code v-pre>packages/realtime/src/types.ts</code>

1 scenario event — subscribe 後の n 番目に発火する event。 `delay` が指定されると、 直前 event から `delay` ms 後に emit される。

```ts
export type ScenarioEvent = ({
    kind: 'presence';
} & Omit<PresenceEvent, 'channel' | 'timestamp'> & {
    delay?: number;
}) | ({
    kind: 'broadcast';
} & Omit<BroadcastEvent, 'channel' | 'timestamp' | 'id'> & {
    delay?: number;
    id?: string;
}) | ({
    kind: 'postgres_changes';
} & Omit<PostgresChangeEvent, 'channel' | 'timestamp'> & {
    delay?: number;
}) | {
    kind: 'disconnect';
    delay?: number;
} | {
    kind: 'reconnect';
    delay?: number;
};
```

#### <code v-pre>SubscriptionHandle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/types.ts#L216) <code v-pre>packages/realtime/src/types.ts</code>

subscribe の返り値 handle。

```ts
export interface SubscriptionHandle {
    channel: string;
    unsubscribe(): Promise<void>;
}
```
