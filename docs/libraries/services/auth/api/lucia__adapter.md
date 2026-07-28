---
title: "@kiwa-lab/auth lucia__adapter の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/auth</code> <code v-pre>lucia&#95;&#95;adapter</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createInMemoryLuciaAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/auth/src/lucia/adapter.ts#L21) <code v-pre>packages/auth/src/lucia/adapter.ts</code>

In-memory adapter that mirrors the shape of `@lucia-auth/adapter-sqlite` and `@lucia-auth/adapter-postgresql`. Both expose the same method names, so this single implementation stands in for either at test time — the `kind` tag is the only observable difference.

```ts
export declare function createInMemoryLuciaAdapter(kind?: LuciaDatabaseKind): LuciaDatabaseAdapter;
```


