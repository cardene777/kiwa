---
title: "@kiwa-lab/i18n plural の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/i18n</code> <code v-pre>plural</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](../reference.md)

### 値

#### <code v-pre>selectPlural</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts#L14) <code v-pre>packages/i18n/src/plural.ts</code>

Intl.PluralRules 経由で count に対する plural category を返す。 実 provider の pluralization rule (CLDR SSOT) を差し替えても同じ signature で呼べる想定。 失敗時は 'other' を返す (safe default)。

```ts
export declare function selectPlural(locale: string, count: number): PluralCategory;
```

### 型

#### <code v-pre>PluralCategory</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts#L1) <code v-pre>packages/i18n/src/plural.ts</code>

```ts
export type PluralCategory = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other';
```

#### <code v-pre>PluralRule</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/i18n/src/plural.ts#L3) <code v-pre>packages/i18n/src/plural.ts</code>

```ts
export interface PluralRule {
    locale: string;
    category: PluralCategory;
    count: number;
}
```
