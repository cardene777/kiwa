# @kiwa-lab/nuxt

`@kiwa-lab/nuxt` は、Nuxt の server route、route middleware、Nitro plugin を Nitro server なしで検証するための test adapter です。handler へ H3 event 相当の入力を渡し、通常の戻り値だけでなく、redirect、response status、header、cookie を結果として取り出します。これにより、HTTP server を起動する前に route の認可や response contract を小さな test で固定できます。

![NuxtのH3 eventから副作用を確認する流れ](/images/kiwa-docs/frameworks/nuxt-overview.png)

server route を test する場合、`invokeEventHandler` に URL、request header、cookie、body を渡します。URL に同じ query key が複数あると値は配列になり、options の `query` は URL の同じ key を置き換えます。handler が `setHeader`、`setCookie`、`sendRedirect` を呼ぶと、通常の return value とは別に `env` と redirect result へ記録されます。戻り値だけでなく、この副作用まで assert することで、認証や cache policy の取りこぼしを防げます。

route middleware は navigation の結果を扱います。`false` は silent abort、文字列の return はそのままの result、`navigateTo` と `abortNavigation` は adapter が捕捉する signal です。Nitro plugin は hook を登録してから `callHook` で実行します。hook の例外は `callHookErrors` に記録され、他の hook は継続します。`hookOnce` は最初の実行後に解除されるため、終了処理の重複も test できます。

この adapter は Nuxt の runtime そのものではありません。route manifest、composable、actual browser navigation、Nitro deployment adapter、real network を起動しません。route の入力と副作用の contract はここで検証し、production server や browser 上の遷移は Nuxt application を起動する integration test または E2E test で確認します。

## 選ぶ場面

cookie を見て redirect する API、locale や filter を query で受け取る route、ログイン前に画面を止める guard、startup と shutdown の Nitro hook を速く検証したい場合に向いています。client component の状態や画面表示を検証する場合は、Vue UI test または browser E2E test を選びます。

[Quickstart](./quickstart) では query と response header を確認します。[使い方](./how-to) では認証 redirect、route middleware、Nitro hook を扱います。すべての入力と結果の shape は [リファレンス](./reference) にあります。
