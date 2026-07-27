# @kiwa-lab/go-lib

`@kiwa-lab/go-lib` は、gin、echo、fiber、chi の request-response contract を TypeScript の test process から観察する mock harness です。Go の binary や実 framework を起動するものではありません。Go 風 handler に最小の context を渡し、入力から読み取った parameter、status、body、header、abort、handler error を assertion できる形で返します。

![Goフレームワークのhandlerを同じrequestで観測する構造](/images/kiwa-docs/languages/go-lib-overview.png)

gin、echo、fiber は individual handler を直接実行します。gin では `Param` と `Query` が未指定なら `undefined` になり、echo と fiber では空文字になります。echo と fiber が `Error` を返した場合は test が throw する代わりに `handlerError` に記録します。gin の `abort()` は `aborted` を記録しますが、後続 handler を自動停止する router ではありません。

chi では route pattern と middleware trace を観察できます。ただし `ChiApp` を作る factory は現在の公開 entry point から export されていません。新しく公開 package だけで導入する場合、chi router を組み立てる用途はまだ完結していません。gin、echo、fiber の handler adapter を使うか、実 Go project 側の integration test を使うのが安全です。

## 使う判断

HTTP handler が受け取る parameter と、アプリが返す status、body、error handling を短い TypeScript test で固定したい場合に使います。route metadata、retry、rate limit、circuit breaker、cancel token も in-memory helper として検証できます。Go 実装へ移植する前に boundary を決める用途や、仕様から生成した test の契約を確認する用途に適します。

実 framework の route 解決、binding、body parse、response serialization、error middleware、network は再現しません。chi の parameter は URL decode されません。実 gin、echo、fiber、chi との互換性と middleware 順序は Go 側の integration test で確認してください。

## 読み進める

[Quickstart](./quickstart) は gin 風 handler の最小 test を保存して実行します。[使い方](./how-to) は echo と fiber の error 契約、retry helper、実 framework への引き渡しを説明します。[リファレンス](./reference) は各 adapter の戻り値と helper の制約を調べるためのページです。
