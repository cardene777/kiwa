---
title: "@kiwa-lab/form submitter の API 契約"
---

# <code v-pre>@kiwa-lab/form</code> <code v-pre>submitter</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/form/src/submitter.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>submitForm</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/form/src/submitter.ts#L14) <code v-pre>packages/form/src/submitter.ts</code>

client を受け取り、 optional な value override を setValue で反映してから submit を叩く convenience wrapper。 form submit workflow (form event → validate → onSubmit) の 1 shot 経路を shorten する。

```ts
export declare function submitForm(client: FormClient, opts: SubmitFlowOptions): Promise<SubmitResult>;
```

### 型

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
