---
title: "@kiwa-lab/ruby active-record の API 契約"
---

# <code v-pre>@kiwa-lab/ruby</code> <code v-pre>active-record</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>captureActiveRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L23) <code v-pre>packages/ruby/src/active-record.ts</code>

activeRecordLog の集計 snapshot。 op 別 / model 別 count を assertion で使える shape で 露出、 「Post.where 3 回 + User.find 1 回」 等の invariant を書ける。

```ts
export declare function captureActiveRecord(env: RubyAppEnv): ActiveRecordSnapshot;
```

### 型

#### <code v-pre>ActiveRecordOp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L3) <code v-pre>packages/ruby/src/active-record.ts</code>

```ts
export type ActiveRecordOp = 'find' | 'where' | 'create' | 'update' | 'destroy' | 'all';
```

#### <code v-pre>ActiveRecordQuery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L5) <code v-pre>packages/ruby/src/active-record.ts</code>

```ts
export interface ActiveRecordQuery {
    op: ActiveRecordOp;
    model: string;
    args: unknown;
    sql?: string;
}
```

#### <code v-pre>ActiveRecordSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/ruby/src/active-record.ts#L12) <code v-pre>packages/ruby/src/active-record.ts</code>

```ts
export interface ActiveRecordSnapshot {
    total: number;
    byOp: Record<ActiveRecordOp, number>;
    byModel: Record<string, number>;
    queries: ActiveRecordQuery[];
}
```
