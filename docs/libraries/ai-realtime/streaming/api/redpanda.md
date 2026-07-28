---
title: "@kiwa-lab/streaming redpanda の API 契約"
---

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>redpanda</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRedpandaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L35) <code v-pre>packages/streaming/src/redpanda.ts</code>

Create a Redpanda-shaped mock. Under the hood it's the same broker mock as Kafka + a schema registry — the split exists so tests targeting Redpanda can pick the exact symbol / surface they want to assert against.

```ts
export declare function createRedpandaMock(config?: RedpandaMockConfig): RedpandaMock;
```

#### <code v-pre>isRedpandaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L63) <code v-pre>packages/streaming/src/redpanda.ts</code>

Type guard: recognize a RedpandaMock.

```ts
export declare function isRedpandaMock(value: unknown): value is RedpandaMock;
```

#### <code v-pre>REDPANDA&#95;MOCK&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L14) <code v-pre>packages/streaming/src/redpanda.ts</code>

```ts
export declare const REDPANDA_MOCK_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>RedpandaMock</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L25) <code v-pre>packages/streaming/src/redpanda.ts</code>

RedpandaMock exposes the same producer/consumer/admin surface as KafkaMock (structural compatibility) + a colocated `schemaRegistry` field so tests can register schemas + assert compatibility without a second setup call.

```ts
export interface RedpandaMock extends KafkaMock {
    readonly [REDPANDA_MOCK_SYMBOL]: true;
    readonly schemaRegistry: SchemaRegistry;
}
```

#### <code v-pre>RedpandaMockConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/redpanda.ts#L16) <code v-pre>packages/streaming/src/redpanda.ts</code>

```ts
export interface RedpandaMockConfig extends KafkaMockConfig {
    readonly schemaRegistry?: SchemaRegistryConfig;
}
```
