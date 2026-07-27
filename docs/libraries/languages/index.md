# 言語アダプター

言語アダプターは、TypeScript のテストから別言語で書かれた Web アプリケーションの境界を検証します。アプリケーション全体を起動する代わりに、route、request、response、middleware の振る舞いを in-memory の環境に入れます。

## 実装言語から選ぶ

Go の Gin、Echo、Fiber は [go-lib](./go-lib/)、Django と Flask は [python](./python/)、Rails と Sinatra は [ruby](./ruby/)、Axum と Actix Web は [rust-lib](./rust-lib/) が対象です。TypeScript 以外のテストランナーだけで使いたい場合は、このカテゴリではなく [ネイティブ言語](../native-languages/) を選んでください。

## 検証できること

Quickstart では handler を登録し、作った request に対する status、header、body を確認します。使い方では middleware の順序、例外、認証、path parameter、template の値を扱います。実際の言語 runtime、依存注入、データベース driver、server process は起動しません。アプリケーションが守る HTTP 契約を先に固定し、実サーバー固有の挙動は統合テストで補います。

## 読み進め方

使っている言語のライブラリで最小 handler を通してから、実装中の route と同じ request を例へ移します。フレームワークごとの adapter と戻り値の詳細はリファレンスを参照してください。
