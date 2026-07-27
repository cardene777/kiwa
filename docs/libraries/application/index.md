# アプリケーション

アプリケーションカテゴリは、画面を描画したり端末を起動したりせず、入力から状態変更、送信 payload、表示用データまでを検証します。ここで扱うのは provider SDK の完全な再現ではなく、アプリケーションがその SDK に渡す値と受け取った結果を正しく処理する契約です。

## 目的から選ぶ

フォームの入力規則と送信分岐なら [form](./form/)、クライアント状態の更新と selector なら [state](./state/)、取得結果とキャッシュの遷移なら [query](./query/) を使います。日付と time zone が結果を変える処理は [date](./date/)、翻訳 key と補間値の扱いは [i18n](./i18n/) が対象です。

チャートへ渡す series、tooltip、操作イベントを固定したいときは [chart](./chart/) を選びます。React Native の端末 API は [react-native](./react-native/)、Expo SDK の permission と module 呼び出しは [expo](./expo/)、SwiftUI を含む macOS アプリの native 層は [macos-app](./macos-app/) を読みます。

## テストを置く場所

画面表示や focus、実際の browser submit を確認するテストはこのカテゴリの対象外です。それらは [ui](../foundation/ui/) または [e2e](../foundation/e2e/) に置きます。ここでは、UI が呼び出す関数に入力を渡し、返る state と副作用を直接検証します。その分、テストは短くなり、失敗したときに原因を入力規則か状態遷移かへ絞れます。

## 読み進め方

個別ページの Quickstart は、最小の state を作り、ひとつの成功または失敗を確認するところまでを示します。使い方では、非同期処理、初期値、再試行、依存する値を追加します。実プロバイダーとの違いと API の厳密な契約は概要とリファレンスで確認してください。
