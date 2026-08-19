# edge-handler-poc

`edge-handler` layer の最小 example。 `/kiwa-design --layer edge-handler` が書いた spec を
`/kiwa-edge` が Vitest の test に変換する経路を、 実際に解決できる形で置いている。

Cloudflare Workers 形式の `fetch(request, env, ctx)` を `@kiwa-lab/edge` の `invokeEdgeHandler`
で直接呼ぶ。 **Miniflare / workerd を起動しない** = KV binding は `createKvNamespace` の純 JS
mock で置き換わる。

## 構成

```
edge-handler-poc/
├── src/
│   └── worker.ts                                  # export default { fetch } の短縮 URL handler
├── tests/spec/integration/
│   └── test-spec-links.edge.md                    # Layer 1 spec (10 TC)
└── tests/
    └── links.edge.test.ts                         # 10 test
```

## 実行

```bash
pnpm -F examples-edge-handler-poc test
```

## 何を demo しているか

| 観点 | 対象 | 見る場所 |
|---|---|---|
| KV read | 登録済 slug の解決 | `createKvNamespace` の seed |
| KV write | 短縮 URL の登録 | 呼出後の `links.get()` |
| redirect | 302 と行き先 | `redirect.status` / `redirect.url` |
| waitUntil | 計数を応答から外す | `ctx.waitedPromises` |
| passThroughOnException | handler の欠陥でない失敗 | `ctx.passThroughCalled` |
| env var | 共有鍵の照合 | `env.API_KEY` |

### waitUntil は 2 つの主張に分ける

`ctx.waitedPromises` に載せただけでは副作用は起きない。 T-EDGE-004 が **載せたか** を、
T-EDGE-005 が `await Promise.all(ctx.waitedPromises)` の後で **実行されるか** を見る。

片方だけだと「載せたが中身が動かない」 形を捕まえられない。
