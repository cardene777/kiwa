# @kiwa-lab/migration 使い方

この package は database migration を実行するものではありません。migration の並び、適用済み履歴、rollback の対象、変更 SQL の危険度という「migration を投入する前に自分の application で確認したい契約」を、外部 database なしで test します。`runDown` が受け取るのは migration object ではなく id です。

以下を `tests/users.migration.test.ts` として保存してください。乱れた入力を id 順に適用すること、rollback で正しい履歴が残ること、実行前の dry run で破壊的な変更を止められることを一つの test file で確認できます。

```ts
import { describe, expect, it } from "vitest";
import {
  applyPendingMigrations,
  createMigrationClient,
  diffSchema,
  listAppliedMigrations,
  planDryRun,
  runDown,
} from "@kiwa-lab/migration";

describe("users migration", () => {
  it("applies migrations in order and records a rollback", () => {
    const client = createMigrationClient({ provider: "kysely" });
    const result = applyPendingMigrations(client, [
      {
        id: "020",
        name: "add email",
        up: "ALTER TABLE users ADD email TEXT",
        down: "ALTER TABLE users DROP email",
      },
      {
        id: "010",
        name: "create users",
        up: "CREATE TABLE users (id INT)",
        down: "DROP TABLE users",
      },
    ]);

    expect(result.applied.map((item) => item.id)).toEqual(["010", "020"]);
    expect(result.failed).toEqual([]);
    expect(listAppliedMigrations(client).latestApplied?.id).toBe("020");

    const rollback = runDown(client, "020");
    const history = listAppliedMigrations(client);

    expect(rollback.status).toBe("rolled_back");
    expect(history.applied.map((record) => record.id)).toEqual(["010"]);
    expect(history.rolledBack.map((record) => record.id)).toEqual(["020"]);
  });

  it("reviews the schema change and blocks destructive SQL before apply", () => {
    const schema = diffSchema(
      {
        tables: [
          { name: "users", columns: [{ name: "id", type: "INT", nullable: false }] },
        ],
      },
      {
        tables: [
          {
            name: "users",
            columns: [
              { name: "id", type: "BIGINT", nullable: false },
              { name: "email", type: "TEXT", nullable: true },
            ],
          },
        ],
      },
    );
    const plan = planDryRun([
      {
        id: "030",
        name: "remove logs",
        up: "DROP TABLE logs",
        down: "CREATE TABLE logs (id INT)",
      },
    ]);

    expect(schema.columnDiffs).toEqual([
      expect.objectContaining({ column: "id", change: "type_changed" }),
      expect.objectContaining({ column: "email", change: "added" }),
    ]);
    expect(plan.destructiveCount).toBe(1);
    expect(plan.operations[0]).toMatchObject({ id: "030", estimated: "destructive" });
  });
});
```

次の command は、作成した file だけを実行します。package 全体の suite を実行する command ではないため、失敗した assertion がこの手順のどこに対応するかをすぐに追えます。

```bash
pnpm exec vitest run tests/users.migration.test.ts
```

最初の test が失敗するなら、id の形式、同じ id の二重適用、`runDown` に渡した id を確認してください。未適用の id は例外を投げず `{ status: "failed", reason: "not applied" }` を返します。二つ目が失敗するなら、`diffSchema` は table と column の追加、削除、型、null 許可だけを比較することを確認してください。主キーや unique の変更は比較対象ではありません。

## 実運用へつなぐ

この test が保証するのは in-process の履歴と判定です。実 database の SQL 構文、transaction、lock、provider 固有の migration metadata、production data への影響は保証しません。dry run で `destructiveCount` がゼロでないときは apply を中断し、Prisma、Drizzle、Kysely、Knex の実 integration environment で SQL を検証してからリリースしてください。

同じ client を複数 case で使う必要があるときだけ `client.clear()` で履歴を消します。通常は test ごとに `createMigrationClient` を呼び、状態を分離します。
