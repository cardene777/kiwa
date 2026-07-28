---
title: "@kiwa-lab/payment semantics__embedded-finance の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;embedded-finance</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>closeAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L162) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Close the account — terminal state, no further ops accepted.

```ts
export declare function closeAccount(session: EmbeddedFinanceSession): EmbeddedFinanceSession;
```

#### <code v-pre>issueCard</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L138) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Issue a virtual or physical card against the account. Requires KYC verified (and KYB verified when required).

```ts
export declare function issueCard(adapter: PaymentAdapter, session: EmbeddedFinanceSession, input: {
    cardId: string;
    type: 'virtual' | 'physical';
    last4: string;
}): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### <code v-pre>openAccount</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L54) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Open a fresh BaaS account for the customer.

```ts
export declare function openAccount(adapter: PaymentAdapter, input: {
    accountId: string;
    customerId: string;
    currency?: string;
    config?: EmbeddedFinanceConfig;
}): Promise<{
    session: EmbeddedFinanceSession;
    step: AxisStep<EmbeddedFinanceState>;
}>;
```

#### <code v-pre>verifyKyb</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L118) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Run KYB (Know Your Business) verification — only meaningful when `config.requireKyb=true`.

```ts
export declare function verifyKyb(adapter: PaymentAdapter, session: EmbeddedFinanceSession, input: {
    businessRegistryId: string;
    verified: boolean;
}): Promise<AxisStep<EmbeddedFinanceState>>;
```

#### <code v-pre>verifyKyc</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L89) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Run KYC verification on the account holder. Score is 0-100.

```ts
export declare function verifyKyc(adapter: PaymentAdapter, session: EmbeddedFinanceSession, input: {
    score: number;
}): Promise<AxisStep<EmbeddedFinanceState>>;
```

### 型

#### <code v-pre>EmbeddedFinanceConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L26) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

```ts
export interface EmbeddedFinanceConfig {
    /** whether KYB (business verification) is required in addition to KYC */
    requireKyb?: boolean;
    /** minimum score (0-100) required to advance to card issuance */
    minScore?: number;
}
```

#### <code v-pre>EmbeddedFinanceSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L33) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

```ts
export interface EmbeddedFinanceSession {
    accountId: string;
    customerId: string;
    currency?: string;
    config: Required<EmbeddedFinanceConfig>;
    kycStatus: KycStatus;
    kybStatus: KycStatus;
    kycScore: number;
    cardIds: string[];
    state: EmbeddedFinanceState;
    history: AxisStep<EmbeddedFinanceState>[];
}
```

#### <code v-pre>EmbeddedFinanceState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L13) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

Embedded finance axis — Banking-as-a-Service (BaaS) + card issuance + KYC (Know Your Customer) + KYB (Know Your Business) verification. Real embedded finance providers (Stripe Treasury / Unit / Column) let a platform open bank accounts on behalf of end users, issue physical or virtual cards, and run compliance verification without the platform itself becoming a bank. The mock reproduces the observable envelope: account open → KYC / KYB verified → card issued.

```ts
export type EmbeddedFinanceState = 'initial' | 'account-opened' | 'kyc-pending' | 'kyc-verified' | 'kyb-pending' | 'kyb-verified' | 'card-issued' | 'suspended' | 'closed';
```

#### <code v-pre>KycStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/embedded-finance.ts#L24) <code v-pre>packages/payment/src/semantics/embedded-finance.ts</code>

```ts
export type KycStatus = 'pending' | 'verified' | 'failed';
```
