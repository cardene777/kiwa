---
title: "@kiwa-lab/realtime semantics-http3-push の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-http3-push</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createHttp3PushMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L54) <code v-pre>packages/realtime/src/semantics/http3-push.ts</code>

```ts
export declare function createHttp3PushMock(config?: SemanticsMockConfig): Http3PushMock;
```

### 型

#### <code v-pre>Http3PushMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L47) <code v-pre>packages/realtime/src/semantics/http3-push.ts</code>

```ts
export interface Http3PushMock extends SemanticsMock {
    readonly protocol: 'http3-quic';
    readonly axis: 'http3-push';
    /** server push を promise、 client 側に push_promise event を送出。 */
    pushStream(path: string, priority?: Partial<PushPriority>): Promise<PushPromise>;
}
```

#### <code v-pre>PushPriority</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L30) <code v-pre>packages/realtime/src/semantics/http3-push.ts</code>

HTTP/3 priority signal (RFC 9218 準拠)。

```ts
export interface PushPriority {
    /** 0 (最高) 〜 7 (最低)、 default 3。 */
    urgency: number;
    /** progressive delivery 可否 (default false)。 */
    incremental: boolean;
}
```

#### <code v-pre>PushPromise</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/http3-push.ts#L37) <code v-pre>packages/realtime/src/semantics/http3-push.ts</code>

```ts
export interface PushPromise {
    readonly id: string;
    readonly path: string;
    readonly priority: PushPriority;
    readonly state: 'promised' | 'headers-sent' | 'body-sent' | 'cancelled';
    sendHeaders(headers: Record<string, string>): Promise<void>;
    sendBody(body: string | Uint8Array): Promise<void>;
    cancel(errorCode: number): Promise<void>;
}
```
