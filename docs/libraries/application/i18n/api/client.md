---
title: "@kiwa-lab/i18n client の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/i18n</code> <code v-pre>client</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>createI18nClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L53) <code v-pre>packages/i18n/src/client.ts</code>

provider 別 mock 差 (setLocale event fire pattern / missing key marker) を持たせつつ、 全 API 共通 interface。 実 provider (next-intl / vue-i18n / react-i18next / Lingui) の SDK を差し替えても同じ signature で呼べる想定。

```ts
export declare function createI18nClient(options?: CreateI18nClientOptions): I18nClient;
```

### 型

#### <code v-pre>CreateI18nClientOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L41) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export interface CreateI18nClientOptions {
    provider?: I18nProvider;
    locale?: Locale;
    fallbackLocale?: Locale;
    messages?: Messages;
}
```

#### <code v-pre>I18nClient</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L29) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export interface I18nClient {
    provider: I18nProvider;
    locale: Locale;
    fallbackLocale: Locale;
    setLocale: (locale: Locale) => void;
    translate: (key: string, options?: TranslateOptions) => TranslateResult;
    formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
    formatDate: (value: number | Date, options?: Intl.DateTimeFormatOptions) => string;
    listRecorded: () => TranslateResult[];
    clear: () => void;
}
```

#### <code v-pre>I18nProvider</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L3) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export type I18nProvider = 'next-intl' | 'vue-i18n' | 'react-i18next' | 'lingui';
```

#### <code v-pre>Locale</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L5) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export type Locale = string;
```

#### <code v-pre>MessageBundle</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L9) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export type MessageBundle = {
    [key: string]: MessageEntry;
};
```

#### <code v-pre>Messages</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L11) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export type Messages = Record<Locale, MessageBundle>;
```

#### <code v-pre>TranslateOptions</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L15) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export interface TranslateOptions {
    values?: InterpolationValues;
    count?: number;
    defaultMessage?: string;
    locale?: Locale;
}
```

#### <code v-pre>TranslateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/client.ts#L22) <code v-pre>packages/i18n/src/client.ts</code>

```ts
export interface TranslateResult {
    text: string;
    locale: Locale;
    used: 'primary' | 'fallback' | 'default' | 'missing';
    missing?: string[];
}
```
