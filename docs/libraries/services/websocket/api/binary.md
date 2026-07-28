---
title: "@kiwa-lab/websocket binary の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/websocket</code> <code v-pre>binary</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureBinaryFrame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L24) <code v-pre>packages/websocket/src/binary.ts</code>

RFC 6455 binary frame parse mock。 real ws.parser の subset (fin + opcode + mask + payload)。 mask key + extended payload length は簡易対応。

```ts
export declare function captureBinaryFrame(frame: Uint8Array): WSBinaryFrame;
```

#### <code v-pre>encodeBinaryFrame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L63) <code v-pre>packages/websocket/src/binary.ts</code>

text / binary payload を simple frame にエンコード (unmasked、 server → client 経路想定)。

```ts
export declare function encodeBinaryFrame(opcode: WSOpcode, payload: Uint8Array): Uint8Array;
```

### 型

#### <code v-pre>WSBinaryFrame</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L3) <code v-pre>packages/websocket/src/binary.ts</code>

```ts
export interface WSBinaryFrame {
    opcode: WSOpcode;
    fin: boolean;
    masked: boolean;
    payloadLength: number;
    payload: Uint8Array;
}
```

#### <code v-pre>WSOpcode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/websocket/src/binary.ts#L1) <code v-pre>packages/websocket/src/binary.ts</code>

```ts
export type WSOpcode = 'continuation' | 'text' | 'binary' | 'close' | 'ping' | 'pong' | 'reserved';
```
