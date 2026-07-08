# kiwa v1.33 released — Payment 深化 II (@kiwa/payment v0.4.0 + 8 axis advanced billing II + real driver + 縦深化 pair 第 5 pair 連続化)

## TL;DR

- **kiwa v1.33 released** — Payment 深化 II milestone (advanced billing II 8 axis + real driver + 縦深化 pair 第 5 pair 連続化)
- **`@kiwa/payment` v0.3.0 → v0.4.0 minor bump** — 8 axis advanced billing II semantics + real driver env-gate + 3 provider × 8 axis neutral state machine 追加
- **8 axis semantics** = orchestration + revenue-recovery + refund-advanced + dispute + webhook-idempotency-advanced + tax-localization + subscription-state-machine + payment-method-vault
- **3 dogfood app v2 / 新規** — stripe-marketplace-app v2 + paddle-subscription-app v2 + lemonsqueezy-license-app 新規、 全 7 軸 release gate PASS + real driver env-gate
- **縦深化 pair pattern 第 5 pair 連続化** — Auth pair (v1.21→v1.22) + Realtime pair (v1.13→v1.28) + Streaming pair (v1.20→v1.31) + Database pair (v1.14→v1.32) + **Payment pair (v1.23→v1.33)**、 縦深化戦略 SSOT を payment production layer に拡張
- **11 milestone 連続 snippet validation streak** (v1.23-v1.33)
- **kiwa runtime fixture 35 packages 維持** (payment 既存 package の minor 拡張)
- v1.11 以降 23 milestone 連続完遂

## v1.33 が解決したい問題 — Payment production semantics の testing gap

v1.14 で `@kiwa/payment` v0.2 (Stripe + Paddle + Lemon Squeezy webhook mock + HMAC signature verify + 4 fixture builder) を land、 v1.23 で v0.3 に minor bump して **9 base billing semantics** (dunning + retry + 3DS v2 + SCA + PSD2 mandate + subscription lifecycle + invoice lifecycle + VAT/GST/sales tax + chargeback dispute) を追加した時点で、 kiwa は 3 provider (Stripe / Paddle / Lemon Squeezy) 上に単一の billing state envelope を統一 mock として提供していた。 broker 経由の live provider endpoint 不要で mock only mode で走る、 実 test 環境の生産性を確保する目的の layer。

しかし v1.23 land 後の実行観測で判明したのは、 real production payment setup で頻繁に遭遇する **8 axis の advanced billing II semantics** — Stripe 障害時の multi-provider routing + failover cascade / dunning cascade (email → in-app → SMS → push) + card updater + network tokenization / Stripe Connect の destination charge + application fee + refund split / chargeback lifecycle (evidence submission + representment + arbitration escalation) / at-least-once webhook + idempotency key + dedup window / DAC7 EU digital platform reporting + jurisdiction split / grace period + trial + proration + coupon stacking / cross-provider vault + token migration + network token — が 9 base semantics だけでは cover できないこと。

v1.33 はこの gap を埋める深化 II milestone。 8 axis advanced billing II semantics + real driver env-gate + 3 dogfood app v2 / 新規 で **production payment testing SSOT** を確立、 kiwa の縦深化 pair pattern (basic mock → advanced real driver) を 5 pair 目として payment production layer に拡張。

## v1.33 で追加した 8 axis advanced billing II semantics

### 1. Orchestration (`orchestration.ts`)

multi-provider routing (BIN / currency / cost で primary provider を選ぶ) + retry ladder (per-provider retry cap まで同一 provider で retry) + failover cascade (retry cap 到達後 cascade 次 provider) + circuit breaker (N 総失敗で open、 outage window 経過で half-open → closed) の 4 axis を pure state machine として実装。 `routing` → `failed-over` → `circuit-open` → `circuit-closed` → `terminated` の 5-state envelope。 real driver env-gate で Stripe / Paddle / Lemon Squeezy 実 test endpoint に routing。

### 2. Revenue recovery (`revenue-recovery.ts`)

smart retry (Stripe Smart Retries の per-attempt backoff + retry cap) + dunning cascade (email → in-app → SMS → push の 4-step notification cascade + attempt state) + card updater (Visa/Mastercard Automatic Billing Updater 経由の PAN / expiry 自動更新) + network tokenization (Visa Token Service + Mastercard Digital Enablement Service) の 4 axis 統一実装。

### 3. Refund advanced (`refund-advanced.ts`)

partial refund + split-fee refund (marketplace で platform fee vs connected account fee の 2 leg 分割) + refund window enforcement (Stripe 120 日 / Paddle 60 日 / Lemon Squeezy 30 日 の provider 固有 window) + dispute-triggered refund + charge reversal の 5 axis state machine。

### 4. Dispute (`dispute.ts`)

chargeback lifecycle (`opened` → `evidence-submitted` → `won` | `lost`) + evidence submission (receipt / shipping / customer communication) + representment (evidence 提出後の provider re-review) + arbitration escalation (card network 経由の 最終審級) + 3DS liability shift (3DS 認証済 transaction は issuer liability に shift) の 5 axis pure state machine。

### 5. Webhook idempotency advanced (`webhook-idempotency-advanced.ts`)

idempotency key (Stripe `Idempotency-Key` header) + at-least-once delivery guarantee + dedup window (24 hour dedup + persistent storage) + retry storm handling (provider が rapid retry で同じ event を 100 回送信するケース) + observability (dedup ratio + retry storm alert) の 5 axis 統一実装。

### 6. Tax localization (`tax-localization.ts`)

DAC7 EU digital platform reporting (EU 加盟国の digital platform に義務化された annual seller revenue reporting) + jurisdiction split (seller × jurisdiction × currency の 3 次元 grid) + seller revenue aggregation (chargeback 差引き + refund 差引き + fee 差引き) + reverse-charge B2B (EU cross-border B2B transaction の VAT 逆転) + tax report CSV export の 5 axis 統一実装。

### 7. Subscription state machine (`subscription-state-machine.ts`)

grace period (past-due だが customer から見ると active な猶予期間) + trial (trial → active 遷移 + trial 中の change plan 挙動) + mid-cycle proration (daysElapsed / daysInCycle split) + coupon stacking (stackable vs non-stackable + 100 % combined cap) + reactivate guard (canceled → active 経路の rate limit) + vault migration (subscription を Paddle → Stripe に移行しつつ customer に card 再入力させない) の 6 axis pure state machine。

### 8. Payment method vault (`payment-method-vault.ts`)

cross-provider vault (Stripe → Paddle → Lemon Squeezy 間の payment method 移行) + token migration (Provider A の customer_id + payment_method_id を Provider B の instrument reference に変換) + network token (Visa Token Service で PAN を network token 化、 provider 非依存の instrument reference) + PSP-agnostic instrument reference (kiwa 内部 instrument_id を provider 側 token に mapping) の 4 axis 統一実装。

## 3 dogfood payment app v2 / 新規

### `dogfood-stripe-marketplace-app` v2

- Next.js 15 + Stripe Connect + destination charge + application fee + DAC7 tax report + dispute lifecycle
- testcontainers-shaped env-gate、 mock only + `KIWA_MODE=real STRIPE_TEST_KEY=xxx` opt-in の 2 layer 走査
- 41 test (dispute + refund + webhook idempotency + tax localization + Connect payout の 5 axis 統一)

### `dogfood-paddle-subscription-app` v2

- Nuxt 3 + Paddle Billing v2 + retention + proration + coupon stacking + trial + smart retry recovery
- testcontainers-shaped env-gate、 grace period + card updater + network tokenization の 3 axis 統合
- 68 test (subscription state machine + revenue recovery + refund window + coupon + vault migration の 5 axis 統一)

### `dogfood-lemonsqueezy-license-app` (new)

- SvelteKit + Lemon Squeezy license key + activation + affiliate program + refund window enforcement
- testcontainers-shaped env-gate、 license issuance + activation limit + refund window + affiliate commission split の 4 axis 統合
- 70 test + Playwright e2e (license activation flow + refund window enforcement の E2E 保証)

## 縦深化 pair pattern 第 5 pair 連続化

v1.33 で kiwa の縦深化 pair pattern (basic mock milestone → 深化 II milestone で real driver + advanced semantics) が **5 pair 連続完成**:

1. **Auth pair** (v1.21 → v1.22)
   - v1.21 = `@kiwa/auth` v0.4 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC) mock only
   - v1.22 = Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver) + a11y axe-core gate
2. **Realtime pair** (v1.13 → v1.28)
   - v1.13 = `@kiwa/realtime` v0.1 4 provider (Supabase / Ably / Pusher / Socket.io) × 5 base semantics mock only
   - v1.28 = WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
3. **Streaming pair** (v1.20 → v1.31)
   - v1.20 = `@kiwa/streaming` v0.1 3 provider (Kafka / Redpanda / NATS) × 5 semantics mock only
   - v1.31 = Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)
4. **Database pair** (v1.14 → v1.32)
   - v1.14-v1.26 = `@kiwa/orm` v0.1-v0.9 3 ORM × 3 backend + 8 base semantics mock only
   - v1.32 = Postgres logical replication + MySQL cluster + SQLite WAL/FTS5 + 8 axis advanced (real driver env-gate + testcontainers)
5. **Payment pair** (v1.23 → v1.33、 this)
   - v1.14-v1.23 = `@kiwa/payment` v0.2-v0.3 3 provider webhook + 9 base billing semantics mock only
   - v1.33 = Stripe Connect + Paddle Billing v2 + Lemon Squeezy license + 8 axis advanced billing II (real driver env-gate)

basic mock → advanced real driver の 2 phase pair を追加 provider に横展開する pattern が SSOT 化された。 v1.25 perf + v1.27 mutation + v1.30 a11y の横串 triple pair と合わせて **kiwa quality gate 縦横 grid maximum extension**。

## v1.11 以降 23 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → v1.31 (Streaming 深化 II) → v1.32 (Database 深化 II) → **v1.33 (Payment 深化 II)**。

23 milestone 連続完遂、 全 sub-Issue land 維持、 kiwa quality gate SSOT を縦深化 pair + 横串 sweep の 2 pattern で拡張し続けている。

## 11 milestone 連続 snippet validation streak

v1.23 (payment) → v1.24 (edge) → v1.25 (perf-harness) → v1.26 (orm-v1.26) → v1.27 (quality-metrics) → v1.28 (realtime) → v1.29 (release-invariants) → v1.30 (a11y) → v1.31 (streaming) → v1.32 (orm-v1.32) → **v1.33 (payment-v1.33)** の 11 milestone 連続 snippet validation。

すべての tutorial code snippet が `packages/{name}/tests/docs-tutorial-v1.XX.test.ts` で automated validation されている。 tutorial が古くなって動かなくなる regression を構造的に遮断する pattern。

## 使い方

```bash
pnpm add -D @kiwa/payment @kiwa/core
```

Payment orchestration の pure state machine helper:

```typescript
import { startOrchestration, routeCharge, probeCircuit } from '@kiwa/payment/semantics/orchestration';

const orch = startOrchestration({
  providers: ['stripe', 'paddle', 'lemonsqueezy'],
  retryCap: 3,
  circuitFailureThreshold: 10,
  outageWindowMs: 5 * 60 * 1000,
});

// route with per-provider retry ladder
const routed = routeCharge(orch, { amount: 5000, currency: 'usd' });
expect(routed.state).toBe('routing');

// simulate failure → failover to next provider
const failedOver = routeCharge(orch, { simulateFailure: true });
expect(failedOver.state).toBe('failed-over');
expect(failedOver.currentProvider).toBe('paddle');

// circuit breaker probe
const probed = probeCircuit(orch);
expect(probed.state).toBe('circuit-closed');
```

real driver env-gate:

```bash
# mock only mode (default)
pnpm test

# real driver mode with testcontainers-shaped env-gate
KIWA_MODE=real STRIPE_TEST_KEY=sk_test_xxx pnpm test
KIWA_MODE=real PADDLE_TEST_KEY=xxx pnpm test
KIWA_MODE=real LEMONSQUEEZY_TEST_KEY=xxx pnpm test
```

Migration guide は https://cardene777.github.io/kiwa/migrations/v1.32-to-v1.33 (additive-only、 breaking change 0)。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100 % milestone
- Cache depth II (Dragonfly + KeyDB failover + Redis cluster resharding + eviction ML)
- Queue depth II (BullMQ Pro + Inngest Fn v2 + AWS SQS FIFO + RabbitMQ federation)
- L2 depth (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK depth (Noir / Circom / RISC Zero test harness)
- IoT depth (MQTT / CoAP / LWM2M)
- DB depth III (SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB)
- Streaming depth III (Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity)
- Auth depth III (WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials)
- Perf-harness sweep II (real-machine baseline、 macOS ARM64 + Linux x86_64 + Windows x86_64)
- Mutation sweep II (property-based mutation、 Stryker + fast-check integration + shrink parser)
- Realtime depth III (WebCodecs / WebGPU compute + AV1/VP9 hardware encoding + WHIP/WHEP ingest fidelity)
- A11y sweep II (WCAG 2.2 AAA gate + screen-reader emulator + keyboard-only harness)
- Payment depth III (Klarna + Afterpay + Alipay + WeChat Pay + PIX + UPI regional processor)

Feedback welcome — どの候補が優先されるべきか、 Discussions で議論しませんか。

## リンク

- GitHub: https://github.com/cardene777/kiwa
- Docs: https://cardene777.github.io/kiwa
- Migration guide: https://cardene777.github.io/kiwa/migrations/v1.32-to-v1.33
- Concept doc: https://cardene777.github.io/kiwa/concepts/payment-real-driver-testing
- npm: `@kiwa/payment` v0.4.0

Thanks for testing kiwa v1.33 pre-releases and shaping the 縦深化 pair pattern SSOT into a 5-pair grid.
