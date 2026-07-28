---
title: "@kiwa-lab/component semantics-form-action-advanced の API 契約"
---

# <code v-pre>@kiwa-lab/component</code> <code v-pre>semantics-form-action-advanced</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>applyOptimisticUpdate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L47) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export declare function applyOptimisticUpdate<TForm extends Record<string, unknown>>(session: FormActionSession<TForm>, patch: Partial<TForm>): AxisStep<FormActionState>;
```

#### <code v-pre>enableProgressiveEnhancement</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L63) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export declare function enableProgressiveEnhancement<TForm extends Record<string, unknown>>(session: FormActionSession<TForm>, input: {
    method?: 'post' | 'get';
    actionUrl: string;
}): AxisStep<FormActionState>;
```

#### <code v-pre>markFormStatusPending</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L36) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export declare function markFormStatusPending<TForm extends Record<string, unknown>>(session: FormActionSession<TForm>, submitter: string): AxisStep<FormActionState>;
```

#### <code v-pre>rejectFormAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L93) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export declare function rejectFormAction<TForm extends Record<string, unknown>>(session: FormActionSession<TForm>, error: Error | string): AxisStep<FormActionState>;
```

#### <code v-pre>resolveFormAction</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L78) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export declare function resolveFormAction<TForm extends Record<string, unknown>>(session: FormActionSession<TForm>, result: Partial<TForm>): AxisStep<FormActionState>;
```

#### <code v-pre>startFormActionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L16) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export declare function startFormActionSession<TForm extends Record<string, unknown>>(input: {
    target: ComponentTarget;
    formId: string;
    initial: TForm;
}): FormActionSession<TForm>;
```

### 型

#### <code v-pre>FormActionSession</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L5) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export interface FormActionSession<TForm extends Record<string, unknown> = Record<string, unknown>> {
    target: ComponentTarget;
    formId: string;
    state: FormActionState;
    form: TForm;
    optimisticPatches: Array<Partial<TForm>>;
    enhanced: boolean;
    history: AxisStep<FormActionState>[];
    error: string | null;
}
```

#### <code v-pre>FormActionState</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/component/src/semantics/form-action-advanced.ts#L3) <code v-pre>packages/component/src/semantics/form-action-advanced.ts</code>

```ts
export type FormActionState = 'idle' | 'pending' | 'optimistic' | 'enhanced' | 'resolved' | 'rejected';
```
