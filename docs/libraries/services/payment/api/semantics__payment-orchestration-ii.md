---
title: "@kiwa-lab/payment semantics__payment-orchestration-ii の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;payment-orchestration-ii</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>scoreMl</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L112) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Run ML scoring on the current route. Score below `minMlScore` triggers fallback on the next `smartRoute` call.

```ts
export declare function scoreMl(adapters: PaymentAdapter[], session: OrchestrationIISession, input: {
    score: number;
    features: Record<string, string | number>;
}): Promise<AxisStep<OrchestrationIIState>>;
```

#### <code v-pre>smartRoute</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L85) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Route the charge through the current provider — the primary route in the cascade ladder.

```ts
export declare function smartRoute(adapters: PaymentAdapter[], session: OrchestrationIISession): Promise<AxisStep<OrchestrationIIState>>;
```

#### <code v-pre>startOrchestrationII</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L52) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Start an orchestration II session.

```ts
export declare function startOrchestrationII(input: {
    intentId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config: OrchestrationIIConfig;
}): OrchestrationIISession;
```

#### <code v-pre>triggerFallback</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L141) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Trigger a fallback to the next provider in the ladder. Increments the current index; exhausts the cascade when no more providers remain.

```ts
export declare function triggerFallback(adapters: PaymentAdapter[], session: OrchestrationIISession): Promise<AxisStep<OrchestrationIIState>>;
```

### 型

#### <code v-pre>OrchestrationIIConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L19) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

```ts
export interface OrchestrationIIConfig {
    /** ordered list of providers in fallback priority */
    providers: PaymentProvider[];
    /** whether ML scoring is used to pick the primary route */
    mlScoringEnabled?: boolean;
    /** minimum ML score (0-1) to accept a routing decision */
    minMlScore?: number;
    /** max attempts across the whole cascade */
    maxAttempts?: number;
}
```

#### <code v-pre>OrchestrationIISession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L30) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

```ts
export interface OrchestrationIISession {
    intentId: string;
    amountCents: number;
    customerId: string;
    currency?: string;
    config: Required<OrchestrationIIConfig>;
    currentIndex: number;
    attemptCount: number;
    mlScore: number | null;
    state: OrchestrationIIState;
    history: AxisStep<OrchestrationIIState>[];
}
```

#### <code v-pre>OrchestrationIIState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/payment-orchestration-ii.ts#L11) <code v-pre>packages/payment/src/semantics/payment-orchestration-ii.ts</code>

Payment orchestration II axis — smart routing (BIN-based / cost-optimised) + ML-driven route decisioning + fallback ladder + retry cascade with exhaustion. Extends the v0.4 `orchestration` axis with an ML scoring signal, an explicit fallback ladder (as opposed to a simple linear cascade), and a terminal `cascade-exhausted` state.

```ts
export type OrchestrationIIState = 'initial' | 'smart-routed' | 'ml-scored' | 'fallback-triggered' | 'cascade-exhausted' | 'terminated';
```
