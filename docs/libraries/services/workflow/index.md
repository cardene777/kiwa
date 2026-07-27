# @kiwa-lab/workflow

`@kiwa-lab/workflow` は、複数 step から成る業務フローをインプロセスで検証するためのテスト用 harness です。Temporal、Inngest、Trigger.dev、AWS Step Functions のような durable workflow を呼び出すアプリケーションで、step の順序、前の出力の受け渡し、失敗、イベント起動をテストできます。

![ワークフローを登録し、順番に step を実行して結果を記録する流れ](/images/kiwa-docs/services/workflow-overview.png)

## 対象とする契約

workflow 名に対して定義した step 列が登録されること、各 step が input と直前の output を受け取ること、最後に `completed` または `failed` になることを確認します。成功した実行の履歴には step output が残るため、受け渡しを status だけに頼らず検証できます。現在の実装は failed record に途中 step の output を残さないため、途中経過の監査はアプリケーション側のログまたは実 provider の履歴で確認します。外部イベントからの起動、retry、timeout、idempotency も同じ契約として test できます。

`createWorkflowClient` の provider は実サービスの SDK に接続しません。`temporal`、`inngest`、`trigger`、`aws-sfn` の違いは execution id の prefix と記録上の provider として扱われ、step の実行経路は共通です。

## 使う場面

注文の検証、決済、出荷のように複数の処理結果をつなぐテストに向いています。実行履歴を確認できるため、途中で失敗したときに最終 status だけでなく、どの step の出力まで残ったかを検証できます。

## 使わない場面

Temporal の durable state、Inngest の distributed step、Trigger.dev の worker、Step Functions の IAM や実行制限を検証するライブラリではありません。これらは実サービスまたは対応するローカル環境で統合テストしてください。並列分岐や compensation を本番のオーケストレーターと同じ意味で保証する用途にも使いません。

## 読み進める

[Quickstart](./quickstart) では workflow を登録して完了結果を確認します。[使い方](./how-to) では step 間のデータ、失敗、retry、イベント起動を扱います。引数と結果の全体像は [リファレンス](./reference) を参照してください。
