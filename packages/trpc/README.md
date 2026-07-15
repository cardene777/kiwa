# @kiwa-lab/trpc

tRPC endpoint mock harness for kiwa — router / procedure / middleware chain / typed client を in-process mock で invoke する test infra。

## API

- `createRouter(config)` = tRPC router mock (procedures 登録 + context 保持)
- `defineProcedure(type, handler)` = query / mutation / subscription procedure 定義
- `invokeProcedure(router, path, input, ctx)` = router に対して procedure を実行し出力を得る
- `createClient(router)` = typed client proxy (client.foo.query(input) / client.bar.mutate(input))
- `middleware(fn)` = middleware chain (context 変換 / error propagation)
