---
title: "@kiwa-lab/payment semantics__tax-localization の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;tax-localization</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>calculateLocalizedTax</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L67) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

Compute the tax line for a given jurisdiction + amount + B2B flag. Handles EU reverse charge (B2B intra-EU → tax borne by buyer) and emits the correct provider dialect for VAT vs GST vs sales-tax.

```ts
export declare function calculateLocalizedTax(adapter: PaymentAdapter, input: TaxLocalizationInput): Promise<{
    line: TaxLocalizationLine;
    step: AxisStep<TaxLocalizationState>;
}>;
```

#### <code v-pre>reportDac7</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L119) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

Emit a DAC7 marketplace report entry. Real digital platforms must submit annual DAC7 reports to the EU tax authorities listing seller revenue by jurisdiction.

```ts
export declare function reportDac7(adapter: PaymentAdapter, input: {
    sellerId: string;
    reportingYear: number;
    lines: TaxLocalizationLine[];
    customerId: string;
    currency?: string;
}): Promise<AxisStep<TaxLocalizationState>>;
```

### 型

#### <code v-pre>TaxJurisdiction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L17) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

```ts
export type TaxJurisdiction = 'EU' | 'UK' | 'US' | 'AU' | 'CA' | 'JP' | 'other';
```

#### <code v-pre>TaxKindLocalized</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L26) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

```ts
export type TaxKindLocalized = 'vat' | 'gst' | 'sales-tax' | 'dac7-report';
```

#### <code v-pre>TaxLocalizationInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L32) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

```ts
export interface TaxLocalizationInput {
    jurisdiction: TaxJurisdiction;
    amountCents: number;
    customerId: string;
    currency?: string;
    /** ISO-3166-2 subdivision for US destination sourcing */
    region?: string;
    /** whether the customer is B2B (reverse charge applies) */
    b2b?: boolean;
}
```

#### <code v-pre>TaxLocalizationLine</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L43) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

```ts
export interface TaxLocalizationLine {
    jurisdiction: TaxJurisdiction;
    kind: TaxKindLocalized;
    amountCents: number;
    taxCents: number;
    ratePercent: number;
    reverseCharge: boolean;
}
```

#### <code v-pre>TaxLocalizationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/tax-localization.ts#L11) <code v-pre>packages/payment/src/semantics/tax-localization.ts</code>

Tax localization axis — VAT + GST + sales tax + EU DAC7 reporting. Real merchants selling cross-border have to compute the correct indirect tax by jurisdiction (EU VAT MOSS / OSS, UK VAT, AU GST, US destination sales tax) and file periodic marketplace reporting under EU DAC7 for digital platforms.

```ts
export type TaxLocalizationState = 'calculating' | 'calculated' | 'reported' | 'exempt';
```
