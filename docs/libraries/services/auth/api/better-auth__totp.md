---
title: "@kiwa-lab/auth better-auth__totp の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>better-auth&#95;&#95;totp</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>generateTotpCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts#L22) <code v-pre>packages/auth/src/better-auth/totp.ts</code>

```ts
export declare function generateTotpCode(secret: string, nowMs?: number): string;
```

#### <code v-pre>generateTotpSecret</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts#L16) <code v-pre>packages/auth/src/better-auth/totp.ts</code>

```ts
export declare function generateTotpSecret(): string;
```

#### <code v-pre>verifyTotpCode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/totp.ts#L39) <code v-pre>packages/auth/src/better-auth/totp.ts</code>

```ts
export declare function verifyTotpCode(secret: string, code: string, nowMs?: number): boolean;
```


