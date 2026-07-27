# hono

`@kiwa-lab/hono` は、Hono application の route、middleware、hc 形式の RPC、Cloudflare Workers binding を memory 上で実行する test adapter です。network の listen や Workers runtime を起動せず、request がどの route に届き、middleware がどの順序で通り、どの response が返るかを検証できます。route の境界を速く確認したい test と、実 deploy でしか分からない挙動を分けるための library です。

![Hono の route と Workers binding を実行する流れ](/images/kiwa-docs/frameworks/hono-overview.png)

## request から response までを追跡する

`createHonoApp` で route と middleware を登録し、`invokeRoute` に method と path を渡すと、その request が app の中を通ります。結果には route が一致したかを示す `matched`、response、実行された middleware と handler の `trace` が入ります。たとえば authorization middleware が handler より先に変数をセットし、`/users/:id` が parameter を返すことまでを、一つの deterministic な test で確認できます。

404 を assertion するときは status だけでは不十分です。handler 自身が 404 response を返したのか、route pattern または method が一致しなかったのかは別の失敗です。後者は `matched: false` になるため、`matched` と response を一緒に確認します。middleware が `next` を呼ばなければ chain はそこで止まるので、trace は認可漏れや誤った登録順を見つける根拠にもなります。

## RPC と Workers の依存を分けて扱う

`createRpcClient` は app を直接 dispatch する hc 風の client です。`$get` や `$post` の呼び出しが parameter、query、header、JSON body を route に渡し、返った response を読めることを確認します。外部 fetch を行わないので、client の input mapping と server handler の契約を network failure から切り離せます。呼び出し側の TypeScript schema を runtime で検証する仕組みではないため、型の整合と実際の input validation はそれぞれ別に test します。

Workers の依存には `mockKVNamespace`、`mockD1Database`、`mockR2Bucket`、`createExecutionContext` を使います。KV と R2 は instance 内の状態を保持するため、handler が保存した値と metadata を assertion できます。D1 は SQL を実行する database ではなく、query string に対する用意済みの結果を返す mock です。`waitUntilAll` は background work が成功または失敗するまで待つので、deferred task を忘れずに test の結果へ含められます。

## 実環境と混同しない

route parser が扱う pattern は `:param` と `*` です。Hono の完全な TrieRouter、streaming response、SSE、WebSocket は再現しません。response は buffered で、KV と R2 の状態も各 mock instance の中だけにあります。D1 の query planner、Cloudflare の edge runtime、network の timeout や retry は、この adapter の外です。

この library では route の入力変換、middleware の順序、response の契約、binding を使うコードの分岐を unit test にします。実 deploy での binding 設定、Hono middleware との統合、streaming、Workers runtime の制約は Miniflare や preview environment を使う integration test で確認します。二つを分けることで、速い test が実 runtime の代わりをしているように見せかけません。

## 読み進める

[Quickstart](./quickstart) では parameter と middleware を含む route を実行します。[使い方](./how-to) では RPC client と Workers binding を扱います。route matching、response、mock が保持する状態の詳細は [リファレンス](./reference) にあります。
