---
title: "@kiwa-lab/i18n interpolate の API 契約"
---

# <code v-pre>@kiwa-lab/i18n</code> <code v-pre>interpolate</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/interpolate.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>interpolate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/interpolate.ts#L14) <code v-pre>packages/i18n/src/interpolate.ts</code>

`&#123;&#123;name&#125;&#125;` placeholder を values で置換する mustache-lite interpolation。 実 provider (next-intl / vue-i18n / react-i18next / Lingui) の interpolation engine を差し替えても 同じ signature で呼べる想定。

```ts
export declare function interpolate(template: string, values: InterpolationValues): InterpolateResult;
```

### 型

#### <code v-pre>InterpolateResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/interpolate.ts#L3) <code v-pre>packages/i18n/src/interpolate.ts</code>

```ts
export interface InterpolateResult {
    text: string;
    variables: string[];
    missing: string[];
}
```
