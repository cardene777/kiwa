# @kiwa-lab/email リファレンス

## client

`createEmailClient` は provider と optional template table から `EmailClient` を作ります。`send` は `EmailSendResult` を返し、送信を queued record として保持します。`listSent` は送信履歴、`renderTemplate` は登録済み template の interpolation を返します。

## signature と event

`verifyWebhookSignature` は payload、signature、secret、provider から検証結果を返します。`parseDeliveryEvent` は provider 固有の raw payload を `NormalizedDeliveryEvent` へ正規化します。signature verification を通す前の raw event を application state に反映しないでください。

## delivery control

`sendWithRetry` は retry policy、`sendBatch` は複数 message、`sendIdempotent` は idempotency cache を扱います。`sendObservable` と hook registry は送信 lifecycle event を観測します。`createCircuitBreaker` は provider failure が続く場合の状態を扱います。

## 制約

client は実メール provider、DNS、inbox に接続しません。provider の signature algorithm と ID prefix は mock で再現しますが、実 provider の delivery timing や deliverability を保証するものではありません。送信履歴は client ごとに保持されます。

<!-- kiwa-public-api:start -->
## エラー診断

次の一覧は、公開 entry point から到達する実装が明示的に送出する Error と TypeError です。template literal の値は実行時の入力で置き換わります。

| 送出する message | 発生箇所 |
| --- | --- |
| `template not found: ${templateId}` | [packages/email/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L95) |

## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/email/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### `createCircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L22) `packages/email/src/circuit-breaker.ts`

circuit breaker: failureThreshold 連続 failure で state=open、 resetTimeoutMs 経過後 half-open で 1 回試行、 success で closed 復帰。

```ts
export declare function createCircuitBreaker(client: EmailClient, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### `createEmailClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L55) `packages/email/src/client.ts`

provider 別のみ mock 差 (id prefix / accepted status label) を持たせつつ、 全 API 共通 interface。 実 provider (Resend / SendGrid / Postmark / SES) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createEmailClient(options?: CreateEmailClientOptions): EmailClient;
```

#### `createHookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L22) `packages/email/src/observability.ts`

observability hook registry。 send 前 / 後 / error 3 phase で callback を発火。

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### `createIdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L11) `packages/email/src/idempotency.ts`

in-memory idempotency cache (production では Redis 等に差替想定)。

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### `parseDeliveryEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L23) `packages/email/src/delivery.ts`

provider 別 event payload を統一 shape に正規化。 実 provider が返す field 名の違い (Resend = type / SendGrid = event / Postmark = RecordType / SES = eventType) を吸収。

```ts
export declare function parseDeliveryEvent(rawEvent: RawDeliveryEvent): NormalizedDeliveryEvent;
```

#### `renderTemplate`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/template.ts#L13) `packages/email/src/template.ts`

`&#123;&#123;name&#125;&#125;` placeholder を data で置換する mustache-lite template。 実 provider の template engine (Handlebars / MJML) を差し替えても同じ signature で呼べる想定。

```ts
export declare function renderTemplate(template: string, data: EmailTemplateContext): TemplateRenderResult;
```

#### `sendBatch`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts#L19) `packages/email/src/batch.ts`

batch send with limited concurrency。 default concurrency = 5、 stopOnFirstFailure=true で最初の failure で中断。

```ts
export declare function sendBatch(client: EmailClient, messages: readonly EmailMessage[], options?: BatchSendOptions): Promise<BatchSendResult>;
```

#### `sendIdempotent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L32) `packages/email/src/idempotency.ts`

idempotent send: 同 idempotencyKey なら cached result を返却、 dup send 防止。 key 未登録なら send して cache に格納。

```ts
export declare function sendIdempotent(client: EmailClient, msg: EmailMessage, options: IdempotentSendOptions): Promise<EmailSendResult & {
    cached: boolean;
}>;
```

#### `sendObservable`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L48) `packages/email/src/observability.ts`

observable send: before-send / after-send / error hook を発火しつつ send。 hook throw は catch して error hook に流す (send 自体は継続)。

```ts
export declare function sendObservable(client: EmailClient, msg: EmailMessage, hooks: HookRegistry): Promise<EmailSendResult>;
```

#### `sendWithRetry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts#L19) `packages/email/src/retry.ts`

send with exponential backoff。 failed status で retry、 maxAttempts 到達で最後の result を返す。 default = maxAttempts 3 / initialDelayMs 100 / backoffMultiplier 2 / maxDelayMs 5000。

```ts
export declare function sendWithRetry(client: EmailClient, msg: EmailMessage, options?: RetryOptions): Promise<RetrySendResult>;
```

#### `verifyWebhookSignature`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/signature.ts#L15) `packages/email/src/signature.ts`

provider 別 webhook 署名を検証。 real provider (Resend / SendGrid / Postmark / SES) が 実際に送る signature format (sha256 hex / base64) を再現。

```ts
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string, provider: EmailProvider): SignatureVerifyResult;
```

### 型

#### `BatchSendOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts#L3) `packages/email/src/batch.ts`

```ts
export interface BatchSendOptions {
    concurrency?: number;
    stopOnFirstFailure?: boolean;
}
```

#### `BatchSendResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/batch.ts#L8) `packages/email/src/batch.ts`

```ts
export interface BatchSendResult {
    total: number;
    succeeded: number;
    failed: number;
    results: EmailSendResult[];
}
```

#### `CircuitBreaker`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L11) `packages/email/src/circuit-breaker.ts`

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    send: (msg: EmailMessage) => Promise<EmailSendResult & {
        circuitState: CircuitState;
    }>;
    reset: () => void;
    failureCount: () => number;
}
```

#### `CircuitBreakerOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L5) `packages/email/src/circuit-breaker.ts`

```ts
export interface CircuitBreakerOptions {
    failureThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### `CircuitState`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/circuit-breaker.ts#L3) `packages/email/src/circuit-breaker.ts`

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### `DeliveryEventType`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L3) `packages/email/src/delivery.ts`

```ts
export type DeliveryEventType = 'delivered' | 'bounced' | 'opened' | 'clicked' | 'complained' | 'unknown';
```

#### `EmailClient`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L35) `packages/email/src/client.ts`

```ts
export interface EmailClient {
    provider: EmailProvider;
    send: (msg: EmailMessage) => Promise<EmailSendResult>;
    renderTemplate: (templateId: string, data: EmailTemplateContext) => string;
    listSent: () => SentEmailRecord[];
    clear: () => void;
}
```

#### `EmailMessage`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L5) `packages/email/src/client.ts`

```ts
export interface EmailMessage {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    templateId?: string;
    templateData?: EmailTemplateContext;
    headers?: Record<string, string>;
    cc?: string[];
    bcc?: string[];
    replyTo?: string;
}
```

#### `EmailProvider`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L3) `packages/email/src/client.ts`

```ts
export type EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'ses';
```

#### `EmailSendResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L21) `packages/email/src/client.ts`

```ts
export interface EmailSendResult {
    id: string;
    provider: EmailProvider;
    status: 'queued' | 'sent' | 'failed';
    acceptedAt: number;
    reason?: string;
}
```

#### `EmailTemplateContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L19) `packages/email/src/client.ts`

```ts
export type EmailTemplateContext = Record<string, string | number | boolean>;
```

#### `HookCallback`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L13) `packages/email/src/observability.ts`

```ts
export type HookCallback = (ctx: HookContext) => void | Promise<void>;
```

#### `HookContext`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L5) `packages/email/src/observability.ts`

```ts
export interface HookContext {
    event: SendHookEvent;
    message: EmailMessage;
    result?: EmailSendResult;
    error?: string;
    durationMs?: number;
}
```

#### `HookRegistry`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L15) `packages/email/src/observability.ts`

```ts
export interface HookRegistry {
    register: (event: SendHookEvent, cb: HookCallback) => () => void;
    emit: (event: SendHookEvent, ctx: HookContext) => Promise<void>;
    count: (event: SendHookEvent) => number;
}
```

#### `IdempotencyCache`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L3) `packages/email/src/idempotency.ts`

```ts
export interface IdempotencyCache {
    get: (key: string) => EmailSendResult | undefined;
    set: (key: string, value: EmailSendResult) => void;
    size: () => number;
    clear: () => void;
}
```

#### `IdempotentSendOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/idempotency.ts#L23) `packages/email/src/idempotency.ts`

```ts
export interface IdempotentSendOptions {
    cache: IdempotencyCache;
    idempotencyKey: string;
}
```

#### `NormalizedDeliveryEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L10) `packages/email/src/delivery.ts`

```ts
export interface NormalizedDeliveryEvent {
    type: DeliveryEventType;
    provider: EmailProvider;
    emailId: string;
    timestamp: number;
    recipient?: string;
    reason?: string;
}
```

#### `RawDeliveryEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/delivery.ts#L5) `packages/email/src/delivery.ts`

```ts
export interface RawDeliveryEvent {
    provider: EmailProvider;
    raw: Record<string, unknown>;
}
```

#### `RetryOptions`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts#L3) `packages/email/src/retry.ts`

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    maxDelayMs?: number;
    onRetry?: (attempt: number, lastError: string) => void;
}
```

#### `RetrySendResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/retry.ts#L11) `packages/email/src/retry.ts`

```ts
export interface RetrySendResult extends EmailSendResult {
    attempts: number;
}
```

#### `SendHookEvent`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/observability.ts#L3) `packages/email/src/observability.ts`

```ts
export type SendHookEvent = 'before-send' | 'after-send' | 'error';
```

#### `SentEmailRecord`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L29) `packages/email/src/client.ts`

```ts
export interface SentEmailRecord extends EmailSendResult {
    message: EmailMessage;
    renderedHtml?: string;
    renderedText?: string;
}
```

#### `SignatureVerifyResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/signature.ts#L4) `packages/email/src/signature.ts`

```ts
export interface SignatureVerifyResult {
    valid: boolean;
    provider: EmailProvider;
    algorithm: string;
    reason?: string;
}
```

#### `TemplateRenderResult`

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/email/src/template.ts#L3) `packages/email/src/template.ts`

```ts
export interface TemplateRenderResult {
    html: string;
    variables: string[];
    missing: string[];
}
```
<!-- kiwa-public-api:end -->
