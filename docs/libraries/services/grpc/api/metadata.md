---
title: "@kiwa-lab/grpc metadata の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/grpc</code> <code v-pre>metadata</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createMetadata</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts#L6) <code v-pre>packages/grpc/src/metadata.ts</code>

```ts
export declare function createMetadata(entries?: Record<string, string>): MetadataEntry[];
```

#### <code v-pre>mergeMetadata</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts#L10) <code v-pre>packages/grpc/src/metadata.ts</code>

```ts
export declare function mergeMetadata(a: MetadataEntry[], b: MetadataEntry[]): MetadataEntry[];
```

### 型

#### <code v-pre>MetadataEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/grpc/src/metadata.ts#L1) <code v-pre>packages/grpc/src/metadata.ts</code>

```ts
export interface MetadataEntry {
    key: string;
    value: string;
}
```
