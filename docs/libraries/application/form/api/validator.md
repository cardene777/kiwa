---
title: "@kiwa-lab/form validator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/form</code> <code v-pre>validator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>validateSchema</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L34) <code v-pre>packages/form/src/validator.ts</code>

provider 別 validate 挙動を統一 result で返す。 実 provider (Zod safeParse / Yup validate / RHF resolver / Conform parseWithZod) に差し替えても signature は変わらない想定。

```ts
export declare function validateSchema(schema: SchemaLike, values: Record<string, unknown>, provider?: FormProvider): ValidateResult;
```

### 型

#### <code v-pre>FieldError</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L3) <code v-pre>packages/form/src/validator.ts</code>

```ts
export interface FieldError {
    field: string;
    message: string;
    code?: string;
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

#### <code v-pre>ValidateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/validator.ts#L9) <code v-pre>packages/form/src/validator.ts</code>

```ts
export interface ValidateResult {
    ok: boolean;
    errors: FieldError[];
    values: Record<string, unknown>;
}
```
