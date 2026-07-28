---
title: "@kiwa-lab/payment semantics-recurring-revenue-advanced の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-recurring-revenue-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>computeMrr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L79) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Compute MRR / ARR from the current snapshot. MRR = mrrEnd, ARR = MRR × 12.

```ts
export declare function computeMrr(adapter: PaymentAdapter, session: RecurringRevenueSession): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>computeNrr</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L140) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Compute NRR (Net Revenue Retention) — the industry-standard growth quality metric. NRR = (MRR_start - churn - contraction + expansion) / MRR_start × 100. NRR &gt; 100% means the cohort grew despite churn.

```ts
export declare function computeNrr(adapter: PaymentAdapter, session: RecurringRevenueSession): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>recordChurn</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L95) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Record churned MRR — a subscription cancellation or downgrade to 0.

```ts
export declare function recordChurn(adapter: PaymentAdapter, session: RecurringRevenueSession, input: {
    churnCents: number;
    subscriptionId: string;
}): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>recordContraction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L165) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Record contraction (downgrade without churn) — separate from churn so NRR captures the difference.

```ts
export declare function recordContraction(session: RecurringRevenueSession, input: {
    contractionCents: number;
}): RecurringRevenueSession;
```

#### <code v-pre>recordExpansion</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L116) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Record expansion MRR — an upgrade or seat add that grew the account.

```ts
export declare function recordExpansion(adapter: PaymentAdapter, session: RecurringRevenueSession, input: {
    expansionCents: number;
    subscriptionId: string;
    kind: 'upgrade' | 'seat-add' | 'usage';
}): Promise<AxisStep<RecurringRevenueState>>;
```

#### <code v-pre>startRecurringRevenue</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L44) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Start a recurring revenue analytics session for a cohort.

```ts
export declare function startRecurringRevenue(input: {
    cohortId: string;
    customerId: string;
    currency?: string;
    mrrStartCents: number;
}): RecurringRevenueSession;
```

### 型

#### <code v-pre>RecurringRevenueSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L29) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

```ts
export interface RecurringRevenueSession {
    cohortId: string;
    customerId: string;
    currency?: string;
    snapshot: RecurringRevenueSnapshot;
    computedMrr: number;
    computedArr: number;
    computedNrr: number;
    state: RecurringRevenueState;
    history: AxisStep<RecurringRevenueState>[];
}
```

#### <code v-pre>RecurringRevenueSnapshot</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L19) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

```ts
export interface RecurringRevenueSnapshot {
    cohortId: string;
    mrrStartCents: number;
    mrrEndCents: number;
    churnCents: number;
    contractionCents: number;
    expansionCents: number;
    newBusinessCents: number;
}
```

#### <code v-pre>RecurringRevenueState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/recurring-revenue-advanced.ts#L12) <code v-pre>packages/payment/src/semantics/recurring-revenue-advanced.ts</code>

Recurring revenue advanced axis — MRR (Monthly Recurring Revenue) + ARR (Annual Recurring Revenue) + churn tracking + expansion revenue + NRR (Net Revenue Retention). Real SaaS billing platforms (Stripe / Chargebee / Recurly) roll these metrics into cohort analytics: NRR = (MRR_end - churn - contraction + expansion) / MRR_start × 100. The mock reproduces MRR / ARR computation, churn / expansion recording, and NRR rollup.

```ts
export type RecurringRevenueState = 'initial' | 'mrr-computed' | 'churn-recorded' | 'expansion-recorded' | 'nrr-computed';
```
