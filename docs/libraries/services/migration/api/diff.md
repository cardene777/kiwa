---
title: "@kiwa-lab/migration diff の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/migration</code> <code v-pre>diff</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>diffSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L36) <code v-pre>packages/migration/src/diff.ts</code>

prev / next schema の diff を計算。 実 provider (Prisma introspect / Drizzle schema push / Kysely migration generate) が返す diff の抽象 shape。

```ts
export declare function diffSchema(prev: Schema, next: Schema): SchemaDiff;
```

### 型

#### <code v-pre>ColumnDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L18) <code v-pre>packages/migration/src/diff.ts</code>

```ts
export interface ColumnDiff {
    table: string;
    column: string;
    change: 'added' | 'removed' | 'type_changed' | 'nullable_changed';
    before?: SchemaColumn;
    after?: SchemaColumn;
}
```

#### <code v-pre>Schema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L14) <code v-pre>packages/migration/src/diff.ts</code>

```ts
export interface Schema {
    tables: SchemaTable[];
}
```

#### <code v-pre>SchemaColumn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L1) <code v-pre>packages/migration/src/diff.ts</code>

```ts
export interface SchemaColumn {
    name: string;
    type: string;
    nullable: boolean;
    primary?: boolean;
    unique?: boolean;
}
```

#### <code v-pre>SchemaDiff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L26) <code v-pre>packages/migration/src/diff.ts</code>

```ts
export interface SchemaDiff {
    addedTables: string[];
    removedTables: string[];
    columnDiffs: ColumnDiff[];
}
```

#### <code v-pre>SchemaTable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/diff.ts#L9) <code v-pre>packages/migration/src/diff.ts</code>

```ts
export interface SchemaTable {
    name: string;
    columns: SchemaColumn[];
}
```
