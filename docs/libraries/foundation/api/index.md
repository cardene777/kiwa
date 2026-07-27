# @kiwa-lab/api

`@kiwa-lab/api` は、HTTP handler を Vitest から起動し、request と response の contract を確認する adapter です。Fetch 形式の handler と Node の request response handler を local HTTP server で動かせます。MSW と組み合わせると、client が受け取る固定 response だけを test する mock mode と、local handler 内の外部 HTTP call だけを置き換える hybrid mode を選べます。

![HTTP handlerから応答確認までの流れ](/images/kiwa-docs/foundation/api-overview.png)

## 何を検証する library か

live mode は handler を 127.0.0.1 の空き port で起動します。`env.request` から GET、POST、PUT、PATCH、DELETE を送り、status、response header、body text、JSON を assertion します。object の request body は JSON に変換され、`content-type` が設定されます。4xx と 5xx は例外ではなく通常の response snapshot なので、application が返す error body と status をそのまま test できます。

mock mode は local handler を起動せず、MSW handler だけを起動します。API client が特定の contract を正しく読めるかを検証する用途です。hybrid mode は local handler と MSW を同時に起動し、test が local server へ送った request は handler へ通し、handler 内の外部 fetch を MSW で固定します。各 mode は request client を同じ API で返すため、同じ assertion を保ったまま検証経路を変えられます。

## 採用する判断

route handler の request parsing、status、JSON response、default header、application 固有の error mapping を HTTP 越しに確認したい場合は live mode を使います。外部 service が返す値に対する client の分岐だけを固定したい場合は mock mode を使います。handler の実装は動かしながら payment や profile service などの外部 call だけを置き換えたい場合は hybrid mode を使います。

browser 操作、cookie jar、CORS、実認証 provider、database、外部 API の応答そのものを証明する library ではありません。local listener は test 後に必ず `stop()` し、database や外部 service を含む確認は integration test に分けます。MSW が intercept しているかだけでは、実 provider の認証や rate limit が正しい証拠にはなりません。

## 利用の流れ

[はじめる](./quickstart) で live handler を起動し、作成と取得を一つの test で確認します。[使い方](./how-to) では mock、hybrid、Node handler、default header を同じ保存用 file で実行します。option、戻り値、mode の必須設定は [リファレンス](./reference) を参照してください。画面上の入力から endpoint まで確認する場合は [e2e](../e2e/) を使います。
