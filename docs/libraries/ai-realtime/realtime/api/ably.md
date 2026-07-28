---
title: "@kiwa-lab/realtime ably の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>ably</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createAblyMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L81) <code v-pre>packages/realtime/src/ably.ts</code>

```ts
export declare function createAblyMock(config?: RealtimeMockConfig & {
    clientId?: string;
}): AblyMock;
```

### 型

#### <code v-pre>AblyChannel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L42) <code v-pre>packages/realtime/src/ably.ts</code>

```ts
export interface AblyChannel {
    readonly name: string;
    attach(): Promise<void>;
    detach(): Promise<void>;
    subscribe(event: string, handler: (msg: AblyMessage) => void): Promise<void>;
    subscribe(handler: (msg: AblyMessage) => void): Promise<void>;
    unsubscribe(): void;
    publish(event: string, data: unknown): Promise<void>;
    history(options?: {
        limit?: number;
    }): Promise<{
        items: AblyMessage[];
    }>;
    presence: AblyPresence;
}
```

#### <code v-pre>AblyChannels</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L64) <code v-pre>packages/realtime/src/ably.ts</code>

```ts
export interface AblyChannels {
    get(name: string): AblyChannel;
    release(name: string): void;
}
```

#### <code v-pre>AblyMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L27) <code v-pre>packages/realtime/src/ably.ts</code>

Ably mock。 SDK 呼出形式 (real `ably`) は以下 ... ```ts const client = new Ably.Realtime(...); const channel = client.channels.get('room-1'); channel.subscribe('chat', (msg) =&gt; {...}); await channel.presence.subscribe('enter', (msg) =&gt; {...}); await channel.presence.enter({ name: 'user' }); const messages = await channel.history({ untilAttach: true }); ``` 本 mock は上記 shape の薄い wrapper。 history rewind (`untilAttach`) は 直近 broadcast event を N 件保持して返却する簡易実装。

```ts
export interface AblyMessage<T = unknown> {
    name: string;
    data: T;
    id: string;
    timestamp: number;
    clientId?: string;
}
```

#### <code v-pre>AblyMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L69) <code v-pre>packages/realtime/src/ably.ts</code>

```ts
export interface AblyMock extends RealtimeMock {
    readonly provider: 'ably';
    channels: AblyChannels;
    connection: {
        state: string;
        on(state: string, handler: () => void): void;
        close(): Promise<void>;
    };
    /** clientId (Ably 固有、 presence の identify 用)。 */
    auth: {
        clientId: string;
    };
}
```

#### <code v-pre>AblyPresence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L54) <code v-pre>packages/realtime/src/ably.ts</code>

```ts
export interface AblyPresence {
    subscribe(action: 'enter' | 'leave' | 'update', handler: (msg: AblyPresenceMessage) => void): Promise<void>;
    enter(data?: Record<string, unknown>): Promise<void>;
    leave(): Promise<void>;
    get(): Promise<AblyPresenceMessage[]>;
}
```

#### <code v-pre>AblyPresenceMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/ably.ts#L35) <code v-pre>packages/realtime/src/ably.ts</code>

```ts
export interface AblyPresenceMessage {
    action: 'enter' | 'leave' | 'update' | 'present';
    clientId: string;
    data: Record<string, unknown>;
    timestamp: number;
}
```
