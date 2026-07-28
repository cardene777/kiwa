---
title: "@kiwa-lab/auth providers の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>providers</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildProviderRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L59) <code v-pre>packages/auth/src/providers.ts</code>

```ts
export declare function buildProviderRegistry(kinds: ProviderKind[]): Record<ProviderKind, ProviderMock>;
```

#### <code v-pre>createEmailProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L45) <code v-pre>packages/auth/src/providers.ts</code>

```ts
export declare function createEmailProviderMock(): ProviderMock;
```

#### <code v-pre>createGithubProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L36) <code v-pre>packages/auth/src/providers.ts</code>

```ts
export declare function createGithubProviderMock(): ProviderMock;
```

#### <code v-pre>createGoogleProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/providers.ts#L27) <code v-pre>packages/auth/src/providers.ts</code>

```ts
export declare function createGoogleProviderMock(): ProviderMock;
```


