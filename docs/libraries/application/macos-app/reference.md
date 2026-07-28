# macos-app リファレンス

## API を選ぶ

画面操作を含む test は `createMacAppEnv` から始めます。mode、bundle、window、root view を一つの環境に閉じ込められるため、test 間で操作履歴や通知の記録が混ざりません。`simulateUserInteraction` は target ID を見つけ、操作を dispatch できたかを返します。これだけでは SwiftUI の state や AppKit の responder chain は実行されないため、操作後の state を検証するにはアプリケーション側の callback も test します。

accessibility の role と label を確認する場合は `captureAccessibilityTree`、capture 要求の領域と format を固定する場合は `mockScreencap` を使います。前者は view type から role を推定し、後者は実ピクセルを撮影しません。通知の payload を組み立てる処理には `emitUserNotification` を使い、schedule の成否、bundle ID、event log を確認します。

## 設定

`createMacAppEnv` は `mode`、`bundleId`、`windowTitle`、`initialView`、`now` を受け取ります。mode は `swiftui` または `appkit` です。

## 結果の分岐

操作結果は dispatched と handled を別に持ちます。通知と view 操作は eventLog に記録されるため、実行されたこととアプリ側が処理したことを分けて検証します。

`mockScreencap` の既定領域は window 全体です。PNG は8-byte signature、JPEG は2-byte SOI marker から始まり、`bytesLength` と region を assertion できます。画像の実ピクセルや font rendering を比較する API ではありません。

`captureAccessibilityTree` は view tree を走査し、`totalNodes` と capture time を返します。role は type 名からの推定です。`emitUserNotification` は非空 title と body を要求し、成功時は bundle ID と schedule time を返します。

## 後始末と制約

環境は event log とビュー木を保持します。テストごとに新しい環境を作ってください。操作は event log への記録までで、SwiftUI の state 更新や AppKit の responder chain は実行しません。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| <code v-pre>rate limit $&#123;options.maxRequests&#125;/$&#123;options.windowMs&#125;ms exceeded</code> | [packages/macos-app/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L57) |
| <code v-pre>circuit breaker open</code> | [packages/macos-app/src/resilience.ts](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/resilience.ts#L72) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [accessibility.ts](./api/accessibility) | 1 | 3 |
| [env.ts](./api/env) | 1 | 6 |
| [interaction.ts](./api/interaction) | 1 | 3 |
| [notification.ts](./api/notification) | 1 | 3 |
| [resilience.ts](./api/resilience) | 7 | 7 |
| [screencap.ts](./api/screencap) | 1 | 3 |

<!-- kiwa-public-api:end -->
