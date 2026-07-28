---
title: "@kiwa-lab/payment semantics__lifecycle-orchestrator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;lifecycle-orchestrator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>handleEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L74) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

event driven state 遷移 SSOT。 5 state × 8 event = 40 セル の 遷移 表を 1 switch で 実装。 無効遷移 は 現 state を保持 + events log に "invalid" 記録 (throw ではなく soft-reject、 v0.7 continuous-auth の guard-throw と 区別 = payment 経路 は event 過剰受信 が normal で、 throw だと dogfood consumer が 例外処理 に多くの コード を割く 必要が出るため soft-reject)。

```ts
export declare function handleEvent(input: {
    session: LifecycleSession;
    event: LifecycleEvent;
    timestamp: string;
}): LifecycleSession;
```

#### <code v-pre>startLifecycle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L55) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

lifecycle orchestrator の 開始。 default で active-billing 状態、 subscription 契約成立直後 に 呼出。

```ts
export declare function startLifecycle(input: {
    timestamp: string;
}): LifecycleSession;
```

#### <code v-pre>summarizeLifecycle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L179) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

```ts
export declare function summarizeLifecycle(session: LifecycleSession): LifecycleSummary;
```

### 型

#### <code v-pre>LifecycleEvent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L31) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

遷移 trigger event、 evaluate 経路 で 使う。

```ts
export type LifecycleEvent = 'payment-succeeded' | 'payment-failed' | 'dunning-succeeded' | 'dunning-exhausted' | 'chargeback-filed' | 'chargeback-won' | 'chargeback-lost' | 'user-canceled';
```

#### <code v-pre>LifecycleSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L41) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

```ts
export interface LifecycleSession {
    state: LifecycleState;
    billingCyclesCompleted: number;
    failedAttemptCount: number;
    dunningRoundsExecuted: number;
    chargebacksDisputed: number;
    lastEventAt: string;
    events: string[];
}
```

#### <code v-pre>LifecycleState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L23) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

lifecycle-orchestrator の 5 state。 subscription lifecycle と revenue-recovery を 統合 した 生命 サイクル SSOT。

```ts
export type LifecycleState = 'active-billing' | 'grace-period' | 'dunning-active' | 'chargeback-dispute' | 'canceled';
```

#### <code v-pre>LifecycleSummary</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/lifecycle-orchestrator.ts#L169) <code v-pre>packages/payment/src/semantics/lifecycle-orchestrator.ts</code>

lifecycle の 統計サマリー生成、 dogfood consumer が 監視 dashboard で 出力する 用途。 total events 数 + valid event 数 + 遷移 経路 の hash。

```ts
export interface LifecycleSummary {
    currentState: LifecycleState;
    totalEvents: number;
    validEvents: number;
    invalidEvents: number;
    terminalEvents: number;
    cyclesCompleted: number;
    chargebacksDisputed: number;
}
```
