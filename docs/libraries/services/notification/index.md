# @kiwa-lab/notification

`@kiwa-lab/notification` は、push、SMS、アプリ内通知を一つのテスト用 client で扱うライブラリです。FCM、APNs、Twilio、AWS SNS の provider 名と送信結果を保ったまま、単一チャネルと複数チャネルの送信を確認できます。

![通知をチャネルごとに投入し、送信結果と配信イベントを記録する流れ](/images/kiwa-docs/services/notification-overview.png)

## 対象にする契約

送信先、本文、provider を渡すと notification は `queued` として記録されます。複数 channel の dispatch は指定順に結果を返し、provider が拒否した channel は `failed` と理由を残します。これにより、一部の送信が失敗してもアプリケーションがどの channel を再試行または画面表示するかを test できます。

FCM、APNs、Twilio、SNS、in-app の delivery event は `parseNotificationEvent` で共通形式へ変換します。retry、batch、idempotency、観測 hook、circuit breaker は送信結果を扱う周辺処理として個別に検証してから dispatch へ組み込みます。

## 対応するチャネル

| channel | provider | 送信メソッド |
| --- | --- | --- |
| `push` | `fcm` または `apns` | `sendPush` |
| `sms` | `twilio` または `sns` | `sendSMS` |
| `in-app` | `in-app` | `sendInApp` |

## 使わない場面

この client は実際に Firebase、APNs、Twilio、SNS へ接続しません。端末 token、SMS の電話番号形式、provider の rate limit、実際の delivery receipt を保証する必要がある場合は、それぞれの provider sandbox を使う統合テストを別に用意してください。

送信結果の `queued` は provider が受理したことを模した状態であり、端末に表示されたことを意味しません。配信や開封の扱いは、別途受け取る provider event を `parseNotificationEvent` で検証します。

## 読み進める

[Quickstart](./quickstart) では push を送信して履歴を確認します。[使い方](./how-to) では複数チャネル、失敗、重複排除を扱います。引数、状態、補助 API は [リファレンス](./reference) を参照してください。
