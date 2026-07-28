---
title: "@kiwa-lab/realtime pusher の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>pusher</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createPusherMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L61) <code v-pre>packages/realtime/src/pusher.ts</code>

```ts
export declare function createPusherMock(config?: RealtimeMockConfig & {
    userId?: string;
}): PusherMock;
```

### 型

#### <code v-pre>PusherChannel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L44) <code v-pre>packages/realtime/src/pusher.ts</code>

```ts
export interface PusherChannel {
    readonly name: string;
    bind(event: string, handler: (data: unknown, metadata?: unknown) => void): PusherChannel;
    unbind(event?: string): PusherChannel;
    trigger(event: string, data: unknown): boolean;
    members?: PusherMembers;
}
```

#### <code v-pre>PusherMember</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L32) <code v-pre>packages/realtime/src/pusher.ts</code>

Pusher mock。 SDK 呼出形式 (real `pusher-js`) は以下 ... ```ts const pusher = new Pusher(APP_KEY, { cluster: 'us2' }); const channel = pusher.subscribeChannel('my-channel'); channel.bind('my-event', (data) =&gt; {...}); const presence = pusher.subscribeChannel('presence-my-channel'); presence.bind('pusher:subscription_succeeded', (members) =&gt; {...}); presence.bind('pusher:member_added', (member) =&gt; {...}); presence.bind('pusher:member_removed', (member) =&gt; {...}); ``` 本 mock は上記 shape を提供、 real Pusher の `subscribe` メソッドは mock 側で `subscribeChannel` に rename している (base `RealtimeMock` の async `subscribe` と衝突するため)。 presence channel は `presence-` 接頭辞で判定、 通常 channel との内部処理は共通 (engine 側)。

```ts
export interface PusherMember {
    id: string;
    info: Record<string, unknown>;
}
```

#### <code v-pre>PusherMembers</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L37) <code v-pre>packages/realtime/src/pusher.ts</code>

```ts
export interface PusherMembers {
    count: number;
    each(callback: (member: PusherMember) => void): void;
    get(id: string): PusherMember | null;
    me: PusherMember | null;
}
```

#### <code v-pre>PusherMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/pusher.ts#L52) <code v-pre>packages/realtime/src/pusher.ts</code>

```ts
export interface PusherMock extends RealtimeMock {
    readonly provider: 'pusher';
    /** Pusher 固有 — channel 購読 (real `pusher.subscribe` 相当、 sync 返却)。 */
    subscribeChannel(channelName: string): PusherChannel;
    unsubscribeChannel(channelName: string): void;
    /** Pusher 固有 — user auth 識別子。 */
    config: {
        userId: string;
    };
}
```
