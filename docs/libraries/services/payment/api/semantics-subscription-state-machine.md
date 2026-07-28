---
title: "@kiwa-lab/payment semantics-subscription-state-machine の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-subscription-state-machine</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyProration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L115) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Apply proration for a mid-cycle plan change. `daysElapsed` is the number of days into the current billing cycle; `newPlanPriceCents` is the target plan's monthly price.

```ts
export declare function applyProration(adapter: PaymentAdapter, session: SubscriptionMachineSession, input: {
    daysElapsed: number;
    daysInCycle: number;
    newPlanPriceCents: number;
}): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>enterGracePeriod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L77) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Enter grace period after payment failure. Grace period is a bounded window where the subscription is still active from the customer's POV but the merchant has stopped granting renewed entitlement.

```ts
export declare function enterGracePeriod(adapter: PaymentAdapter, session: SubscriptionMachineSession): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>exitGracePeriod</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L95) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Exit grace period — either payment recovered (returns to active) or timeout reached (returns to expired).

```ts
export declare function exitGracePeriod(adapter: PaymentAdapter, session: SubscriptionMachineSession, input: {
    recovered: boolean;
}): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>stackCoupon</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L148) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Add a coupon to the stack. Non-stackable coupons replace any existing coupon; stackable coupons combine.

```ts
export declare function stackCoupon(adapter: PaymentAdapter, session: SubscriptionMachineSession, input: CouponEntry): Promise<AxisStep<SubscriptionMachineState>>;
```

#### <code v-pre>startSubscriptionMachine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L49) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Start a subscription state-machine session against an existing subscription. This wraps the v0.3 subscription-lifecycle axis with the fine-grained payment-side state (grace period + coupon stacking) that downstream tests need to assert on.

```ts
export declare function startSubscriptionMachine(input: {
    subscriptionId: string;
    customerId: string;
    planPriceCents: number;
    currency?: string;
    gracePeriodMs?: number;
}): SubscriptionMachineSession;
```

### 型

#### <code v-pre>CouponEntry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L19) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

```ts
export interface CouponEntry {
    code: string;
    percentOff: number;
    amountOffCents?: number;
    /** ms until the coupon expires; 0 = never */
    ttlMs?: number;
    /** whether this coupon can stack with others */
    stackable?: boolean;
}
```

#### <code v-pre>SubscriptionMachineSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L29) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

```ts
export interface SubscriptionMachineSession {
    subscriptionId: string;
    customerId: string;
    planPriceCents: number;
    currency?: string;
    currentCyclePriceCents: number;
    state: SubscriptionMachineState;
    gracePeriodMs: number;
    gracePeriodEnteredAt: number | null;
    pausedAt: number | null;
    coupons: CouponEntry[];
    history: AxisStep<SubscriptionMachineState>[];
}
```

#### <code v-pre>SubscriptionMachineState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/subscription-state-machine.ts#L12) <code v-pre>packages/payment/src/semantics/subscription-state-machine.ts</code>

Subscription state machine axis — grace period + pause / resume + proration + coupon stacking. Real subscription billing has a distinct grace period (past-due but not yet cancelled), first-class pause / resume (Stripe `paused_collection`, Paddle `subscription.paused`), mid-cycle proration for plan changes, and stackable discounts / coupons whose effective percent must be recomputed on every renewal.

```ts
export type SubscriptionMachineState = 'active' | 'grace-period' | 'paused' | 'canceled' | 'expired';
```
