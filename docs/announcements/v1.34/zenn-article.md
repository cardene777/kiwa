# kiwa v1.34 released — Frontend 深化 (@kiwa-lab/component v0.3.0 + @kiwa-lab/nextjs v1.2.0 + 8 axis advanced frontend + 縦深化 pair 第 6 pair 連続化)

## TL;DR

- **kiwa v1.34 released** — Frontend 深化 milestone (advanced frontend semantics 8 axis + real driver + 縦深化 pair 第 6 pair 連続化)
- **`@kiwa-lab/component` v0.2.0 → v0.3.0 + `@kiwa-lab/nextjs` v1.1.0 → v1.2.0 pair minor bump** — 8 axis advanced frontend semantics + real driver env-gate + 3 target × 8 axis neutral state machine 追加
- **8 axis semantics** = rsc-harness + streaming-ssr + view-transitions + form-action-advanced + server-action-advanced + partial-prerendering + interception-routes + parallel-routes-advanced
- **3 dogfood app 新規** — nextjs-rsc-streaming-app v2 + nextjs-server-action-app 新規 + storybook-8-mdx-app 新規、 全 7 軸 release gate PASS + real driver env-gate
- **縦深化 pair pattern 第 6 pair 連続化** — Auth pair (v1.21→v1.22) + Realtime pair (v1.13→v1.28) + Streaming pair (v1.20→v1.31) + Database pair (v1.14→v1.32) + Payment pair (v1.23→v1.33) + **Frontend pair (v1.16→v1.34)**、 縦深化戦略 SSOT を frontend production layer に拡張
- **12 milestone 連続 snippet validation streak** (v1.23-v1.34)
- **kiwa runtime fixture 35 packages 維持** (component + nextjs 既存 package の pair minor 拡張)
- v1.11 以降 24 milestone 連続完遂

## v1.34 が解決したい問題 — Frontend production semantics の testing gap

v1.16 で `@kiwa-lab/component` v0.1 (Storybook 8 + Playwright Component Testing + Chromatic の 3 target を単一 API surface で unify する mock harness) を land、 v1.2 で `@kiwa-lab/nextjs` v1.0 (Next.js App Router / Pages Router / Edge Runtime の unified adapter) を land した時点で、 kiwa は 3 target 上に単一の component + nextjs test envelope を統一 mock として提供していた。 browser 経由の live rendering 不要で mock only mode で走る、 実 test 環境の inner-loop 速度を確保する目的の layer。

しかし v1.16 / v1.2 land 後の実行観測で判明したのは、 real production frontend setup (React 19 + Next.js 15 App Router + Server Components + Server Actions + view transitions) で頻繁に遭遇する **8 axis の advanced frontend semantics** — RSC で Suspense fallback が resolved chunk に置換されない sequencing bug / selective hydration が 4 boundary のうち 1 つだけ pending の状態で stuck / view transition の element transition promise を await 忘れて timing off / useOptimistic で optimistic patch が resolved shape 不一致で stuck / Server Action の revalidateTag typo で wrong path revalidate / Partial Prerendering で static shell の Suspense boundary が外れて dynamic hole flush 失敗 / (.)intercept が親 segment を swallowing / parallel route で default.tsx なしで loading slot 出ない — が v1.16 の 6 base semantics + v1.2 の 5 base semantics だけでは cover できないこと。

v1.34 はこの gap を埋める深化 milestone。 8 axis advanced frontend semantics + real driver env-gate + 3 dogfood app 新規 で **production frontend testing SSOT** を確立、 kiwa の縦深化 pair pattern (basic mock → advanced real driver) を 6 pair 目として frontend production layer に拡張。

## v1.34 で追加した 8 axis advanced frontend semantics

### 1. RSC harness (`rsc-harness.ts`)

React Server Component render + Suspense boundary tracking (nested boundary の enter / exit 対応) + streaming HTML chunk assertion (chunk 単位の emission event) + chunk order guard (server が emit した chunk order が client hydration order と一致) の 4 axis を pure state machine として実装。 `startRscHarness` → `beginRscRender` → `enterSuspenseBoundary` → `streamHtmlChunk` → `completeRscRender` | `failRscRender` の 5 event envelope。 real driver env-gate で Next.js 15 App Router の実 RSC render に routing。

### 2. Streaming SSR (`streaming-ssr.ts`)

Suspense pending state 追跡 + selective hydration (per-boundary hydration order) + progressive hydration state machine (client-side event-driven hydration prioritization) + error boundary correlation (error boundary が捕捉した error を pending suspense と紐付ける) の 4 axis 統一実装。 `markSuspensePending` → `captureErrorBoundary` → `startProgressiveHydration` → `completeSelectiveHydration` の 4-event envelope。

### 3. View transitions (`view-transitions.ts`)

element transition (個別要素の CSS view-transition-name 追跡) + document transition (全 document 遷移の startViewTransition() promise 追跡) + animation promise tracking (finished / ready promise の await 状態 assertion) + assertion timing (transition の各 phase で assertion 可能な時点を明示) の 4 axis 統一実装。

### 4. Form action advanced (`form-action-advanced.ts`)

useFormStatus pending state (form 送信中の pending / data / method / action 追跡) + useOptimistic patch ledger (optimistic update と resolved update の diff 追跡) + progressive enhancement (JS off state での form action 動作保証) + resolved-vs-optimistic diff (optimistic patch が resolved value と不一致な時の detection) の 4 axis 統一実装。

### 5. Server action advanced (`server-action-advanced.ts`)

form action submit (Server Action への form 送信 event 発火) + revalidatePath prefix guard (typo で他 path を revalidate してしまわないための prefix check) + revalidateTag string match (tag の完全一致 assertion) + redirect action (Server Action からの redirect() 呼出) の 4 axis 統一実装。

### 6. Partial prerendering (`partial-prerendering.ts`)

static shell (build 時に render される static portion) + dynamic hole (request 時に render される dynamic portion) + Suspense boundary flush (dynamic hole の streaming flush event) + streaming assertion (shell と dynamic の境界 assertion) の 4 axis 統一実装。

### 7. Interception routes (`interception-routes.ts`)

(.) current-segment intercept + (..) parent-segment intercept + (...) root-catchall intercept + modal pattern (intercept で modal open、 直 URL 訪問で full page) の 4 axis 統一実装。

### 8. Parallel routes advanced (`parallel-routes-advanced.ts`)

default.tsx slot (unmatched slot の fallback) + loading state slot (loading.tsx の parallel display) + error boundary (per-slot error boundary) + slot navigation (異なる slot への同時 navigation state machine) の 4 axis 統一実装。

## 3 dogfood frontend app 新規

### `dogfood-nextjs-rsc-streaming-app` v2 (v1.34-2, Issue #1049)

- Next.js 15.4 + React 19.1 + RSC + Suspense + streaming SSR + selective hydration + view transitions + form action advanced
- testcontainers-shaped env-gate、 mock only + `KIWA_MODE=real NEXTJS_APP_ROUTER_BROWSER_READY=1` opt-in の 2 layer 走査
- 67 test (RSC harness + streaming SSR + view transitions + form action advanced の 4 axis 統一)

### `dogfood-nextjs-server-action-app` (新規, v1.34-3, Issue #1050)

- Next.js 15 form action + useFormStatus + useOptimistic + revalidatePath + revalidateTag + redirect + progressive enhancement
- testcontainers-shaped env-gate、 form action + optimistic UI + revalidation の 3 axis を統一処理
- 70 test + Playwright e2e (form action progressive enhancement + optimistic UI reconciliation の E2E 保証)

### `dogfood-storybook-8-mdx-app` (新規, v1.34-4, Issue #1051)

- Storybook 8 + MDX component preview + interaction test (@storybook/test) + coverage report
- testcontainers-shaped env-gate、 CSF3 + MDX doc + interaction runner + coverage 4 axis の統一
- 71 test (Storybook 8 MDX + interaction runner + play function chain + coverage collection の 4 axis 統一)

## 縦深化 pair pattern 第 6 pair 連続化

v1.34 で kiwa の縦深化 pair pattern (basic mock milestone → 深化 II milestone で real driver + advanced semantics) が **6 pair 連続完成**:

1. **Auth pair** (v1.21 → v1.22)
   - v1.21 = `@kiwa-lab/auth` v0.4 4 protocol adapter (WebAuthn L3 / Passkey / OAuth 2.1 / OIDC) mock only
   - v1.22 = Keycloak testcontainers + oauth2-mock-server + Chrome caBLE hybrid transport (real driver) + a11y axe-core gate
2. **Realtime pair** (v1.13 → v1.28)
   - v1.13 = `@kiwa-lab/realtime` v0.1 4 provider (Supabase / Ably / Pusher / Socket.io) × 5 base semantics mock only
   - v1.28 = WebRTC + WebTransport + HTTP/3 + QUIC multiplexing + 8 axis advanced (real driver env-gate)
3. **Streaming pair** (v1.20 → v1.31)
   - v1.20 = `@kiwa-lab/streaming` v0.1 3 provider (Kafka / Redpanda / NATS) × 5 semantics mock only
   - v1.31 = Kafka raw + Redpanda schema + NATS JetStream + 8 axis advanced (real driver env-gate + testcontainers)
4. **Database pair** (v1.14 → v1.32)
   - v1.14-v1.26 = `@kiwa-lab/orm` v0.1-v0.9 3 ORM × 3 backend + 8 base semantics mock only
   - v1.32 = Postgres logical replication + MySQL cluster + SQLite WAL/FTS5 + 8 axis advanced (real driver env-gate + testcontainers)
5. **Payment pair** (v1.23 → v1.33)
   - v1.14-v1.23 = `@kiwa-lab/payment` v0.2-v0.3 3 provider webhook + 9 base billing semantics mock only
   - v1.33 = Stripe Connect + Paddle Billing v2 + Lemon Squeezy license + 8 axis advanced billing II (real driver env-gate)
6. **Frontend pair** (v1.16 → v1.34、 this)
   - v1.16 = `@kiwa-lab/component` v0.1-v0.2 3 target (Storybook 8 / Playwright CT / Chromatic) 6 base semantics mock only
   - v1.34 = `@kiwa-lab/component` v0.3 + `@kiwa-lab/nextjs` v1.2 8 axis advanced frontend semantics + real driver env-gate + Next.js 15 App Router + Storybook 8 MDX + Playwright CT + Chromatic

basic mock → advanced real driver の 2 phase pair を追加領域に横展開する pattern が SSOT 化された。 v1.25 perf + v1.27 mutation + v1.30 a11y の横串 triple pair と合わせて **kiwa quality gate 縦横 grid maximum extension**、 6 領域 (auth / realtime / streaming / database / payment / frontend) 完全 cover。

## v1.11 以降 24 milestone 連続完遂

v1.11 (release gate) → v1.12 (非決定性) → v1.13 (時間軸) → v1.14 (横軸拡張) → v1.15 (AI-LLM 深化) → v1.16 (component 縦軸) → v1.17 (Observability v2) → v1.18 (Blockchain 深化) → v1.19 (Framework 深化) → v1.20 (Streaming 深化) → v1.21 (Auth 深化) → v1.22 (Auth 深化 II) → v1.23 (Payment 深化) → v1.24 (Edge / Serverless 深化) → v1.25 (Perf-harness sweep) → v1.26 (Database 深化) → v1.27 (Mutation testing sweep) → v1.28 (Realtime 深化 II) → v1.29 (release script filter SSOT) → v1.30 (a11y 横串 sweep) → v1.31 (Streaming 深化 II) → v1.32 (Database 深化 II) → v1.33 (Payment 深化 II) → **v1.34 (Frontend 深化)**。

## 12 milestone 連続 snippet validation streak

v1.23 (payment 深化) から v1.34 (frontend 深化) まで **12 milestone 連続で snippet validation pattern** を land 済:

payment-v1.23 / edge-v1.24 / perf-harness-v1.25 / orm-v1.26 / quality-metrics-v1.27 / realtime-v1.28 / release-invariants-v1.29 / a11y-v1.30 / streaming-v1.31 / orm-v1.32 / payment-v1.33 / **frontend-v1.34**。

各 milestone の tutorial code snippet はすべて `docs-tutorial-v1.XX.test.ts` で自動検証されている (`packages/component/tests/docs-tutorial-v1.34.test.ts` は 12 milestone 目の追加)。

## Try it

```bash
pnpm add -D @kiwa-lab/component @kiwa-lab/nextjs
```

Migration guide (additive-only、 breaking change なし):

- [v1.33 → v1.34 migration guide](https://cardene777.github.io/kiwa/migrations/v1.33-to-v1.34)
- [Frontend real-driver testing SSOT concept doc](https://cardene777.github.io/kiwa/concepts/frontend-real-driver-testing)

## v2.0 で解決したい問題

- Multi-version Vitest matrix — Vitest 1.x vs 2.x vs 3.x parity check
- Desktop (Electron / Tauri) + mobile (React Native / Expo) adapter
- Coverage 100 % milestone
- Cache depth II — Dragonfly + KeyDB failover + Redis cluster resharding + eviction ML
- Queue depth II — BullMQ Pro + Inngest Fn v2 + AWS SQS FIFO + RabbitMQ federation
- AI-LLM depth II — Anthropic Messages Batch API + OpenAI Realtime API + Vercel AI SDK v4 + LangGraph fan-out
- L2 depth — Base / Arbitrum / Optimism / Scroll block-space fidelity
- ZK depth — Noir / Circom / RISC Zero test harness
- IoT depth — MQTT / CoAP / LWM2M
- DB depth III — SurrealDB / EdgeDB / Turso / CockroachDB / TimescaleDB / QuestDB
- Streaming depth III — Pulsar + KsqlDB + Faust + Flink + Beam pipeline fidelity
- Auth depth III — WebAuthn L3 + Passkey caBLE + Federation + Verifiable Credentials
- Perf-harness sweep II — real-machine baseline、 macOS ARM64 + Linux x86_64 + Windows x86_64

これらのうちどれを v2.0 に land すべきかの feedback を GitHub Discussions で募集中。

## Thanks

v1.34 sub-Issue を review していただいた方、 `@kiwa-lab/component` v0.3 + `@kiwa-lab/nextjs` v1.2 pre-release を試していただいた方、 縦深化 pair pattern SSOT を 6-pair grid に整理する議論に付き合っていただいた方、 ありがとうございます。 v2.0 へ。
