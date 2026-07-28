---
title: "@kiwa-lab/realtime semantics__moq-datagram-media の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/realtime</code> <code v-pre>semantics&#95;&#95;moq-datagram-media</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createMoqDatagramMediaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts#L32) <code v-pre>packages/realtime/src/semantics/moq-datagram-media.ts</code>

```ts
export declare function createMoqDatagramMediaMock(config?: SemanticsMockConfig): MoqDatagramMediaMock;
```

### 型

#### <code v-pre>MoqDatagram</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts#L16) <code v-pre>packages/realtime/src/semantics/moq-datagram-media.ts</code>

MoQ datagram media axis — partial reliability + priority + FEC recovery. MOQT の datagram delivery mode は QUIC datagram frame を使い、 packet drop を許容する pattern。 Forward Error Correction (FEC) で失われた datagram を再構成する path も含む。

```ts
export interface MoqDatagram {
    trackName: string;
    sequenceNumber: number;
    payloadBytes: number;
    priority: number;
}
```

#### <code v-pre>MoqDatagramMediaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/realtime/src/semantics/moq-datagram-media.ts#L23) <code v-pre>packages/realtime/src/semantics/moq-datagram-media.ts</code>

```ts
export interface MoqDatagramMediaMock extends SemanticsMock {
    readonly protocol: 'moqt';
    readonly axis: 'moq-datagram-media';
    sendDatagram(input: MoqDatagram): Promise<void>;
    dropDatagram(input: {
        trackName: string;
        sequenceNumber: number;
    }): Promise<void>;
    setPriority(input: {
        trackName: string;
        priority: number;
    }): Promise<void>;
    recoverFec(input: {
        trackName: string;
        recoveredCount: number;
    }): Promise<void>;
}
```
