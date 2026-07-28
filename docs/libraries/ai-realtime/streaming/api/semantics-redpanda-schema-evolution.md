---
title: "@kiwa-lab/streaming semantics-redpanda-schema-evolution の API 契約"
---

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>semantics-redpanda-schema-evolution</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createRedpandaSchemaEvolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L131) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

Create a Redpanda schema-evolution registry. Registration enforces the subject's current compat mode + tracks a schema reference graph (`references`) so tests can validate composed schemas (Order → Address).

```ts
export declare function createRedpandaSchemaEvolution(config?: RedpandaSchemaEvolutionConfig): RedpandaSchemaEvolution;
```

#### <code v-pre>isRedpandaSchemaEvolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L243) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

Type guard: recognize a RedpandaSchemaEvolution.

```ts
export declare function isRedpandaSchemaEvolution(value: unknown): value is RedpandaSchemaEvolution;
```

#### <code v-pre>REDPANDA&#95;SCHEMA&#95;EVOLUTION&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L13) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export declare const REDPANDA_SCHEMA_EVOLUTION_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>EvolutionCheckResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L38) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface EvolutionCheckResult {
    readonly compatible: boolean;
    readonly mode: CompatibilityMode;
    readonly reasons: readonly string[];
}
```

#### <code v-pre>EvolutionSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L28) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface EvolutionSchema {
    readonly id: number;
    readonly subject: string;
    readonly version: number;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly references: readonly SchemaReference[];
    readonly registeredAt: number;
}
```

#### <code v-pre>RedpandaSchemaEvolution</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L44) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface RedpandaSchemaEvolution {
    readonly [REDPANDA_SCHEMA_EVOLUTION_SYMBOL]: true;
    readonly config: Required<RedpandaSchemaEvolutionConfig>;
    register(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
        readonly references?: readonly SchemaReference[];
    }): EvolutionSchema;
    latest(subject: string): EvolutionSchema | null;
    versions(subject: string): readonly EvolutionSchema[];
    setCompatibility(subject: string, mode: CompatibilityMode): void;
    getCompatibility(subject: string): CompatibilityMode;
    check(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
    }): EvolutionCheckResult;
    subjectFor(topic: string, part: 'key' | 'value', recordName?: string): string;
    resolveReferences(schema: EvolutionSchema): readonly EvolutionSchema[];
    reset(): void;
}
```

#### <code v-pre>RedpandaSchemaEvolutionConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L17) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface RedpandaSchemaEvolutionConfig {
    readonly defaultCompatibility?: CompatibilityMode;
    readonly subjectNamingStrategy?: SubjectNamingStrategy;
}
```

#### <code v-pre>SchemaReference</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/semantics/redpanda-schema-evolution.ts#L22) <code v-pre>packages/streaming/src/semantics/redpanda-schema-evolution.ts</code>

```ts
export interface SchemaReference {
    readonly name: string;
    readonly subject: string;
    readonly version: number;
}
```
