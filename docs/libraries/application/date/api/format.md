---
title: "@kiwa-lab/date format の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/date</code> <code v-pre>format</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>formatDate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L19) <code v-pre>packages/date/src/format.ts</code>

pattern token = `YYYY / MM / DD / HH / mm / ss` を UTC ベースで置換。 全 provider (date-fns/dayjs/Luxon/Temporal) が最低限 support する共通 subset。

```ts
export declare function formatDate(date: Date, pattern: string, provider: DateProvider): FormatResult;
```

#### <code v-pre>parseDate</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L40) <code v-pre>packages/date/src/format.ts</code>

pattern に沿って date string を parse。 未対応 pattern は Date コンストラクタに fallback。

```ts
export declare function parseDate(str: string, pattern: string, provider: DateProvider): ParseResult;
```

### 型

#### <code v-pre>FormatResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L3) <code v-pre>packages/date/src/format.ts</code>

```ts
export interface FormatResult {
    formatted: string;
    pattern: string;
    provider: DateProvider;
}
```

#### <code v-pre>ParseResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/format.ts#L9) <code v-pre>packages/date/src/format.ts</code>

```ts
export interface ParseResult {
    date: Date;
    pattern: string;
    provider: DateProvider;
}
```
