---
title: kiwa API reference
---

# kiwa API reference

kiwa の各 lib API を分類別に列挙。 各 lib page には Overview + Supported providers + Main API + Types + Usage examples + Related skills を掲載。

## Libraries by category

### SaaS (10)

| lib | package | domain |
|---|---|---|
| [email](./email) | `@kiwa-lab/email` | Resend / SendGrid / Postmark / SES email send + template + webhook |
| [webhook](./webhook) | `@kiwa-lab/webhook` | Stripe / GitHub / Slack / Twilio signature verify + retry |
| [feature-flag](./feature-flag) | `@kiwa-lab/feature-flag` | GrowthBook / LaunchDarkly / PostHog / Unleash flag evaluation |
| [upload](./upload) | `@kiwa-lab/upload` | S3 / GCS / R2 / Cloudinary multipart + presigned URL |
| [notification](./notification) | `@kiwa-lab/notification` | FCM / APNs push + Twilio SMS + SNS + in-app |
| [vector](./vector) | `@kiwa-lab/vector` | Pinecone / Weaviate / Qdrant / pgvector upsert + nearest query |
| [graphql](./graphql) | `@kiwa-lab/graphql` | Apollo / Yoga server + urql / Relay client + subscription |
| [trpc](./trpc) | `@kiwa-lab/trpc` | tRPC v10 router / procedure / middleware / typed client |
| [i18n](./i18n) | `@kiwa-lab/i18n` | next-intl / vue-i18n / react-i18next / Lingui translation |
| [workflow](./workflow) | `@kiwa-lab/workflow` | Temporal / Inngest / Trigger.dev / Step Functions orchestration |

### Backend languages (4)

| lib | package | domain |
|---|---|---|
| [python](./python) | `@kiwa-lab/python` | Django / Flask / FastAPI / Starlette request-response mock |
| [ruby](./ruby) | `@kiwa-lab/ruby` | Rails / Sinatra / Roda / Hanami mock |
| [rust-lib](./rust-lib) | `@kiwa-lab/rust-lib` | axum / actix-web / tower-http / rocket handler mock |
| [go-lib](./go-lib) | `@kiwa-lab/go-lib` | gin / echo / fiber / chi handler mock |

### Mobile (2)

| lib | package | domain |
|---|---|---|
| [react-native](./react-native) | `@kiwa-lab/react-native` | AsyncStorage / Navigation / Platform / Linking / Dimensions |
| [expo](./expo) | `@kiwa-lab/expo` | Expo Router / SecureStore / Notifications / FileSystem / Camera |

### Platform (1)

| lib | package | domain |
|---|---|---|
| [macos-app](./macos-app) | `@kiwa-lab/macos-app` | SwiftUI / AppKit / XCTest / accessibility / screencap / notification |

### DevX (5)

| lib | package | domain |
|---|---|---|
| [form](./form) | `@kiwa-lab/form` | React Hook Form / Zod / Formik / Conform |
| [state](./state) | `@kiwa-lab/state` | Zustand / Redux / Jotai / Valtio / MobX |
| [query](./query) | `@kiwa-lab/query` | TanStack Query / SWR / urql / Apollo Client cache |
| [date](./date) | `@kiwa-lab/date` | date-fns / dayjs / Luxon / Temporal |
| [chart](./chart) | `@kiwa-lab/chart` | Recharts / Chart.js / D3 / Visx |

### Infra (4)

| lib | package | domain |
|---|---|---|
| [crypto](./crypto) | `@kiwa-lab/crypto` | JWT / RSA / AES / hash / HMAC / X.509 |
| [migration](./migration) | `@kiwa-lab/migration` | Prisma / Drizzle / Kysely / Knex |
| [websocket](./websocket) | `@kiwa-lab/websocket` | ws / uWebSockets / Socket.IO / Colyseus raw WS |
| [grpc](./grpc) | `@kiwa-lab/grpc` | @grpc/grpc-js / nice-grpc / twirp / ConnectRPC |

## Auto-generated language API refs

kiwa は上記 26 lib の hand-written reference に加えて、 language-native の auto-generated API reference も持つ:

- **TypeScript** — [`/api/typescript/`](./typescript/) covers every `@kiwa-lab/*` package (typedoc output)
- **Rust** — [`/api/rust/kiwa/`](./rust/kiwa/) covers `kiwa-test-rs` (cargo doc output)
- **Solidity** — [`/api/solidity/dogfood-foundry-dapp/`](./solidity/dogfood-foundry-dapp/) covers the dogfood Foundry project (forge doc output)

## test-taxonomy guide

- **[test-taxonomy-guide.md](./test-taxonomy-guide)** — 5 分類 SSOT + meta lint + fidelity primitive + skill-test + CLI + real driver 経路の user-facing 統合 guide。

## Concepts

- **[Multi-provider mock pattern](../concepts/multi-provider-mock)** — 統一 interface で複数 provider を mock する設計思想
- **[Lib composition pattern](../concepts/lib-composition)** — 26 lib を組合わせて real app test を書く経路

## Regeneration

```bash
claude /docs-generate
```

typedoc + cargo doc + forge doc を順次実行、 `docs/api/<language>/` に書出す。
