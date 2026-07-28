---
title: "@kiwa-lab/payment semantics__refund-advanced の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;refund-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>denyByPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L109) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Explicit deny — the merchant refuses the refund because it violates policy (e.g., digital goods post-download).

```ts
export declare function denyByPolicy(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>fullRefund</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L91) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Issue a full refund. Marks the session as fully refunded.

```ts
export declare function fullRefund(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>markWindowExpired</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L120) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Emit the window-expired terminal — refund attempted outside the window.

```ts
export declare function markWindowExpired(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>partialRefund</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L73) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Issue a partial refund. Fails if the window has expired, if the amount violates policy, or if a prior full refund has already exhausted the charge.

```ts
export declare function partialRefund(adapter: PaymentAdapter, session: RefundSession, input: {
    amountCents: number;
}): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>preventChargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L133) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Chargeback prevention utility — issues a full refund whenever the merchant preemptively wants to head off a chargeback. Only fires if the policy has `chargebackPrevention: true`.

```ts
export declare function preventChargeback(adapter: PaymentAdapter, session: RefundSession): Promise<AxisStep<RefundState>>;
```

#### <code v-pre>startRefund</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L46) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Start a refund session against an existing charge. `chargedAt` is the original charge timestamp; the window policy is evaluated relative to this timestamp.

```ts
export declare function startRefund(input: {
    chargeId: string;
    originalAmountCents: number;
    chargedAt: number;
    customerId: string;
    currency?: string;
    policy: RefundPolicy;
}): RefundSession;
```

### 型

#### <code v-pre>RefundPolicy</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L18) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

```ts
export interface RefundPolicy {
    /** ms window in which refunds are allowed */
    windowMs: number;
    /** minimum refundable amount in cents */
    minAmountCents?: number;
    /** maximum single-refund amount in cents */
    maxAmountCents?: number;
    /** whether the merchant proactively refunds to prevent chargebacks */
    chargebackPrevention?: boolean;
}
```

#### <code v-pre>RefundSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L29) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

```ts
export interface RefundSession {
    chargeId: string;
    originalAmountCents: number;
    chargedAt: number;
    customerId: string;
    currency?: string;
    policy: RefundPolicy;
    refundedCents: number;
    state: RefundState;
    history: AxisStep<RefundState>[];
}
```

#### <code v-pre>RefundState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/refund-advanced.ts#L11) <code v-pre>packages/payment/src/semantics/refund-advanced.ts</code>

Refund advanced axis — partial refund + refund policy + refund window + chargeback prevention. Real merchants apply time-window policies (30 day / 60 day / no-refund), partial refunds with amount caps, and use refunds proactively to head off chargebacks that would otherwise incur $15-$25 fees plus liability shift.

```ts
export type RefundState = 'requested' | 'partial-issued' | 'full-issued' | 'window-expired' | 'policy-denied';
```
