---
title: "kiwa v1.23 released — Payment 深化 (advanced billing semantics 9 axis + 3 dogfood merchant app)"
emoji: "💳"
type: "tech"
topics: ["oss", "typescript", "stripe", "paddle", "kiwa"]
published: true
---

# kiwa v1.23 released

v1.23 は kiwa の 13 milestone 目です。 v1.14 (横軸拡張、 `@kiwa-lab/payment` v0.2 で Stripe + Paddle + Lemon Squeezy webhook mock + HMAC signature verify + 4 fixture event を land) の後、 v1.23 は payment webhook mock の上に **9 axis advanced billing semantics 層** を追加、 dunning + retry + 3DS v2 + SCA + PSD2 mandate + subscription lifecycle + invoice lifecycle + VAT/GST/sales-tax + chargeback dispute の 9 axis を provider-neutral state machine + strict transition guard として `packages/payment/src/semantics/*` に実装しました。 v1.14 webhook mock は first-line contract のまま維持 (v0.2 signature 完全維持)、 9 axis semantics は second-line envelope として並走、 test は adapter 経由 `KIWA_MODE=real` で real provider sandbox に切替可能 (v1.22 で確立した 3 execution mode SSOT を継承)。 v1.11 以降の連続完遂 12 milestone (release gate → 非決定性 → 時間軸 → 横軸拡張 → AI-LLM 深化 → component 縦軸 → Observability v2 → Blockchain 深化 → Framework 深化 → Streaming 深化 → Auth 深化 → Auth 深化 II) を受けて、 v1.23 は Payment 深化 milestone、 kiwa runtime fixture 34 packages はそのまま維持 (payment 既存 package の minor 拡張)。

## 主な追加

### `@kiwa-lab/payment` v0.3.0 (9 axis advanced billing semantics)

v1.14 で land した 3 provider webhook mock (`createStripeMock` / `createPaddleMock` / `createLemonSqueezyMock` + `signWebhook` / `emit` / `verify` + 4 fixture event `checkoutCompleted` / `subscriptionCreated` / `paymentFailed` / `refunded`) の signature を完全維持したまま、 v1.23 は `packages/payment/src/semantics/*` に 1 axis = 1 file の pure state machine helper を追加。 各 axis は shared `PaymentAdapter` interface を受け取り強型 `AxisStep` sequence を emit するため、 test は event 名ではなく **transition** に対して assert 可能。

#### 1. `dunning.ts` — Stripe Smart Retries envelope

state machine ... `active` → `in-grace-period` → `recovered` or `exhausted`。 default `maxAttempts: 4` + `retryIntervalMs: 3 days` + `gracePeriodMs: 1 day` で Stripe Smart Retries の retry cadence を再現。

```ts
import { createStripeMock, startDunning, dunningAttempt, finalizeDunning } from '@kiwa-lab/payment';

const adapter = createStripeMock({ webhookSecret: 'whsec_test', apiKey: 'sk_test_123' });
const session = startDunning({
  invoiceId: 'in_1',
  amountCents: 1999,
  customerId: 'cus_1',
  currency: 'usd',
});

for (let i = 0; i < 4; i++) {
  await dunningAttempt(adapter, session);
}
// session.state === 'in-grace-period' after 4 attempts.

const { session: final } = await finalizeDunning(adapter, session, { succeed: false });
// final.state === 'exhausted' → merchant app must render "we could not collect" UX.
```

失敗 mode ... merchant app が「we'll retry your card in 3 days」 grace-period UX を出さず uncollectible flip の worst UX を出す。 test は `session.state === 'in-grace-period'` を最後の attempt と finalisation の間で assert して catch。

#### 2. `three-ds.ts` — EMVCo 3DS 2.2 challenge flow

state machine ... `fingerprint` → `challenge-pending` → `completed`、 或いは `fingerprint` → `frictionless`。 EMVCo 6 `transStatus` code (`Y` / `N` / `A` / `C` / `U` / `R`) を全て accept。

```ts
import { startThreeDs, threeDsRequestChallenge, threeDsSubmitChallenge, threeDsFrictionless } from '@kiwa-lab/payment';

const session = startThreeDs({
  paymentIntentId: 'pi_1',
  amountCents: 4999,
  customerId: 'cus_1',
});

// Challenge path.
await threeDsRequestChallenge(adapter, session);
await threeDsSubmitChallenge(adapter, session, { transStatus: 'Y' });
// session.state === 'completed'

// Frictionless path.
const frictionless = startThreeDs({ paymentIntentId: 'pi_2', amountCents: 999, customerId: 'cus_1' });
await threeDsFrictionless(adapter, frictionless);
// frictionless.state === 'frictionless'
```

失敗 mode ... merchant app が frictionless を challenge-pending と誤解釈して checkout を block、 EU 小額決済で高い drop-off。 test は terminal state が 2 経路を区別する assertion で catch。

#### 3. `subscription-lifecycle.ts` — 5-state envelope + strict transition guard

5 state = `active` / `upgraded` / `downgraded` / `paused` / `canceled`。 transition guard = `paused` → `resumed` は許容、 `canceled` → `reactivated` は許容、 他遷移は invalid transition として reject。

```ts
import { createSubscription, changePlan, pauseSubscription, resumeSubscription, cancelSubscription, reactivateSubscription } from '@kiwa-lab/payment';

const sub = await createSubscription(adapter, { customerId: 'cus_1', planId: 'plan_pro_monthly' });
// sub.state === 'active'

const upgraded = await changePlan(adapter, sub, { newPlanId: 'plan_pro_yearly' });
// upgraded.state === 'upgraded'

const paused = await pauseSubscription(adapter, upgraded);
// paused.state === 'paused'

const resumed = await resumeSubscription(adapter, paused);
// resumed.state === 'active' (resume は active に戻る)

const canceled = await cancelSubscription(adapter, resumed);
// canceled.state === 'canceled'

const reactivated = await reactivateSubscription(adapter, canceled);
// reactivated.state === 'active'
```

失敗 mode ... merchant app が invalid transition (例 `paused` state の app を直接 `canceled` に飛ばす等) を permit してしまい、 provider 側で reject されて decoupling bug が production に届く。 guard 経路が state graph に絡む全遷移で assertion 可能。

#### 4. `tax.ts` — VAT / GST / sales-tax auto-calc + reverse-charge

~180 jurisdiction の VAT / GST / sales-tax 自動計算 + B2B EU 顧客の reverse-charge exemption + valid VAT ID 検証。

```ts
import { calculateTax } from '@kiwa-lab/payment';

// B2C EU consumer (Germany 19% VAT).
const b2c = calculateTax({
  amountCents: 10000,
  currency: 'eur',
  buyer: { country: 'DE', type: 'consumer' },
});
// b2c.taxCents === 1900、 b2c.appliedRule === 'DE_VAT_19'

// B2B EU (VAT ID reverse charge).
const b2b = calculateTax({
  amountCents: 10000,
  currency: 'eur',
  buyer: { country: 'FR', type: 'business', vatId: 'FR12345678901' },
  seller: { country: 'DE', type: 'business', vatId: 'DE987654321' },
});
// b2b.taxCents === 0、 b2b.appliedRule === 'EU_REVERSE_CHARGE'
```

### dogfood app 3 種の新規追加

#### `dogfood-stripe-billing-app` — Next.js 15 + checkout + webhook + subscription + invoice + 3DS + Smart Retries

- Next.js 15 App Router + Stripe checkout session + webhook endpoint (`/api/webhook/stripe`)
- subscription 5-state envelope 走査 (create → upgrade → downgrade → pause → resume → cancel → reactivate)
- 3D Secure v2 challenge + frictionless 両経路走査
- Smart Retries dunning 4 attempt + grace period 走査
- 35 vitest、 全て `createStripeMock` 経由、 `KIWA_MODE=real` で real Stripe sandbox に切替可能

#### `dogfood-paddle-merchant-app` — Nuxt 3 + Paddle Billing v2 + inline checkout + tier + VAT/GST auto-calc

- Nuxt 3 + Paddle Billing v2 inline checkout (`Paddle.Checkout.open`) — hosted redirect ではなく inline JS checkout
- tier upgrade with proration (Paddle は差額即時 charge、 Stripe の deferred proration と対比)
- VAT / GST / sales-tax 自動計算 + reverse-charge B2B intra-EU 顧客対応
- Paddle は Merchant-of-Record として fraud + chargeback + tax registration を吸収、 app は neutralised event のみを book
- 40 vitest

#### `dogfood-lemon-squeezy-app` — SvelteKit + hosted checkout + license key + refund + chargeback dispute

- SvelteKit + Lemon Squeezy hosted checkout URL (Paddle inline と対比、 Lemon Squeezy は redirect 型)
- license key issue + activate + revoke lifecycle
- refund full + partial via neutral `refunded` fixture
- chargeback dispute lifecycle (opened → evidence-submitted → won / lost + fee assessment)
- 74 vitest — v1.23 dogfood app で最も広い、 license flow が chargeback signal source として二重機能

### tutorial 3 本 + concept doc + migration guide + snippet validation

#### tutorial 39 — Stripe advanced billing

15 分完了、 subscription 5-state 走査 + 3DS challenge + Smart Retries dunning 4 attempt を Next.js 15 App Router から実装。

#### tutorial 40 — Paddle merchant-of-record

15 分完了、 Paddle inline checkout + tier proration + VAT/GST auto-calc + reverse-charge B2B EU を Nuxt 3 から実装。

#### tutorial 41 — Lemon Squeezy license flow

15 分完了、 hosted checkout + license issue+activate+revoke + refund + chargeback dispute を SvelteKit から実装。

#### concept doc `billing-semantics.md`

9 axis SSOT + provider (Stripe / Paddle / Lemon Squeezy) 別 fidelity surface reference。 各 axis の state machine + key function + failure mode + neutralised event 名 mapping を SSOT 化。

#### snippet validation `docs-tutorial-v1.23.test.ts`

tutorial 39-41 の全 code snippet を実 `@kiwa-lab/payment` API import + execute + assertion で走査、 18 test で drift を検知 (`docs-tutorial-v1.21.test.ts` / `docs-tutorial-v1.22.test.ts` と同じ pattern)。

## Numbers

- **6 sub-Issue 解決** (#900-#905)
- **6 PR merge** (v1.23-1 + v1.23-2 + v1.23-3 + v1.23-4 + v1.23-5 + 本 publish PR)
- **1 npm minor bump** (`@kiwa-lab/payment` v0.2.0 → v0.3.0) — kiwa runtime fixture 34 packages 維持
- **3 dogfood merchant app 新規** with fidelity report → 7 軸 release gate 供給
- **~267 new test** 9 axis semantics (100) + Stripe (35) + Paddle (40) + Lemon Squeezy (74) + snippet validation (18)

## なぜ 9 axis (webhook mock 単純ではなく)

payment testing には webhook 単純 mock で捕捉不能な 3 失敗 mode がある、 fixture event を幾ら詰め込んでも。

- **state-machine drift** — subscription の real lifecycle は `active` / `canceled` の 2 state ではない、 5-state graph with transition guard (`active` → `upgraded` → `downgraded` → `paused` → `canceled`、 `reactivate` は `canceled` からのみ許容)。 `event.type === 'customer.subscription.created'` だけを assert する test は guard を素通し、 production bug は「app 側が permit した invalid transition を provider 側で reject」 として顕在化。
- **retry cadence** — real dunning = 4 attempt × ~1 週間 + grace period。 retry loop を skip する test は uncollectible flip regression を素通し、 merchant app が grace-period UX なしで ship される。
- **cross-provider fidelity** — Stripe は proration を次 invoice に defer、 Paddle は差額即時 charge、 Lemon Squeezy は hosted checkout、 Paddle は inline。 neutral test surface が上記の違いを **明示 assertion** に変え、 silent regression を防ぐ。

9 axis は 3 target provider の billing envelope を再現する最小 set。 各 axis は `@kiwa-lab/payment/semantics/*` 下の独立 module、 shared `PaymentAdapter` interface + 強型 `AxisStep` sequence emit で「event 名」 ではなく「transition」 に対する assertion を可能にする。

## 13 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → **v1.23 (Payment 深化)**。 v1.11 以降の全 milestone で 6 sub-Issue を完遂。

## v2.0 candidates

- Multi-version Vitest matrix (Vitest 1.x vs 2.x vs 3.x parity)
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapters
- Coverage 100% milestone
- Cache / Data 深化 (Dragonfly / Materialize / Neon)
- L2 深化 (Base / Arbitrum / Optimism / Scroll block-space fidelity)
- ZK 深化 (Noir / Circom / RISC Zero test harness)
- IoT 深化 (MQTT / CoAP / LWM2M)
- DB 深化 (SurrealDB / EdgeDB / Turso)
- Payment 深化 II — real driver layer (real Stripe / Paddle / Lemon Squeezy sandbox testcontainers + `KIWA_MODE=real-required` nightly)

Feedback welcome on which of these should land next. どれから land するかの投票は GitHub Discussions で募集中。
