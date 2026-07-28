---
title: "@kiwa-lab/i18n translator の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/i18n</code> <code v-pre>translator</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/translator.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>translate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/translator.ts#L26) <code v-pre>packages/i18n/src/translator.ts</code>

translation lookup + fallback + pluralization + interpolation の統合 entry。 実 provider の t() / $t() / gettext() を差し替えても同じ signature で呼べる想定。

```ts
export declare function translate(input: TranslateInput): TranslateResult;
```

### 型

#### <code v-pre>TranslateInput</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/translator.ts#L12) <code v-pre>packages/i18n/src/translator.ts</code>

```ts
export interface TranslateInput {
    key: string;
    messages: Messages;
    locale: Locale;
    fallbackLocale: Locale;
    values?: InterpolationValues;
    count?: number;
    defaultMessage?: string;
}
```
