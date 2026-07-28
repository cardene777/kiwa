---
title: "@kiwa-lab/websocket reconnect の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/websocket</code> <code v-pre>reconnect</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>computeReconnectDelay</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L18) <code v-pre>packages/websocket/src/reconnect.ts</code>

exponential backoff で reconnect delay を計算。 real WS client の reconnect strategy (Socket.IO / uWebSockets client) を mock。 jitter で thundering herd 回避。

```ts
export declare function computeReconnectDelay(attempt: number, policy: ReconnectPolicy, rng?: () => number): ReconnectAttempt;
```

#### <code v-pre>createHeartbeatState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L36) <code v-pre>packages/websocket/src/reconnect.ts</code>

ping/pong heartbeat 状態を追跡、 pong 未受信で missedPongs を increment、 閾値超えで healthy=false。 real WS keepalive パターンの mock。

```ts
export declare function createHeartbeatState(now?: () => number): {
    state: HeartbeatState;
    ping: () => void;
    pong: () => void;
    check: (thresholdMs: number, maxMissed: number) => HeartbeatState;
};
```

### 型

#### <code v-pre>HeartbeatState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L25) <code v-pre>packages/websocket/src/reconnect.ts</code>

```ts
export interface HeartbeatState {
    lastPingAt: number;
    lastPongAt: number;
    missedPongs: number;
    healthy: boolean;
}
```

#### <code v-pre>ReconnectAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L8) <code v-pre>packages/websocket/src/reconnect.ts</code>

```ts
export interface ReconnectAttempt {
    attempt: number;
    delayMs: number;
    giveUp: boolean;
}
```

#### <code v-pre>ReconnectPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/reconnect.ts#L1) <code v-pre>packages/websocket/src/reconnect.ts</code>

```ts
export interface ReconnectPolicy {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    jitter?: boolean;
}
```
