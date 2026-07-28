---
title: "@kiwa-lab/macos-app notification の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/macos-app</code> <code v-pre>notification</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>emitUserNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L35) <code v-pre>packages/macos-app/src/notification.ts</code>

UserNotifications framework の schedule API 相当を mock。 実 UNUserNotificationCenter は 起動せず、 env.eventLog に notification schedule を記録して user が listSent 相当で assert 可能にする。

```ts
export declare function emitUserNotification(env: MacAppEnv, notification: UserNotification): NotificationResult;
```

### 型

#### <code v-pre>NotificationAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L3) <code v-pre>packages/macos-app/src/notification.ts</code>

```ts
export interface NotificationAction {
    id: string;
    title: string;
    destructive?: boolean;
}
```

#### <code v-pre>NotificationResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L20) <code v-pre>packages/macos-app/src/notification.ts</code>

```ts
export interface NotificationResult {
    id: string;
    scheduled: boolean;
    scheduledAt: number;
    bundleId: string;
    reason?: string;
}
```

#### <code v-pre>UserNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/macos-app/src/notification.ts#L9) <code v-pre>packages/macos-app/src/notification.ts</code>

```ts
export interface UserNotification {
    id?: string;
    title: string;
    body: string;
    subtitle?: string;
    sound?: string;
    category?: string;
    actions?: NotificationAction[];
    userInfo?: Record<string, string | number | boolean>;
}
```
