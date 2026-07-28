---
title: "@kiwa-lab/payment semantics__orchestration の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/payment</code> <code v-pre>semantics&#95;&#95;orchestration</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>probeCircuit</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L142) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Probe the circuit breaker — closes the breaker if the outage window has elapsed, otherwise stays open. Emits `orchestration.circuit_closed` when the breaker closes.

```ts
export declare function probeCircuit(adapters: PaymentAdapter[], session: OrchestrationSession): Promise<AxisStep<OrchestrationState>>;
```

#### <code v-pre>routeCharge</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L87) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Route a single charge attempt through the current provider adapter. `succeed=true` emits `orchestration.routed` and leaves the router on the same provider. `succeed=false` increments the failure counter and either triggers a failover, opens the breaker, or terminates.

```ts
export declare function routeCharge(adapters: PaymentAdapter[], session: OrchestrationSession, input: {
    succeed: boolean;
    customerId: string;
}): Promise<AxisStep<OrchestrationState>>;
```

#### <code v-pre>startOrchestration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L53) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Start an orchestration session. `adapters` supplies one adapter per provider in the same order as `config.providers`.

```ts
export declare function startOrchestration(input: {
    intentId: string;
    amountCents: number;
    currency?: string;
    config: OrchestrationConfig;
}): OrchestrationSession;
```

### 型

#### <code v-pre>OrchestrationConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L19) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

```ts
export interface OrchestrationConfig {
    /** ordered provider list — index 0 = primary, rest = failover cascade */
    providers: PaymentProvider[];
    /** consecutive failures that open the breaker */
    circuitBreakerThreshold?: number;
    /** ms the breaker stays open before we probe again */
    circuitOpenDurationMs?: number;
    /** retry attempts against the current provider before failover */
    maxRetriesPerProvider?: number;
}
```

#### <code v-pre>OrchestrationSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L30) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

```ts
export interface OrchestrationSession {
    intentId: string;
    amountCents: number;
    currency?: string;
    config: Required<OrchestrationConfig>;
    currentProviderIndex: number;
    currentProviderFailures: number;
    totalFailures: number;
    state: OrchestrationState;
    history: AxisStep<OrchestrationState>[];
    circuitOpenedAt: number | null;
}
```

#### <code v-pre>OrchestrationState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/payment/src/semantics/orchestration.ts#L12) <code v-pre>packages/payment/src/semantics/orchestration.ts</code>

Orchestration axis — multi-provider routing + failover + retry ladder + circuit breaker. Real merchants split traffic across 2-3 providers to hedge against outages and to fine-tune per-BIN authorisation rates. The mock reproduces the observable envelope: a router that picks the primary provider, retries on failure, fails over to a secondary, and opens a circuit after a configurable failure threshold.

```ts
export type OrchestrationState = 'routing' | 'failed-over' | 'circuit-open' | 'circuit-closed' | 'terminated';
```
