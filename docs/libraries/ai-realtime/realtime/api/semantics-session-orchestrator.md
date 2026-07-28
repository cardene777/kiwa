---
title: "@kiwa-lab/realtime semantics-session-orchestrator の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-session-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>dispatchEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L62) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

event driven state 遷移 SSOT。 5 state × 8 event = 40 セル。 payment 同様 soft-reject + invalid log (realtime 経路 も webhook 相当 の event 重複配信 が normal、 throw だと consumer が例外処理コード膨張)。

```ts
export declare function dispatchEvent(input: {
    session: RealtimeSession;
    event: RealtimeEvent;
    timestamp: string;
}): RealtimeSession;
```

#### <code v-pre>startSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L45) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

```ts
export declare function startSession(input: {
    timestamp: string;
}): RealtimeSession;
```

#### <code v-pre>summarizeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L168) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

```ts
export declare function summarizeSession(session: RealtimeSession): RealtimeSessionSummary;
```

### 型

#### <code v-pre>RealtimeEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L25) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

```ts
export type RealtimeEvent = 'connect-succeeded' | 'connect-failed' | 'subscribe-succeeded' | 'heartbeat-lost' | 'heartbeat-recovered' | 'reconnect-succeeded' | 'reconnect-exhausted' | 'user-disconnect';
```

#### <code v-pre>RealtimeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L35) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

```ts
export interface RealtimeSession {
    state: RealtimeSessionState;
    connectAttempts: number;
    reconnectRounds: number;
    heartbeatFailures: number;
    broadcastsReceived: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>RealtimeSessionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L18) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

v2.1 realtime session-orchestrator = presence + broadcast + subscription + heartbeat + reconnect の 5 axis を 継続合成 する 上位 layer。 Realtime pair v0.1 → v2.1 = 5 段深化到達、 **depth-5 pattern 5 例目発生** (Mobile + Desktop + quality-metrics + Payment + Realtime = 5 pair 到達で pattern 「rule」 化 → **systematic law** 昇格 candidate)。 auth v0.7 + payment v2.1 の 上位層 pattern を Realtime pair に転用、 systematic pattern 47 度目適用 (continuous state machine variant Realtime 転用)。 4 provider (Supabase / Ably / Pusher / Socket.io) 抽象 の 上位、 provider 独立 な pure state machine、 5 state SSOT + 8 event SSOT + 40 セル 遷移表。 shape 契約 preserving 絶対維持 = 既存 API (v0.1-v0.2) 変更 0、 新規 file 追加 のみ、 backward compat 絶対維持。

```ts
export type RealtimeSessionState = 'connecting' | 'subscribed' | 'reconnecting' | 'degraded' | 'closed';
```

#### <code v-pre>RealtimeSessionSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/session-orchestrator.ts#L157) <code v-pre>packages/realtime/src/semantics/session-orchestrator.ts</code>

```ts
export interface RealtimeSessionSummary {
    currentState: RealtimeSessionState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    broadcastsReceived: number;
    reconnectRounds: number;
    heartbeatFailures: number;
}
```
