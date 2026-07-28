---
title: "@kiwa-lab/payment semantics__tax の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;tax</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>calculateTax</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L61) <code v-pre>packages/payment/src/semantics/tax.ts</code>

Pure tax calculation — no adapter side effect. Returns a fully populated {@link TaxLine} so callers can decide whether to emit `tax.calculated`, `tax.reverse_charged` or `tax.exempted`. Rules: - buyer B2B (has VAT id) + cross-border EU + digital / service → reverse charge - buyer country not in table → exempt (out of coverage) - otherwise → standard calc netCents * rateBps / 10000

```ts
export declare function calculateTax(input: TaxCalcInput): TaxLine;
```

#### <code v-pre>emitTaxLine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L105) <code v-pre>packages/payment/src/semantics/tax.ts</code>

Emit the tax outcome. Neutral event = `tax.calculated` (standard), `tax.reverse_charged` (B2B intra-EU) or `tax.exempted` (out of coverage).

```ts
export declare function emitTaxLine(adapter: PaymentAdapter, input: {
    customerId: string;
    line: TaxLine;
    currency?: string;
}): Promise<AxisStep<'calculated' | 'reverse-charged' | 'exempted'>>;
```

### 型

#### <code v-pre>TaxCalcInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L24) <code v-pre>packages/payment/src/semantics/tax.ts</code>

```ts
export interface TaxCalcInput {
    netAmountCents: number;
    buyerCountry: string;
    buyerVatId?: string;
    merchantCountry: string;
    productKind?: 'digital' | 'physical' | 'service';
}
```

#### <code v-pre>TaxKind</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L12) <code v-pre>packages/payment/src/semantics/tax.ts</code>

Tax semantics — VAT / GST / sales tax + reverse charge + tax registration. Real providers surface tax through per-line calculation (Stripe Tax, Paddle Merchant of Record includes VAT/GST inclusive, Lemon Squeezy MOR). This module reproduces the observable envelope: a pure `calculateTax` helper for local decisions plus 3 emit helpers for the neutral events downstream harnesses filter on.

```ts
export type TaxKind = 'vat' | 'gst' | 'sales-tax';
```

#### <code v-pre>TaxLine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax.ts#L14) <code v-pre>packages/payment/src/semantics/tax.ts</code>

```ts
export interface TaxLine {
    kind: TaxKind;
    country: string;
    rateBps: number;
    amountCents: number;
    taxCents: number;
    reverseCharged: boolean;
    exempt: boolean;
}
```
