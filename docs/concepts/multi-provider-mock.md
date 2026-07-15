# Multi-provider mock pattern

kiwa は SaaS domain (email / webhook / feature-flag / upload / notification / vector / graphql / trpc / i18n / workflow / auth / cache / queue / search / streaming / ai-llm / realtime / payment / orm / agent / mcp) の各 lib で「複数 provider を統一 interface で mock する」 pattern を採用する。 本 doc はその設計思想 + 実装 SSOT。

## Why (なぜ統一 interface か)

SaaS app は開発中に provider 変更する。 例:

- MVP は Resend で email 送信、 scale 後 SendGrid に移行
- Pinecone で RAG prototype、 self-host 段階で pgvector に移行
- LaunchDarkly で feature flag、 cost 削減で GrowthBook に移行

test を provider ごとに書き直すと、 移行 cost が線形に増える。 kiwa は「provider 別差 (id prefix / signature encoding / event key 名) を吸収した抽象」 を提供、 provider 変更 = 1 引数変更 (`provider: 'resend'` → `provider: 'sendgrid'`) で同じ test が通る。

## 実装 pattern (email lib SSOT)

`packages/email/src/client.ts` を SSOT として、 全 SaaS lib で以下 5 要素を統一する。

### 1. `create*Client(options): *Client`

provider を string literal type で受け取る factory。 全 lib で `provider` field 必須、 default は最 popular な provider (email = resend / vector = pinecone 等)。

```typescript
export function createEmailClient(options: { provider: 'resend' | 'sendgrid' | 'postmark' | 'ses' }): EmailClient { ... }
```

### 2. `Provider` type = string union

`type EmailProvider = 'resend' | 'sendgrid' | 'postmark' | 'ses'`。 lib の中心 type、 全 API がこれを引数に取る。

### 3. Provider 別差の吸収経路

- **id prefix** = 各 provider で異なる id format (Resend = `re-N` / SendGrid = `sg-N` / SES = `ses-N`) を internal mapping で自動割振り
- **signature encoding** = SES = HMAC-SHA1 / 他 = HMAC-SHA256、 SendGrid = base64 / 他 = hex。 `verifyWebhookSignature` 内で provider 分岐して自動選択
- **event key 名** = Resend = `type` / SendGrid = `event` / Postmark = `RecordType` / SES = `eventType`。 `parseDeliveryEvent` 内で mapping table を持ち統一 shape に normalize

### 4. `list*(): SentRecord[]` 系 introspection API

send / dispatch した record を全件返す method、 test で「N 件送信された」「特定 recipient 宛」 を assertion する主経路。 provider 経由を意識せず統一 assertion が書ける。

### 5. `clear()` method

test 間で state を reset、 `beforeEach(() => client.clear())` pattern で test 隔離を保証。

## Fidelity vs Mock の哲学

本 pattern は「real provider の SDK と同じ signature で叩ける mock」 を提供、 real provider ↔ mock 間の behavior fidelity は `@kiwa-lab/quality-metrics` の `assertFidelity` で verify する。

- mock 単独 test = `packages/*/tests/skill/*.skill.test.ts` (fast、 CI default で走る)
- mock vs real reference impl = `packages/*/tests/fidelity/*.fidelity.test.ts` (mock が仕様通り動くか)
- mock vs real provider = `packages/*/tests/fidelity/*.real.fidelity.test.ts` (env-gate `KIWA_MODE=real`、 opt-in で走る)

3 段 fidelity chain で「mock が real provider の behavior を再現している」 confidence を build up する。

## 適用 lib 一覧

| 分類 | lib | provider 数 |
|---|---|---|
| email | @kiwa-lab/email | 4 (Resend / SendGrid / Postmark / SES) |
| webhook | @kiwa-lab/webhook | 4 (Stripe / GitHub / Slack / Twilio) |
| feature-flag | @kiwa-lab/feature-flag | 4 (GrowthBook / LaunchDarkly / PostHog / Unleash) |
| upload | @kiwa-lab/upload | 4 (S3 / GCS / R2 / Cloudinary) |
| notification | @kiwa-lab/notification | 5 (FCM / APNs / Twilio / SNS / inapp) |
| vector | @kiwa-lab/vector | 4 (Pinecone / Weaviate / Qdrant / pgvector) |
| graphql | @kiwa-lab/graphql | 4 (Apollo / Yoga / urql / Relay) |
| i18n | @kiwa-lab/i18n | 4 (next-intl / vue-i18n / react-i18next / Lingui) |
| workflow | @kiwa-lab/workflow | 4 (Temporal / Inngest / Trigger.dev / Step Functions) |
| form | @kiwa-lab/form | 4 (React Hook Form / Zod / Formik / Conform) |
| state | @kiwa-lab/state | 5 (Zustand / Redux / Jotai / Valtio / MobX) |
| query | @kiwa-lab/query | 4 (TanStack Query / SWR / urql / Apollo Client) |
| date | @kiwa-lab/date | 4 (date-fns / dayjs / Luxon / Temporal) |
| chart | @kiwa-lab/chart | 4 (Recharts / Chart.js / D3 / Visx) |
| migration | @kiwa-lab/migration | 4 (Prisma / Drizzle / Kysely / Knex) |
| websocket | @kiwa-lab/websocket | 4 (ws / uWebSockets / Socket.IO / Colyseus) |
| grpc | @kiwa-lab/grpc | 4 (grpc-js / nice-grpc / twirp / connect-rpc) |
| python | @kiwa-lab/python | 4 (Django / Flask / FastAPI / Starlette) |
| ruby | @kiwa-lab/ruby | 4 (Rails / Sinatra / Roda / Hanami) |
| rust-lib | @kiwa-lab/rust-lib | 4 (axum / actix-web / tower-http / rocket) |
| go-lib | @kiwa-lab/go-lib | 4 (gin / echo / fiber / chi) |

計 22 lib で 5 primitive の統一 pattern を採用。

## Related

- [Lib composition pattern](./lib-composition) — 複数 lib を組合わせて real app test を書く
- [Test taxonomy guide](../api/test-taxonomy-guide) — 4 category test の統一分類
