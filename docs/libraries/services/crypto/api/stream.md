---
title: "@kiwa-lab/crypto stream の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>stream</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>streamDecrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L29) <code v-pre>packages/crypto/src/stream.ts</code>

```ts
export declare function streamDecrypt(result: StreamEncryptResult, key: Buffer): string;
```

#### <code v-pre>streamEncrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L16) <code v-pre>packages/crypto/src/stream.ts</code>

stream cipher (AES-CTR / ChaCha20-Poly1305) で byte 流を encrypt。 real TLS record layer / Signal Protocol の対称暗号 stream mode 相当。

```ts
export declare function streamEncrypt(plaintext: string, key: Buffer, algorithm?: StreamCipherAlgorithm): StreamEncryptResult;
```

### 型

#### <code v-pre>StreamCipherAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L3) <code v-pre>packages/crypto/src/stream.ts</code>

```ts
export type StreamCipherAlgorithm = 'aes-256-ctr' | 'chacha20-poly1305';
```

#### <code v-pre>StreamEncryptResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/stream.ts#L5) <code v-pre>packages/crypto/src/stream.ts</code>

```ts
export interface StreamEncryptResult {
    ciphertext: string;
    iv: string;
    authTag?: string;
    algorithm: StreamCipherAlgorithm;
}
```
