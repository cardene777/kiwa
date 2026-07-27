# @kiwa-lab/grpc をはじめる

このチュートリアルでは unary method を登録し、request、metadata、response、未登録 method の status を同じ test file で確認します。ここで作る server は gRPC endpoint ではありません。アプリケーションが transport adapter に渡す handler を process 内で呼び、入力と返却値の契約を速く固定するための test fixture です。

## インストール

```bash
pnpm add -D @kiwa-lab/grpc vitest
```

## unary RPC と失敗 status を確認する

`tests/kiwa/grpc.test.ts` を作り、次の内容をそのまま保存します。

```ts
import { describe, expect, it } from "vitest";
import {
  createGrpcServer,
  createMetadata,
  defineService,
  invokeUnary,
  type GrpcMetadata,
} from "@kiwa-lab/grpc";

describe("UserService", () => {
  it("invokes a unary method with metadata", async () => {
    const server = createGrpcServer({ provider: "grpc-js" });
    server.addService(defineService("UserService", [
      {
        name: "Get",
        type: "unary",
        handler: async ({ id }: { id: string }, metadata: GrpcMetadata) => ({
          id,
          tenant: metadata?.find((entry) => entry.key === "x-tenant")?.value,
        }),
      },
    ]));

    const result = await invokeUnary(
      server,
      "UserService",
      "Get",
      { id: "1" },
      createMetadata({ "X-Tenant": "acme" }),
    );

    expect(result).toMatchObject({
      ok: true,
      response: { id: "1", tenant: "acme" },
      status: { code: 0, message: "" },
      trailingMetadata: [],
    });
  });

  it("returns an unimplemented status for an unknown method", async () => {
    const server = createGrpcServer();
    server.addService(defineService("UserService", [
      { name: "Get", type: "unary", handler: async () => ({ id: "1" }) },
    ]));

    const result = await invokeUnary(server, "UserService", "Missing", {});

    expect(result).toMatchObject({ ok: false, status: { code: 12 } });
    expect(result.response).toBeUndefined();
  });
});
```

次の command は作成した file だけを実行します。

```bash
pnpm exec vitest run tests/kiwa/grpc.test.ts
```

metadata key は `createMetadata` で小文字化されます。handler の第二引数は metadata array であり、provider の transport metadata object ではありません。service name、method name、method type のどれかが一致しない場合、invoke helper は throw せず `ok: false` と status code `12` を返します。

handler 内の例外も result に変換されます。実際の gRPC client に返る status と error detail、HTTP2、TLS、protobuf serialization は adapter と実 server を使う integration test で別に確認してください。stream、handler error、deadline は [使い方](./how-to) を確認します。

## skill で test を作る

この library には `/kiwa:kiwa-grpc` という companion skill があります。初回だけ kiwa plugin を導入してから使います。

```text
/plugin marketplace add cardene777/kiwa
/plugin install kiwa@kiwa-marketplace
/reload-plugins
```

skill は library の挙動を実行時に置き換えるものではなく、ここで確認したい RPC の境界を test の形にする入口です。対象と出力先を固定します。

```text
/kiwa:kiwa-grpc --module user-service --rpc-type unary --output tests/integration/user.grpc.test.ts
```

生成後は `tests/integration/user.grpc.test.ts` を読み、Quickstart と同じ成功条件・失敗条件が期待値になっていることを確認してから、その file だけを実行します。

```bash
pnpm exec vitest run tests/integration/user.grpc.test.ts
```

provider や対象の種類、出力先を変える引数は [skill の仕様](https://github.com/cardene777/kiwa/blob/main/.claude/skills/kiwa-grpc/SKILL.md) を参照してください。
