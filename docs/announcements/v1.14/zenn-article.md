---
title: "kiwa v1.14 released — Payment + Search + Telemetry + Go Iris/Chi、 横軸拡張と perf 実測完遂"
emoji: "🌱"
type: "tech"
topics: ["oss", "typescript", "testing", "kiwa", "release"]
published: true
---

# kiwa v1.14 released

v1.14 は kiwa の 4 milestone 目です。 v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) の **縦軸 3 連続完遂** の後、 v1.14 は **横軸拡張** に思想シフト。 SaaS 実運用の必須 4 provider を land + 全 9 kiwa target で perf 実測を完遂しました。

## 主な追加

### `@kiwa-lab/payment` v0.1

Stripe + Paddle + Lemon Squeezy webhook mock。 3 provider を 1 API で扱えます。

```ts
import { createStripeMock, checkoutCompleted } from '@kiwa-lab/payment';

const stripe = createStripeMock({ secret: 'whsec_test' });
const { rawBody, signature } = checkoutCompleted(stripe, {
  amountCents: 2000,
  customerId: 'cus_test',
});
const verified = stripe.verifyWebhook({ rawBody, signature });
expect(verified.ok).toBe(true);
```

- HMAC-SHA256 sign + timing-safe verify (side-channel 攻撃防護)
- 4 fixture builder (`checkoutCompleted` / `subscriptionCreated` / `paymentFailed` / `refunded`)
- 3 provider の payload 差 (Stripe `data.object.*` / Paddle `data.attributes.*` / Lemon Squeezy `meta.event_name`) は engine config で吸収
- Verify 3 failure mode (bad-signature / stale-timestamp / malformed-body) を SSOT 化

### `@kiwa-lab/search` v0.1

Meilisearch + Algolia + Typesense を統一 mock で扱えます。

```ts
import { createMeilisearchMock } from '@kiwa-lab/search';

const search = createMeilisearchMock();
await search.addDocuments('docs', [{ id: '1', title: 'kiwa release gate' }]);
const r = await search.search('docs', { q: 'kiwa', facets: ['category'] });
```

- 5-op adapter (`addDocuments` / `updateDocuments` / `deleteDocuments` / `search` / `clearIndex`)
- word-overlap ranking + filter + facet + sort + pagination
- 1-edit-distance typo tolerance (provider 別 default = Meili/Algolia ON / Typesense OFF)

### `@kiwa-lab/observability` v1.1 (telemetry 拡張)

3 telemetry mock 追加 = OpenTelemetry + Datadog + Sentry。 既存 flaky/spec-coverage/dashboard は据置き。

```ts
import { createSentryMock } from '@kiwa-lab/observability';

const sentry = createSentryMock();
sentry.addBreadcrumb({ category: 'ui', message: 'clicked-button' });
const fp = sentry.captureException(new Error('db down'));
expect(sentry.collector.hasException(fp)).toBe(true);
```

- 3 provider を `TelemetryCollector` 共通 shape (spans / metrics / logs / exceptions / transactions) で統一
- Sentry fingerprint dedupe (同 message = 同 fingerprint) は real SDK と一致
- Sentry breadcrumb lifecycle (addBreadcrumb pending → captureException で attach + clear) も real SDK と一致

### `kiwa-test-go` v0.5 (Iris + Chi 追加)

kiwa が cover する Go web framework は **5 種類**になりました。

- gin (v1.5)
- echo (v1.5)
- fiber (v1.7)
- **iris (v1.14) 🆕**
- **chi (v1.14) 🆕**

すべて同一 `TestServer` contract。 iris は `app.Build()` lazy compile、 chi は `chi.Router` を `http.Handler` として直接 dispatch (最軽量)。

### perf-harness 実測完遂

v1.13-1 で `@kiwa-lab/perf-harness` を 5 target 適用 land。 v1.14-1 で **9 target** に拡張。

| target | max p95 | verdict |
|---|---|---|
| quality-metrics | sub-ms | PASS |
| ai-llm | 9.87ms | PASS |
| realtime | 5.86ms | PASS |
| dogfood-anthropic-chatbot | 17.06ms | PASS |
| dogfood-openai-tool-agent | 33.65ms | PASS |
| dogfood-vercel-ai-rag | sub-ms | PASS |
| dogfood-supabase-realtime-chat | 3.48ms | PASS |
| dogfood-ably-collab-cursor | 10.42ms | PASS |
| dogfood-socketio-notification | 3.58ms | PASS |

全 target 現行 threshold 内、 library の性能は十分と判定。

## v1.15+ 候補

- Reth (Rust Ethereum execution client、 dApp testing 深化)
- Dragonfly (Redis 互換 modern cache)
- Storybook integration
- AI-LLM 深化 (multimodal vision/audio + MCP tool + agent orchestration)
- Framework 深化 (SolidJS / Fresh / HonoJS)

## まとめ

v1.14 は横軸拡張の milestone。 SaaS 実運用の必須 provider を 4 系統追加 (payment / search / telemetry / go web framework) + perf 実測を全 9 target に拡張しました。 v1.11-v1.14 で **20 sub-Issue 完遂 + 20 PR merge**、 kiwa の provider coverage は依然として拡大中です。

Roadmap: https://github.com/cardene777/kiwa/issues/724
