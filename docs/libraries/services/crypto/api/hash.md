---
title: "@kiwa-lab/crypto hash の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>hash</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>hashData</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L7) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export declare function hashData(data: string | Buffer, algorithm?: HashAlgorithm, encoding?: 'hex' | 'base64' | 'binary'): string;
```

#### <code v-pre>hmacDigest</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L17) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export declare function hmacDigest(data: string | Buffer, secret: string | Buffer, algorithm?: HmacAlgorithm, encoding?: 'hex' | 'base64' | 'binary'): string;
```

### 型

#### <code v-pre>HashAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L3) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export type HashAlgorithm = 'sha256' | 'sha384' | 'sha512' | 'blake2b512' | 'blake2s256' | 'sha1' | 'md5';
```

#### <code v-pre>HmacAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/hash.ts#L5) <code v-pre>packages/crypto/src/hash.ts</code>

```ts
export type HmacAlgorithm = HashAlgorithm;
```
