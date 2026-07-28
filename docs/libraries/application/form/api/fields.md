---
title: "@kiwa-lab/form fields の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/form</code> <code v-pre>fields</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/form/src/fields.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

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


