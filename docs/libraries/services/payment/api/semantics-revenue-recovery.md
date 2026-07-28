---
title: "@kiwa-lab/payment semantics-revenue-recovery の API 契約"
---

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics-revenue-recovery</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>advanceCascade</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L101) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Advance the dunning cascade one step. Emits `recovery.dunning_cascade_step` with the channel (email / in-app / sms / push) and step index.

```ts
export declare function advanceCascade(adapter: PaymentAdapter, session: RecoverySession): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>applyCardUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L130) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Card updater ran — customer's expiring card was refreshed via the network. Emits `recovery.card_updated` with the new PAN suffix hint.

```ts
export declare function applyCardUpdate(adapter: PaymentAdapter, session: RecoverySession, input: {
    last4: string;
    expMonth: number;
    expYear: number;
}): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>applyNetworkToken</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L150) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Network tokenization applied — customer card issued a network token that survives PAN re-issue.

```ts
export declare function applyNetworkToken(adapter: PaymentAdapter, session: RecoverySession, input: {
    networkTokenId: string;
}): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>finalizeRecovery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L167) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Mark the recovery terminal — succeeded (recovered) or exhausted (lost).

```ts
export declare function finalizeRecovery(session: RecoverySession, input: {
    succeed: boolean;
}): RecoverySession;
```

#### <code v-pre>scheduleSmartRetry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L83) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Schedule the next smart retry. Emits `recovery.smart_retry_scheduled` with the computed backoff and priority hint. Real Stripe uses ML to predict optimal retry times; the mock uses linear cascade timing.

```ts
export declare function scheduleSmartRetry(adapter: PaymentAdapter, session: RecoverySession): Promise<AxisStep<RecoveryState>>;
```

#### <code v-pre>startRecovery</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L54) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Start a recovery session. The initial failed charge is assumed to have been emitted through the base adapter already.

```ts
export declare function startRecovery(input: {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config?: RecoveryConfig;
}): RecoverySession;
```

### 型

#### <code v-pre>RecoveryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L21) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

```ts
export interface RecoveryConfig {
    /** cascade step definitions ordered by fire time */
    cascade?: Array<'email' | 'in-app' | 'sms' | 'push'>;
    /** ms between cascade steps */
    cascadeStepMs?: number;
    /** whether the merchant subscribes to card updater */
    cardUpdaterEnabled?: boolean;
    /** whether the merchant uses network tokenization */
    networkTokenizationEnabled?: boolean;
}
```

#### <code v-pre>RecoverySession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L32) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

```ts
export interface RecoverySession {
    invoiceId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    state: RecoveryState;
    config: Required<RecoveryConfig>;
    cascadeStepIndex: number;
    history: AxisStep<RecoveryState>[];
}
```

#### <code v-pre>RecoveryState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/revenue-recovery.ts#L12) <code v-pre>packages/payment/src/semantics/revenue-recovery.ts</code>

Revenue recovery axis — smart retry + dunning cascade + card updater + network tokenization. Real providers combine 4 mechanisms to recover failed payments: intelligent retry timing (Stripe Smart Retries), a multi-step dunning cascade (email + in-app + SMS), the card updater network to refresh expired cards, and network tokenization to survive card re-issue events without re-collecting PAN.

```ts
export type RecoveryState = 'initial' | 'smart-retry-scheduled' | 'dunning-cascade' | 'card-updated' | 'network-tokenized' | 'recovered' | 'lost';
```
