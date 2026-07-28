---
title: "@kiwa-lab/form client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/form</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>createFormClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/client.ts#L51) <code v-pre>packages/form/src/client.ts</code>

form client は provider 別 (RHF/Zod/Formik/Conform) の validate + submit 挙動を統一 interface で叩く。 provider 差は id prefix と将来的な error message format のみで、 実 provider の SDK を差し替えても signature 一致で書ける想定。

```ts
export declare function createFormClient(options?: CreateFormClientOptions): FormClient;
```

### 型

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
