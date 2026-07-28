---
title: "@kiwa-lab/notification push の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/notification</code> <code v-pre>push</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/push.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>sendPush</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/push.ts#L12) <code v-pre>packages/notification/src/push.ts</code>

top-level helper — client.sendPush() の 1-shot 呼出 shim。 実 code base が `sendPush(client, msg)` の function-style を好む場合の代替 API。

```ts
export declare function sendPush(client: NotificationClient, msg: PushMessage, _config?: PushDeliveryConfig): Promise<NotificationSendResult>;
```

### 型

#### <code v-pre>PushDeliveryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/push.ts#L3) <code v-pre>packages/notification/src/push.ts</code>

```ts
export interface PushDeliveryConfig {
    ttl?: number;
    priority?: 'normal' | 'high';
}
```
