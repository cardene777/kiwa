# @kiwa-lab/webhook リファレンス

## verifier

`createWebhookVerifier` は `secret` を必須とし、`provider`、`now`、`idSeed`、`toleranceSec` を受け取ります。provider の既定値は `stripe` です。

| provider | outcome id の prefix | 既定の署名 algorithm |
| --- | --- | --- |
| `stripe` | `evt-` | HMAC SHA256 |
| `github` | `gh-` | HMAC SHA256 |
| `slack` | `sl-` | HMAC SHA256 |
| `twilio` | `tw-` | HMAC SHA1 |

`verify(incoming)` は `WebhookVerifyOutcome` を返します。`status` は `verified` または `rejected` で、拒否理由がある場合は `reason` を含みます。署名と JSON parse が通った場合だけ `event` を含みます。`listDelivered()` は raw incoming と `signatureResult` を含む `DeliveredWebhookRecord[]` のコピーを返し、`clear()` は記録を消去します。

## 署名と payload

`verifyWebhookSignature(payload, signature, secret, provider, options)` は署名だけを検証し、`valid`、`provider`、`algorithm`、必要なら `reason` を返します。Stripe の timestamp を検証するには `toleranceSec` を指定し、テストでは `now` を固定します。

`parseWebhookPayload({ provider, raw })` は `NormalizedWebhookEvent` を返します。共通フィールドは `type`、`provider`、`eventId`、`occurredAt`、任意の `resource` です。未知の provider event は `type: "unknown"` になります。

## 配送と batch

`dispatchWithRetry(handler, event, options)` は handler の実行結果を `DispatchRetryResult` として返します。`maxAttempts` の既定値は三、`initialDelayMs` は百、`backoffFactor` は二です。`attempts` には各試行の成功、時間、失敗理由が入ります。

`verifyWithRetry` は検証の retry 用 helper、`verifyBatch` は複数の incoming を順に検証する helper です。`verifyBatch` の `stopOnFirstRejection` を true にすると最初の拒否で停止します。

## 補助機能

`createIdempotencyCache` と `verifyIdempotent` は outcome を key でキャッシュします。`createHookRegistry` と `verifyObservable` は検証の観測 hook を付けるための API です。`createCircuitBreaker` は失敗数と reset 時間を扱います。これらはすべてプロセス内の状態を持てるため、テスト間で共有しないでください。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>createCircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L19) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

circuit breaker: rejectionThreshold 連続 rejection で open、 resetTimeoutMs 後 half-open。

```ts
export declare function createCircuitBreaker(verifier: WebhookVerifier, options?: CircuitBreakerOptions): CircuitBreaker;
```

#### <code v-pre>createHookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L20) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export declare function createHookRegistry(): HookRegistry;
```

#### <code v-pre>createIdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts#L10) <code v-pre>packages/webhook/src/idempotency.ts</code>

```ts
export declare function createIdempotencyCache(): IdempotencyCache;
```

#### <code v-pre>createWebhookVerifier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L47) <code v-pre>packages/webhook/src/client.ts</code>

provider 別 verifier を作成。 verify() 呼出で signature + payload parse + record を atomic に実行し、 listDelivered() で受信ログを取り出せる in-process mock。 実 provider (Stripe Events API / GitHub webhook / Slack Events API / Twilio) の signature 検証と event shape を同じ signature で再現する。

```ts
export declare function createWebhookVerifier(options: CreateWebhookVerifierOptions): WebhookVerifier;
```

#### <code v-pre>dispatchWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L28) <code v-pre>packages/webhook/src/delivery.ts</code>

exponential backoff で handler を retry する delivery loop。 実 webhook subscriber (Stripe / GitHub の redelivery loop) を再現するための test helper。 sleep は injectable なので test では即 resolve で回せる。

```ts
export declare function dispatchWithRetry(handler: (event: NormalizedWebhookEvent) => Promise<void>, event: NormalizedWebhookEvent, options?: DispatchRetryOptions): Promise<DispatchRetryResult>;
```

#### <code v-pre>parseWebhookPayload</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L34) <code v-pre>packages/webhook/src/payload.ts</code>

provider 別 event payload を統一 shape に正規化。 field 名の違い (Stripe = type / GitHub = X-GitHub-Event header header → raw.event / Slack = event.type / Twilio = MessageStatus) を吸収する。

```ts
export declare function parseWebhookPayload(rawEvent: RawWebhookEvent): NormalizedWebhookEvent;
```

#### <code v-pre>verifyBatch</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts#L15) <code v-pre>packages/webhook/src/batch.ts</code>

batch verify: 複数 incoming webhook を一括 verify、 stopOnFirstRejection で中断。

```ts
export declare function verifyBatch(verifier: WebhookVerifier, incomings: readonly IncomingWebhook[], options?: BatchVerifyOptions): BatchVerifyResult;
```

#### <code v-pre>verifyIdempotent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts#L21) <code v-pre>packages/webhook/src/idempotency.ts</code>

idempotent verify: event id (or dedup key) で dup detection、 cached outcome 返却。

```ts
export declare function verifyIdempotent(verifier: WebhookVerifier, incoming: IncomingWebhook, idempotencyKey: string, cache: IdempotencyCache): WebhookVerifyOutcome & {
    deduplicated: boolean;
};
```

#### <code v-pre>verifyObservable</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L38) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export declare function verifyObservable(verifier: WebhookVerifier, incoming: IncomingWebhook, hooks: HookRegistry): WebhookVerifyOutcome;
```

#### <code v-pre>verifyWebhookSignature</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts#L24) <code v-pre>packages/webhook/src/signature.ts</code>

provider 別 webhook 署名を検証。 実 provider が送る signature format を再現。 - stripe = `t=&lt;ts&gt;,v1=&lt;hex&gt;` 形式、 sha256 hex、 toleranceSec 内のみ valid - github = `sha256=&lt;hex&gt;` 形式、 sha256 hex - slack = `v0=&lt;hex&gt;` 形式 (`v0:&lt;ts&gt;:&lt;body&gt;` を base string に)、 sha256 hex - twilio = base64、 sha1 (URL + form params) - mock では payload そのままを署名対象にする

```ts
export declare function verifyWebhookSignature(payload: string, signature: string, secret: string, provider: WebhookProvider, options?: VerifySignatureOptions): SignatureVerifyResult;
```

#### <code v-pre>verifyWithRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts#L15) <code v-pre>packages/webhook/src/retry.ts</code>

verify with exponential backoff (transient signature failure retry)。

```ts
export declare function verifyWithRetry(verifier: WebhookVerifier, incoming: IncomingWebhook, options?: RetryOptions): Promise<RetryVerifyResult>;
```

### 型

#### <code v-pre>BatchVerifyOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts#L3) <code v-pre>packages/webhook/src/batch.ts</code>

```ts
export interface BatchVerifyOptions {
    stopOnFirstRejection?: boolean;
}
```

#### <code v-pre>BatchVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/batch.ts#L7) <code v-pre>packages/webhook/src/batch.ts</code>

```ts
export interface BatchVerifyResult {
    total: number;
    verified: number;
    rejected: number;
    results: WebhookVerifyOutcome[];
}
```

#### <code v-pre>CircuitBreaker</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L11) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreaker {
    state: () => CircuitState;
    verify: (incoming: IncomingWebhook) => WebhookVerifyOutcome & {
        circuitState: CircuitState;
    };
    reset: () => void;
    rejectionCount: () => number;
}
```

#### <code v-pre>CircuitBreakerOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L5) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

```ts
export interface CircuitBreakerOptions {
    rejectionThreshold?: number;
    resetTimeoutMs?: number;
    now?: () => number;
}
```

#### <code v-pre>CircuitState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/circuit-breaker.ts#L3) <code v-pre>packages/webhook/src/circuit-breaker.ts</code>

```ts
export type CircuitState = 'closed' | 'open' | 'half-open';
```

#### <code v-pre>DeliveredWebhookRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L21) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface DeliveredWebhookRecord extends WebhookVerifyOutcome {
    raw: IncomingWebhook;
    signatureResult: SignatureVerifyResult;
}
```

#### <code v-pre>DispatchAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L10) <code v-pre>packages/webhook/src/delivery.ts</code>

```ts
export interface DispatchAttempt {
    attempt: number;
    ok: boolean;
    durationMs: number;
    error?: string;
}
```

#### <code v-pre>DispatchRetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L3) <code v-pre>packages/webhook/src/delivery.ts</code>

```ts
export interface DispatchRetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
    sleep?: (ms: number) => Promise<void>;
}
```

#### <code v-pre>DispatchRetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/delivery.ts#L17) <code v-pre>packages/webhook/src/delivery.ts</code>

```ts
export interface DispatchRetryResult {
    delivered: boolean;
    attempts: DispatchAttempt[];
    totalDurationMs: number;
}
```

#### <code v-pre>HookCallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L12) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export type HookCallback = (ctx: HookContext) => void;
```

#### <code v-pre>HookContext</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L5) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export interface HookContext {
    event: VerifyHookEvent;
    incoming: IncomingWebhook;
    outcome?: WebhookVerifyOutcome;
    durationMs?: number;
}
```

#### <code v-pre>HookRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L14) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export interface HookRegistry {
    register: (event: VerifyHookEvent, cb: HookCallback) => () => void;
    emit: (event: VerifyHookEvent, ctx: HookContext) => void;
    count: (event: VerifyHookEvent) => number;
}
```

#### <code v-pre>IdempotencyCache</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/idempotency.ts#L3) <code v-pre>packages/webhook/src/idempotency.ts</code>

```ts
export interface IdempotencyCache {
    seen: (key: string) => boolean;
    mark: (key: string, outcome: WebhookVerifyOutcome) => void;
    get: (key: string) => WebhookVerifyOutcome | undefined;
    clear: () => void;
}
```

#### <code v-pre>IncomingWebhook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L6) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface IncomingWebhook {
    payload: string;
    signature: string;
    headers?: Record<string, string>;
}
```

#### <code v-pre>NormalizedWebhookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L21) <code v-pre>packages/webhook/src/payload.ts</code>

```ts
export interface NormalizedWebhookEvent {
    type: WebhookEventType;
    provider: WebhookProvider;
    eventId: string;
    occurredAt: number;
    resource?: string;
}
```

#### <code v-pre>RawWebhookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L16) <code v-pre>packages/webhook/src/payload.ts</code>

```ts
export interface RawWebhookEvent {
    provider: WebhookProvider;
    raw: Record<string, unknown>;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts#L3) <code v-pre>packages/webhook/src/retry.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    onRetry?: (attempt: number, reason: string) => void;
}
```

#### <code v-pre>RetryVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/retry.ts#L10) <code v-pre>packages/webhook/src/retry.ts</code>

```ts
export interface RetryVerifyResult extends WebhookVerifyOutcome {
    attempts: number;
}
```

#### <code v-pre>SignatureVerifyResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts#L4) <code v-pre>packages/webhook/src/signature.ts</code>

```ts
export interface SignatureVerifyResult {
    valid: boolean;
    provider: WebhookProvider;
    algorithm: string;
    reason?: string;
}
```

#### <code v-pre>VerifyHookEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/observability.ts#L3) <code v-pre>packages/webhook/src/observability.ts</code>

```ts
export type VerifyHookEvent = 'before-verify' | 'after-verify' | 'rejected';
```

#### <code v-pre>VerifySignatureOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/signature.ts#L11) <code v-pre>packages/webhook/src/signature.ts</code>

```ts
export interface VerifySignatureOptions {
    toleranceSec?: number;
    now?: () => number;
}
```

#### <code v-pre>WebhookEventType</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/payload.ts#L3) <code v-pre>packages/webhook/src/payload.ts</code>

```ts
export type WebhookEventType = 'payment.succeeded' | 'payment.failed' | 'subscription.updated' | 'push' | 'pull_request' | 'issues' | 'message' | 'app_mention' | 'sms.delivered' | 'sms.failed' | 'unknown';
```

#### <code v-pre>WebhookProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L4) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export type WebhookProvider = 'stripe' | 'github' | 'slack' | 'twilio';
```

#### <code v-pre>WebhookVerifier</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L26) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface WebhookVerifier {
    provider: WebhookProvider;
    verify: (incoming: IncomingWebhook) => WebhookVerifyOutcome;
    listDelivered: () => DeliveredWebhookRecord[];
    clear: () => void;
}
```

#### <code v-pre>WebhookVerifyOutcome</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/client.ts#L12) <code v-pre>packages/webhook/src/client.ts</code>

```ts
export interface WebhookVerifyOutcome {
    id: string;
    provider: WebhookProvider;
    status: 'verified' | 'rejected';
    reason?: string;
    event?: NormalizedWebhookEvent;
    receivedAt: number;
}
```
<!-- kiwa-public-api:end -->
