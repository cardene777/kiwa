---
title: "@kiwa-lab/crypto kdf の API 契約"
---

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>kdf</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>deriveKey</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L28) <code v-pre>packages/crypto/src/kdf.ts</code>

password → derived key の KDF ラッパー。 PBKDF2 と scrypt は node:crypto、 Argon2 は node:crypto 未対応のため scrypt を argon2-mock として代替 (bytes 契約は同一)。

```ts
export declare function deriveKey(password: string, opts?: KdfOptions): KdfResult;
```

#### <code v-pre>verifyPassword</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L49) <code v-pre>packages/crypto/src/kdf.ts</code>

password + 既存 salt/params で KDF を再実行、 hashHex 一致で verification 成功。

```ts
export declare function verifyPassword(password: string, stored: KdfResult): boolean;
```

### 型

#### <code v-pre>KdfAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L3) <code v-pre>packages/crypto/src/kdf.ts</code>

```ts
export type KdfAlgorithm = 'pbkdf2' | 'scrypt' | 'argon2-mock';
```

#### <code v-pre>KdfOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L5) <code v-pre>packages/crypto/src/kdf.ts</code>

```ts
export interface KdfOptions {
    algorithm?: KdfAlgorithm;
    saltBytes?: number;
    iterations?: number;
    keyLength?: number;
    digest?: 'sha256' | 'sha512';
    N?: number;
    r?: number;
    p?: number;
}
```

#### <code v-pre>KdfResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/kdf.ts#L16) <code v-pre>packages/crypto/src/kdf.ts</code>

```ts
export interface KdfResult {
    algorithm: KdfAlgorithm;
    hashHex: string;
    saltHex: string;
    iterations: number;
    keyLength: number;
}
```
