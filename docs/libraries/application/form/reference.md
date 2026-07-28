# @kiwa-lab/form リファレンス

## client と field

`createFormClient(options)` は `provider`、`defaultValues`、`now`、`idSeed` を受け取ります。provider の既定値は `react-hook-form` です。`registerField` は rule と default value を登録し、既に同名の値があれば default value で上書きしません。

client の `setValue`、`getValues`、`getSchema`、`getLastErrors`、`listSubmitted`、`clear` は in-memory の状態を扱います。`getFieldError(client, field)` は error がなければ `undefined` ではなく `null` を返します。

## validation

`validateSchema(schema, values, provider)` は `ValidateResult` を返します。field rule は次を組み合わせられます。

| rule | 対象 | error code |
| --- | --- | --- |
| `required` | `undefined` `null` 空文字 | `required` |
| `min` | string の長さまたは number | `min` |
| `max` | string の長さまたは number | `max` |
| `pattern` | string | `pattern` |
| `custom` | 任意の値 | `custom` |

`custom` は error message または `null` を返します。未登録 field、value が undefined または null の required ではない field は、min、max、pattern の検証を通過します。

## submit

`client.submit({ onSubmit, onError })` は validation 後に `SubmitResult` を返します。失敗時は `onError` を呼び、成功時だけ `onSubmit` を await します。どちらの結果も `listSubmitted` へ記録されます。

`submitForm(client, options)` は `overrideValues` をセットしてから `client.submit` を呼ぶ convenience API です。

## 拡張 API

`validateAsync` は validator を並列または直列に実行します。`createFieldArray` は array mutation、`validateDependentFields` は条件付き field validation を扱います。

`retryWithBackoff`、`withTimeout`、`createObservabilityHook` は Promise の失敗制御と観測を扱う汎用 helper です。これらの state はテストごとに作ってください。

<!-- kiwa-public-api:start -->
## API 契約

この section は [公開 entry point](https://github.com/cardene777/kiwa/blob/main/packages/form/src/index.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

### 値

#### <code v-pre>createFieldArray</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L53) <code v-pre>packages/form/src/extensions.ts</code>

field array — React Hook Form useFieldArray 相当

```ts
export declare function createFieldArray<T>(initial?: T[]): FieldArray<T>;
```

#### <code v-pre>createFormClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L51) <code v-pre>packages/form/src/client.ts</code>

form client は provider 別 (RHF/Zod/Formik/Conform) の validate + submit 挙動を統一 interface で叩く。 provider 差は id prefix と将来的な error message format のみで、 実 provider の SDK を差し替えても signature 一致で書ける想定。

```ts
export declare function createFormClient(options?: CreateFormClientOptions): FormClient;
```

#### <code v-pre>createObservabilityHook</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L124) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export declare function createObservabilityHook(): ObservabilityHook;
```

#### <code v-pre>getFieldError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/fields.ts#L16) <code v-pre>packages/form/src/fields.ts</code>

getFieldError = 直近 submit の field-level error を取得。 UI 側 field error 表示 (RHF formState.errors / Formik touched+errors) を再現する経路。

```ts
export declare function getFieldError(client: FormClient, field: string): FieldError | null;
```

#### <code v-pre>registerField</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/fields.ts#L8) <code v-pre>packages/form/src/fields.ts</code>

registerField = provider 別 field register API (RHF register / Formik useField 相当) を client に集約。 rule (required / min / max / pattern / custom) を同時に登録する経路。

```ts
export declare function registerField(client: FormClient, reg: FieldRegistration): void;
```

#### <code v-pre>retryWithBackoff</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/extensions.ts#L100) <code v-pre>packages/form/src/extensions.ts</code>

```ts
export declare function retryWithBackoff<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<RetryResult<T>>;
```

#### <code v-pre>submitForm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/submitter.ts#L14) <code v-pre>packages/form/src/submitter.ts</code>

client を受け取り、 optional な value override を setValue で反映してから submit を叩く convenience wrapper。 form submit workflow (form event → validate → onSubmit) の 1 shot 経路を shorten する。

```ts
export declare function submitForm(client: FormClient, opts: SubmitFlowOptions): Promise<SubmitResult>;
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

#### <code v-pre>validateSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L34) <code v-pre>packages/form/src/validator.ts</code>

provider 別 validate 挙動を統一 result で返す。 実 provider (Zod safeParse / Yup validate / RHF resolver / Conform parseWithZod) に差し替えても signature は変わらない想定。

```ts
export declare function validateSchema(schema: SchemaLike, values: Record<string, unknown>, provider?: FormProvider): ValidateResult;
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

#### <code v-pre>FieldError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L3) <code v-pre>packages/form/src/validator.ts</code>

```ts
export interface FieldError {
    field: string;
    message: string;
    code?: string;
}
```

#### <code v-pre>FieldRegistration</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L5) <code v-pre>packages/form/src/client.ts</code>

```ts
export interface FieldRegistration {
    name: string;
    defaultValue?: unknown;
    rule?: SchemaLike['fields'][string];
}
```

#### <code v-pre>FormClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L27) <code v-pre>packages/form/src/client.ts</code>

```ts
export interface FormClient {
    provider: FormProvider;
    registerField: (reg: FieldRegistration) => void;
    setValue: (name: string, value: unknown) => void;
    getValues: () => Record<string, unknown>;
    getSchema: () => SchemaLike;
    submit: (opts: SubmitOptions) => Promise<SubmitResult>;
    getLastErrors: () => FieldError[];
    listSubmitted: () => SubmittedRecord[];
    clear: () => void;
}
```

#### <code v-pre>FormProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L3) <code v-pre>packages/form/src/client.ts</code>

```ts
export type FormProvider = 'react-hook-form' | 'zod' | 'formik' | 'conform';
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

#### <code v-pre>SchemaLike</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L20) <code v-pre>packages/form/src/validator.ts</code>

SchemaLike = 4 provider の schema 表現を統一。 各 field に validate rule (required / min / max / pattern / customFn) を declaratively 持たせる。 実 provider (Zod object / yup object / RHF resolver) を差し替えても shape は変わらない想定。

```ts
export interface SchemaLike {
    fields: Record<string, {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: RegExp;
        custom?: (value: unknown) => string | null;
    }>;
}
```

#### <code v-pre>SubmitFlowOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/submitter.ts#L3) <code v-pre>packages/form/src/submitter.ts</code>

```ts
export interface SubmitFlowOptions {
    overrideValues?: Record<string, unknown>;
    onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
    onError?: (errors: Array<{
        field: string;
        message: string;
        code?: string;
    }>) => void;
}
```

#### <code v-pre>SubmitOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L11) <code v-pre>packages/form/src/client.ts</code>

```ts
export interface SubmitOptions {
    onSubmit: (values: Record<string, unknown>) => void | Promise<void>;
    onError?: (errors: FieldError[]) => void;
}
```

#### <code v-pre>SubmitResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L16) <code v-pre>packages/form/src/client.ts</code>

```ts
export interface SubmitResult {
    ok: boolean;
    id: string;
    provider: FormProvider;
    values: Record<string, unknown>;
    errors: FieldError[];
    submittedAt: number;
}
```

#### <code v-pre>SubmittedRecord</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L25) <code v-pre>packages/form/src/client.ts</code>

```ts
export interface SubmittedRecord extends SubmitResult {
}
```

#### <code v-pre>ValidateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L9) <code v-pre>packages/form/src/validator.ts</code>

```ts
export interface ValidateResult {
    ok: boolean;
    errors: FieldError[];
    values: Record<string, unknown>;
}
```
<!-- kiwa-public-api:end -->
