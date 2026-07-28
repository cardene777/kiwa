---
title: "@kiwa-lab/crypto rsa の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>rsa</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>generateRsaKeyPair</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L47) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function generateRsaKeyPair(modulusLength?: number): {
    publicKey: string;
    privateKey: string;
};
```

#### <code v-pre>rsaDecrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L43) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaDecrypt(cipher: Buffer, privateKey: KeyLike): Buffer;
```

#### <code v-pre>rsaEncrypt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L38) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaEncrypt(data: string | Buffer, publicKey: KeyLike): Buffer;
```

#### <code v-pre>rsaSign</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L15) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaSign(data: string | Buffer, privateKey: KeyLike, algorithm?: string): Buffer;
```

#### <code v-pre>rsaVerify</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L21) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export declare function rsaVerify(data: string | Buffer, signature: Buffer, publicKey: KeyLike, algorithm?: string): RsaVerifyResult;
```

### 型

#### <code v-pre>RsaVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/rsa.ts#L10) <code v-pre>packages/crypto/src/rsa.ts</code>

```ts
export interface RsaVerifyResult {
    valid: boolean;
    reason?: string;
}
```
