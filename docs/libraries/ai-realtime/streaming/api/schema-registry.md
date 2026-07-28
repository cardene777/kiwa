---
title: "@kiwa-lab/streaming schema-registry の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/streaming</code> <code v-pre>schema-registry</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createSchemaRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L74) <code v-pre>packages/streaming/src/schema-registry.ts</code>

Create a Confluent-shaped schema registry mock. Every registered schema gets a monotonically increasing id + subject-scoped version. Compatibility enforcement is structural — see `checkCompatibility` for the rule set.

```ts
export declare function createSchemaRegistry(config?: SchemaRegistryConfig): SchemaRegistry;
```

#### <code v-pre>isSchemaRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L237) <code v-pre>packages/streaming/src/schema-registry.ts</code>

Type guard: recognize a SchemaRegistry.

```ts
export declare function isSchemaRegistry(value: unknown): value is SchemaRegistry;
```

#### <code v-pre>SCHEMA&#95;REGISTRY&#95;SYMBOL</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L12) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export declare const SCHEMA_REGISTRY_SYMBOL: unique symbol;
```

### 型

#### <code v-pre>CompatibilityCheckResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L30) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface CompatibilityCheckResult {
    readonly compatible: boolean;
    readonly mode: CompatibilityMode;
    readonly reasons: readonly string[];
}
```

#### <code v-pre>RegisteredSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L21) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface RegisteredSchema {
    readonly id: number;
    readonly subject: string;
    readonly version: number;
    readonly kind: SchemaKind;
    readonly schema: string;
    readonly registeredAt: number;
}
```

#### <code v-pre>SchemaRegistry</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L36) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface SchemaRegistry {
    readonly [SCHEMA_REGISTRY_SYMBOL]: true;
    readonly config: SchemaRegistryConfig;
    /**
     * Register a schema version against a subject. Enforces the subject's
     * current compat mode; throws when incompatible.
     */
    register(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
    }): Promise<RegisteredSchema>;
    getById(id: number): Promise<RegisteredSchema | null>;
    getLatestVersion(subject: string): Promise<RegisteredSchema | null>;
    listVersions(subject: string): Promise<RegisteredSchema[]>;
    listSubjects(): Promise<string[]>;
    setCompatibility(subject: string, mode: CompatibilityMode): Promise<void>;
    getCompatibility(subject: string): CompatibilityMode;
    checkCompatibility(input: {
        readonly subject: string;
        readonly kind: SchemaKind;
        readonly schema: string;
    }): CompatibilityCheckResult;
    subjectFor(topic: string, kind: 'key' | 'value'): string;
    reset(): void;
}
```

#### <code v-pre>SchemaRegistryConfig</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/streaming/src/schema-registry.ts#L14) <code v-pre>packages/streaming/src/schema-registry.ts</code>

```ts
export interface SchemaRegistryConfig {
    /** Default compat mode applied to new subjects. */
    readonly defaultCompatibility?: CompatibilityMode;
    /** Subject naming strategy — how tests derive subject from topic. */
    readonly subjectNamingStrategy?: SubjectNamingStrategy;
}
```
