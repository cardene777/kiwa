---
title: "@kiwa-lab/streaming semantics-fidelity-harness の API 契約"
---

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics-fidelity-harness</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createFidelityHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L59) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Default grid — Kafka + Redpanda cover the Kafka-shaped axes (raw protocol, consumer group, schema evolution, transactions, exactly-once, lag). NATS covers the JetStream + KV/Object axes + shares exactly-once + lag. `not-applicable` marks a real-world mismatch (e.g. NATS has no raw Kafka wire protocol) so tests can distinguish "missing on purpose" from "todo".

```ts
export declare function createFidelityHarness(): FidelityHarness;
```

#### <code v-pre>FIDELITY&#95;HARNESS&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L9) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export declare const FIDELITY_HARNESS_SYMBOL: unique symbol;
```

#### <code v-pre>isFidelityHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L121) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Type guard: recognize a FidelityHarness.

```ts
export declare function isFidelityHarness(value: unknown): value is FidelityHarness;
```

#### <code v-pre>isRealDriverMode</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L130) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Env-gate — returns whether tests should also run the real driver against KIWA_MODE=real.

```ts
export declare function isRealDriverMode(env?: NodeJS.ProcessEnv): boolean;
```

#### <code v-pre>requiredKeyFor</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L139) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

Which real-driver key an axis requires when KIWA_MODE=real is set. Tests check `requiredKeyFor(cell.axis)` and skip the real-driver assertion when the corresponding env var isn't present.

```ts
export declare function requiredKeyFor(axis: SemanticsAxis): string | null;
```

### 型

#### <code v-pre>CellStatus</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L21) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export type CellStatus = 'implemented' | 'not-applicable' | 'planned';
```

#### <code v-pre>FidelityCell</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L23) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export interface FidelityCell {
    readonly provider: StreamingProvider;
    readonly axis: SemanticsAxis;
    readonly status: CellStatus;
    readonly note?: string;
}
```

#### <code v-pre>FidelityHarness</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L30) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export interface FidelityHarness {
    readonly [FIDELITY_HARNESS_SYMBOL]: true;
    readonly cells: readonly FidelityCell[];
    cellFor(provider: StreamingProvider, axis: SemanticsAxis): FidelityCell | null;
    cellsFor(provider: StreamingProvider): readonly FidelityCell[];
    axesFor(provider: StreamingProvider, status: CellStatus): readonly SemanticsAxis[];
    totalCells(): number;
}
```

#### <code v-pre>SemanticsAxis</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/fidelity-harness.ts#L11) <code v-pre>packages/streaming/src/semantics/fidelity-harness.ts</code>

```ts
export type SemanticsAxis = 'kafka-raw-protocol' | 'kafka-consumer-group' | 'redpanda-schema-evolution' | 'redpanda-transactions' | 'nats-jetstream-durable' | 'nats-kv-object' | 'exactly-once' | 'consumer-lag-telemetry';
```
