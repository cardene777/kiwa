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

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/webhook/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [batch.ts](./api/batch) | 1 | 2 |
| [circuit-breaker.ts](./api/circuit-breaker) | 1 | 3 |
| [client.ts](./api/client) | 1 | 5 |
| [delivery.ts](./api/delivery) | 1 | 3 |
| [idempotency.ts](./api/idempotency) | 2 | 1 |
| [observability.ts](./api/observability) | 2 | 4 |
| [payload.ts](./api/payload) | 1 | 3 |
| [retry.ts](./api/retry) | 1 | 2 |
| [signature.ts](./api/signature) | 1 | 2 |

<!-- kiwa-public-api:end -->
