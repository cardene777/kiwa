# @kiwa-lab/api はじめる

このチュートリアルでは、Fetch handler を live mode で起動し、POST と GET の応答を確認します。live mode はローカルの空き port を使うため、test の最後に必ず `stop()` します。

## インストール

```bash
pnpm add -D @kiwa-lab/api vitest
```

## 最初のテスト

```ts
import { afterEach, expect, it } from "vitest";
import { setupApiServer, type ApiTestEnv } from "@kiwa-lab/api";

const envs: ApiTestEnv[] = [];

afterEach(async () => {
  while (envs.length > 0) {
    await envs.pop()?.stop();
  }
});

it("item を作成、取得し、invalid body を reject する", async () => {
  const items: Array<{ id: number; name: string }> = [];
  const env = await setupApiServer({
    mode: "live",
    app: {
      kind: "fetch",
      handler: async (request) => {
        const url = new URL(request.url);
        if (url.pathname === "/api/items" && request.method === "POST") {
          const body = (await request.json()) as { name?: string };
          if (!body.name) return new Response("name required", { status: 400 });
          const item = { id: items.length + 1, name: body.name };
          items.push(item);
          return Response.json(item, { status: 201 });
        }
        if (url.pathname === "/api/items" && request.method === "GET") {
          return Response.json(items);
        }
        return new Response("not found", { status: 404 });
      },
    },
  });
  envs.push(env);

  const created = await env.request.post("/api/items", { name: "kiwa" });
  expect(created.status).toBe(201);
  expect(created.json<{ id: number; name: string }>()).toEqual({ id: 1, name: "kiwa" });

  const listed = await env.request.get("/api/items");
  expect(listed.json()).toEqual([{ id: 1, name: "kiwa" }]);

  const invalid = await env.request.post("/api/items", {});
  expect(invalid.status).toBe(400);
  expect(invalid.bodyText).toBe("name required");
});
```

object を POST、PUT、PATCH の body に渡すと、client は JSON へ変換し `content-type` を `application/json` に設定します。string、`ArrayBuffer`、`Uint8Array` はそのまま送られ、content type は自動設定されません。

`env.request` は HTTP status で例外を投げません。4xx と 5xx は通常の `ApiResponseSnapshot` として返るため、status と必要なら本文を検証します。`json()` は `bodyText` に対して `JSON.parse` を行います。空本文や JSON ではない error body に対しては呼ばず、`bodyText` を使ってください。

この例を `tests/items.api.test.ts` に保存した後、次の command を実行してください。

```bash
pnpm exec vitest run tests/items.api.test.ts
```

test が成功すると、live server の起動、POST、GET、停止を確認できます。実認証 provider、database、外部 HTTP service はこの handler 内に含めず、必要な部分を mock mode または integration test へ分けてください。

## 次に読む

mock と hybrid、default header、Node handler は [使い方](./how-to) を確認してください。
<!-- skill-guide -->
## skill で仕様から test を作る

この library の companion skill は、先に作成した仕様を input にします。[kiwa の skill を使う](../../../guides/skills) の手順で plugin を導入し、Quickstart の最小 test で API と期待結果を理解してから実行してください。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

次の順序では、最初の command が `tests/spec/` に仕様を作り、二つ目の command がその module の test を作ります。

```text
/kiwa:kiwa-design --layer integration --module orders-api
/kiwa:kiwa-api --module orders-api
```

生成した test は、そのまま正しさの証明にはなりません。Quickstart にある入力、期待結果、対象外の境界と照合し、プロジェクトの runner で実行してください。既定の出力先を使った場合は、次の command で実行します。

```bash
pnpm exec vitest run test/integration/orders-api.test.ts
```

layer の選択肢と出力先は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-api/SKILL.md) を参照してください。
