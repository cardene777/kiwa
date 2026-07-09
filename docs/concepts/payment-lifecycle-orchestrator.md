---
title: "@kiwa-lab/payment v2.1 lifecycle-orchestrator SSOT"
---

# @kiwa-lab/payment v2.1 lifecycle-orchestrator SSOT

## What this covers

`@kiwa-lab/payment` v2.1 lifecycle-orchestrator SSOT = subscription lifecycle + dunning + retry + revenue-recovery + chargeback の 5 axis を 継続合成する 上位 layer。 Payment pair v0.1-v0.4 の 4 段深化 + v2.1 で 5 段深化到達 = **depth-5 pattern 4 例目確定** (Mobile + Desktop + quality-metrics + Payment)、 systematic pattern 46 度目適用 (continuous state machine variant Payment 転用)。

## 5 state SSOT

```
              startLifecycle
                    ↓
             [active-billing] ←────────── dunning-succeeded / chargeback-won
              ↑    ↓    ↓
     payment-succeeded  chargeback-filed
              │    ↓        ↓
     [grace-period]    [chargeback-dispute]
              ↓                 ↓
     payment-failed       chargeback-lost
              ↓                 ↓
     [dunning-active] ←→→→→→→ [canceled] ← user-canceled (any state)
              ↓         terminal
     dunning-exhausted
              ↓
          [canceled]
```

## 8 event SSOT

- **payment-succeeded** = 課金成功
- **payment-failed** = 課金失敗
- **dunning-succeeded** = dunning recovery 成功
- **dunning-exhausted** = dunning 全経路 失敗 → 強制 cancel
- **chargeback-filed** = chargeback 発生
- **chargeback-won** = dispute 勝訴
- **chargeback-lost** = dispute 敗訴 → 強制 cancel
- **user-canceled** = voluntary cancel (any state 有効)

## 40 セル 遷移表 SSOT

5 state × 8 event = 40 セル、 有効 遷移 + soft-reject (invalid log 記録) + terminal reject。

## soft-reject vs throw guard の 区別 SSOT

- **auth v0.7 continuous-auth** = throw guard (state 誤指定 は 即 throw)
- **payment v2.1 lifecycle-orchestrator** = soft-reject (invalid log 記録 + state 保持)

理由 = payment 経路 では webhook 重複配信 / event 順序前後 が normal、 throw だと consumer が 例外処理に 多くの コード を割く必要が出る。 soft-reject + invalid log で consumer 側 の handling を簡素化する。

## API 3 export SSOT

```ts
export function startLifecycle(input: { timestamp: string }): LifecycleSession;

export function handleEvent(input: {
  session: LifecycleSession;
  event: LifecycleEvent;
  timestamp: string;
}): LifecycleSession;

export function summarizeLifecycle(session: LifecycleSession): LifecycleSummary;
```

## Session envelope shape SSOT

```ts
export interface LifecycleSession {
  state: LifecycleState;
  billingCyclesCompleted: number;
  failedAttemptCount: number;
  dunningRoundsExecuted: number;
  chargebacksDisputed: number;
  lastEventAt: string;
  events: string[];  // audit trail: event:X / invalid:X-in-Y / terminal:X-in-Y
}
```

## events log 3 種類 SSOT

- `event:{eventName}` = 正常 event 受信
- `invalid:{eventName}-in-{state}` = 無効 event、 soft-reject
- `terminal:{eventName}-in-{state}` = terminal state で 受信、 全 reject

## Backward compat 絶対維持

- 既存 API (v0.1-v0.4) 変更 0
- shape 契約 preserving = 27 semantics + adapter + provider 群 全て 触らず
- 新規 file `semantics/lifecycle-orchestrator.ts` 追加のみ

## depth-5 pattern 4 例目確定 SSOT

- **1 例目 (depth-5) confirmed** = Mobile v1.54-v1.55 (native storage adapter)
- **1 例目 (depth-5) confirmed** = Desktop v1.60-v1.61 (native process spawn)
- **1 例目 (depth-5) confirmed** = quality-metrics v0.1-v0.5 (release gate)
- **v2.3 = 4 例目 (depth-5) confirmed** = Payment v0.1-v2.1 (lifecycle-orchestrator)

「絶対的 rule」 (3 例目) → 「dominant pattern」 (4 例目) 昇格 confirmed、 v2.4+ で 5 例目 発生の場合は **systematic law** 昇格 candidate。

## systematic pattern 46 度目適用 (continuous state machine variant Payment 転用)

- shape 契約 preserving (既存 API 変更 0)
- additive-only (新規 file 追加のみ)
- backward compat 絶対維持 (opt-in)
- 5 state SSOT (state 数と遷移経路 の 網羅性)
- 8 event SSOT (event 分類の 完全性)
- **soft-reject + invalid log** (payment 経路 の webhook 重複配信対応、 auth throw guard と 区別)
- events log 3 種類 (audit trail 完全性)
- 40 セル 遷移表 (state × event の 網羅)

8 原則統合 pattern (auth v0.7 と 同型) を Payment pair に 転用実証、 v2.4+ で Realtime / Streaming 等 別 pair の depth-5 拡張 で 再利用予定。

## Reference

- 実装 = `packages/payment/src/semantics/lifecycle-orchestrator.ts`
- test = `packages/payment/tests/semantics/lifecycle-orchestrator.test.ts` § T-P-LO-001-018 (18 test)
- dogfood = `examples/dogfood-payment-lifecycle-app/` (4 pattern workflow、 6 test)
- tutorial = `docs/tutorials/130-payment-lifecycle-orchestrator.md`
- migration = `docs/migrations/v2.2-to-v2.3.md`
