# @kiwa/payment v2.1 lifecycle-orchestrator in 15 min

## What you'll build

`@kiwa/payment` v2.1 lifecycle-orchestrator = subscription lifecycle + dunning + retry + revenue-recovery + chargeback の 継続合成 layer。 5 state SSOT + 8 event SSOT + 40 セル 遷移表。 **depth-5 pattern 4 例目確定** (Mobile v1.55 + Desktop v1.61 + quality-metrics v1.65 + Payment v2.1)、 systematic pattern 46 度目適用、 49 milestone streak。

## Prerequisites

- Node.js ≥ 20 + pnpm
- `@kiwa/payment` v2.1 (`pnpm add -D @kiwa/payment@^2.1`)

## Step-by-step build

### 1. subscription 契約成立で 初期化

```ts
import { startLifecycle } from '@kiwa/payment';

const session = startLifecycle({ timestamp: new Date().toISOString() });
// session.state = 'active-billing'
```

### 2. event 送信 で 遷移

```ts
import { handleEvent } from '@kiwa/payment';

// 通常課金成功
let next = handleEvent({ session, event: 'payment-succeeded', timestamp: t1 });
// next.state = 'active-billing'、 billingCyclesCompleted = 1

// 支払い失敗 → grace-period
next = handleEvent({ session: next, event: 'payment-failed', timestamp: t2 });
// next.state = 'grace-period'
```

### 3. dunning cascade

```ts
// grace-period で さらに payment-failed → dunning-active
const dunning = handleEvent({ session: grace, event: 'payment-failed', timestamp: t3 });
// dunning.state = 'dunning-active'、 dunningRoundsExecuted = 1

// dunning 成功で active-billing 復帰
const recovered = handleEvent({ session: dunning, event: 'dunning-succeeded', timestamp: t4 });
// recovered.state = 'active-billing'
```

### 4. chargeback dispute

```ts
// chargeback filed で chargeback-dispute 遷移
const dispute = handleEvent({ session, event: 'chargeback-filed', timestamp: t5 });
// dispute.state = 'chargeback-dispute'、 chargebacksDisputed = 1

// dispute 勝訴 で active-billing 復帰
const won = handleEvent({ session: dispute, event: 'chargeback-won', timestamp: t6 });
// won.state = 'active-billing'
```

## 5 state SSOT

| state | 意味 |
|---|---|
| active-billing | 通常課金中 |
| grace-period | 支払い失敗直後、 dunning trigger 待ち |
| dunning-active | dunning cascade 実行中 |
| chargeback-dispute | chargeback 発生、 dispute 対応中 |
| canceled | subscription 完全終了 (terminal) |

## 8 event SSOT

payment-succeeded / payment-failed / dunning-succeeded / dunning-exhausted / chargeback-filed / chargeback-won / chargeback-lost / user-canceled

## 40 セル 遷移表 SSOT

各 state × 各 event = 40 セル、 有効 遷移 + soft-reject (invalid log)。 auth v0.7 continuous-auth の throw guard と 区別 = payment 経路 は 過剰 event 受信 が normal のため soft-reject。

## depth-5 pattern 4 例目確定 = 「rule」 dominant pattern 昇格

- 1 例目 = Mobile v1.54-v1.55 (native storage adapter)
- 2 例目 = Desktop v1.60-v1.61 (native process spawn)
- 3 例目 = quality-metrics v0.1-v0.5 (release gate)
- **4 例目 = Payment v0.1-v2.1** (lifecycle-orchestrator)

3 例目 で 「絶対的 rule」 昇格 signal 到達済、 4 例目 で dominant pattern 昇格 confirmed。 「pattern 化 → 確定 pattern → 絶対的 rule → dominant pattern」 の 4 段昇格。

## Reference: dogfood-payment-lifecycle-app

4 pattern workflow (`bootstrapSubscription` + `processEventBatch` + `reportDashboard` + `extractDunningPath`) の実装は `examples/dogfood-payment-lifecycle-app/` を参照。

## What's next

- v2.4+ = 別 pair の depth-5 拡張 (Realtime / Streaming / Search 等) or Payment v0.6 継続深化
