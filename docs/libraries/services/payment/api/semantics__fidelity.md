---
title: "@kiwa-lab/payment semantics__fidelity の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;fidelity</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>collectFidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L166) <code v-pre>packages/payment/src/semantics/fidelity.ts</code>

Collect the provider × axis coverage grid. `adapters` is the list of adapters to inspect — usually all 3 (`createStripeMock()`, `createPaddleMock()`, `createLemonSqueezyMock()`). The output is a flat row list `adapters.length * 25 = 75` for the default setup (9 v0.3 axis + 8 v0.4 axis + 8 v0.5 axis = 25 axis × 3 provider), plus `providers` + `axes` roll-up lists so callers can assert on the grid dimensions.

```ts
export declare function collectFidelityCoverage(adapters: PaymentAdapter[]): FidelityCoverage;
```

### 型

#### <code v-pre>FidelityCoverage</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L19) <code v-pre>packages/payment/src/semantics/fidelity.ts</code>

```ts
export interface FidelityCoverage {
    providers: PaymentProvider[];
    axes: BillingAxis[];
    rows: FidelityRow[];
}
```

#### <code v-pre>FidelityRow</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fidelity.ts#L12) <code v-pre>packages/payment/src/semantics/fidelity.ts</code>

Fidelity harness — collects the provider × axis coverage grid that downstream release-gate reports on. Not a runner (no side effect emit); pure inspection so tests / release-gate can assert "3 provider × 25 axis" (v0.3 9 axis + v0.4 8 axis + v0.5 8 axis) without walking every neutral event by hand. The v0.5 slice alone is 3 provider × 8 axis = 24 combination, extending the v0.4 total from 51 rows to 75 rows.

```ts
export interface FidelityRow {
    provider: PaymentProvider;
    axis: BillingAxis;
    neutralEvents: NeutralEventName[];
    providerEvents: string[];
}
```
