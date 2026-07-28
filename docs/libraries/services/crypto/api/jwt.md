---
title: "@kiwa-lab/crypto jwt の API 契約"
---

# <code v-pre>@kiwa-lab/crypto</code> <code v-pre>jwt</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>signJWT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L37) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export declare function signJWT(payload: JWTPayload, secret: string | KeyLike, algorithm?: JWTAlgorithm): string;
```

#### <code v-pre>verifyJWT</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L58) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export declare function verifyJWT(token: string, secret: string | KeyLike, algorithm?: JWTAlgorithm): JWTVerifyResult;
```

### 型

#### <code v-pre>JWTAlgorithm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L3) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export type JWTAlgorithm = 'HS256' | 'HS384' | 'HS512' | 'RS256' | 'RS384' | 'RS512' | 'ES256';
```

#### <code v-pre>JWTPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L5) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export type JWTPayload = Record<string, unknown>;
```

#### <code v-pre>JWTVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/crypto/src/jwt.ts#L7) <code v-pre>packages/crypto/src/jwt.ts</code>

```ts
export interface JWTVerifyResult {
    valid: boolean;
    payload?: JWTPayload;
    algorithm: JWTAlgorithm;
    reason?: string;
}
```
