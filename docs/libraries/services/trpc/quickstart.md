# @kiwa-lab/trpc はじめる

query procedure を定義し、router を直接実行します。

## インストール

```bash
pnpm add -D @kiwa-lab/trpc vitest
```

## テストを書く

```ts
import { expect, it } from "vitest";
import { createRouter, defineProcedure, invokeProcedure } from "@kiwa-lab/trpc";

it("query を呼ぶ", async () => {
  const router = createRouter({
    procedures: { "user.get": defineProcedure("query", async ({ input }) => ({ id: input })) },
  });
  expect(await invokeProcedure(router, "user.get", "u1")).toEqual({ id: "u1" });
});
```

`invokeProcedure` はprocedure typeを検証しません。query、mutation、subscriptionのいずれでもpathとhandlerを直接呼びます。未知のpathは `TRPCError` の `NOT_FOUND` でrejectします。

`createClient(router)` も同じin-process invocationへ変換します。clientの `.query`、`.mutate`、`.subscribe` はprocedure typeに関係なく同じrouter methodを呼ぶため、type mismatchのtransport errorを再現しません。

## 実行して確認する

この例を `tests/kiwa/trpc.test.ts` に保存して実行します。

```bash
pnpm exec vitest run tests/kiwa/trpc.test.ts
```

成功時は Vitest が `1 passed` と表示し、`user.get` の handler は `{ id: "u1" }` を返します。`NOT_FOUND` が返る場合は router の procedure key と呼び出す path が一致しているかを確認します。query、mutation、subscription の type mismatch は、この in-process invocation では検証されません。

middleware と `TRPCError` は [使い方](./how-to) を確認してください。

<!-- skill-guide -->
## skill で test を作る

この library には `/kiwa:kiwa-trpc` という companion skill があります。Claude Code を使う場合は、まず plugin を導入します。すでに導入済みならこの操作は不要です。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

[skills guide](/guides/skills) を確認してから、Quickstart の package 導入も済ませて実行します。skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい境界を test の形にする入口です。

次の例では、対象を表す名前と生成先を固定します。

```text
/kiwa:kiwa-trpc --module user-router --target procedure --output tests/integration/user-router.trpc.test.ts
```

生成後は `tests/integration/user-router.trpc.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/user-router.trpc.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-trpc/SKILL.md) を参照してください。
