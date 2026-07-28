---
title: "@kiwa-lab/payment semantics__chargeback の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;chargeback</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>openChargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L42) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Open a chargeback. Emits `chargeback.opened`.

```ts
export declare function openChargeback(adapter: PaymentAdapter, input: {
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    reason: ChargebackReason;
}): Promise<{
    chargeback: Chargeback;
    step: AxisStep<ChargebackState>;
}>;
```

#### <code v-pre>resolveChargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L133) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Resolve the dispute. `merchantWon: true` → `chargeback.won` (funds returned), `false` → `chargeback.lost` (funds forfeit + fee). Only allowed from `evidence-submitted`.

```ts
export declare function resolveChargeback(adapter: PaymentAdapter, chargeback: Chargeback, input: {
    merchantWon: boolean;
}): Promise<AxisStep<ChargebackState>>;
```

#### <code v-pre>submitEvidence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L90) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Submit evidence to represent the dispute. Emits `chargeback.evidence_submitted`. Only allowed from `opened`.

```ts
export declare function submitEvidence(adapter: PaymentAdapter, chargeback: Chargeback, input: {
    receiptUrl?: string;
    shippingProof?: string;
    customerCommunication?: string;
}): Promise<AxisStep<ChargebackState>>;
```

### 型

#### <code v-pre>Chargeback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L28) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

```ts
export interface Chargeback {
    id: string;
    transactionId: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    reason: ChargebackReason;
    state: ChargebackState;
    history: AxisStep<ChargebackState>[];
}
```

#### <code v-pre>ChargebackReason</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L18) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

```ts
export type ChargebackReason = 'fraudulent' | 'unrecognized' | 'duplicate' | 'product-not-received' | 'product-unacceptable' | 'subscription-canceled' | 'credit-not-processed' | 'general';
```

#### <code v-pre>ChargebackState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/chargeback.ts#L12) <code v-pre>packages/payment/src/semantics/chargeback.ts</code>

Chargeback / dispute semantics. Real card networks (Visa VCR, Mastercard MCOP) run a multi-step dispute flow: opened → evidence submitted (or accept) → representment → arbitration → final outcome. The mock reduces that to the observable 4-event envelope providers surface (opened / evidence_submitted / won / lost) with a state machine that guards transitions.

```ts
export type ChargebackState = 'opened' | 'evidence-submitted' | 'won' | 'lost';
```
