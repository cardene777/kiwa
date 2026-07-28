---
title: "@kiwa-lab/auth adapter の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>adapter</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/adapter.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createInMemoryAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/adapter.ts#L21) <code v-pre>packages/auth/src/adapter.ts</code>

In-memory database adapter compatible with the Auth.js adapter contract. `@auth/prisma-adapter` and `@auth/drizzle-adapter` both expose the same method names, so this mock is a drop-in for either surface during tests.

```ts
export declare function createInMemoryAdapter(): AuthDatabaseAdapter;
```


