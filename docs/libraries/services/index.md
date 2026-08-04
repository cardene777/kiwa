# サービス連携

サービス連携カテゴリは、アプリケーションと外部サービスの間にある request、response、event、永続状態をプロセス内で検証します。実サービスの認証やネットワーク遅延を再現するものではありません。アプリケーションが送る payload と、失敗時に取る分岐を確定させるために使います。

## 外部へ送る処理


## データとバックグラウンド処理

キャッシュの hit、miss、expiry は [cache](./cache/)、ORM 経由の query と transaction は [orm](./orm/) で扱います。ジョブの遅延、再試行、失敗隔離は [queue](./queue/) を選んでください。

## 認証の境界

session、OAuth、passkey は [auth](./auth/) を参照します。

## 読み進め方

個別ライブラリの Quickstart は、外部サービスの代わりになる client または mock を作り、アプリケーションの一操作を確認します。使い方で retry、timeout、webhook、複数の状態を追加してください。実サービス固有の権限、証明書、rate limit、network failure は対象外に明記しているため、必要な統合テストをそこで判断できます。
