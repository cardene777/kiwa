---
title: "@kiwa-lab/payment semantics__bnpl の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;bnpl</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>chargeLateFee</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L151) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Charge a late fee for a missed installment.

```ts
export declare function chargeLateFee(adapter: PaymentAdapter, session: BnplSession, input: {
    installmentIndex: number;
}): Promise<AxisStep<BnplState>>;
```

#### <code v-pre>createBnplPlan</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L58) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Create a BNPL plan. Splits `totalCents` into equal installments (rounded to integer cents; the last installment absorbs any rounding remainder).

```ts
export declare function createBnplPlan(adapter: PaymentAdapter, input: {
    planId: string;
    customerId: string;
    totalCents: number;
    currency?: string;
    config: BnplConfig;
}): Promise<{
    session: BnplSession;
    step: AxisStep<BnplState>;
}>;
```

#### <code v-pre>markInstallmentPaid</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L175) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Mark an installment as paid. Once all installments are paid the session enters `settled`.

```ts
export declare function markInstallmentPaid(session: BnplSession): BnplSession;
```

#### <code v-pre>scheduleInstallment</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L106) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Schedule the next installment — advances the schedule pointer and emits the neutral event. Throws once all installments are scheduled.

```ts
export declare function scheduleInstallment(adapter: PaymentAdapter, session: BnplSession): Promise<AxisStep<BnplState>>;
```

#### <code v-pre>scoreRisk</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L127) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

Run risk scoring on the customer. Score below `config.minRiskScore` marks the plan as defaulted and blocks further activity.

```ts
export declare function scoreRisk(adapter: PaymentAdapter, session: BnplSession, input: {
    score: number;
    creditBureau?: string;
}): Promise<AxisStep<BnplState>>;
```

### 型

#### <code v-pre>BnplConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L22) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

```ts
export interface BnplConfig {
    /** number of installments (2-6 typical) */
    installments: number;
    /** ms between installment due dates */
    installmentIntervalMs?: number;
    /** minimum risk score (0-100) required to approve */
    minRiskScore?: number;
    /** late fee charged per missed installment, in cents */
    lateFeeCents?: number;
}
```

#### <code v-pre>BnplSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L33) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

```ts
export interface BnplSession {
    planId: string;
    customerId: string;
    totalCents: number;
    currency?: string;
    config: Required<BnplConfig>;
    installmentAmountCents: number;
    installmentsScheduled: number;
    installmentsPaid: number;
    riskScore: number;
    lateFeesTotalCents: number;
    state: BnplState;
    history: AxisStep<BnplState>[];
}
```

#### <code v-pre>BnplState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/bnpl.ts#L12) <code v-pre>packages/payment/src/semantics/bnpl.ts</code>

BNPL (Buy Now Pay Later) axis — installment plan + risk scoring + credit decisioning + late fee. Real BNPL providers (Klarna / Affirm / Afterpay) split a purchase into 2-6 installments, run a soft credit check + risk score at checkout, and charge a late fee if a scheduled installment misses its due date. The mock reproduces plan creation, per-installment schedule emission, risk score emission, and late fee emission.

```ts
export type BnplState = 'initial' | 'plan-created' | 'installments-scheduled' | 'risk-scored' | 'active' | 'late-fee-charged' | 'settled' | 'defaulted';
```
