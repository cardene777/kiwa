# kiwa-test-go

`kiwa-test-go` は、Go の `testing` を置き換えずに、テストごとの fixture と HTTP 境界を扱いやすくするライブラリです。unit test では同じ seed と mode から毎回同じ fixture を作り、integration test では一時的な HTTP server を起動して、アプリケーションが送った request と返した response の両方を確かめます。

<img src="/images/kiwa-docs/native-languages/go-overview.webp" alt="Go の mock server を cleanup する流れ" width="1200" height="658" loading="lazy" decoding="async">

テスト対象が関数や domain object だけなら、まず `SetupUnitEnv` を使います。これは test が終わると `t.Cleanup` で停止する fixture を返すため、seed、mode、ラベルを test ごとに閉じ込められます。外部 API を呼ぶ code を検証したい場合は、`NewMockServer` が OS に選ばせた一時 port で server を起動します。production code にはその URL を渡し、test では response と記録済み request を確認します。

このライブラリは実サービスを再現する SDK ではありません。`ModeLive` は実 resource を使う意思を fixture に記録する flag であり、database、認証、外部 API を自動で用意しません。route の path は完全一致だけで、parameter、glob、正規表現による matching も扱いません。その場合は route を明示して test するか、目的に合う HTTP mock library を併用します。

## 選ぶ場面

アサーションの失敗を `got` と `want` の差分で読みたい場合、fixture の cleanup を test runner に任せたい場合、または HTTP client が正しい method、path、header、body を送ったことまで確かめたい場合に向いています。Gin、Echo、Fiber、Chi、Iris の handler は、対応する subpackage を import すると socket を開かずに同じ request builder で実行できます。

最初に unit fixture を動かす場合は [Quickstart](./quickstart) を読んでください。HTTP client の request と未登録 route の失敗を確認する場合は [HTTP mock server を使う](./how-to) を使います。各 API の既定値、寿命、制約は [リファレンス](./reference) にまとめています。
