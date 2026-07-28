---
title: "@kiwa-lab/payment semantics__psd2 の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;psd2</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createMandate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L29) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

Create a new mandate. Emits `psd2.mandate_created` with the scheme embedded in metadata so downstream tests can filter per scheme.

```ts
export declare function createMandate(adapter: PaymentAdapter, input: {
    scheme: PsdMandateScheme;
    customerId: string;
    amountCentsCap?: number;
    currency?: string;
}): Promise<{
    mandate: PsdMandate;
    step: AxisStep<PsdMandateState>;
}>;
```

#### <code v-pre>grantConsent</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L112) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

Grant open banking consent. Emits `psd2.consent_granted` with the scope list embedded — real OBIE consents scope to `accounts` / `payments`, this mock echoes whatever caller passes so tests can assert on custom scopes.

```ts
export declare function grantConsent(adapter: PaymentAdapter, input: {
    customerId: string;
    scopes: string[];
    validForMs?: number;
}): Promise<AxisStep<'granted'>>;
```

#### <code v-pre>revokeMandate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L76) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

Revoke an active mandate. Emits `psd2.mandate_revoked`. Idempotent — a second call on an already-revoked mandate throws so tests exercise the guard explicitly.

```ts
export declare function revokeMandate(adapter: PaymentAdapter, mandate: PsdMandate): Promise<AxisStep<PsdMandateState>>;
```

### 型

#### <code v-pre>PsdMandate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L15) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

```ts
export interface PsdMandate {
    id: string;
    scheme: PsdMandateScheme;
    customerId: string;
    amountCentsCap?: number;
    currency?: string;
    state: PsdMandateState;
    history: AxisStep<PsdMandateState>[];
}
```

#### <code v-pre>PsdMandateScheme</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L11) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

PSD2 open banking + mandate semantics. Under PSD2 (EU) and the equivalent UK OBIE spec, recurring debits require a signed customer mandate (SEPA DD B2C, SEPA DD B2B, UK BACS DDI). Open banking payment initiation requires a granular consent from the customer's bank. This module tracks both — mandate lifecycle (create / revoke) and consent grant.

```ts
export type PsdMandateScheme = 'sepa-core' | 'sepa-b2b' | 'bacs' | 'open-banking';
```

#### <code v-pre>PsdMandateState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/psd2.ts#L13) <code v-pre>packages/payment/src/semantics/psd2.ts</code>

```ts
export type PsdMandateState = 'active' | 'revoked';
```
