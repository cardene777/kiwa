# @kiwa-lab/trpc

`@kiwa-lab/trpc` は、tRPC 形式の router、procedure、middleware を同じ process で実行し、アプリケーションが守る input、context、戻り値、失敗を test する harness です。実 tRPC server、HTTP transport、Zod parser、subscription transport は起動しません。

![routerのmiddlewareを通ったprocedureがデータまたは拒否を返す流れ](/images/kiwa-docs/services/trpc-overview.png)

## procedure の境界を直接 test する

router に query、mutation、subscription の procedure を登録し、`invokeProcedure` または in-process client で path を呼びます。middleware は handler の前に context を検証し、許可するときだけ `next` で更新済み context を渡せます。認可失敗は `TRPCError` として reject されるため、成功値だけでなく code を assertion に含めます。

冪等性、retry、timeout、rate limit、circuit breaker、batch の wrapper も test できます。ただし batch は transaction ではありません。複数 instance をまたぐ冪等性、session や JWT の復元、request body の validation、実 client の request shape は database、adapter、tRPC integration test で確認してください。

## 使う場面

procedure が受け取る input と context、認可失敗、mutation の副作用、部分的に失敗する dashboard query をネットワークなしで固定したい場合に使います。GraphQL には [graphql](../graphql/)、gRPC には [grpc](../grpc/) を使います。

## 読み進める

[Quickstart](./quickstart) では query procedure を直接実行します。[使い方](./how-to) では認可 middleware、冪等 mutation、batch、retry を扱います。公開 API は [リファレンス](./reference) にあります。
