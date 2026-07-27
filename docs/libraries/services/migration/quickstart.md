# @kiwa-lab/migration をはじめる

この手順では、一つの migration を適用し、id を指定して取り消し、未適用 id の失敗も同じ test file で確認します。この library は実 database へ SQL を送らず、メモリ内の migration history と投入前の判断を扱います。

## インストール

```bash
pnpm add -D @kiwa-lab/migration vitest
```

## 適用と rollback を確認する

`tests/kiwa/migration.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  createMigrationClient,
  listAppliedMigrations,
  runDown,
  runUp,
} from "@kiwa-lab/migration";

describe("users migration", () => {
  it("applies a migration and moves it to rolled back history", () => {
    const client = createMigrationClient({ provider: "drizzle" });
    const migration = {
      id: "001",
      name: "create users",
      up: "CREATE TABLE users (id INT)",
      down: "DROP TABLE users",
    };

    const up = runUp(client, migration);
    expect(up.status).toBe("applied");
    expect(listAppliedMigrations(client).applied.map((record) => record.id)).toEqual(["001"]);

    const down = runDown(client, migration.id);
    expect(down.status).toBe("rolled_back");
    expect(listAppliedMigrations(client).applied).toEqual([]);
    expect(listAppliedMigrations(client).rolledBack.map((record) => record.id)).toEqual(["001"]);
  });

  it("reports an attempt to roll back an unapplied migration", () => {
    const client = createMigrationClient({ provider: "drizzle" });

    const result = runDown(client, "404");

    expect(result).toMatchObject({ status: "failed", reason: "not applied" });
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/migration.test.ts
```

`runUp` と `runDown` は同期 API です。`MigrationClient` はメモリ内の履歴を更新するため、test ごとに新しく作ると状態が混ざりません。未適用の id を `runDown` に渡しても例外は送出されません。`failed` と `not applied` を assertion に含め、成功だけを確認しないでください。

複数 migration、適用順、schema 差分は [使い方](./how-to) を確認してください。実 database の SQL 構文、transaction、lock、provider 固有 metadata、production data への影響は実 integration environment で検証します。

## skill で test を作る

この library には `/kiwa:kiwa-migration` という companion skill があります。初回だけ kiwa plugin を導入し、この Quickstart の package 導入も済ませます。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、確認したい migration 境界を test の形にする入口です。対象と出力先を固定します。

```text
/kiwa:kiwa-migration --module 0042-users --output tests/integration/0042-users.migration.test.ts
```

生成後は `tests/integration/0042-users.migration.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/0042-users.migration.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-migration/SKILL.md) を参照してください。
