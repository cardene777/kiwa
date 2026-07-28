---
title: "@kiwa-lab/mobile adapters-mock-factory の API 契約"
---

# <code v-pre>@kiwa-lab/mobile</code> <code v-pre>adapters-mock-factory</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>makeMockAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L215) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare function makeMockAdapter(axis: MobileAxis): MobileAdapter;
```

#### <code v-pre>makeRealAdapter</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L225) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare function makeRealAdapter(axis: MobileAxis): MobileAdapter;
```

#### <code v-pre>MOCK&#95;ADAPTERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L236) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare const MOCK_ADAPTERS: Record<MobileAxis, MobileAdapter>;
```

#### <code v-pre>REAL&#95;ADAPTERS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/mobile/src/adapters/mock-factory.ts#L250) <code v-pre>packages/mobile/src/adapters/mock-factory.ts</code>

```ts
export declare const REAL_ADAPTERS: Record<MobileAxis, MobileAdapter>;
```


