---
title: "@kiwa-lab/desktop adapters__mock-factory の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>adapters&#95;&#95;mock-factory</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>makeMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L247) <code v-pre>packages/desktop/src/adapters/mock-factory.ts</code>

```ts
export declare function makeMockAdapter(axis: DesktopAxis): DesktopAdapter;
```

#### <code v-pre>makeRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L256) <code v-pre>packages/desktop/src/adapters/mock-factory.ts</code>

```ts
export declare function makeRealAdapter(axis: DesktopAxis): DesktopAdapter;
```

#### <code v-pre>MOCK&#95;ADAPTERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L282) <code v-pre>packages/desktop/src/adapters/mock-factory.ts</code>

```ts
export declare const MOCK_ADAPTERS: Record<DesktopAxis, DesktopAdapter>;
```

#### <code v-pre>REAL&#95;ADAPTERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/adapters/mock-factory.ts#L290) <code v-pre>packages/desktop/src/adapters/mock-factory.ts</code>

```ts
export declare const REAL_ADAPTERS: Record<DesktopAxis, DesktopAdapter>;
```


