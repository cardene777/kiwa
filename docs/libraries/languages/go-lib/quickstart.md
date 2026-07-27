# @kiwa-lab/go-lib を始める

このチュートリアルでは gin 風 handler に path parameter、query、header を渡し、JSON response と認可時の abort を確認します。成功すると、実 Go process を起動せずに handler contract を検証する Vitest test が一つできます。

## 依存関係を追加する

```bash
pnpm add -D @kiwa-lab/go-lib vitest
```

## 最初の test を書く

次の内容全体を `tests/users.go-lib.test.ts` に保存します。`params` と `query` は router が URL から解析する値ではなく、test が handler に与える値です。実 router の URL decode や route match は、この test の後に Go integration test で確認します。

```ts
import { expect, it } from "vitest";
import { invokeGinHandler } from "@kiwa-lab/go-lib";

it("returns the path and query values used by the handler", async () => {
  const result = await invokeGinHandler({
    handler: (context) => {
      context.Header("x-request-id", "test-1");
      context.JSON(200, {
        id: context.Param("id"),
        page: context.Query("page"),
      });
    },
    req: {
      method: "GET",
      path: "/users/1",
      params: { id: "1" },
      query: { page: "2" },
    },
  });

  expect(result).toMatchObject({
    status: 200,
    body: { id: "1", page: "2" },
    headers: {
      "content-type": "application/json",
      "x-request-id": "test-1",
    },
  });
});

it("records an authorization abort with its status", async () => {
  const result = await invokeGinHandler({
    handler: (context) => {
      context.status(401);
      context.abort();
    },
    req: { method: "GET", path: "/private" },
  });

  expect(result).toMatchObject({ status: 401, aborted: true });
});
```

`abort()` は `aborted` を記録します。handler chain を止めたり response body を作ったりはしません。path に `id` が含まれていても `params.id` を与えなければ handler は `undefined` を受け取ります。これは mock harness が router ではないためです。

## 実行する

```bash
pnpm exec vitest run tests/users.go-lib.test.ts
```

## skill から test の下書きを作る

Claude Code を使う場合は、初回だけ plugin を導入してから `kiwa-go-lib` を実行します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins

/kiwa:kiwa-go-lib --module posts-api --output tests/integration/posts.go-lib.test.ts
```

生成後は framework、手で渡す `params` と `query`、期待する response を確認し、対象 file を実行します。

```bash
pnpm exec vitest run tests/integration/posts.go-lib.test.ts
```
