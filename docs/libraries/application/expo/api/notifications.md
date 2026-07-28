---
title: "@kiwa-lab/expo notifications の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/expo</code> <code v-pre>notifications</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dispatchNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L25) <code v-pre>packages/expo/src/notifications.ts</code>

expo-notifications の scheduleNotificationAsync / presentNotificationAsync mock。 env が保持する scheduled list に push、 identifier を返す。

```ts
export declare function dispatchNotification(env: {
    scheduled: ScheduledNotification[];
    nowFn: () => number;
    nextId: () => string;
}, payload: NotificationPayload): NotificationDispatchResult;
```

### 型

#### <code v-pre>NotificationDispatchResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L15) <code v-pre>packages/expo/src/notifications.ts</code>

```ts
export interface NotificationDispatchResult {
    identifier: string;
    status: 'scheduled' | 'delivered' | 'failed';
    reason?: string;
}
```

#### <code v-pre>NotificationPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L1) <code v-pre>packages/expo/src/notifications.ts</code>

```ts
export interface NotificationPayload {
    title: string;
    body: string;
    data?: Record<string, unknown>;
    trigger?: {
        seconds: number;
    } | {
        channelId: string;
    } | null;
    channelId?: string;
}
```

#### <code v-pre>ScheduledNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/expo/src/notifications.ts#L9) <code v-pre>packages/expo/src/notifications.ts</code>

```ts
export interface ScheduledNotification {
    identifier: string;
    payload: NotificationPayload;
    scheduledAt: number;
}
```
