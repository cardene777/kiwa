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
| <code v-pre>template not found: $&#123;templateId&#125;</code> | [packages/email/src/client.ts](https://github.com/cardene777/kiwa/blob/main/packages/email/src/client.ts#L95) |

## API 契約

[公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/email/src/index.ts) から同期しています。宣言元ごとにページを分けています。

| 宣言元 | 値 | 型 |
| --- | --- | --- |
| [batch.ts](./api/batch) | 1 | 2 |
| [circuit-breaker.ts](./api/circuit-breaker) | 1 | 3 |
| [client.ts](./api/client) | 1 | 6 |
| [delivery.ts](./api/delivery) | 1 | 3 |
| [idempotency.ts](./api/idempotency) | 2 | 2 |
| [observability.ts](./api/observability) | 2 | 4 |
| [retry.ts](./api/retry) | 1 | 2 |
| [signature.ts](./api/signature) | 1 | 1 |
| [template.ts](./api/template) | 1 | 1 |

<!-- kiwa-public-api:end -->
