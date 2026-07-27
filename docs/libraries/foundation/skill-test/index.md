# skill test

`@kiwa-lab/skill-test` は、agent、MCP server、CLI が実際に選んだツール呼び出しをテストするための小さな assertion ライブラリです。出力テキストだけではなく、「Read をしてから Bash を呼ぶ」「危険な Write は呼ばない」「特定の引数で search を一度だけ呼ぶ」といった実行経路を確認したいときに使います。

このライブラリは agent をモック化したり、ツールを実行したりしません。対象アプリケーションがツールを呼ぶ地点に `spy.record(name, argumentsJson)` を接続し、テストではその記録を assertion します。つまりテストの価値は、手で `record` を並べることではなく、実装の callback から spy まで到達させることにあります。

![ツール呼出を記録して検証する流れ](/images/kiwa-docs/foundation/skill-test-overview.png)

## 何を保証するか

一つの spy は tool 名、引数の文字列、記録した順番を保持します。`assertToolCalled` は少なくとも一度呼ばれたか、または指定した回数ちょうど呼ばれたかを確かめます。`assertToolCalledWith` は同名の呼び出しのうち一つが期待する引数に深く一致するかを確かめます。JSON ではない CLI 形式の引数も、同じ文字列として比較できます。

`assertToolCallOrder` は完全な列ではなく subsequence を検査します。`Read`、`Bash` を期待したとき、間に `Search` が挟まっても通ります。これは「情報を読んでからコマンドを実行する」という大まかな因果を守りたいテストには便利です。一方、余分なツール呼び出しがセキュリティやコストに直結する場合は、`getCalls()` の全配列を厳密に比較します。

## 使う判断

出力だけでは正しい経路を判定できない agent に向いています。たとえば、ファイルを読む前に編集してはならない、認可失敗時に外部 API を呼んではならない、検索条件を変えずにそのまま下流へ渡す、といった契約です。ツールの実処理やネットワークの成否を確かめるライブラリではありません。それらは integration test や E2E test と組み合わせてください。

## 読み進める

[Quickstart](./quickstart) では最小の tool runner を用意し、callback から記録してテストを実行します。[使い方](./how-to) では回数、引数、順序をどの粒度で検査するかと、失敗の調査方法を扱います。[リファレンス](./reference) には assertion と `ToolSpy` の契約があります。

プロセスとして CLI を検証する場合は [cli test](../cli-test/) を参照してください。kiwa 全体のテスト層は [kiwa](../kiwa/) で説明しています。
