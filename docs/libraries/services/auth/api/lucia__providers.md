---
title: "@kiwa-lab/auth lucia__providers の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>lucia&#95;&#95;providers</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>buildLuciaProviderRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L41) <code v-pre>packages/auth/src/lucia/providers.ts</code>

```ts
export declare function buildLuciaProviderRegistry(kinds: LuciaProviderKind[]): Record<LuciaProviderKind, LuciaProviderMock>;
```

#### <code v-pre>createLuciaGithubProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L32) <code v-pre>packages/auth/src/lucia/providers.ts</code>

```ts
export declare function createLuciaGithubProviderMock(): LuciaProviderMock;
```

#### <code v-pre>createLuciaGoogleProviderMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/providers.ts#L23) <code v-pre>packages/auth/src/lucia/providers.ts</code>

```ts
export declare function createLuciaGoogleProviderMock(): LuciaProviderMock;
```


