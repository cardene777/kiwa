# @kiwa-lab/migration リファレンス

migration の履歴、schema 差分、実行計画を扱う公開 API です。すべてプロセス内で完結し、実 DB への接続や SQL 実行は行いません。

## client と migration

`createMigrationClient` は `prisma`、`drizzle`、`kysely`、`knex` のいずれかを provider として持つ client を作ります。provider の既定値は `prisma` です。

```ts
const client = createMigrationClient({
  provider: "knex",
  now: () => 1_700_000_000_000,
  seedApplied: [],
});
```

`Migration` は `id`、`name`、`up`、`down` の四つを必須とします。`now` は result と履歴の時刻を固定したい test で使えます。`seedApplied` は既存履歴を持つ状態からの検証用です。

## 適用と取り消し

| API | 入力 | 結果 |
| --- | --- | --- |
| `runUp` | client と `Migration` | `applied` の `MigrationResult`。同じ id がすでに applied なら同じ status と `already applied` の reason を返す |
| `runDown` | client と migration id | 対象を `rolled_back` に更新。対象がなければ `failed` と `not applied` を返す |
| `applyPendingMigrations` | client と `Migration[]` | id 昇順で適用し、`applied`、`skipped`、`failed` を返す |

`applyPendingMigrations` は failed が返った後の migration を `skipped` に入れます。途中で自動 rollback はしません。

## 履歴

`listAppliedMigrations` は配列ではなく `MigrationHistory` を返します。`total` は取り消し済みと失敗も含む record 数です。`latestApplied` は applied の挿入順で最後の record であり、時刻が同じでも安定します。

```ts
const history = listAppliedMigrations(client);
expect(history).toMatchObject({ provider: "knex", total: 2 });
expect(history.applied).toHaveLength(1);
expect(history.rolledBack).toHaveLength(1);
```

## schema 差分

`diffSchema(previous, next)` は `addedTables`、`removedTables`、`columnDiffs` を返します。列では `added`、`removed`、`type_changed`、`nullable_changed` のみを検出します。primary と unique の変更は検出対象外です。

## 実行計画と依存関係

`planDryRun(migrations, direction)` は `up` または `down` の SQL とリスク推定を返します。direction の既定値は `up` です。

`resolveDependencyOrder` は `dependsOn` を持つ migration を依存先から先に並べます。存在しない依存先と循環依存では例外を送出するため、その入力は test で明示的に検証してください。

`createLockRegistry` は scope と owner による advisory lock を扱います。同じ scope の有効な lock は `null` を返し、所有者が違う `release` は `false` を返します。期限切れの lock は次の `acquire` で置き換えられます。

## 状態をリセットする

`client.clear()` は client の履歴を空にします。外部接続は作られないため、通常は test ごとに client を作るだけで十分です。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>cyclic dependency detected at $&#123;id&#125;</code> | [packages/migration/src/dryrun.ts](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L47) |
| <code v-pre>unknown migration referenced: $&#123;id&#125;</code> | [packages/migration/src/dryrun.ts](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/dryrun.ts#L49) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/migration/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 6 |
| [diff.ts](./api/diff) | 1 | 5 |
| [dryrun.ts](./api/dryrun) | 2 | 2 |
| [history.ts](./api/history) | 1 | 1 |
| [lock.ts](./api/lock) | 1 | 1 |
| [up-down.ts](./api/up-down) | 3 | 1 |

<!-- kiwa-public-api:end -->
