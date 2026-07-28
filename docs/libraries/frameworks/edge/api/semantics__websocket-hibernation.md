---
title: "@kiwa-lab/edge semantics__websocket-hibernation の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/edge</code> <code v-pre>semantics&#95;&#95;websocket-hibernation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>completeReconnect</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L128) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

Complete reconnection — connection is fully live again. Transitions to `reconnected` and emits `ws-hibernation.reconnected`.

```ts
export declare function completeReconnect(session: WsHibernationSession): AxisStep<WsHibernationState>;
```

#### <code v-pre>hibernate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L44) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

Hibernate the connection (idle timeout). Transitions to `hibernated` and emits `ws-hibernation.entered`. State is preserved in storage.

```ts
export declare function hibernate(session: WsHibernationSession, input: {
    nowMs: number;
}): AxisStep<WsHibernationState>;
```

#### <code v-pre>restoreState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L100) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

Restore state from storage back into the resumed session. Confirms all expected keys are present and emits `ws-hibernation.state-restored`.

```ts
export declare function restoreState(session: WsHibernationSession, input: {
    expectedKeys: string[];
}): AxisStep<WsHibernationState>;
```

#### <code v-pre>resume</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L72) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

Resume a hibernated connection on inbound message. Transitions to `resuming` and emits `ws-hibernation.resumed` with time in hibernation.

```ts
export declare function resume(session: WsHibernationSession, input: {
    nowMs: number;
}): AxisStep<WsHibernationState>;
```

#### <code v-pre>startHibernationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L25) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

Open a hibernation session. Initial state is `live` with given `storedState` (persisted across hibernation).

```ts
export declare function startHibernationSession(input: {
    platform: EdgePlatform;
    connectionId: string;
    initialState?: Record<string, string | number | boolean>;
}): WsHibernationSession;
```

### 型

#### <code v-pre>WsHibernationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L12) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

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

#### <code v-pre>WsHibernationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/edge/src/semantics/websocket-hibernation.ts#L10) <code v-pre>packages/edge/src/semantics/websocket-hibernation.ts</code>

WebSocket hibernation axis — Cloudflare Workers / Vercel Edge model where an idle WebSocket connection is hibernated (freed from memory), then resumed on the next inbound message with restored state. The helper tracks per-connection hibernation status and last-known state so tests can drive hibernate → resume → reconnect flows.

```ts
export type WsHibernationState = 'live' | 'hibernated' | 'resuming' | 'reconnected';
```
