---
title: "@kiwa-lab/auth better-auth__providers の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>better-auth&#95;&#95;providers</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>buildBetterAuthProviderRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L41) <code v-pre>packages/auth/src/better-auth/providers.ts</code>

```ts
export declare function buildBetterAuthProviderRegistry(kinds: BetterAuthProviderKind[]): Record<BetterAuthProviderKind, BetterAuthProviderMock>;
```

#### <code v-pre>createBetterAuthGithubProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L32) <code v-pre>packages/auth/src/better-auth/providers.ts</code>

```ts
export declare function createBetterAuthGithubProviderMock(): BetterAuthProviderMock;
```

#### <code v-pre>createBetterAuthGoogleProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/better-auth/providers.ts#L23) <code v-pre>packages/auth/src/better-auth/providers.ts</code>

```ts
export declare function createBetterAuthGoogleProviderMock(): BetterAuthProviderMock;
```


