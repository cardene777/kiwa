---
title: "@kiwa-lab/crypto keypair の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>keypair</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>generateKeyPair</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L11) <code v-pre>packages/crypto/src/keypair.ts</code>

```ts
export declare function generateKeyPair(type?: KeyPairType, options?: {
    modulusLength?: number;
    namedCurve?: string;
}): KeyPairResult;
```

### 型

#### <code v-pre>KeyPairResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L5) <code v-pre>packages/crypto/src/keypair.ts</code>

```ts
export interface KeyPairResult {
    publicKey: string;
    privateKey: string;
    type: KeyPairType;
}
```

#### <code v-pre>KeyPairType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/keypair.ts#L3) <code v-pre>packages/crypto/src/keypair.ts</code>

```ts
export type KeyPairType = 'rsa' | 'ec' | 'ed25519';
```
