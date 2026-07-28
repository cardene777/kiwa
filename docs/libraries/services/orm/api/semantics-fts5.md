---
title: "@kiwa-lab/orm semantics-fts5 の API 契約"
---

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>semantics-fts5</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createFts5Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L42) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function createFts5Session(input: {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
}): Fts5Session;
```

#### <code v-pre>createFts5VirtualTable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L60) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function createFts5VirtualTable(session: Fts5Session, input: {
    columns: string[];
    tokenizer: Fts5Tokenizer;
}): AxisStep<Fts5State>;
```

#### <code v-pre>inspectFts5Vocab</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L141) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function inspectFts5Vocab(session: Fts5Session, input: {
    term: string;
    occurrences: number;
}): AxisStep<Fts5State>;
```

#### <code v-pre>matchFts5Query</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L113) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function matchFts5Query(session: Fts5Session, input: {
    query: string;
    rank: number;
}): AxisStep<Fts5State>;
```

#### <code v-pre>tokenizeFts5Document</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L87) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export declare function tokenizeFts5Document(session: Fts5Session, input: {
    document: string;
}): AxisStep<Fts5State>;
```

### 型

#### <code v-pre>Fts5Session</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L25) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export interface Fts5Session {
    tableName: string;
    provider: OrmProvider;
    backend: OrmBackend;
    state: Fts5State;
    columns: string[];
    tokenizer: Fts5Tokenizer | null;
    tokenCount: number;
    lastRank: number;
    history: AxisStep<Fts5State>[];
}
```

#### <code v-pre>Fts5State</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L16) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

FTS5 — SQLite virtual-table creation, tokenizer configuration, MATCH ranking, and vocab-table inspection. SQLite maps to FTS5 / fts5vocab; Postgres approximates with tsvector / tsquery; MySQL approximates with FULLTEXT / MATCH AGAINST. State transitions: created → 'empty' createFts5VirtualTable → 'virtual-table-created' tokenizeFts5Document → 'tokenized' matchFts5Query → 'matched' inspectFts5Vocab → 'vocab-inspected'

```ts
export type Fts5State = 'empty' | 'virtual-table-created' | 'tokenized' | 'matched' | 'vocab-inspected';
```

#### <code v-pre>Fts5Tokenizer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/semantics/fts5.ts#L23) <code v-pre>packages/orm/src/semantics/fts5.ts</code>

```ts
export type Fts5Tokenizer = 'unicode61' | 'porter' | 'trigram';
```
