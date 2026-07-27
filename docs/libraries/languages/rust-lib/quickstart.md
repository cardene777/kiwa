# @kiwa-lab/rust-lib を始める

このチュートリアルでは axum 風 handler を request として実行し、成功と例外がどの形で記録されるかを固定します。Rust server、Tokio、axum crate は起動しません。TypeScript の Vitest process で、アプリが期待する body とアプリ側の失敗分岐を素早く確認するための harness です。

## 依存関係を追加する

```bash
pnpm add -D @kiwa-lab/rust-lib vitest
```

## handler の契約を test にする

`tests/create.rust-lib.test.ts` を作成します。adapter は `body` だけを handler へ渡します。header は handler の argument にはならず、結果の metadata として保持されます。二つの `it` は同じ一つの file に保存してください。

```ts
import { expect, it } from "vitest";
import { invokeAxumHandler } from "@kiwa-lab/rust-lib";

it("request body と handler の成功結果を記録する", async () => {
  const result = await invokeAxumHandler({
    handler: async (body: { name: string } | undefined) => ({
      result: "created",
      name: body?.name,
    }),
    method: "POST",
    path: "/api/create",
    body: { name: "kiwa" },
    headers: { authorization: "Bearer test-token" },
  });

  expect(result).toMatchObject({
    status: 200,
    body: { result: "created", name: "kiwa" },
    method: "POST",
    path: "/api/create",
    headers: { authorization: "Bearer test-token" },
  });
  expect(result.durationMs).toBeGreaterThanOrEqual(0);
});

it("handler の例外を失敗 response として記録する", async () => {
  const result = await invokeAxumHandler({
    handler: async () => {
      throw new Error("invalid input");
    },
    method: "POST",
    path: "/api/create",
  });

  expect(result).toMatchObject({
    status: 500,
    body: null,
    reason: "invalid input",
  });
});
```

実行します。

```bash
pnpm exec vitest run tests/create.rust-lib.test.ts
```

成功時は adapter が常に status `200` を返します。handler が status を含む object を返しても、実 axum の `IntoResponse` のように HTTP status を解釈しません。例外は test を reject する代わりに status `500`、`body: null`、`reason` を持つ結果になります。HTTP serialization、extractor、router、network の確認は対象 framework を使う Rust integration test に残してください。

<!-- skill-guide -->
## skill から test の下書きを作る

初回だけ kiwa plugin を導入します。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

```text
/kiwa:kiwa-rust-lib --module users-api --output tests/create.rust-lib.test.ts
```

生成した file は handler contract の出発点です。body、期待結果、Rust integration test に残す framework 固有の確認を見直してから、対象 file だけを実行してください。

```bash
pnpm exec vitest run tests/create.rust-lib.test.ts
```
