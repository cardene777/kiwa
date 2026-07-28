---
title: "@kiwa-lab/date timezone の API 契約"
---

<!-- kiwa-generated-api-page -->

# <code v-pre>@kiwa-lab/date</code> <code v-pre>timezone</code> の API 契約

[ソース](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts) から同期しています。各項目は公開名、TypeScript の宣言、宣言元のソース位置を示します。実装に JSDoc がある場合は、その説明も表示します。

[リファレンスの目次へ戻る](./)

### 値

#### <code v-pre>timezoneConvert</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts#L32) <code v-pre>packages/date/src/timezone.ts</code>

`timezoneConvert(date, tz, provider)` は date を tz オフセット分ずらした Date を返す。 未知の tz は 0 offset (UTC 相当) に fallback。 DST 未対応 = mock として cover 十分。

```ts
export declare function timezoneConvert(date: Date, timezone: string, provider: DateProvider): TimezoneResult;
```

### 型

#### <code v-pre>TimezoneResult</code>

[ソース宣言](https://github.com/cardene777/kiwa/blob/main/packages/date/src/timezone.ts#L3) <code v-pre>packages/date/src/timezone.ts</code>

```ts
export interface TimezoneResult {
    date: Date;
    timezone: string;
    offsetMinutes: number;
    provider: DateProvider;
}
```
