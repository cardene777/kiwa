# AI とリアルタイム

AI とリアルタイムカテゴリは、非決定的な応答、外部ツール呼び出し、検索順位、継続接続、イベントストリームをテスト可能な状態へ置き換えます。目的は本物の provider を模倣することではなく、アプリケーションが受け取るイベント列と失敗を固定し、期待する処理を検証することです。

## AI の振る舞いを確認する

チャット completion、tool call、streaming token、usage は [AI LLM](./ai-llm/) を選びます。trace、metric、log からテスト結果を読む処理は [Observability](./observability/) が対象です。

## 検索と配信を確認する

keyword と filter を含む検索結果は [Search](./search/) を使います。WebSocket や realtime channel の接続、再接続、presence は [Realtime](./realtime/) を参照してください。

## 実サービスへ戻す判断

model の品質、実際の token 消費、provider の rate limit、broker の選出、ネットワーク切断は in-memory test だけでは検証できません。各概要の「対象外」を読み、アプリケーションの分岐を unit test で固定したうえで、少数の実プロバイダー統合テストを追加してください。

## 読み進め方

Quickstart でひとつのイベント列を再現し、使い方で timeout、拒否、再試行、順序のずれを追加します。戻り値の schema と API の全項目はリファレンスを参照してください。
