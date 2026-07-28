---
title: "@kiwa-lab/notification inapp の API 契約"
---

# <code v-pre>@kiwa-lab/notification</code> <code v-pre>inapp</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/inapp.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sendInApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/inapp.ts#L8) <code v-pre>packages/notification/src/inapp.ts</code>

```ts
export declare function sendInApp(client: NotificationClient, msg: InAppMessage, _config?: InAppDispatchConfig): Promise<NotificationSendResult>;
```

### 型

#### <code v-pre>InAppDispatchConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/inapp.ts#L3) <code v-pre>packages/notification/src/inapp.ts</code>

```ts
export interface InAppDispatchConfig {
    channel?: string;
    broadcast?: boolean;
}
```
