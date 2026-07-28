# @kiwa-lab/notification リファレンス

## client

`createNotificationClient(options)` の `pushProvider` は `fcm` または `apns`、`smsProvider` は `twilio` または `sns` です。`now` と `idSeed` は結果を決定的にするテスト用の option、`failOn` は送信を失敗させる predicate です。

`sendPush`、`sendSMS`、`sendInApp` はそれぞれ `NotificationSendResult` を返します。status は `queued`、`sent`、`failed` の union ですが、現在の mock の通常送信は `queued` を返します。`dispatch` は順番に実行した result の配列を返します。

`listSent` は `SentNotificationRecord[]` のコピー、`clear` は送信履歴の削除に使います。

## message

| channel | 必須 field | 任意 field |
| --- | --- | --- |
| push | `deviceToken` `title` `body` | `data` `badge` `sound` |
| SMS | `to` `from` `body` | `mediaUrl` |
| in-app | `userId` `title` `body` | `category` `metadata` |

関数形式の `sendPush`、`sendSMS`、`sendInApp` は client method を呼ぶ shim です。`PushDeliveryConfig`、`SmsDeliveryConfig`、`InAppDispatchConfig` は受け取れますが、現在の in-memory mock はこれらの provider 配送設定を適用しません。

## 配送 event

`parseNotificationEvent({ provider, raw })` は provider 固有の event を `NormalizedNotificationEvent` に変換します。FCM と APNs は push、Twilio と SNS は SMS、`in-app` は in-app channel になります。provider が保持する notification id、時刻、任意の recipient と reason を共通の field として返します。

## 補助 API

`sendPushWithRetry` は failed result に対して既定三回まで指数的に待機して再送します。`sendPushBatch` は既定 concurrency 五で push を処理し、成功と失敗を集計します。

`sendPushIdempotent` は `IdempotencyCache` に最初の result を保存します。`sendPushObservable` は before-send、after-send、error の hook を呼びます。`createCircuitBreaker` は failed result の連続回数を追跡し、threshold を超えると `open` にして送信を拒否します。

<!-- kiwa-public-api:start -->

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [client.ts](./api/client) | 1 | 10 |
| [delivery.ts](./api/delivery) | 1 | 3 |
| [enhancements.ts](./api/enhancements) | 7 | 10 |
| [inapp.ts](./api/inapp) | 1 | 1 |
| [push.ts](./api/push) | 1 | 1 |
| [sms.ts](./api/sms) | 1 | 1 |

<!-- kiwa-public-api:end -->
