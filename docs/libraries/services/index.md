# サービス連携

サービス連携カテゴリは、アプリケーションと外部サービスの間にある request、response、event、永続状態をプロセス内で検証します。実サービスの認証やネットワーク遅延を再現するものではありません。アプリケーションが送る payload と、失敗時に取る分岐を確定させるために使います。

## 外部へ送る処理

メール送信は [email](./email/)、Push、SMS、アプリ内通知は [notification](./notification/)、ファイルの保存は [upload](./upload/) を選びます。署名付きの受信イベントと再試行は [webhook](./webhook/)、双方向接続は [websocket](./websocket/) が対象です。決済状態や billing webhook は [payment](./payment/) を使います。

## データとバックグラウンド処理

キャッシュの hit、miss、expiry は [cache](./cache/)、ORM 経由の query と transaction は [orm](./orm/)、schema の適用と rollback は [migration](./migration/) で扱います。ジョブの遅延、再試行、失敗隔離は [queue](./queue/)、長時間処理の進行と補償は [workflow](./workflow/) を選んでください。

## 認証と通信の境界

session、OAuth、passkey は [auth](./auth/)、鍵、JWT、暗号化は [crypto](./crypto/)、feature flag の評価と rollout は [feature-flag](./feature-flag/) を参照します。GraphQL、gRPC、tRPC の server contract はそれぞれ [graphql](./graphql/)、[grpc](./grpc/)、[trpc](./trpc/) にあります。

## 読み進め方

個別ライブラリの Quickstart は、外部サービスの代わりになる client または mock を作り、アプリケーションの一操作を確認します。使い方で retry、timeout、webhook、複数の状態を追加してください。実サービス固有の権限、証明書、rate limit、network failure は対象外に明記しているため、必要な統合テストをそこで判断できます。
