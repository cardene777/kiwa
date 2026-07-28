---
title: "@kiwa-lab/payment semantics__dunning の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;dunning</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>dunningAttempt</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L78) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Run the next dunning attempt. Emits `dunning.attempt` on every retry, transitions to `in-grace-period` after the last configured attempt, and finalises to `exhausted` when `finalizeDunning` is called with `succeed: false` (or `recovered` with `succeed: true`).

```ts
export declare function dunningAttempt(adapter: PaymentAdapter, session: DunningSession): Promise<AxisStep<DunningState>>;
```

#### <code v-pre>finalizeDunning</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L117) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Terminal step — either the last attempt succeeded during grace period (`succeed: true` → `dunning.recovered`), or the grace period elapsed (`succeed: false` → `dunning.exhausted`).

```ts
export declare function finalizeDunning(adapter: PaymentAdapter, session: DunningSession, input: {
    succeed: boolean;
}): Promise<AxisStep<DunningState>>;
```

#### <code v-pre>startDunning</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L51) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Start a dunning session. No webhook is emitted at start — the initial failed charge is assumed to have been emitted via `signWebhook` / `checkoutCompleted` etc. Call {@link dunningAttempt} to drive the retry sequence.

```ts
export declare function startDunning(input: {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config?: DunningConfig;
}): DunningSession;
```

### 型

#### <code v-pre>DunningConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L19) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

```ts
export interface DunningConfig {
    /** attempts total (1st attempt included) */
    maxAttempts?: number;
    /** ms between attempts */
    retryIntervalMs?: number;
    /** ms grace period between last failed attempt and terminal state */
    gracePeriodMs?: number;
}
```

#### <code v-pre>DunningSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L28) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

```ts
export interface DunningSession {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    attempt: number;
    state: DunningState;
    config: Required<DunningConfig>;
    history: AxisStep<DunningState>[];
}
```

#### <code v-pre>DunningState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/dunning.ts#L13) <code v-pre>packages/payment/src/semantics/dunning.ts</code>

Dunning — payment retry sequence for a failed invoice. Real providers all run a scheduled retry cadence (Stripe Smart Retries default = 4 attempts over ~1 week, Paddle's dunning follows the merchant-configured schedule, Lemon Squeezy retries 4 times over 14 days). The mock reproduces the user-observable envelope: N attempts, each with a delay window, a grace period between last attempt and terminal state, and a notification hook that fires on every attempt.

```ts
export type DunningState = 'active' | 'in-grace-period' | 'recovered' | 'exhausted';
```
