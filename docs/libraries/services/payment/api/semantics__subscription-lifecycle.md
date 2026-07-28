---
title: "@kiwa-lab/payment semantics__subscription-lifecycle の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;subscription-lifecycle</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>cancelSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L195) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Cancel the subscription. Emits `subscription.canceled`. Idempotent guard: cancelling an already-canceled subscription throws.

```ts
export declare function cancelSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>changePlan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L76) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Change plan (upgrade or downgrade). The amount change relative to the current plan determines the neutral event: strictly greater = `upgraded`, strictly less = `downgraded`. Equal-amount change is rejected so tests exercise no-op guards explicitly.

```ts
export declare function changePlan(adapter: PaymentAdapter, subscription: Subscription, input: {
    newPlanId: string;
    newAmountCents: number;
}): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>createSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L30) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Create a new subscription. Emits `subscription.created`.

```ts
export declare function createSubscription(adapter: PaymentAdapter, input: {
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
}): Promise<{
    subscription: Subscription;
    step: AxisStep<SubscriptionState>;
}>;
```

#### <code v-pre>pauseSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L127) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Pause the subscription. Emits `subscription.paused`. Only allowed from active / upgraded / downgraded states.

```ts
export declare function pauseSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>reactivateSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L229) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Reactivate a canceled subscription. Emits `subscription.reactivated`. Only allowed from `canceled` — the subscription returns to `active`.

```ts
export declare function reactivateSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

#### <code v-pre>resumeSubscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L161) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Resume a paused subscription. Emits `subscription.resumed`. Only allowed from `paused`.

```ts
export declare function resumeSubscription(adapter: PaymentAdapter, subscription: Subscription): Promise<AxisStep<SubscriptionState>>;
```

### 型

#### <code v-pre>Subscription</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L17) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

```ts
export interface Subscription {
    id: string;
    customerId: string;
    planId: string;
    amountCents: number;
    currency?: string;
    state: SubscriptionState;
    history: AxisStep<SubscriptionState>[];
}
```

#### <code v-pre>SubscriptionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-lifecycle.ts#L10) <code v-pre>packages/payment/src/semantics/subscription-lifecycle.ts</code>

Subscription lifecycle state machine. Real providers converge on the same 7-state envelope: created → (upgraded / downgraded / paused / resumed) → canceled → reactivated. This module wraps that envelope with strict transition guards so tests fail loudly on invalid transitions.

```ts
export type SubscriptionState = 'active' | 'upgraded' | 'downgraded' | 'paused' | 'canceled';
```
