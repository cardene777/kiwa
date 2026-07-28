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

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L150) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function createCircuitBreaker(client: NotificationClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L104) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L63) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>createNotificationClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L70) <code v-pre>packages/notification/src/client.ts</code>

provider 別のみ id prefix + status label に mock 差を出しつつ、 全 channel を共通 interface で 叩ける。 実 SDK (Firebase Admin / apns2 / twilio /

```ts
export declare function createNotificationClient(options?: CreateNotificationClientOptions): NotificationClient;
```

#### <code v-pre>parseNotificationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L24) <code v-pre>packages/notification/src/delivery.ts</code>

provider 別 event payload を統一 shape に正規化。 fcm=notification_id / apns=apns-id / twilio=MessageSid / sns=MessageId / in-app=id の field 差を吸収。

```ts
export declare function parseNotificationEvent(rawEvent: RawNotificationEvent): NormalizedNotificationEvent;
```

#### <code v-pre>sendInApp</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/inapp.ts#L8) <code v-pre>packages/notification/src/inapp.ts</code>

```ts
export declare function sendInApp(client: NotificationClient, msg: InAppMessage, _config?: InAppDispatchConfig): Promise<NotificationSendResult>;
```

#### <code v-pre>sendPush</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/push.ts#L12) <code v-pre>packages/notification/src/push.ts</code>

top-level helper — client.sendPush() の 1-shot 呼出 shim。 実 code base が `sendPush(client, msg)` の function-style を好む場合の代替 API。

```ts
export declare function sendPush(client: NotificationClient, msg: PushMessage, _config?: PushDeliveryConfig): Promise<NotificationSendResult>;
```

#### <code v-pre>sendPushBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L41) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushBatch(client: NotificationClient, messages: readonly PushMessage[], concurrency?: number): Promise<BatchSendResult>;
```

#### <code v-pre>sendPushIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L73) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushIdempotent(client: NotificationClient, msg: PushMessage, idempotencyKey: string, cache: IdempotencyCache): Promise<NotificationSendResult & {
    cached: boolean;
}>;
```

#### <code v-pre>sendPushObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L118) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushObservable(client: NotificationClient, msg: PushMessage, hooks: HookRegistry): Promise<NotificationSendResult>;
```

#### <code v-pre>sendPushWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L14) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export declare function sendPushWithRetry(client: NotificationClient, msg: PushMessage, options?: RetryOptions): Promise<NotificationSendResult & {
    attempts: number;
}>;
```

#### <code v-pre>sendSMS</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/sms.ts#L8) <code v-pre>packages/notification/src/sms.ts</code>

```ts
export declare function sendSMS(client: NotificationClient, msg: SmsMessage, _config?: SmsDeliveryConfig): Promise<NotificationSendResult>;
```

### 型

#### <code v-pre>BatchSendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L34) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface BatchSendResult {
    total: number;
    succeeded: number;
    failed: number;
    results: NotificationSendResult[];
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L143) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    sendPush: (msg: PushMessage) => Promise<NotificationSendResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L137) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L135) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L96) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L89) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface HookContext {
    event: SendHookEvent;
    message: PushMessage;
    result?: NotificationSendResult;
    error?: string;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L98) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface HookRegistry {
    register: (event: SendHookEvent, cb: HookCallback) => () => void;
    emit: (event: SendHookEvent, ctx: HookContext) => void;
    count: (event: SendHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L56) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface IdempotencyCache {
    get: (key: string) => NotificationSendResult | undefined;
    set: (key: string, value: NotificationSendResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### <code v-pre>InAppDispatchConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/inapp.ts#L3) <code v-pre>packages/notification/src/inapp.ts</code>

```ts
export interface InAppDispatchConfig {
    channel?: string;
    broadcast?: boolean;
}
```

#### <code v-pre>InAppMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L22) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface InAppMessage {
    userId: string;
    title: string;
    body: string;
    category?: string;
    metadata?: Record<string, string | number | boolean>;
}
```

#### <code v-pre>NormalizedNotificationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L10) <code v-pre>packages/notification/src/delivery.ts</code>

```ts
export interface NormalizedNotificationEvent {
    type: NotificationEventType;
    provider: NotificationProvider;
    channel: NotificationChannel;
    notificationId: string;
    timestamp: number;
    recipient?: string;
    reason?: string;
}
```

#### <code v-pre>NotificationChannel</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L4) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type NotificationChannel = 'push' | 'sms' | 'in-app';
```

#### <code v-pre>NotificationClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L43) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface NotificationClient {
    pushProvider: PushProvider;
    smsProvider: SmsProvider;
    sendPush: (msg: PushMessage) => Promise<NotificationSendResult>;
    sendSMS: (msg: SmsMessage) => Promise<NotificationSendResult>;
    sendInApp: (msg: InAppMessage) => Promise<NotificationSendResult>;
    dispatch: (channels: NotificationChannel[], payload: {
        push?: PushMessage;
        sms?: SmsMessage;
        inApp?: InAppMessage;
    }) => Promise<NotificationSendResult[]>;
    listSent: () => SentNotificationRecord[];
    clear: () => void;
}
```

#### <code v-pre>NotificationEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L3) <code v-pre>packages/notification/src/delivery.ts</code>

```ts
export type NotificationEventType = 'delivered' | 'opened' | 'clicked' | 'failed' | 'unknown';
```

#### <code v-pre>NotificationProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L3) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type NotificationProvider = PushProvider | SmsProvider | 'in-app';
```

#### <code v-pre>NotificationSendResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L30) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface NotificationSendResult {
    id: string;
    channel: NotificationChannel;
    provider: NotificationProvider;
    status: 'queued' | 'sent' | 'failed';
    acceptedAt: number;
    reason?: string;
}
```

#### <code v-pre>PushDeliveryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/push.ts#L3) <code v-pre>packages/notification/src/push.ts</code>

```ts
export interface PushDeliveryConfig {
    ttl?: number;
    priority?: 'normal' | 'high';
}
```

#### <code v-pre>PushMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L6) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface PushMessage {
    deviceToken: string;
    title: string;
    body: string;
    data?: Record<string, string>;
    badge?: number;
    sound?: string;
}
```

#### <code v-pre>PushProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L1) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type PushProvider = 'fcm' | 'apns';
```

#### <code v-pre>RawNotificationEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/delivery.ts#L5) <code v-pre>packages/notification/src/delivery.ts</code>

```ts
export interface RawNotificationEvent {
    provider: NotificationProvider;
    raw: Record<string, unknown>;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L8) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    onRetry?: (attempt: number) => void;
}
```

#### <code v-pre>SendHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/enhancements.ts#L87) <code v-pre>packages/notification/src/enhancements.ts</code>

```ts
export type SendHookEvent = 'before-send' | 'after-send' | 'error';
```

#### <code v-pre>SentNotificationRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L39) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface SentNotificationRecord extends NotificationSendResult {
    message: PushMessage | SmsMessage | InAppMessage;
}
```

#### <code v-pre>SmsDeliveryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/sms.ts#L3) <code v-pre>packages/notification/src/sms.ts</code>

```ts
export interface SmsDeliveryConfig {
    statusCallback?: string;
    maxPrice?: number;
}
```

#### <code v-pre>SmsMessage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L15) <code v-pre>packages/notification/src/client.ts</code>

```ts
export interface SmsMessage {
    to: string;
    from: string;
    body: string;
    mediaUrl?: string;
}
```

#### <code v-pre>SmsProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/notification/src/client.ts#L2) <code v-pre>packages/notification/src/client.ts</code>

```ts
export type SmsProvider = 'twilio' | 'sns';
```
<!-- kiwa-public-api:end -->
