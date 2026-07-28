# @kiwa-lab/webhook

`@kiwa-lab/webhook` は、Webhook の受信処理をアプリケーションの外へ出さずに検証する test harness です。外部サービスの request を受けたコードでは、最初に署名を確かめ、次に payload を共通のイベントに読み替え、最後に業務 handler へ渡します。この三段階のどこかが曖昧だと、改変された request を受理したり、同じ配送を二度処理したりします。この library は、その境界をテストで明示します。

<img src="/images/kiwa-docs/services/webhook-overview.webp" alt="Webhook の署名を検証し、受理した payload をイベントへ変換する流れ" width="1717" height="916" loading="lazy" decoding="async">

## 受信から業務処理までを分けて確かめる

`createWebhookVerifier` に provider と secret を渡すと、`verify` は raw body の署名検証、JSON の読み取り、イベントの正規化、受信記録を一度の呼び出しで行います。検証を通った outcome だけが `event` を持つため、業務コードは `status === "verified"` を確認してから処理を始められます。拒否された request も `listDelivered` で追跡できるので、失敗した request を黙って捨てる test にはなりません。

正規化後の `NormalizedWebhookEvent` は、provider 固有の JSON をそのまま業務コードへ渡さないための境界です。たとえば Stripe の支払い完了は `payment.succeeded`、GitHub の push は `push` になり、どちらも event ID、発生時刻、必要なら対象リソースを持ちます。業務 handler は provider ごとのネスト構造ではなく、この共通 shape を受け取ります。

## 署名を正しい元データで検証する

署名の対象は、JSON を parse して再度文字列化した値ではありません。受信したままの raw body です。空白、キーの並び、改行の一つでも変われば digest は一致しなくなります。実際の framework で raw body を取り出す処理は endpoint integration test で確認し、この library の test ではその raw body を文字列として固定します。

Stripe は timestamp と raw body を結合して HMAC SHA256 を計算します。GitHub は raw body の HMAC SHA256、Slack は `v0` を前置した raw body の HMAC SHA256、Twilio は raw body の HMAC SHA1 を使います。`createWebhookVerifier` はこの差を隠しますが、テスト内で署名を組み立てると、実装がどの入力に依存するかを明確にできます。

## 一度だけ安全に配送する

検証後の handler は外部 API やデータベースを呼ぶことがあります。一時的な失敗を再試行する場合は `dispatchWithRetry` を使います。テストでは `sleep` を注入して待機をなくし、何回失敗して何回目に成功したかを assertion します。全試行が失敗した場合、関数は例外を隠さず `delivered: false` と試行履歴を返します。DLQ、アラート、実際の再送キューは、その結果を受け取るアプリケーションの責務です。

同じ provider が同じ delivery を再送するケースには `verifyIdempotent` を使います。これはプロセス内 cache に最初の outcome を保存し、同じ key の二回目では verifier を実行せず cached result を返します。テストでは delivery ID を key にして重複処理を防げます。本番の複数 process 間での排他、TTL、永続化は Redis やデータベースなど、アプリケーションの共有ストアで設計してください。

## この library が扱う範囲

この library は署名、payload の読み替え、再試行、重複排除を決定的にテストするためのものです。TLS、IP allowlist、実 HTTP header の到着、provider が行うネットワーク再送、Stripe や GitHub の sandbox との接続を置き換えるものではありません。公開 endpoint の設定と provider 側の契約は、実際の framework と test account を使う integration test で別に確認します。Twilio の URL と form parameter を含む本番の完全な署名計算も対象外です。

## 読み進める

[Quickstart](./quickstart) では Stripe request を署名して受理する最小 test を作ります。[使い方](./how-to) では GitHub request の改変拒否、retry、重複排除を一つの実行可能な test file として扱います。公開 API の引数、既定値、保持する状態は [リファレンス](./reference) を参照してください。
