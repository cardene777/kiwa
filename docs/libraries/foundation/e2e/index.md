# @kiwa-lab/e2e

`@kiwa-lab/e2e` は、ローカル HTTP server と Playwright browser を同じ test environment として起動する、Web アプリケーション向けの E2E adapter です。フォーム送信、画面遷移、client-side script のように、実際の HTTP 経路と browser engine を通さなければ確認できない振る舞いを test します。wallet や chain が必要な dApp は [dapp](../dapp/)、browser を起動しない component test は [ui](../ui/) を使います。

![ブラウザとサーバーをまとめる流れ](/images/kiwa-docs/foundation/e2e-overview.png)

## server と browser を一つの寿命で扱う

`setupE2eEnv` は 127.0.0.1 の空き port に server を起動し、browser、context、page を作り、指定 path へ移動してから environment を返します。`staticHtml` を渡せば最小の画面操作を、Fetch handler または Node handler を渡せば実アプリに近い HTTP response を test できます。page の locator、入力、click、評価、screenshot は Playwright を通して実行します。

environment は browser と server の両方を持つため、test の `finally` または `afterEach` で必ず `stop` を呼びます。片方だけを閉じる cleanup は不要で、`stop` が context、browser、server をまとめて終了します。複数 test で environment を共有すると state と port の失敗原因が不明瞭になるため、test ごとに作成して終了してください。

## handler と browser の境界

Fetch handler は `Request` を受けて `Response` を返し、Node handler は `(req, res)` を受けます。handler の未処理例外は harness により 500 response へ変換されますが、アプリ固有の error mapping は handler 自身で実装し、status と画面表示を assertion します。`initialPath` が relative path なら local server を対象にし、絶対 HTTP URL ならその URL に移動します。SUT を local app に固定する E2E では relative path を使います。

browser は Chromium、Firefox、WebKit を選べますが、選んだ engine を Playwright で事前に install する必要があります。この library は browser binary、実 production deployment、外部 service の state を用意しません。fixture data、認証、network stub、test account は呼び出し側で制御してください。

## 読み進める

[Quickstart](./quickstart) では Todo フォームを Chromium で操作します。[使い方](./how-to) では Fetch handler、Node handler、browser の選択を扱います。server と page の公開 API は [リファレンス](./reference) にあります。
