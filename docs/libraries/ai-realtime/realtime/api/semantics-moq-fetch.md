---
title: "@kiwa-lab/realtime semantics-moq-fetch の API 契約"
---

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics-moq-fetch</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createMoqFetchMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L39) <code v-pre>packages/realtime/src/semantics/moq-fetch.ts</code>

```ts
export declare function createMoqFetchMock(config?: SemanticsMockConfig): MoqFetchMock;
```

### 型

#### <code v-pre>MoqAnnouncement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L17) <code v-pre>packages/realtime/src/semantics/moq-fetch.ts</code>

Media over QUIC / MOQT axis — track announce + subscribe + object delivery. MOQT (draft-ietf-moq-transport) は QUIC 上の pub/sub media transport で、 publisher が track を announce → subscriber が subscribe → object を 送受信する pattern。 本 mock は 4 event (announce / subscribe / object-sent / object-received) を deterministic seed で emit。

```ts
export interface MoqAnnouncement {
    trackName: string;
    namespace: string;
    authInfo: string;
}
```

#### <code v-pre>MoqFetchMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L30) <code v-pre>packages/realtime/src/semantics/moq-fetch.ts</code>

```ts
export interface MoqFetchMock extends SemanticsMock {
    readonly protocol: 'moqt';
    readonly axis: 'moq-fetch';
    announceTrack(input: MoqAnnouncement): Promise<void>;
    subscribeTrack(input: {
        trackName: string;
        namespace: string;
    }): Promise<void>;
    sendObject(input: MoqObject): Promise<void>;
    receiveObject(input: MoqObject): Promise<void>;
}
```

#### <code v-pre>MoqObject</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-fetch.ts#L23) <code v-pre>packages/realtime/src/semantics/moq-fetch.ts</code>

```ts
export interface MoqObject {
    trackName: string;
    groupId: number;
    objectId: number;
    payloadBytes: number;
}
```
