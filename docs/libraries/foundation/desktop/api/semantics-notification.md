---
title: "@kiwa-lab/desktop semantics-notification の API 契約"
---

# <code v-pre>@kiwa-lab/desktop</code> <code v-pre>semantics-notification</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>dismissNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L106) <code v-pre>packages/desktop/src/semantics/notification.ts</code>

```ts
export declare function dismissNotification(session: NotificationSession): AxisStep<NotificationState>;
```

#### <code v-pre>displayNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L74) <code v-pre>packages/desktop/src/semantics/notification.ts</code>

```ts
export declare function displayNotification(session: NotificationSession, displayedAtMs: number): AxisStep<NotificationState>;
```

#### <code v-pre>invokeNotificationAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L90) <code v-pre>packages/desktop/src/semantics/notification.ts</code>

```ts
export declare function invokeNotificationAction(session: NotificationSession, actionId: string): AxisStep<NotificationState>;
```

#### <code v-pre>scheduleNotification</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L45) <code v-pre>packages/desktop/src/semantics/notification.ts</code>

```ts
export declare function scheduleNotification(input: {
    target: DesktopTarget;
    notificationId: string;
    title: string;
    scheduledAtMs: number;
}): NotificationSession;
```

### 型

#### <code v-pre>NotificationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L14) <code v-pre>packages/desktop/src/semantics/notification.ts</code>

```ts
export interface NotificationSession {
    target: DesktopTarget;
    notificationId: string;
    title: string;
    state: NotificationState;
    scheduledAtMs: number;
    displayedAtMs: number;
    actions: string[];
    dismissed: boolean;
    history: AxisStep<NotificationState>[];
}
```

#### <code v-pre>NotificationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/desktop/src/semantics/notification.ts#L7) <code v-pre>packages/desktop/src/semantics/notification.ts</code>

Notification axis (v0.2) — schedule + display + action + dismiss の 4 step 遷移。 macOS UserNotifications + Windows Toast + Linux libnotify の 3 target を uniform 扱い。

```ts
export type NotificationState = 'idle' | 'scheduled' | 'displayed' | 'action-invoked' | 'dismissed';
```
