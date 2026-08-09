# フレームワーク

このカテゴリは、Web フレームワークの route、loader、action、middleware、server handler をサーバー起動なしで検証します。アプリケーション固有の処理だけを呼び、入力した request と返った response を確認するため、実ブラウザでの見た目や hydration の確認とは分けて使います。

## 使用中のフレームワークから選ぶ

Next.js は [nextjs](./nextjs/)。Hono の middleware と RPC は [hono](./hono/) を参照してください。

SolidStart の server function と routing は [solidstart](./solidstart/) が担当します。edge runtime の標準 Request と Response を直接扱う処理は [edge](./edge/) から始めます。

## ここで検証すること

Quickstart では handler に request を渡し、status、header、body を確認します。使い方では、認証、cookie、route parameter、例外、redirect を扱います。フレームワーク固有の実行順序を再現する範囲は各概要に明記しています。Node や edge の本物の runtime、bundle、hydration、ブラウザ互換性はこのモックだけでは証明できないため、必要な箇所は E2E テストへ残してください。

## 読み進め方

使っているフレームワークの Quickstart を一度動かしたら、実装中の route と同じ request を使い方ページの例へ置き換えます。API の全引数や返り値を調べるときだけリファレンスを開くと、情報を探しやすくなります。
