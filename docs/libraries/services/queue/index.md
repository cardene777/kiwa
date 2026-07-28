# @kiwa-lab/queue

`@kiwa-lab/queue` は、非同期ジョブとメッセージ処理をテストするためのアダプターです。アプリケーションが登録する処理と投入するイベントを同じテスト内で動かし、完了、失敗、再試行、デッドレター、停止までを結果として検証します。

<img src="/images/kiwa-docs/services/queue-overview.webp" alt="キューを投入して処理し、失敗時には再試行して停止する流れ" width="1693" height="929" loading="lazy" decoding="async">

## 対象にする実行基盤

| 実行基盤 | 作成関数 | 高速な検証 | 実サービスに近い検証 |
| --- | --- | --- | --- |
| BullMQ | `setupBullMQEnv` | `sandbox` | `testcontainers` の Redis |
| Inngest | `setupInngestEnv` | `stub` | `dev-server` |
| Cloudflare Queues | `setupCloudflareQueuesEnv` | `miniflare` | `wrangler` |
| AWS SQS | `setupSQSEnv` | `stub` | `localstack` |
| RabbitMQ | `setupRabbitMQEnv` | `stub` | `testcontainers` |

すべての環境は、投入、実行、結果の待機、停止という共通のテストの流れを持ちます。日常のテストではインプロセスの実行モードを使い、Redis、開発サーバー、LocalStack、RabbitMQ との相互運用を確かめるケースだけ実行モードを切り替えます。

## 何を検証するか

BullMQ では processor の戻り値、retry 回数、最終失敗の理由を記録します。Inngest ではイベントからどの function が起動し、どの `step.run` が実行されたかを確認します。Cloudflare Queues と SQS では、consumer が成功を ack または delete したか、失敗を再配信または DLQ に渡したかを確認します。RabbitMQ では exchange、binding、routing key、ack、nack を、宣言した topology に沿って検証します。

この library が固定するのは application の処理 contract です。たとえば SQS の visibility timeout を使う test は、受信後に delete しないと message を再受信することを確認します。実際の IAM、broker のスケーリング、production の retry policy は同じ test から推測せず、選択した provider の実行モードまたは staging integration test で確認します。

## 使わない場面

これは本番キューの運用監視やスループット試験の製品ではありません。プロバイダー固有の制限、分散した競合、スケーリング、認証設定を保証する必要がある場合は、実際のステージング環境で別途検証します。

高速モードにも範囲があります。たとえば BullMQ の `sandbox` は単一 processor と基本的な delay、retry を扱いますが、優先度、rate limit、複数 worker の競合、backoff の再現は対象外です。その種の契約は `testcontainers` を使います。

## 導入判断

キューのライブラリ名ではなく、アプリケーションが依存する実行モデルで選びます。ジョブ名を投入して worker の戻り値を見たいなら BullMQ、イベントから関数を起動したいなら Inngest、Worker の batch handler を試すなら Cloudflare Queues、受信と可視性を制御したいなら SQS、routing key と exchange を使うなら RabbitMQ です。

まずは [Quickstart](./quickstart) の BullMQ sandbox でテストの形を確認してください。失敗と再試行を扱う実例は [使い方](./how-to)、モードと公開 API の範囲は [リファレンス](./reference) にまとめています。
