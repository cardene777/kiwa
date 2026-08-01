---
title: "@kiwa-lab/orm setup-orm-env の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/orm</code> <code v-pre>setup-orm-env</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>setupOrmEnv</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/orm/src/setup-orm-env.ts#L668) <code v-pre>packages/orm/src/setup-orm-env.ts</code>

```ts
export declare function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(opts: MockSqliteOptions<TSchema>): Promise<OrmTestEnvMockT<TSchema>>;
export declare function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(opts: LivePostgresOptions<TSchema>): Promise<OrmTestEnvLiveT<TSchema>>;
export declare function setupOrmEnv<TSchema extends DrizzleSchema = DrizzleSchema>(opts: LiveMysqlOptions<TSchema>): Promise<OrmTestEnvLiveMysqlT<TSchema>>;
export declare function setupOrmEnv<TClient>(opts: MockPrismaSqliteOptions<TClient>): Promise<OrmTestEnvMockPrismaT<TClient>>;
export declare function setupOrmEnv<TClient>(opts: LivePrismaPostgresOptions<TClient>): Promise<import('./types.js').OrmTestEnvLivePrismaPostgres<TClient>>;
export declare function setupOrmEnv<TClient>(opts: LivePrismaMysqlOptions<TClient>): Promise<import('./types.js').OrmTestEnvLivePrismaMysql<TClient>>;
export declare function setupOrmEnv<TDatabase extends KyselyDatabase>(opts: MockKyselySqliteOptions<TDatabase>): Promise<OrmTestEnvMockKyselyT<TDatabase>>;
export declare function setupOrmEnv<TDatabase extends KyselyDatabase>(opts: LiveKyselyPostgresOptions<TDatabase>): Promise<OrmTestEnvLiveKyselyPostgresT<TDatabase>>;
export declare function setupOrmEnv<TDatabase extends KyselyDatabase>(opts: LiveKyselyMysqlOptions<TDatabase>): Promise<OrmTestEnvLiveKyselyMysqlT<TDatabase>>;
```


