---
title: "@kiwa-lab/payment semantics__dispute の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;dispute</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>escalateArbitration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L105) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Escalate to arbitration — final round in the card-network dispute process, decided by the network with a non-refundable filing fee.

```ts
export declare function escalateArbitration(adapter: PaymentAdapter, session: DisputeSession): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>finalizeDispute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L143) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Terminal — dispute resolved with an outcome. `won` returns funds to the merchant; `lost` finalises the chargeback.

```ts
export declare function finalizeDispute(session: DisputeSession, input: {
    won: boolean;
}): DisputeSession;
```

#### <code v-pre>openDispute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L38) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Open a dispute against an existing charge.

```ts
export declare function openDispute(input: {
    disputeId: string;
    chargeId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    reason: string;
}): DisputeSession;
```

#### <code v-pre>representDispute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L85) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Represent the dispute — merchant challenges the chargeback with the submitted evidence. Advances the case to second presentment.

```ts
export declare function representDispute(adapter: PaymentAdapter, session: DisputeSession): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>shiftLiability</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L124) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Liability shift — apply the 3DS liability shift for a passed challenge. Moves fraud loss from merchant to issuer; typically emitted right after dispute open when the original auth had a successful 3DS.

```ts
export declare function shiftLiability(adapter: PaymentAdapter, session: DisputeSession, input: {
    threeDsAuthCode: string;
}): Promise<AxisStep<DisputeState>>;
```

#### <code v-pre>submitDisputeEvidence</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L66) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Submit evidence for the dispute — receipt, shipping confirmation, customer communication, etc.

```ts
export declare function submitDisputeEvidence(adapter: PaymentAdapter, session: DisputeSession, input: {
    evidenceIds: string[];
}): Promise<AxisStep<DisputeState>>;
```

### 型

#### <code v-pre>DisputeSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L21) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

```ts
export interface DisputeSession {
    disputeId: string;
    chargeId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    reason: string;
    state: DisputeState;
    evidence: string[];
    liabilityShifted: boolean;
    history: AxisStep<DisputeState>[];
    arbitrationOpenedAt: number | null;
}
```

#### <code v-pre>DisputeState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dispute.ts#L12) <code v-pre>packages/payment/src/semantics/dispute.ts</code>

Dispute lifecycle axis — evidence submission + representment + arbitration + liability shift. Real card networks (Visa / Mastercard) define a 5-stage dispute cycle: retrieval → first chargeback → second presentment → arbitration → final ruling. Liability shift occurs when 3DS challenge was passed at authorisation, moving fraud loss from the merchant to the issuer.

```ts
export type DisputeState = 'opened' | 'evidence-submitted' | 'represented' | 'arbitration-opened' | 'liability-shifted' | 'lost' | 'won';
```
