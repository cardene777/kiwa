---
title: "@kiwa-lab/auth oauth21-refresh-rotation の API 契約"
---

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>oauth21-refresh-rotation</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>&#95;&#95;resetTokenCounters</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L11) <code v-pre>packages/auth/src/oauth21/refresh-rotation.ts</code>

```ts
export declare function __resetTokenCounters(): void;
```

#### <code v-pre>mintAccessToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L30) <code v-pre>packages/auth/src/oauth21/refresh-rotation.ts</code>

Mint a fresh access token. Access tokens carry state (`clientId`, `subject`, `scope`, expiration) so the introspection endpoint can echo them without a separate lookup. Real deployments encode this as a signed JWT; the mock hands the state back to the caller who stores it in the AS registry.

```ts
export declare function mintAccessToken(params: {
    clientId: string;
    subject: string;
    scope: string;
    lifetimeSec: number;
    now: () => number;
    dpopJkt?: string;
    resource?: string;
}): AccessToken;
```

#### <code v-pre>mintRefreshToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L59) <code v-pre>packages/auth/src/oauth21/refresh-rotation.ts</code>

Mint a fresh refresh token. Refresh tokens are opaque strings the AS binds to a client + subject + scope. The mock keeps them separate from access tokens so the rotation registry is easy to inspect.

```ts
export declare function mintRefreshToken(params: {
    clientId: string;
    subject: string;
    scope: string;
    lifetimeSec: number;
    now: () => number;
    rotationCount?: number;
    dpopJkt?: string;
    resource?: string;
}): RefreshToken;
```

#### <code v-pre>rotateRefreshToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/oauth21/refresh-rotation.ts#L94) <code v-pre>packages/auth/src/oauth21/refresh-rotation.ts</code>

Rotate a refresh token — invalidate the previous token and mint a fresh one that inherits the client + subject + scope. RFC 9700 §2.2 mandates this on every `/token` refresh call to defeat replay of an exfiltrated refresh token. Returns the newly-minted refresh token; the caller replaces the old token in the AS registry with the returned value.

```ts
export declare function rotateRefreshToken(previous: RefreshToken, lifetimeSec: number, now: () => number, overrides?: {
    scope?: string;
    dpopJkt?: string;
    resource?: string;
}): RefreshToken;
```


