---
title: "@kiwa-lab/payment semantics-invoice の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-invoice</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>creditNoteInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L206) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Issue a credit note against a paid invoice. Emits `invoice.credit_noted` with the credit amount (negative, capped at the invoice amount so tests fail loudly on overrefund attempts).

```ts
export declare function creditNoteInvoice(adapter: PaymentAdapter, invoice: Invoice, input: {
    creditAmountCents: number;
}): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>draftInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L29) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Draft a new invoice. Emits `invoice.drafted`.

```ts
export declare function draftInvoice(adapter: PaymentAdapter, input: {
    customerId: string;
    amountCents: number;
    currency?: string;
}): Promise<{
    invoice: Invoice;
    step: AxisStep<InvoiceState>;
}>;
```

#### <code v-pre>markUncollectible</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L171) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Mark an invoice uncollectible (dunning exhausted). Emits `invoice.uncollectible`. Only allowed from `open`.

```ts
export declare function markUncollectible(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>openInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L69) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Open (finalise) a draft. Emits `invoice.opened`. Only allowed from `draft`.

```ts
export declare function openInvoice(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>payInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L102) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Mark invoice paid. Emits `invoice.paid`. Only allowed from `open`.

```ts
export declare function payInvoice(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

#### <code v-pre>voidInvoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L137) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Void an invoice. Emits `invoice.voided`. Allowed from `draft` or `open` (real providers reject voiding a paid invoice — must be credit-noted instead).

```ts
export declare function voidInvoice(adapter: PaymentAdapter, invoice: Invoice): Promise<AxisStep<InvoiceState>>;
```

### 型

#### <code v-pre>Invoice</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L17) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

```ts
export interface Invoice {
    id: string;
    customerId: string;
    amountCents: number;
    currency?: string;
    state: InvoiceState;
    history: AxisStep<InvoiceState>[];
}
```

#### <code v-pre>InvoiceState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/invoice.ts#L10) <code v-pre>packages/payment/src/semantics/invoice.ts</code>

Invoice lifecycle. Real providers use the state machine draft → open → paid (or void / uncollectible). Credit notes are emitted post-paid to refund partial amounts without voiding the invoice. Guards enforce the legal transitions so tests exercise each edge explicitly.

```ts
export type InvoiceState = 'draft' | 'open' | 'paid' | 'void' | 'uncollectible';
```
