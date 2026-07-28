---
title: "@kiwa-lab/crypto aes の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>aes</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>aesDecrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L35) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export declare function aesDecrypt(input: {
    ciphertext: Buffer;
    iv: Buffer;
    authTag?: Buffer;
}, key: Buffer, mode?: AesMode): Buffer;
```

#### <code v-pre>aesEncrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L19) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export declare function aesEncrypt(plaintext: string | Buffer, key: Buffer, mode?: AesMode): AesEncryptResult;
```

### 型

#### <code v-pre>AesEncryptResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L5) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export interface AesEncryptResult {
    ciphertext: Buffer;
    iv: Buffer;
    authTag?: Buffer;
}
```

#### <code v-pre>AesMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/aes.ts#L3) <code v-pre>packages/crypto/src/aes.ts</code>

```ts
export type AesMode = 'aes-256-cbc' | 'aes-256-gcm' | 'aes-128-cbc' | 'aes-128-gcm';
```
