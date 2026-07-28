---
title: "@kiwa-lab/payment semantics__fx-cross-border の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;fx-cross-border</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>completeSettlement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L151) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Complete settlement — funds arrived at the beneficiary bank.

```ts
export declare function completeSettlement(adapter: PaymentAdapter, session: FxSession, input: {
    settlementRef: string;
}): Promise<AxisStep<FxState>>;
```

#### <code v-pre>expireRate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L178) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Explicitly expire the current rate lock — used when the caller detects the lock window has passed.

```ts
export declare function expireRate(adapter: PaymentAdapter, session: FxSession): Promise<AxisStep<FxState>>;
```

#### <code v-pre>initiateSettlement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L127) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Initiate settlement via the configured rail (SWIFT / SEPA / ACH etc.). Rate must not have expired.

```ts
export declare function initiateSettlement(adapter: PaymentAdapter, session: FxSession, input: {
    beneficiaryIban?: string;
    beneficiaryBic?: string;
}): Promise<AxisStep<FxState>>;
```

#### <code v-pre>lockRate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L83) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Lock an FX rate for the given currency pair + amount. The rate stays valid for `rateLockDurationMs`, after which callers must call `expireRate` and re-lock.

```ts
export declare function lockRate(adapter: PaymentAdapter, session: FxSession, input: {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    quoteId: string;
    amountFromCents: number;
}): Promise<AxisStep<FxState>>;
```

#### <code v-pre>startFxTransfer</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L58) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

Start a fresh FX session.

```ts
export declare function startFxTransfer(input: {
    transferId: string;
    customerId: string;
    config?: FxConfig;
}): FxSession;
```

### 型

#### <code v-pre>FxConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L33) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

```ts
export interface FxConfig {
    /** ms the rate lock stays valid */
    rateLockDurationMs?: number;
    /** which settlement rail to use */
    settlementRail?: SettlementRail;
}
```

#### <code v-pre>FxRateQuote</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L22) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

```ts
export interface FxRateQuote {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    quoteId: string;
    lockedAt: number;
    lockExpiresAt: number;
    amountFromCents: number;
    amountToCents: number;
}
```

#### <code v-pre>FxSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L40) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

```ts
export interface FxSession {
    transferId: string;
    customerId: string;
    quote: FxRateQuote | null;
    state: FxState;
    config: Required<FxConfig>;
    settledAmountCents: number;
    history: AxisStep<FxState>[];
}
```

#### <code v-pre>FxState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L12) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

FX / cross-border axis — multi-currency rate lock + SWIFT / SEPA settlement + rate expiration. Real cross-border providers (Wise / Airwallex / Currencycloud) quote a rate that stays valid for a fixed window (typically 60-3600 seconds), then settle via SWIFT (global) or SEPA (EU). The mock reproduces rate lock, settlement initiation, settlement completion, and rate expiration.

```ts
export type FxState = 'initial' | 'rate-locked' | 'settlement-initiated' | 'settlement-completed' | 'expired' | 'failed';
```

#### <code v-pre>SettlementRail</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/fx-cross-border.ts#L20) <code v-pre>packages/payment/src/semantics/fx-cross-border.ts</code>

```ts
export type SettlementRail = 'SWIFT' | 'SEPA' | 'ACH' | 'FASTER' | 'RTGS';
```
