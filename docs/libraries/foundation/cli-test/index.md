# @kiwa-lab/cli-test

`@kiwa-lab/cli-test` は、temporary directory で child process を起動し、CLI の入力、出力、終了状態、ファイル副作用を test する adapter です。shell command を文字列として評価せず、Node の `spawn` へ command と arguments を分けて渡します。設定 file を読む CLI、stdin を受ける subcommand、失敗時の exit code を、実 process の contract として確認できます。

<img src="/images/kiwa-docs/foundation/cli-test-overview.webp" alt="CLIテスト環境の隔離と停止" width="1200" height="658" loading="lazy" decoding="async">

## 何を検証する library か

`setupCliEnv` は OS の temporary directory 配下に作業 directory を作り、seed file と environment variable を用意します。`runCli` はその directory を既定 cwd として command を起動し、stdout、stderr、exit code、signal、実行時間を返します。test は process の出力だけでなく、生成された file とその内容を確認できます。

正常終了は `CliRunResult` として返ります。timeout と binary の起動失敗は result ではなく Promise rejection です。signal で終了した process は implementation 上 `exitCode` がゼロに正規化される場合があるため、signal も assertion します。こうした失敗の形を分けることで、CLI の入力エラー、process の異常終了、test 環境の起動失敗を混同せずに扱えます。

## 採用する判断

設定 file の読み書き、subcommand、stdin、環境変数、exit code、error message を command line から確認したい場合に使います。lifecycle helper は process を起動せず、orchestrator が出す event 列だけを state machine として test する用途です。

temp directory は sandbox ではありません。`../` を含む path と absolute `cwd` は拒否されず、外部 directory へ到達できます。信頼できない input から path を組み立てず、test では temporary directory 配下の相対 path に限定してください。browser UI は [e2e](../e2e/)、kiwa 自身の CLI 利用方法は [cli](../cli/) を参照してください。

## 利用の流れ

Quickstart で seed file を読み、結果を書く command を一つ実行します。How-to では stdin、timeout、cwd、lifecycle を追加し、正常 result と Promise rejection を分けて assertion します。environment を作った test は、`afterEach` または `finally` で必ず `stop()` し、temporary directory を削除します。

[はじめる](./quickstart) は file と command の最小 contract を扱います。[使い方](./how-to) は失敗と path の境界を扱います。option と result shape は [リファレンス](./reference) を参照してください。
