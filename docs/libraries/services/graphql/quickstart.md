# @kiwa-lab/graphql をはじめる

この Quickstart では、最小の schema と resolver を作り、query の data と resolver error を同じ test file で確認します。schema validation や型検査は行わないため、`typeDefs` の field と resolver の組を実装に照らして確認してください。

## インストール

```bash
pnpm add -D @kiwa-lab/graphql vitest
```

## query と resolver error を確認する

`tests/hello.graphql.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import { createGraphQLServer } from "@kiwa-lab/graphql";

describe("hello resolver", () => {
  it("passes a query to a resolver and returns data", async () => {
    const server = createGraphQLServer(
      { typeDefs: "type Query { hello: String }" },
      { Query: { hello: () => "world" } },
      { provider: "apollo" },
    );

    const result = await server.executeQuery("{ hello }");

    expect(result).toEqual({ data: { hello: "world" } });
    expect(server.listCalls()).toEqual([
      expect.objectContaining({ operationType: "query", status: "ok" }),
    ]);
  });

  it("returns a resolver failure as a GraphQL result", async () => {
    const server = createGraphQLServer(
      { typeDefs: "type Query { profile: String }" },
      { Query: { profile: () => { throw new Error("profile unavailable"); } } },
    );

    const result = await server.executeQuery("{ profile }");

    expect(result.data).toEqual({});
    expect(result.errors).toEqual([
      { message: "profile unavailable", path: ["profile"] },
    ]);
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/hello.graphql.test.ts
```

resolver が未登録の場合と resolver が throw した場合は、例外ではなく `errors` に field path と message が入ります。成功した sibling field は `data` に残るため、クライアントが partial result を受け入れるかを assertion してください。HTTP transport、schema validation、認可 middleware は実 server の integration test で確認します。

## skill で test の下書きを作る

この library には `/kiwa:kiwa-graphql` という companion skill があります。初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

対象の resolver contract と出力先を指定して実行します。

```text
/kiwa:kiwa-graphql --module user-query --target server --output tests/integration/user-query.graphql.test.ts
```

生成後は schema、resolver、context、error をアプリケーションの仕様に合わせます。次の command で生成 file だけを実行してから採用し、variables と subscription は [使い方](./how-to) に進んでください。

```bash
pnpm exec vitest run tests/integration/user-query.graphql.test.ts
```
