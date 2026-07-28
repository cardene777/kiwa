---
title: "@kiwa-lab/form extensions の API 契約"
---

# <code v-pre>@kiwa-lab/form</code> <code v-pre>extensions</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createFieldArray</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L53) <code v-pre>packages/form/src/extensions.ts</code>

field array — React Hook Form useFieldArray 相当

```ts
export declare function createFieldArray<T>(initial?: T[]): FieldArray<T>;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L124) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L100) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>validateAsync</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L21) <code v-pre>packages/form/src/extensions.ts</code>

async validation — server 側 uniqueness chk 相当

```ts
export declare function validateAsync(values: Record<string, unknown>, validators: Record<string, AsyncValidator>, options?: AsyncValidationOptions): Promise<AsyncValidationResult>;
```

#### <code v-pre>validateDependentFields</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L84) <code v-pre>packages/form/src/extensions.ts</code>

dependent field validation — 「country=US なら zipCode 必須」 相当

```ts
export declare function validateDependentFields(values: Record<string, unknown>, rules: DependentFieldRule[]): DependentFieldResult;
```

#### <code v-pre>withTimeout</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L129) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export declare function withTimeout<T>(fn: () => Promise<T>, timeoutMs: number): Promise<T>;
```

### 型

#### <code v-pre>AsyncValidationOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L7) <code v-pre>packages/form/src/extensions.ts</code>

v2.1 extensions — async validation, field array, dependent field validation, plus retry/batch/observability/timeout/rateLimit/circuitBreaker generics. React Hook Form v7.60+ / Zod v4 追随。

```ts
export interface AsyncValidationOptions {
    debounceMs?: number;
    parallel?: boolean;
}
```

#### <code v-pre>AsyncValidationResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L12) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface AsyncValidationResult {
    valid: boolean;
    errors: Record<string, string>;
    durationMs: number;
}
```

#### <code v-pre>AsyncValidator</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L18) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export type AsyncValidator = (value: unknown, field: string) => Promise<string | null>;
```

#### <code v-pre>DependentFieldResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L77) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface DependentFieldResult {
    valid: boolean;
    triggered: string[];
    errors: Record<string, string>;
}
```

#### <code v-pre>DependentFieldRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L70) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface DependentFieldRule {
    field: string;
    dependsOn: string;
    when: (dependsValue: unknown) => boolean;
    validator: (value: unknown) => string | null;
}
```

#### <code v-pre>FieldArray</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L42) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface FieldArray<T> {
    items: () => T[];
    append: (item: T) => void;
    remove: (index: number) => void;
    move: (from: number, to: number) => void;
    update: (index: number, item: T) => void;
    clear: () => void;
    length: () => number;
}
```

#### <code v-pre>ObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L118) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface ObservabilityHook {
    emit: (event: {
        kind: string;
        data: Record<string, unknown>;
    }) => void;
    events: () => Array<{
        kind: string;
        data: Record<string, unknown>;
    }>;
    clear: () => void;
}
```

#### <code v-pre>RetryOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L97) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface RetryOptions {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffFactor?: number;
}
```

#### <code v-pre>RetryResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L98) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export interface RetryResult<T> {
    ok: boolean;
    attempts: number;
    value?: T;
    error?: unknown;
}
```
